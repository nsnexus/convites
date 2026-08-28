"use client";

import { useActionState, useRef, useEffect } from "react";
import { addBudgetItemAction, type FormState } from "./actions";

const initialState: FormState = {};

export function AddBudgetItemForm({ coupleId }: { coupleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addBudgetItemAction.bind(null, coupleId), initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="category" placeholder="Categoria (ex: Buffet)" required className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <input name="planned" type="number" step="0.01" placeholder="Previsto (R$)" className="w-32 rounded border border-neutral-300 px-3 py-2 text-sm" />
      <input name="contracted" type="number" step="0.01" placeholder="Contratado (R$)" className="w-32 rounded border border-neutral-300 px-3 py-2 text-sm" />
      <input name="paid" type="number" step="0.01" placeholder="Pago (R$)" className="w-32 rounded border border-neutral-300 px-3 py-2 text-sm" />
      <input name="vendorName" placeholder="Fornecedor (opcional)" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-rose-700 px-3 py-2 text-sm text-white hover:bg-rose-800 disabled:opacity-50">
        {pending ? "Adicionando…" : "Adicionar"}
      </button>
    </form>
  );
}
