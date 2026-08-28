"use client";

import { useActionState } from "react";
import { createVendorAction, type FormState } from "./actions";
import { VENDOR_CATEGORY_LABEL } from "@/lib/vendor-categories";

const initialState: FormState = {};

export default function VendorSignupPage() {
  const [state, formAction, pending] = useActionState(createVendorAction, initialState);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Cadastrar como fornecedor</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Seu perfil entra em análise antes de aparecer nas buscas (ver moderação no backoffice).
        </p>
      </div>

      <form action={formAction} className="flex max-w-lg flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Nome do negócio
          <input name="name" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Endereço (slug)
          <input name="slug" placeholder="ateliê-flor-de-lis" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <fieldset>
          <legend className="mb-1 text-sm">Categorias</legend>
          <div className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
            {Object.entries(VENDOR_CATEGORY_LABEL).map(([id, label]) => (
              <label key={id} className="flex items-center gap-2">
                <input type="checkbox" name="categories" value={id} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm">
          Cidades atendidas (separadas por vírgula)
          <input name="cities" placeholder="Fortaleza, Eusébio" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          A partir de (R$)
          <input name="priceFrom" type="number" min={0} step="0.01" className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sobre
          <textarea name="about" rows={4} className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded bg-rose-700 px-4 py-2 text-sm text-white hover:bg-rose-800 disabled:opacity-50"
        >
          {pending ? "Criando…" : "Criar perfil"}
        </button>
      </form>
    </main>
  );
}
