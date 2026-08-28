"use client";

import { useActionState, useRef, useEffect } from "react";
import { addGuestAction, importGuestsAction, type FormState } from "./actions";

const initialState: FormState = {};

export function AddGuestForm({ coupleId }: { coupleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addGuestAction.bind(null, coupleId), initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input name="name" placeholder="Nome" required className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <input name="phone" placeholder="Telefone (opcional)" className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm" />
        <input name="seats" type="number" min={1} defaultValue={1} className="w-1/2 rounded border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      <input name="email" placeholder="E-mail (opcional)" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <input name="groupLabel" placeholder="Grupo/família (opcional)" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-rose-700 px-3 py-1.5 text-sm text-white hover:bg-rose-800 disabled:opacity-50"
      >
        {pending ? "Adicionando…" : "Adicionar"}
      </button>
    </form>
  );
}

export function ImportGuestsForm({ coupleId }: { coupleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(importGuestsAction.bind(null, coupleId), initialState);

  useEffect(() => {
    if (state.ok && !state.error) formRef.current?.reset();
  }, [state.ok, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <textarea
        name="bulk"
        rows={5}
        placeholder={"Maria Silva, 11999999999, maria@email.com, 2\nJoão Souza"}
        required
        className="rounded border border-neutral-300 px-3 py-2 text-sm"
      />
      {state.error && <p className="text-xs text-amber-700">{state.error}</p>}
      {state.ok && !state.error && <p className="text-xs text-emerald-700">Importado.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Importando…" : "Importar"}
      </button>
    </form>
  );
}
