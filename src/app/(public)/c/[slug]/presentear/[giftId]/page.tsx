import { notFound } from "next/navigation";
import { getCoupleBySlug } from "@/server/repositories/couples";
import { getGiftItem } from "@/server/repositories/gift-items";
import { formatBRL } from "@/lib/money";
import { ContributeForm } from "./contribute-form";

export default async function GiftCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string; giftId: string }>;
}) {
  const { slug, giftId } = await params;
  const couple = await getCoupleBySlug(slug);
  if (!couple) notFound();

  const gift = await getGiftItem(couple.id, giftId);
  if (!gift || !gift.active) notFound();

  const remaining = gift.mode === "quota" ? (gift.quotas.total ?? 0) - gift.quotas.sold : null;

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{gift.title}</h1>
        {gift.description && <p className="mt-1 text-neutral-600">{gift.description}</p>}
        <p className="mt-2 text-lg tabular-nums">{formatBRL(gift.price)}</p>
        {gift.mode === "quota" && <p className="text-sm text-neutral-500">{remaining} cotas restantes</p>}
      </div>
      <ContributeForm slug={slug} giftId={giftId} mode={gift.mode} priceCents={gift.price} quotasRemaining={remaining} />
    </main>
  );
}
