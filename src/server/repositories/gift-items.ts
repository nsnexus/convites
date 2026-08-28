import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import type { CreateGiftItemInput } from "@/lib/schemas/gift";

/** Ver padrão de repositório em src/server/repositories/couples.ts. Ver plano §3.5 e §05. */

const giftItemsCol = (coupleId: string) =>
  adminDb.collection("couples").doc(coupleId).collection("giftItems");

export type GiftItemDoc = {
  title: string;
  description: string | null;
  image: string | null;
  price: number; // centavos — preço de referência (ou de cada cota)
  mode: "item" | "quota" | "free";
  quotas: { total: number | null; sold: number };
  active: boolean;
  order: number;
  createdAt: FirebaseFirestore.Timestamp;
};

export async function createGiftItem(coupleId: string, input: CreateGiftItemInput): Promise<string> {
  const ref = giftItemsCol(coupleId).doc();
  const doc: GiftItemDoc = {
    title: input.title,
    description: input.description || null,
    image: input.image || null,
    price: input.priceCents,
    mode: input.mode,
    quotas: {
      total: input.mode === "quota" ? input.quotasTotal ?? 1 : input.mode === "item" ? 1 : null,
      sold: 0,
    },
    active: true,
    order: Date.now(),
    createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  };
  await ref.set(doc);
  return ref.id;
}

export async function listGiftItems(coupleId: string): Promise<Array<GiftItemDoc & { id: string }>> {
  const snap = await giftItemsCol(coupleId).orderBy("order", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as GiftItemDoc) }));
}

export async function getGiftItem(
  coupleId: string,
  giftId: string
): Promise<(GiftItemDoc & { id: string }) | null> {
  const doc = await giftItemsCol(coupleId).doc(giftId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as GiftItemDoc) };
}

export async function setGiftItemActive(coupleId: string, giftId: string, active: boolean): Promise<void> {
  await giftItemsCol(coupleId).doc(giftId).update({ active });
}

export async function deleteGiftItem(coupleId: string, giftId: string): Promise<void> {
  await giftItemsCol(coupleId).doc(giftId).delete();
}

export function giftItemRef(coupleId: string, giftId: string) {
  return giftItemsCol(coupleId).doc(giftId);
}
