import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { listCouplesForUser } from "@/server/repositories/couples";
import { CreateCoupleForm } from "./create-couple-form";

export default async function PainelHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/painel");

  const couples = await listCouplesForUser(user.uid);

  if (couples.length === 1) {
    redirect(`/painel/${couples[0].id}`);
  }

  if (couples.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-6">
        <h1 className="text-2xl font-semibold">Criar site do casamento</h1>
        <CreateCoupleForm />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">Seus casamentos</h1>
      <ul className="flex flex-col gap-2">
        {couples.map((c) => (
          <li key={c.id}>
            <Link
              href={`/painel/${c.id}`}
              className="block rounded border border-neutral-200 px-4 py-3 hover:bg-neutral-50"
            >
              <span className="font-medium">{c.slug}</span>
              <span className="ml-2 text-sm text-neutral-500">{c.city}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
