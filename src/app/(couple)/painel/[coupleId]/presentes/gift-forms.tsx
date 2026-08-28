"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addGiftItemAction, requestWithdrawalAction, type FormState } from "./actions";

const initialState: FormState = {};

export function AddGiftItemForm({ coupleId }: { coupleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState("item");
  const [state, formAction, pending] = useActionState(addGiftItemAction.bind(null, coupleId), initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input name="title" placeholder="Título (ex: Jogo de panelas)" required className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <textarea name="description" placeholder="Descrição (opcional)" rows={2} className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <input name="price" type="number" min={5} step="0.01" placeholder="Preço (R$)" required className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm" />
        <select name="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm">
          <option value="item">Presente simbólico</option>
          <option value="quota">Cotas (ex: lua de mel)</option>
          <option value="free">Valor livre</option>
        </select>
      </div>
      {mode === "quota" && (
        <input name="quotasTotal" type="number" min={1} placeholder="Número de cotas" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      )}
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-fit rounded bg-rose-700 px-3 py-1.5 text-sm text-white hover:bg-rose-800 disabled:opacity-50">
        {pending ? "Adicionando…" : "Adicionar presente"}
      </button>
    </form>
  );
}

export function WithdrawForm({ coupleId, availableCents }: { coupleId: string; availableCents: number }) {
  const [state, formAction, pending] = useActionState(requestWithdrawalAction.bind(null, coupleId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="amount"
          type="number"
          min={1}
          step="0.01"
          max={availableCents / 100}
          placeholder="Valor (R$)"
          required
          className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <input name="pixKey" placeholder="Chave Pix" required className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && <p className="text-xs text-emerald-700">Saque solicitado.</p>}
      <button
        type="submit"
        disabled={pending || availableCents === 0}
        className="w-fit rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Solicitar saque"}
      </button>
    </form>
  );
}
