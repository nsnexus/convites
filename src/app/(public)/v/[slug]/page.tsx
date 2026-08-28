import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVendorBySlug } from "@/server/repositories/vendors";
import { getCurrentUser } from "@/server/auth/session";
import { VENDOR_CATEGORY_LABEL } from "@/lib/vendor-categories";
import { formatBRL } from "@/lib/money";
import { LeadForm } from "./lead-form";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  return { title: vendor?.name ?? "Fornecedor" };
}

export default async function VendorProfilePublicPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  const user = await getCurrentUser();

  const isOwner = user && vendor && vendor.ownerUid === user.uid;
  if (!vendor || (vendor.status !== "active" && !isOwner)) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      {vendor.status === "pending" && isOwner && (
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Perfil em análise — só você consegue ver esta página por enquanto.
        </p>
      )}
      <div>
        <h1 className="text-3xl font-semibold">{vendor.name}</h1>
        <p className="mt-1 text-neutral-600">
          {vendor.categories.map((c) => VENDOR_CATEGORY_LABEL[c] ?? c).join(", ")} · {vendor.cities.join(", ")}
        </p>
        <p className="mt-1 text-sm text-neutral-500">A partir de {formatBRL(vendor.priceFrom)}</p>
        {vendor.rating.count > 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            ⭐ {vendor.rating.avg.toFixed(1)} ({vendor.rating.count} avaliações)
          </p>
        )}
      </div>

      {vendor.about && <p className="whitespace-pre-line text-sm leading-relaxed">{vendor.about}</p>}

      <section className="rounded border border-neutral-200 p-4">
        <h2 className="mb-2 font-medium">Entrar em contato</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Seu telefone e e-mail só aparecem para o fornecedor depois que ele responder — ver plano §3.7.
        </p>
        <LeadForm vendorId={vendor.id} vendorSlug={slug} />
      </section>
    </main>
  );
}
