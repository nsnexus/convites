"use client";

import { useActionState } from "react";
import { sendLeadAction, type FormState } from "./actions";

const initialState: FormState = {};

export function LeadForm({ vendorId, vendorSlug }: { vendorId: string; vendorSlug: string }) {
  const [state, formAction, pending] = useActionState(sendLeadAction.bind(null, vendorSlug), initialState);

  if (state.ok) {
    return <p className="text-sm text-emerald-700">Mensagem enviada! O fornecedor foi notificado.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="vendorId" value={vendorId} />
      <div className="flex gap-2">
        <input name="eventDate" type="date" className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm" />
        <input name="guestCount" type="number" min={1} placeholder="Nº de convidados" className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      <input name="budgetRange" placeholder="Faixa de orçamento (opcional)" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <textarea name="message" rows={3} placeholder="Conte um pouco sobre o que você procura…" required className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-rose-700 px-4 py-2 text-sm text-white hover:bg-rose-800 disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar mensagem"}
      </button>
    </form>
  );
}
