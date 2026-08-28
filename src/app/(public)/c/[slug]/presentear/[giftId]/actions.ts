"use server";

import { redirect } from "next/navigation";
import { getCoupleBySlug } from "@/server/repositories/couples";
import { getGiftItem } from "@/server/repositories/gift-items";
import { createOrderIntent, attachCharge } from "@/server/repositories/orders";
import { selectProvider } from "@/server/payments/dev-provider";
import { contributeSchema } from "@/lib/schemas/gift";
import { platformFee } from "@/lib/money";

export type ContributeState = { error?: string };

export async function contributeAction(
  slug: string,
  giftId: string,
  _prevState: ContributeState,
  formData: FormData
): Promise<ContributeState> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return { error: "Casamento não encontrado." };

  const gift = await getGiftItem(couple.id, giftId);
  if (!gift || !gift.active) return { error: "Este presente não está mais disponível." };

  const parsed = contributeSchema.safeParse({
    quotas: formData.get("quotas") || 1,
    amountCents: formData.get("amount") ? Math.round(Number(formData.get("amount")) * 100) : undefined,
    payerName: formData.get("payerName"),
    payerEmail: formData.get("payerEmail"),
    note: formData.get("note"),
    anonymous: formData.get("anonymous") === "on",
    method: formData.get("method"),
    guestCoversFee: formData.get("guestCoversFee") === "on",
  });
  if (!parsed.success) {
    return { error: "Confira os campos — nome e forma de pagamento são obrigatórios." };
  }

  const baseCents =
    gift.mode === "free"
      ? parsed.data.amountCents ?? 0
      : gift.price * (gift.mode === "quota" ? parsed.data.quotas : 1);

  // "Convidado cobre a taxa": soma a comissão da plataforma ao valor cobrado,
  // para o casal receber o valor cheio do presente (ver plano §07). A taxa é
  // calculada sobre o valor do presente, não sobre o total já com taxa embutida.
  const fee = platformFee(baseCents);
  const grossCents = parsed.data.guestCoversFee ? baseCents + fee : baseCents;

  if (grossCents < 500) {
    return { error: "O valor mínimo de contribuição é R$5." };
  }

  let orderId: string;
  try {
    orderId = await createOrderIntent({
      coupleId: couple.id,
      giftId,
      quotas: gift.mode === "quota" ? parsed.data.quotas : 1,
      grossCents,
      method: parsed.data.method,
      payerName: parsed.data.payerName,
      payerEmail: parsed.data.payerEmail || null,
      note: parsed.data.note || null,
      anonymous: parsed.data.anonymous,
      feePlatformCents: parsed.data.guestCoversFee ? fee : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível reservar este presente." };
  }

  const provider = selectProvider(parsed.data.method);
  const charge = await provider.createCharge({
    orderId,
    amountCents: grossCents,
    method: parsed.data.method,
    payerName: parsed.data.payerName,
    payerEmail: parsed.data.payerEmail || null,
  });
  await attachCharge(orderId, provider.name, charge);

  redirect(`/c/${slug}/presentear/${giftId}/pedido/${orderId}`);
}
