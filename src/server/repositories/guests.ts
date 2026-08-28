import "server-only";
import { adminDb, FieldValue, Timestamp } from "@/lib/firebase-admin";
import type { CreateGuestInput, RsvpInput } from "@/lib/schemas/guest";
import { normalizeBrazilPhone } from "@/lib/phone";
import { signInviteToken } from "@/server/auth/invite-token";

/** Ver padrão de repositório em src/server/repositories/couples.ts. */

const guestsCol = (coupleId: string) => adminDb.collection("couples").doc(coupleId).collection("guests");

export type GuestDoc = {
  name: string;
  phone: string | null; // E.164
  email: string | null;
  groupLabel: string | null;
  seats: number;
  rsvp: {
    status: "pendente" | "confirmado" | "recusado";
    companions: number;
    meal: string;
    note: string | null;
    at: FirebaseFirestore.Timestamp | null;
  };
  inviteToken: string | null;
  sentAt: FirebaseFirestore.Timestamp | null;
  openedAt: FirebaseFirestore.Timestamp | null;
  tableId: string | null;
  checkedInAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
};

const INVITE_TOKEN_TTL_DAYS = 365;

export async function addGuest(coupleId: string, input: CreateGuestInput): Promise<string> {
  const phone = input.phone ? normalizeBrazilPhone(input.phone) : null;

  // Dedup por telefone normalizado dentro do mesmo casal.
  if (phone) {
    const existing = await guestsCol(coupleId).where("phone", "==", phone).limit(1).get();
    if (!existing.empty) {
      throw new Error(`Já existe um convidado com este telefone: ${existing.docs[0].data().name}`);
    }
  }

  const ref = guestsCol(coupleId).doc();
  const doc: GuestDoc = {
    name: input.name,
    phone,
    email: input.email || null,
    groupLabel: input.groupLabel || null,
    seats: input.seats,
    rsvp: { status: "pendente", companions: 0, meal: "padrao", note: null, at: null },
    inviteToken: null,
    sentAt: null,
    openedAt: null,
    tableId: null,
    checkedInAt: null,
    createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  };
  await ref.set(doc);

  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const token = signInviteToken(coupleId, ref.id, expiresAt);
  await ref.update({ inviteToken: token });

  await adminDb
    .collection("couples")
    .doc(coupleId)
    .update({ "stats.guests": FieldValue.increment(1) });

  return ref.id;
}

export async function listGuests(coupleId: string): Promise<Array<GuestDoc & { id: string }>> {
  const snap = await guestsCol(coupleId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as GuestDoc) }));
}

export async function getGuest(
  coupleId: string,
  guestId: string
): Promise<(GuestDoc & { id: string }) | null> {
  const doc = await guestsCol(coupleId).doc(guestId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as GuestDoc) };
}

export async function markInviteSent(coupleId: string, guestId: string): Promise<void> {
  await guestsCol(coupleId).doc(guestId).update({ sentAt: FieldValue.serverTimestamp() });
}

export async function markInviteOpened(coupleId: string, guestId: string): Promise<void> {
  const ref = guestsCol(coupleId).doc(guestId);
  const doc = await ref.get();
  if (doc.exists && !doc.data()?.openedAt) {
    await ref.update({ openedAt: FieldValue.serverTimestamp() });
  }
}

/** Grava o RSVP e atualiza os agregados do casal (stats.confirmed) por transação. */
export async function submitRsvp(coupleId: string, guestId: string, input: RsvpInput): Promise<void> {
  const guestRef = guestsCol(coupleId).doc(guestId);
  const coupleRef = adminDb.collection("couples").doc(coupleId);

  await adminDb.runTransaction(async (tx) => {
    const guestDoc = await tx.get(guestRef);
    if (!guestDoc.exists) throw new Error("Convidado não encontrado.");

    const previousStatus = (guestDoc.data() as GuestDoc).rsvp.status;

    tx.update(guestRef, {
      rsvp: {
        status: input.status,
        companions: input.companions,
        meal: input.meal,
        note: input.note || null,
        at: FieldValue.serverTimestamp() as unknown as Timestamp,
      },
    });

    // Ajuste incremental do contador — só muda se o status realmente mudou.
    if (previousStatus !== "confirmado" && input.status === "confirmado") {
      tx.update(coupleRef, { "stats.confirmed": FieldValue.increment(1) });
    } else if (previousStatus === "confirmado" && input.status !== "confirmado") {
      tx.update(coupleRef, { "stats.confirmed": FieldValue.increment(-1) });
    }
  });
}

/** Recados públicos — só quem confirmou e deixou mensagem (ver plano §3.5/§3.2). */
export async function listGuestNotes(
  coupleId: string
): Promise<Array<{ name: string; note: string }>> {
  const snap = await guestsCol(coupleId).where("rsvp.status", "==", "confirmado").get();
  return snap.docs
    .map((d) => d.data() as GuestDoc)
    .filter((g) => g.rsvp.note)
    .map((g) => ({ name: g.name, note: g.rsvp.note as string }));
}

export async function deleteGuest(coupleId: string, guestId: string): Promise<void> {
  const ref = guestsCol(coupleId).doc(guestId);
  const doc = await ref.get();
  if (!doc.exists) return;

  const wasConfirmed = (doc.data() as GuestDoc).rsvp.status === "confirmado";
  await ref.delete();

  const coupleRef = adminDb.collection("couples").doc(coupleId);
  await coupleRef.update({
    "stats.guests": FieldValue.increment(-1),
    ...(wasConfirmed ? { "stats.confirmed": FieldValue.increment(-1) } : {}),
  });
}
