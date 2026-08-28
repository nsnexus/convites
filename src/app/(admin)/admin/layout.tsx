import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/admin");
  if (!user.roles.includes("admin")) redirect("/");

  return <div className="mx-auto flex min-h-full max-w-6xl flex-1 flex-col px-6 py-8">{children}</div>;
}
