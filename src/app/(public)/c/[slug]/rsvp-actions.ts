"use server";

import { revalidatePath } from "next/cache";
import { verifyInviteToken } from "@/server/auth/invite-token";
import { getCoupleBySlug } from "@/server/repositories/couples";
import { submitRsvp } from "@/server/repositories/guests";
import { rsvpSchema } from "@/lib/schemas/guest";

export type RsvpState = { error?: string; ok?: boolean };

/**
 * RSVP público — sem conta. A identidade do convidado vem inteiramente do
 * token assinado no link, nunca de um uid de sessão. Ver plano §3.4 e §06.
 */
export async function submitRsvpAction(
  slug: string,
  token: string,
  _prevState: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  const payload = verifyInviteToken(token);
  if (!payload) {
    return { error: "Este link de convite expirou ou é inválido." };
  }

  const couple = await getCoupleBySlug(slug);
  if (!couple || couple.id !== payload.coupleId) {
    return { error: "Convite não corresponde a este casamento." };
  }

  const parsed = rsvpSchema.safeParse({
    status: formData.get("status"),
    companions: formData.get("companions") || 0,
    meal: formData.get("meal") || "padrao",
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: "Não foi possível confirmar — confira os campos." };
  }

  await submitRsvp(couple.id, payload.guestId, parsed.data);
  revalidatePath(`/c/${slug}`);
  revalidatePath(`/painel/${couple.id}/convidados`);
  revalidatePath(`/painel/${couple.id}`);

  return { ok: true };
}
