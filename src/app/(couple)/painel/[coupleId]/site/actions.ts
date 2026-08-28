"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleMember } from "@/server/auth/guards";
import { getCoupleById, updateCoupleSite } from "@/server/repositories/couples";
import { updateCoupleSiteSchema, CONTENT_SECTION_IDS } from "@/lib/schemas/couple";
import { SITE_TEMPLATES } from "@/lib/site-templates";

export type UpdateSiteState = { error?: string; ok?: boolean };

export async function updateSiteAction(
  coupleId: string,
  _prevState: UpdateSiteState,
  formData: FormData
): Promise<UpdateSiteState> {
  await requireCoupleMember(coupleId);

  const template = String(formData.get("template") ?? "classico");
  const sections = formData.getAll("sections").map(String);
  const content: Record<string, string> = {};
  for (const id of CONTENT_SECTION_IDS) {
    const value = formData.get(`content.${id}`);
    if (typeof value === "string" && value.trim()) content[id] = value.trim();
  }

  const parsed = updateCoupleSiteSchema.safeParse({
    template,
    theme: SITE_TEMPLATES[template as keyof typeof SITE_TEMPLATES]?.theme ?? SITE_TEMPLATES.classico.theme,
    sections,
    content,
  });

  if (!parsed.success) {
    return { error: "Não foi possível salvar — confira os campos." };
  }

  await updateCoupleSite(coupleId, parsed.data);

  const couple = await getCoupleById(coupleId);
  revalidatePath(`/painel/${coupleId}/site`);
  if (couple?.published) revalidatePath(`/c/${couple.slug}`);

  return { ok: true };
}
