"use server";

import { revalidatePath } from "next/cache";
import { requireVendorOwner } from "@/server/auth/guards";
import { setLeadStatus, type LeadDoc } from "@/server/repositories/leads";

export async function updateLeadStatusAction(vendorId: string, leadId: string, status: LeadDoc["status"]) {
  await requireVendorOwner(vendorId);
  await setLeadStatus(leadId, status);
  revalidatePath("/fornecedor");
}
