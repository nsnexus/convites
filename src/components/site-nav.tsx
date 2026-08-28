"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function SiteNav() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  // Site público do casal fica imersivo, sem a barra do produto por cima.
  if (pathname?.startsWith("/c/")) return null;

  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          NSConvites
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/fornecedores" className="text-neutral-600 hover:text-neutral-900">
            Fornecedores
          </Link>
          {!loading && user ? (
            <>
              <Link href="/painel" className="text-neutral-600 hover:text-neutral-900">
                Meu painel
              </Link>
              <button onClick={() => signOut()} className="text-neutral-600 hover:text-neutral-900">
                Sair
              </button>
            </>
          ) : (
            !loading && (
              <>
                <Link href="/entrar" className="text-neutral-600 hover:text-neutral-900">
                  Entrar
                </Link>
                <Link href="/cadastro" className="rounded bg-rose-700 px-3 py-1.5 text-white hover:bg-rose-800">
                  Criar conta
                </Link>
              </>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
