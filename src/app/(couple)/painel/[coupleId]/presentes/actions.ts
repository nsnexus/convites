"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleMember } from "@/server/auth/guards";
import { createGiftItem, deleteGiftItem, setGiftItemActive } from "@/server/repositories/gift-items";
import { requestWithdrawal } from "@/server/repositories/withdrawals";
import { createGiftItemSchema } from "@/lib/schemas/gift";

export type FormState = { error?: string; ok?: boolean };

export async function addGiftItemAction(
  coupleId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireCoupleMember(coupleId);

  const parsed = createGiftItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priceCents: Number(formData.get("price")) * 100,
    mode: formData.get("mode"),
    quotasTotal: formData.get("quotasTotal") || undefined,
  });
  if (!parsed.success) {
    return { error: "Confira os campos — preço mínimo R$5, título obrigatório." };
  }

  await createGiftItem(coupleId, parsed.data);
  revalidatePath(`/painel/${coupleId}/presentes`);
  return { ok: true };
}

export async function toggleGiftItemAction(coupleId: string, giftId: string, active: boolean) {
  await requireCoupleMember(coupleId);
  await setGiftItemActive(coupleId, giftId, active);
  revalidatePath(`/painel/${coupleId}/presentes`);
}

export async function deleteGiftItemAction(coupleId: string, giftId: string) {
  await requireCoupleMember(coupleId);
  await deleteGiftItem(coupleId, giftId);
  revalidatePath(`/painel/${coupleId}/presentes`);
}

export async function requestWithdrawalAction(
  coupleId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireCoupleMember(coupleId);

  const amountReais = Number(formData.get("amount"));
  const pixKey = String(formData.get("pixKey") ?? "").trim();
  if (!amountReais || amountReais <= 0 || !pixKey) {
    return { error: "Informe um valor e uma chave Pix válidos." };
  }

  try {
    await requestWithdrawal(coupleId, Math.round(amountReais * 100), pixKey);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível solicitar o saque." };
  }

  revalidatePath(`/painel/${coupleId}/presentes`);
  return { ok: true };
}
