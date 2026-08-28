import Link from "next/link";
import { VENDOR_CATEGORY_LABEL } from "@/lib/vendor-categories";

export const metadata = { title: "Fornecedores para o seu casamento" };

export default function VendorsIndexPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">Fornecedores</h1>
      <p className="text-neutral-600">Escolha uma categoria para começar a busca.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(VENDOR_CATEGORY_LABEL).map(([id, label]) => (
          <Link
            key={id}
            href={`/fornecedores/${id}`}
            className="rounded border border-neutral-200 px-4 py-3 text-sm hover:bg-neutral-50"
          >
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
