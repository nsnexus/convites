import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/painel");

  return <div className="mx-auto flex min-h-full max-w-5xl flex-1 flex-col px-6 py-8">{children}</div>;
}
