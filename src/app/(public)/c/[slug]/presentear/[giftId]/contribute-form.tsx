"use client";

import { useActionState, useState } from "react";
import { contributeAction, type ContributeState } from "./actions";
import { formatBRL } from "@/lib/money";

const initialState: ContributeState = {};

export function ContributeForm({
  slug,
  giftId,
  mode,
  priceCents,
  quotasRemaining,
}: {
  slug: string;
  giftId: string;
  mode: "item" | "quota" | "free";
  priceCents: number;
  quotasRemaining: number | null;
}) {
  const boundAction = contributeAction.bind(null, slug, giftId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [quotas, setQuotas] = useState(1);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {mode === "quota" && (
        <label className="flex flex-col gap-1 text-sm">
          Quantas cotas?
          <input
            name="quotas"
            type="number"
            min={1}
            max={quotasRemaining ?? 1}
            value={quotas}
            onChange={(e) => setQuotas(Number(e.target.value))}
            className="rounded border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">Total: {formatBRL(priceCents * quotas)}</span>
        </label>
      )}
      {mode === "free" && (
        <label className="flex flex-col gap-1 text-sm">
          Valor (R$)
          <input name="amount" type="number" min={5} step="0.01" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Seu nome
        <input name="payerName" required className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Seu e-mail (opcional)
        <input name="payerEmail" type="email" className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Recado (opcional)
        <textarea name="note" rows={2} maxLength={300} className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="anonymous" type="checkbox" />
        Presentear anonimamente
      </label>
      <fieldset className="flex gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" name="method" value="pix" defaultChecked /> Pix
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" name="method" value="cartao" /> Cartão
        </label>
      </fieldset>
      <label className="flex items-center gap-2 text-xs text-neutral-500">
        <input name="guestCoversFee" type="checkbox" />
        Quero cobrir a taxa da plataforma (ajuda o casal a receber o valor cheio)
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-rose-700 px-4 py-2 text-sm text-white hover:bg-rose-800 disabled:opacity-50"
      >
        {pending ? "Gerando pagamento…" : "Continuar"}
      </button>
    </form>
  );
}
