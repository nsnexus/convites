"use server";

import { revalidatePath } from "next/cache";
import { requireVendorOwner } from "@/server/auth/guards";
import { updateVendorProfile } from "@/server/repositories/vendors";
import { createVendorSchema } from "@/lib/schemas/vendor";

export type FormState = { error?: string; ok?: boolean };

export async function updateVendorProfileAction(
  vendorId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireVendorOwner(vendorId);

  const parsed = createVendorSchema.pick({ name: true, categories: true, cities: true, priceFrom: true, about: true }).safeParse({
    name: formData.get("name"),
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

  await updateVendorProfile(vendorId, parsed.data);
  revalidatePath("/fornecedor");
  revalidatePath("/fornecedor/perfil");
  return { ok: true };
}
