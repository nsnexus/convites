"use client";

import { useActionState } from "react";
import { createCoupleAction, type CreateCoupleState } from "./actions";

const initialState: CreateCoupleState = {};

export function CreateCoupleForm() {
  const [state, formAction, pending] = useActionState(createCoupleAction, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Endereço (slug)
        <input
          name="slug"
          placeholder="joao-e-maria"
          required
          className="rounded border border-neutral-300 px-3 py-2"
        />
        {state.fieldErrors?.slug && <span className="text-xs text-red-600">{state.fieldErrors.slug[0]}</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Data do casamento
        <input
          name="weddingDate"
          type="date"
          required
          className="rounded border border-neutral-300 px-3 py-2"
        />
        {state.fieldErrors?.weddingDate && (
          <span className="text-xs text-red-600">{state.fieldErrors.weddingDate[0]}</span>
        )}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Cidade
        <input
          name="city"
          placeholder="Fortaleza"
          required
          className="rounded border border-neutral-300 px-3 py-2"
        />
        {state.fieldErrors?.city && <span className="text-xs text-red-600">{state.fieldErrors.city[0]}</span>}
      </label>
      {state.formError && <p className="text-sm text-red-600">{state.formError}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-rose-700 px-4 py-2 text-white hover:bg-rose-800 disabled:opacity-50"
      >
        {pending ? "Criando…" : "Criar"}
      </button>
    </form>
  );
}
