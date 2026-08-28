import Link from "next/link";
import type { Metadata } from "next";
import { searchVendors } from "@/server/repositories/vendors";
import { VENDOR_CATEGORY_LABEL } from "@/lib/vendor-categories";
import { formatBRL } from "@/lib/money";

type Params = { categoria: string; cidade: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria, cidade } = await params;
  const label = VENDOR_CATEGORY_LABEL[categoria] ?? categoria;
  return { title: `${label} em ${decodeURIComponent(cidade)}` };
}

export const revalidate = 300;

/** Landing programática categoria × cidade — motor de SEO do marketplace (ver plano §08). */
export default async function VendorsByCategoryCityPage({ params }: { params: Promise<Params> }) {
  const { categoria, cidade } = await params;
  const cityName = decodeURIComponent(cidade);
  const label = VENDOR_CATEGORY_LABEL[categoria] ?? categoria;
  const vendors = await searchVendors({ category: categoria, city: cityName });

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">
        {label} em {cityName}
      </h1>
      <ul className="flex flex-col gap-2">
        {vendors.map((v) => (
          <li key={v.id}>
            <Link href={`/v/${v.slug}`} className="block rounded border border-neutral-200 px-4 py-3 hover:bg-neutral-50">
              <p className="font-medium">{v.name}</p>
              <p className="text-sm text-neutral-500">a partir de {formatBRL(v.priceFrom)}</p>
            </Link>
          </li>
        ))}
        {vendors.length === 0 && (
          <p className="text-neutral-400">Nenhum fornecedor de {label.toLowerCase()} em {cityName} ainda.</p>
        )}
      </ul>
    </main>
  );
}
