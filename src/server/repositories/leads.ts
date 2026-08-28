import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import type { CreateLeadInput } from "@/lib/schemas/vendor";

/** Leads do marketplace — ver plano §3.7. */

const leadsCol = () => adminDb.collection("leads");

export type LeadDoc = {
  coupleId: string;
  coupleUid: string;
  coupleName: string;
  vendorId: string;
  eventDate: string | null;
  guestCount: number | null;
  budgetRange: string | null;
  message: string;
  status: "novo" | "respondido" | "fechado" | "perdido";
  contactUnlocked: boolean;
  createdAt: FirebaseFirestore.Timestamp;
};

export async function createLead(input: {
  coupleId: string;
  coupleUid: string;
  coupleName: string;
  data: CreateLeadInput;
}): Promise<string> {
  const ref = leadsCol().doc();
  const doc: LeadDoc = {
    coupleId: input.coupleId,
    coupleUid: input.coupleUid,
    coupleName: input.coupleName,
    vendorId: input.data.vendorId,
    eventDate: input.data.eventDate || null,
    guestCount: input.data.guestCount ?? null,
    budgetRange: input.data.budgetRange || null,
    message: input.data.message,
    status: "novo",
    contactUnlocked: false,
    createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  };
  await ref.set(doc);
  return ref.id;
}

export async function listLeadsForVendor(vendorId: string): Promise<Array<LeadDoc & { id: string }>> {
  const snap = await leadsCol().where("vendorId", "==", vendorId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as LeadDoc) }));
}

export async function setLeadStatus(leadId: string, status: LeadDoc["status"]): Promise<void> {
  await leadsCol()
    .doc(leadId)
    .update({ status, contactUnlocked: status !== "novo" });
}
