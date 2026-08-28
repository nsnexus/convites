"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleMember } from "@/server/auth/guards";
import { addGuest, deleteGuest, markInviteSent } from "@/server/repositories/guests";
import { createGuestSchema } from "@/lib/schemas/guest";

export type FormState = { error?: string; ok?: boolean };

export async function addGuestAction(
  coupleId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireCoupleMember(coupleId);

  const parsed = createGuestSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    seats: formData.get("seats") || 1,
    groupLabel: formData.get("groupLabel"),
  });
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Dados inválidos." };
  }

  try {
    await addGuest(coupleId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível adicionar." };
  }

  revalidatePath(`/painel/${coupleId}/convidados`);
  return { ok: true };
}

/** Colagem de lista: uma linha por convidado, "Nome, telefone, email, assentos". */
export async function importGuestsAction(
  coupleId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireCoupleMember(coupleId);

  const raw = String(formData.get("bulk") ?? "");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let imported = 0;
  let skipped = 0;

  for (const line of lines) {
    const [name, phone, email, seats] = line.split(",").map((v) => v?.trim());
    if (!name) {
      skipped++;
      continue;
    }
    const parsed = createGuestSchema.safeParse({
      name,
      phone: phone || "",
      email: email || "",
      seats: seats || 1,
    });
    if (!parsed.success) {
      skipped++;
      continue;
    }
    try {
      await addGuest(coupleId, parsed.data);
      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath(`/painel/${coupleId}/convidados`);
  return { ok: true, error: skipped > 0 ? `${imported} importados, ${skipped} ignorados (duplicados ou inválidos).` : undefined };
}

export async function deleteGuestAction(coupleId: string, guestId: string) {
  await requireCoupleMember(coupleId);
  await deleteGuest(coupleId, guestId);
  revalidatePath(`/painel/${coupleId}/convidados`);
}

export async function markSentAction(coupleId: string, guestId: string) {
  await requireCoupleMember(coupleId);
  await markInviteSent(coupleId, guestId);
  revalidatePath(`/painel/${coupleId}/convidados`);
}
