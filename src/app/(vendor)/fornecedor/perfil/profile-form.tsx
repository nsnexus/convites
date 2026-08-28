"use client";

import { useActionState } from "react";
import { updateVendorProfileAction, type FormState } from "./actions";
import { VENDOR_CATEGORY_LABEL } from "@/lib/vendor-categories";
import type { VendorDoc } from "@/server/repositories/vendors";

const initialState: FormState = {};

export function ProfileForm({ vendorId, vendor }: { vendorId: string; vendor: VendorDoc }) {
  const [state, formAction, pending] = useActionState(updateVendorProfileAction.bind(null, vendorId), initialState);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Nome do negócio
        <input name="name" defaultValue={vendor.name} required className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <fieldset>
        <legend className="mb-1 text-sm">Categorias</legend>
        <div className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
          {Object.entries(VENDOR_CATEGORY_LABEL).map(([id, label]) => (
            <label key={id} className="flex items-center gap-2">
              <input type="checkbox" name="categories" value={id} defaultChecked={vendor.categories.includes(id)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        Cidades atendidas (separadas por vírgula)
        <input name="cities" defaultValue={vendor.cities.join(", ")} required className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        A partir de (R$)
        <input name="priceFrom" type="number" min={0} step="0.01" defaultValue={vendor.priceFrom / 100} className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Sobre
        <textarea name="about" rows={4} defaultValue={vendor.about ?? ""} className="rounded border border-neutral-300 px-3 py-2" />
      </label>
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
