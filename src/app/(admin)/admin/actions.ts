"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guards";
import { setVendorStatus, type VendorDoc } from "@/server/repositories/vendors";

export async function setVendorStatusAction(vendorId: string, status: VendorDoc["status"]) {
  await requireAdmin();
  await setVendorStatus(vendorId, status);
  revalidatePath("/admin");
}
