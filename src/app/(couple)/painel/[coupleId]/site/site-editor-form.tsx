"use client";

import { useActionState } from "react";
import { SITE_TEMPLATES, SITE_SECTIONS, type SiteTemplateId } from "@/lib/site-templates";
import { CONTENT_SECTION_IDS } from "@/lib/schemas/couple";
import { updateSiteAction, type UpdateSiteState } from "./actions";

const initialState: UpdateSiteState = {};

const CONTENT_LABEL: Record<string, { label: string; placeholder: string }> = {
  historia: { label: "História do casal", placeholder: "Como vocês se conheceram, o pedido…" },
  cronograma: { label: "Cronograma do dia", placeholder: "16h Cerimônia\n18h Coquetel\n20h Jantar…" },
  "dress-code": { label: "Dress code", placeholder: "Traje social. Evitem branco e verde militar." },
  hospedagem: { label: "Hospedagem", placeholder: "Hotéis próximos e como chegar…" },
  faq: { label: "Perguntas frequentes", placeholder: "Posso levar acompanhante? Tem estacionamento?…" },
};

export function SiteEditorForm({
  coupleId,
  currentTemplate,
  currentSections,
  currentContent,
}: {
  coupleId: string;
  currentTemplate: string;
  currentSections: string[];
  currentContent: Record<string, string>;
}) {
  const boundAction = updateSiteAction.bind(null, coupleId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Template</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(SITE_TEMPLATES) as SiteTemplateId[]).map((id) => (
            <label
              key={id}
              className="flex cursor-pointer flex-col gap-2 rounded border border-neutral-200 p-3 has-[:checked]:border-rose-700"
            >
              <input
                type="radio"
                name="template"
                value={id}
                defaultChecked={id === currentTemplate}
                className="sr-only"
              />
              <span
                className="h-10 rounded"
                style={{ background: SITE_TEMPLATES[id].theme.bg, border: `2px solid ${SITE_TEMPLATES[id].theme.accent}` }}
              />
              <span className="text-sm">{SITE_TEMPLATES[id].label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Seções do site</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SITE_SECTIONS.map((section) => (
            <label key={section.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="sections"
                value={section.id}
                defaultChecked={currentSections.includes(section.id)}
              />
              {section.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Conteúdo</legend>
        <div className="flex flex-col gap-3">
          {CONTENT_SECTION_IDS.map((id) => (
            <label key={id} className="flex flex-col gap-1 text-sm">
              {CONTENT_LABEL[id].label}
              <textarea
                name={`content.${id}`}
                rows={3}
                placeholder={CONTENT_LABEL[id].placeholder}
                defaultValue={currentContent[id] ?? ""}
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">Salvo.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-rose-700 px-4 py-2 text-sm text-white hover:bg-rose-800 disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
