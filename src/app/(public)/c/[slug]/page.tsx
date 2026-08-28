import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCoupleBySlug } from "@/server/repositories/couples";
import { getGuest, listGuestNotes, markInviteOpened } from "@/server/repositories/guests";
import { listGiftItems } from "@/server/repositories/gift-items";
import { verifyInviteToken } from "@/server/auth/invite-token";
import { SITE_TEMPLATES } from "@/lib/site-templates";
import { formatBRL } from "@/lib/money";
import { daysUntil } from "@/lib/date";
import { formatCoupleName } from "@/lib/couple-name";
import { RsvpForm } from "./rsvp-form";

/**
 * Página pública do casal. Renderizada no servidor com o Admin SDK e
 * cacheada por ISR — nunca lê pelo SDK de cliente (ver plano §04).
 * Site com noindex por padrão (privacidade, ver plano §08).
 */
export const revalidate = 120;

type Params = { slug: string };
type Search = { g?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const couple = await getCoupleBySlug(slug);

  if (!couple || !couple.published) {
    return { title: "Convite não encontrado" };
  }

  return {
    title: formatCoupleName(couple.slug),
    robots: { index: false, follow: false },
  };
}

export default async function CoupleSitePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const { g: token } = await searchParams;
  const couple = await getCoupleBySlug(slug);

  if (!couple || !couple.published) {
    notFound();
  }

  const theme = SITE_TEMPLATES[couple.site.template as keyof typeof SITE_TEMPLATES]?.theme ?? SITE_TEMPLATES.classico.theme;
  const sections = new Set(couple.site.sections.length ? couple.site.sections : ["cerimonia-e-festa", "rsvp"]);
  const content = couple.site.content ?? {};

  let guest = null;
  if (token) {
    const payload = verifyInviteToken(token);
    if (payload && payload.coupleId === couple.id) {
      guest = await getGuest(couple.id, payload.guestId);
      await markInviteOpened(couple.id, payload.guestId);
    }
  }

  const weddingDate = new Date(`${couple.weddingDate}T00:00:00`);
  const daysLeft = daysUntil(couple.weddingDate);

  const [giftItems, notes] = await Promise.all([
    sections.has("lista-de-presentes") ? listGiftItems(couple.id) : Promise.resolve([]),
    sections.has("recados") ? listGuestNotes(couple.id) : Promise.resolve([]),
  ]);

  return (
    <main
      style={{ background: theme.bg, color: theme.ink, fontFamily: theme.font }}
      className="flex flex-1 flex-col"
    >
      <section className="flex flex-col items-center gap-3 px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] opacity-70">Casamento</p>
        <h1 className="text-4xl font-semibold" style={{ color: theme.accent }}>
          {formatCoupleName(couple.slug)}
        </h1>
        <p className="opacity-80">
          {couple.city} · {weddingDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-6 pb-24">
        {sections.has("historia") && content.historia && <Section title="Nossa história">{content.historia}</Section>}

        {sections.has("contagem-regressiva") && (
          <Section title="Contagem regressiva">
            {daysLeft > 0 ? `Faltam ${daysLeft} dias!` : daysLeft === 0 ? "É hoje! 🎉" : "Já aconteceu — obrigado por fazer parte."}
          </Section>
        )}

        {sections.has("cerimonia-e-festa") && (
          <Section title="Cerimônia e festa">
            {couple.venue ?? `Em ${couple.city}, detalhes do local em breve.`}
          </Section>
        )}

        {sections.has("cronograma") && content.cronograma && (
          <Section title="Cronograma">
            <div className="flex flex-col gap-1">
              {content.cronograma.split("\n").filter(Boolean).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </Section>
        )}

        {sections.has("dress-code") && content["dress-code"] && (
          <Section title="Dress code">{content["dress-code"]}</Section>
        )}

        {sections.has("hospedagem") && content.hospedagem && (
          <Section title="Hospedagem">{content.hospedagem}</Section>
        )}

        {sections.has("faq") && content.faq && <Section title="Perguntas frequentes">{content.faq}</Section>}

        {sections.has("rsvp") && (
          <Section title="Confirmar presença">
            {guest && token ? (
              <RsvpForm slug={slug} token={token} guestName={guest.name} maxSeats={guest.seats} accentColor={theme.accent} />
            ) : (
              <p className="text-sm opacity-70">
                Use o link pessoal que você recebeu por WhatsApp para confirmar presença.
              </p>
            )}
          </Section>
        )}

        {sections.has("lista-de-presentes") && (
          <Section title="Lista de presentes">
            <div className="grid gap-3 sm:grid-cols-2">
              {giftItems.filter((g) => g.active).map((item) => {
                const soldOut = item.mode === "quota" && item.quotas.total !== null && item.quotas.sold >= item.quotas.total;
                return (
                  <Link
                    key={item.id}
                    href={soldOut ? "#" : `/c/${slug}/presentear/${item.id}`}
                    aria-disabled={soldOut}
                    className={`rounded border p-3 text-sm ${soldOut ? "pointer-events-none opacity-50" : "hover:opacity-80"}`}
                    style={{ borderColor: theme.accent }}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="opacity-70">{formatBRL(item.price)}</p>
                    {item.mode === "quota" && (
                      <p className="text-xs opacity-60">
                        {soldOut ? "Esgotado" : `${(item.quotas.total ?? 0) - item.quotas.sold} cotas restantes`}
                      </p>
                    )}
                  </Link>
                );
              })}
              {giftItems.filter((g) => g.active).length === 0 && (
                <p className="text-sm opacity-60">O casal ainda não cadastrou presentes.</p>
              )}
            </div>
          </Section>
        )}

        {sections.has("recados") && (
          <Section title="Recados">
            <div className="flex flex-col gap-3">
              {notes.map((n, i) => (
                <p key={i} className="text-sm">
                  <span className="font-medium">{n.name}:</span> {n.note}
                </p>
              ))}
              {notes.length === 0 && <p className="text-sm opacity-60">Nenhum recado ainda.</p>}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="whitespace-pre-line text-sm leading-relaxed opacity-90">{children}</div>
    </section>
  );
}
