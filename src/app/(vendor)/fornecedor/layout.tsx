import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

/**
 * Só exige login aqui. A checagem de "já tem perfil de fornecedor?" é feita
 * em cada página (dashboard redireciona para /cadastro se faltar perfil;
 * /cadastro nunca redireciona de volta) — evita loop de redirect entre as
 * duas condições.
 */
export default async function FornecedorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/fornecedor");

  return <div className="mx-auto flex min-h-full max-w-5xl flex-1 flex-col px-6 py-8">{children}</div>;
}
