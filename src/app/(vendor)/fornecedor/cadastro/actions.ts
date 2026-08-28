"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { createVendor, getVendorByOwner } from "@/server/repositories/vendors";
import { createVendorSchema } from "@/lib/schemas/vendor";

export type FormState = { error?: string };

export async function createVendorAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const existing = await getVendorByOwner(user.uid);
  if (existing) redirect("/fornecedor");

  const parsed = createVendorSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    categories: formData.getAll("categories"),
    cities: String(formData.get("cities") ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    priceFrom: Math.round(Number(formData.get("priceFrom") || 0) * 100),
    about: formData.get("about"),
  });

  if (!parsed.success) {
    return { error: "Confira os campos — escolha ao menos uma categoria e uma cidade." };
  }

  try {
    await createVendor(user.uid, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar o perfil." };
  }

  redirect("/fornecedor");
}
