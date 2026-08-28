"use client";

import { useActionState } from "react";
import { submitRsvpAction, type RsvpState } from "./rsvp-actions";

const initialState: RsvpState = {};

export function RsvpForm({
  slug,
  token,
  guestName,
  maxSeats,
  accentColor,
}: {
  slug: string;
  token: string;
  guestName: string;
  maxSeats: number;
  accentColor: string;
}) {
  const boundAction = submitRsvpAction.bind(null, slug, token);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.ok) {
    return <p className="text-sm">Obrigado, {guestName}! Sua resposta foi registrada. 🎉</p>;
  }

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3">
      <p className="text-sm opacity-80">Olá, {guestName}! Você confirma presença?</p>
      <div className="flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded border px-3 py-2 text-sm has-[:checked]:font-medium" style={{ borderColor: accentColor }}>
          <input type="radio" name="status" value="confirmado" defaultChecked required className="sr-only" />
          Vou! 🎉
        </label>
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded border px-3 py-2 text-sm has-[:checked]:font-medium" style={{ borderColor: accentColor }}>
          <input type="radio" name="status" value="recusado" required className="sr-only" />
          Não vou poder
        </label>
      </div>
      {maxSeats > 1 && (
        <label className="flex flex-col gap-1 text-sm">
          Acompanhantes (máx. {maxSeats - 1})
          <input name="companions" type="number" min={0} max={maxSeats - 1} defaultValue={0} className="rounded border px-3 py-2" style={{ borderColor: accentColor }} />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Restrição alimentar
        <select name="meal" className="rounded border px-3 py-2" style={{ borderColor: accentColor }}>
          <option value="padrao">Sem restrição</option>
          <option value="vegetariano">Vegetariano</option>
          <option value="vegano">Vegano</option>
          <option value="sem-gluten">Sem glúten</option>
          <option value="outro">Outra</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Recado para o casal (opcional)
        <textarea name="note" rows={2} maxLength={300} className="rounded border px-3 py-2" style={{ borderColor: accentColor }} />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded px-4 py-2 text-sm text-white disabled:opacity-50"
        style={{ background: accentColor }}
      >
        {pending ? "Enviando…" : "Enviar resposta"}
      </button>
    </form>
  );
}
