import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoupleById } from "@/server/repositories/couples";
import { getWallet } from "@/server/repositories/orders";
import { formatBRL } from "@/lib/money";
import { publishSiteAction, unpublishSiteAction } from "./actions";

export default async function CoupleOverviewPage({
  params,
}: {
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const couple = await getCoupleById(coupleId);
  if (!couple) notFound();

  const wallet = await getWallet(coupleId);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Convidados" value={String(couple.stats.guests)} />
        <Stat label="Confirmados" value={String(couple.stats.confirmed)} />
        <Stat label="Presentes recebidos" value={formatBRL(couple.stats.giftsTotal)} />
        <Stat label="Disponível para saque" value={formatBRL(wallet.available)} />
      </section>

      <section className="rounded border border-neutral-200 p-4">
        <h2 className="font-medium">Site do casamento</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {couple.published ? (
            <>
              Publicado em{" "}
              <Link href={`/c/${couple.slug}`} className="text-rose-700 underline" target="_blank">
                nsconvites.com.br/c/{couple.slug}
              </Link>
            </>
          ) : (
            "Ainda não publicado — os convidados não conseguem ver o site."
          )}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href={`/painel/${coupleId}/site`}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Editar site
          </Link>
          {couple.published ? (
            <form action={unpublishSiteAction.bind(null, coupleId)}>
              <button className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
                Despublicar
              </button>
            </form>
          ) : (
            <form action={publishSiteAction.bind(null, coupleId)}>
              <button className="rounded bg-rose-700 px-3 py-1.5 text-sm text-white hover:bg-rose-800">
                Publicar
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <QuickLink href={`/painel/${coupleId}/convidados`} title="Convidados" desc="Importar lista, links de convite, RSVP." />
        <QuickLink href={`/painel/${coupleId}/presentes`} title="Lista de presentes" desc="Catálogo, extrato e saque." />
        <QuickLink href={`/painel/${coupleId}/checklist`} title="Checklist e orçamento" desc="Tarefas e gastos por categoria." />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-200 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded border border-neutral-200 p-4 hover:bg-neutral-50">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-neutral-600">{desc}</p>
    </Link>
  );
}
