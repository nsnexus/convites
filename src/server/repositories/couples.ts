import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import type { CreateCoupleInput } from "@/lib/schemas/couple";

/**
 * Repositório de casais. Padrão a seguir para todo repositório novo:
 * - só este arquivo (e os pares em services/) fala com o Firestore para
 *   esta coleção — nenhum componente ou route handler acessa adminDb direto;
 * - toda escrita que precisa de consistência (aqui: reserva de slug + criação
 *   do doc) roda dentro de uma runTransaction;
 * - dinheiro em centavos, nunca float; contadores só crescem por transação.
 *
 * Isso é o que mantém aberta a porta de trocar o financeiro para Postgres
 * sem reescrever a aplicação (ver plano §04).
 */

const couplesCol = () => adminDb.collection("couples");
const slugsCol = () => adminDb.collection("slugs");

export type CoupleDoc = {
  slug: string;
  members: string[];
  weddingDate: string;
  city: string;
  venue: string | null;
  planTier: "free" | "premium";
  site: {
    template: string;
    theme: Record<string, string>;
    sections: string[];
    content: Record<string, string>;
  };
  published: boolean;
  customDomain: string | null;
  stats: {
    guests: number;
    confirmed: number;
    giftsTotal: number; // centavos
  };
  createdAt: FirebaseFirestore.Timestamp;
};

export async function createCouple(ownerUid: string, input: CreateCoupleInput): Promise<string> {
  return adminDb.runTransaction(async (tx) => {
    const slugRef = slugsCol().doc(input.slug);
    const slugDoc = await tx.get(slugRef);
    if (slugDoc.exists) {
      throw new Error(`O endereço "${input.slug}" já está em uso.`);
    }

    const coupleRef = couplesCol().doc();

    const coupleData: CoupleDoc = {
      slug: input.slug,
      members: [ownerUid],
      weddingDate: input.weddingDate,
      city: input.city,
      venue: null,
      planTier: "free",
      site: { template: "classico", theme: {}, sections: [], content: {} },
      published: false,
      customDomain: null,
      stats: { guests: 0, confirmed: 0, giftsTotal: 0 },
      createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
    };

    tx.set(coupleRef, coupleData);
    tx.set(slugRef, { coupleId: coupleRef.id });

    return coupleRef.id;
  });
}

export async function getCoupleBySlug(slug: string): Promise<(CoupleDoc & { id: string }) | null> {
  const snap = await couplesCol().where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as CoupleDoc) };
}

export async function getCoupleById(coupleId: string): Promise<(CoupleDoc & { id: string }) | null> {
  const doc = await couplesCol().doc(coupleId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as CoupleDoc) };
}

export async function publishCoupleSite(coupleId: string): Promise<void> {
  await couplesCol().doc(coupleId).update({ published: true });
  // Revalidação do ISR acontece na camada de service, não aqui — o
  // repositório só fala com o Firestore.
}

export async function unpublishCoupleSite(coupleId: string): Promise<void> {
  await couplesCol().doc(coupleId).update({ published: false });
}

export async function updateCoupleSite(
  coupleId: string,
  site: { template: string; theme: Record<string, string>; sections: string[]; content: Record<string, string> }
): Promise<void> {
  await couplesCol().doc(coupleId).update({ site });
}

export async function listCouplesForUser(uid: string): Promise<Array<CoupleDoc & { id: string }>> {
  const snap = await couplesCol().where("members", "array-contains", uid).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CoupleDoc) }));
}

export async function addPartnerToCouple(coupleId: string, partnerUid: string): Promise<void> {
  await couplesCol()
    .doc(coupleId)
    .update({ members: FieldValue.arrayUnion(partnerUid) });
}
