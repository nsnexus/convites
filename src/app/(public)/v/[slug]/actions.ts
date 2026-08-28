"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/session";
import { listCouplesForUser } from "@/server/repositories/couples";
import { createLead } from "@/server/repositories/leads";
import { createLeadSchema } from "@/lib/schemas/vendor";
import { formatCoupleName } from "@/lib/couple-name";

export type FormState = { error?: string; ok?: boolean };

export async function sendLeadAction(vendorSlug: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Entre na sua conta de casal para enviar uma mensagem." };

  const couples = await listCouplesForUser(user.uid);
  if (couples.length === 0) {
    return { error: "Crie o site do seu casamento antes de contatar fornecedores." };
  }
  const couple = couples[0];

  const parsed = createLeadSchema.safeParse({
    vendorId: formData.get("vendorId"),
    eventDate: formData.get("eventDate") || couple.weddingDate,
    guestCount: formData.get("guestCount") || undefined,
    budgetRange: formData.get("budgetRange"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: "Escreva uma mensagem com pelo menos 10 caracteres." };
  }

  await createLead({
    coupleId: couple.id,
    coupleUid: user.uid,
    coupleName: formatCoupleName(couple.slug),
    data: parsed.data,
  });

  revalidatePath(`/v/${vendorSlug}`);
  return { ok: true };
}
