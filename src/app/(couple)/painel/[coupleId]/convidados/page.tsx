import { notFound } from "next/navigation";
import { getCoupleById } from "@/server/repositories/couples";
import { listGuests } from "@/server/repositories/guests";
import { getSiteOrigin } from "@/lib/site-url.server";
import { buildWhatsAppShareLink } from "@/lib/phone";
import { AddGuestForm, ImportGuestsForm } from "./guest-forms";
import { deleteGuestAction, markSentAction } from "./actions";

const RSVP_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
};

const RSVP_CLASS: Record<string, string> = {
  pendente: "bg-neutral-100 text-neutral-600",
  confirmado: "bg-emerald-100 text-emerald-700",
  recusado: "bg-red-100 text-red-700",
};

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const couple = await getCoupleById(coupleId);
  if (!couple) notFound();

  const [guests, origin] = await Promise.all([listGuests(coupleId), getSiteOrigin()]);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-medium">Adicionar convidado</h2>
          <AddGuestForm coupleId={coupleId} />
        </div>
        <div>
          <h2 className="mb-2 font-medium">Colar lista</h2>
          <p className="mb-2 text-xs text-neutral-500">
            Uma linha por convidado: nome, telefone, e-mail, assentos (só o nome é obrigatório).
          </p>
          <ImportGuestsForm coupleId={coupleId} />
        </div>
      </section>

      <section className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2 pr-3">Nome</th>
              <th className="py-2 pr-3">Assentos</th>
              <th className="py-2 pr-3">RSVP</th>
              <th className="py-2 pr-3">Convite</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => {
              const link = `${origin}/c/${couple.slug}?g=${encodeURIComponent(guest.inviteToken ?? "")}`;
              const message = `Você foi convidado(a) para o casamento! Confirme presença: ${link}`;
              const waLink = buildWhatsAppShareLink(guest.phone, message);
              return (
                <tr key={guest.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-3">
                    {guest.name}
                    {guest.groupLabel && <span className="ml-2 text-xs text-neutral-400">{guest.groupLabel}</span>}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{guest.seats}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${RSVP_CLASS[guest.rsvp.status]}`}>
                      {RSVP_LABEL[guest.rsvp.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <a href={waLink} target="_blank" rel="noreferrer" className="text-rose-700 underline">
                        Compartilhar
                      </a>
                      {guest.sentAt ? (
                        <span className="text-xs text-neutral-400">enviado</span>
                      ) : (
                        <form action={markSentAction.bind(null, coupleId, guest.id)}>
                          <button className="text-xs text-neutral-500 underline">marcar enviado</button>
                        </form>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <form action={deleteGuestAction.bind(null, coupleId, guest.id)}>
                      <button className="text-xs text-red-600 underline">remover</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {guests.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-neutral-400">
                  Nenhum convidado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
