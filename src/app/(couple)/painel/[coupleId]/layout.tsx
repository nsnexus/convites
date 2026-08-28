import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getCoupleById } from "@/server/repositories/couples";
import { formatCoupleName } from "@/lib/couple-name";

const TABS = [
  { href: "", label: "Visão geral" },
  { href: "/site", label: "Site" },
  { href: "/convidados", label: "Convidados" },
  { href: "/presentes", label: "Presentes" },
  { href: "/checklist", label: "Checklist" },
  { href: "/orcamento", label: "Orçamento" },
];

export default async function CoupleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/painel/${coupleId}`);

  const couple = await getCoupleById(coupleId);
  if (!couple) notFound();
  if (!couple.members.includes(user.uid)) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-neutral-500">Painel do casal</p>
        <h1 className="text-2xl font-semibold">{formatCoupleName(couple.slug)}</h1>
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={`/painel/${coupleId}${tab.href}`}
            className="rounded-t px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
