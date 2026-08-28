"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleMember } from "@/server/auth/guards";
import { addBudgetItem, deleteBudgetItem } from "@/server/repositories/planning";
import { createBudgetItemSchema } from "@/lib/schemas/planning";

export type FormState = { error?: string; ok?: boolean };

export async function addBudgetItemAction(
  coupleId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireCoupleMember(coupleId);

  const parsed = createBudgetItemSchema.safeParse({
    category: formData.get("category"),
    plannedCents: Math.round(Number(formData.get("planned") || 0) * 100),
    contractedCents: Math.round(Number(formData.get("contracted") || 0) * 100),
    paidCents: Math.round(Number(formData.get("paid") || 0) * 100),
    vendorName: formData.get("vendorName"),
  });
  if (!parsed.success) return { error: "Confira os valores informados." };

  await addBudgetItem(coupleId, parsed.data);
  revalidatePath(`/painel/${coupleId}/orcamento`);
  return { ok: true };
}

export async function deleteBudgetItemAction(coupleId: string, itemId: string) {
  await requireCoupleMember(coupleId);
  await deleteBudgetItem(coupleId, itemId);
  revalidatePath(`/painel/${coupleId}/orcamento`);
}
