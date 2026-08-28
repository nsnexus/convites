"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleMember } from "@/server/auth/guards";
import { publishCoupleSite, unpublishCoupleSite, getCoupleById } from "@/server/repositories/couples";

export async function publishSiteAction(coupleId: string) {
  await requireCoupleMember(coupleId);
  await publishCoupleSite(coupleId);
  const couple = await getCoupleById(coupleId);
  revalidatePath(`/painel/${coupleId}`);
  if (couple) revalidatePath(`/c/${couple.slug}`);
}

export async function unpublishSiteAction(coupleId: string) {
  await requireCoupleMember(coupleId);
  await unpublishCoupleSite(coupleId);
  const couple = await getCoupleById(coupleId);
  revalidatePath(`/painel/${coupleId}`);
  if (couple) revalidatePath(`/c/${couple.slug}`);
}
