"use client";

import { useActionState, useRef, useEffect } from "react";
import { addTaskAction, type FormState } from "./actions";

const initialState: FormState = {};

export function AddTaskForm({ coupleId }: { coupleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addTaskAction.bind(null, coupleId), initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="title" placeholder="Tarefa" required className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <input name="dueDate" type="date" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      <input name="category" placeholder="Categoria (opcional)" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-rose-700 px-3 py-2 text-sm text-white hover:bg-rose-800 disabled:opacity-50">
        {pending ? "Adicionando…" : "Adicionar"}
      </button>
    </form>
  );
}
