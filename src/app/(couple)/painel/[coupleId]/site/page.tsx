import { notFound } from "next/navigation";
import { getCoupleById } from "@/server/repositories/couples";
import { SiteEditorForm } from "./site-editor-form";

export default async function SiteEditorPage({
  params,
}: {
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const couple = await getCoupleById(coupleId);
  if (!couple) notFound();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600">
        Escolha o template e as seções que aparecem em{" "}
        <code className="rounded bg-neutral-100 px-1">nsconvites.com.br/c/{couple.slug}</code>.
      </p>
      <SiteEditorForm
        coupleId={coupleId}
        currentTemplate={couple.site.template}
        currentSections={couple.site.sections}
        currentContent={couple.site.content ?? {}}
      />
    </div>
  );
}
