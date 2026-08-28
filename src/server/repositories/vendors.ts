import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import type { CreateVendorInput } from "@/lib/schemas/vendor";

/**
 * Marketplace de fornecedores — ver plano §3.7. Busca aqui é por filtro
 * simples do Firestore (array-contains + where), suficiente para o volume
 * inicial de uma praça só. Typesense/Algolia entram na fase 3 quando o
 * catálogo crescer (ver plano §08 — ressalva técnica já prevista).
 */

const vendorsCol = () => adminDb.collection("vendors");

export type VendorDoc = {
  name: string;
  slug: string;
  ownerUid: string;
  categories: string[];
  cities: string[];
  priceFrom: number; // centavos
  capacity: number | null;
  about: string | null;
  media: string[];
  socials: Record<string, string>;
  verified: boolean;
  planTier: "free" | "premium";
  rating: { avg: number; count: number };
  responseTimeMins: number | null;
  status: "pending" | "active" | "suspended";
  createdAt: FirebaseFirestore.Timestamp;
};

export async function createVendor(ownerUid: string, input: CreateVendorInput): Promise<string> {
  const existing = await vendorsCol().where("slug", "==", input.slug).limit(1).get();
  if (!existing.empty) throw new Error(`O endereço "${input.slug}" já está em uso.`);

  const ref = vendorsCol().doc();
  const doc: VendorDoc = {
    name: input.name,
    slug: input.slug,
    ownerUid,
    categories: input.categories,
    cities: input.cities,
    priceFrom: input.priceFrom,
    capacity: null,
    about: input.about || null,
    media: [],
    socials: {},
    verified: false,
    planTier: "free",
    rating: { avg: 0, count: 0 },
    responseTimeMins: null,
    status: "pending", // liberado no backoffice — ver plano §3.9
    createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  };
  await ref.set(doc);
  return ref.id;
}

export async function getVendorByOwner(ownerUid: string): Promise<(VendorDoc & { id: string }) | null> {
  const snap = await vendorsCol().where("ownerUid", "==", ownerUid).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...(snap.docs[0].data() as VendorDoc) };
}

export async function getVendorBySlug(slug: string): Promise<(VendorDoc & { id: string }) | null> {
  const snap = await vendorsCol().where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...(snap.docs[0].data() as VendorDoc) };
}

export async function getVendorById(id: string): Promise<(VendorDoc & { id: string }) | null> {
  const doc = await vendorsCol().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as VendorDoc) };
}

export async function searchVendors(filters: {
  category?: string;
  city?: string;
  limit?: number;
}): Promise<Array<VendorDoc & { id: string }>> {
  // Firestore não permite dois array-contains na mesma consulta: usamos o
  // de categoria (mais seletivo) e filtramos cidade em memória quando os
  // dois filtros vierem juntos.
  let query: FirebaseFirestore.Query = vendorsCol().where("status", "==", "active");

  if (filters.category) {
    query = query.where("categories", "array-contains", filters.category);
  } else if (filters.city) {
    query = query.where("cities", "array-contains", filters.city);
  }

  const snap = await query.limit(filters.limit ?? 60).get();
  let results = snap.docs.map((d) => ({ id: d.id, ...(d.data() as VendorDoc) }));

  if (filters.category && filters.city) {
    results = results.filter((v) => v.cities.includes(filters.city!));
  }

  return results;
}

export async function updateVendorProfile(
  vendorId: string,
  patch: Pick<CreateVendorInput, "name" | "categories" | "cities" | "priceFrom" | "about">
): Promise<void> {
  await vendorsCol()
    .doc(vendorId)
    .update({
      name: patch.name,
      categories: patch.categories,
      cities: patch.cities,
      priceFrom: patch.priceFrom,
      about: patch.about || null,
    });
}

export async function setVendorStatus(vendorId: string, status: VendorDoc["status"]): Promise<void> {
  await vendorsCol()
    .doc(vendorId)
    .update({ status, verified: status === "active" });
}

export async function listPendingVendors(): Promise<Array<VendorDoc & { id: string }>> {
  const snap = await vendorsCol().where("status", "==", "pending").orderBy("createdAt", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as VendorDoc) }));
}
