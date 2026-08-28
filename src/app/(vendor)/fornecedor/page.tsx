import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getVendorByOwner } from "@/server/repositories/vendors";
import { listLeadsForVendor } from "@/server/repositories/leads";
import { VENDOR_CATEGORY_LABEL } from "@/lib/vendor-categories";
import { updateLeadStatusAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  respondido: "Respondido",
  fechado: "Fechado",
  perdido: "Perdido",
};

export default async function VendorDashboardPage() {
  const user = await requireUser();
  const vendor = await getVendorByOwner(user.uid);
  if (!vendor) redirect("/fornecedor/cadastro");

  const leads = await listLeadsForVendor(vendor.id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{vendor.name}</h1>
          <p className="text-sm text-neutral-500">
            {vendor.status === "pending" && "Aguardando aprovação no backoffice."}
            {vendor.status === "active" && "Ativo — aparecendo nas buscas."}
            {vendor.status === "suspended" && "Suspenso."}
            {" · "}
            {vendor.categories.map((c) => VENDOR_CATEGORY_LABEL[c] ?? c).join(", ")}
          </p>
        </div>
        <Link href="/fornecedor/perfil" className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
          Editar perfil
        </Link>
      </header>

      <section>
        <h2 className="mb-2 font-medium">Leads</h2>
        <ul className="flex flex-col gap-2">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded border border-neutral-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{lead.contactUnlocked ? lead.coupleName : "Casal (contato após responder)"}</p>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{STATUS_LABEL[lead.status]}</span>
              </div>
              <p className="mt-1 text-neutral-600">{lead.message}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {lead.eventDate && `Data: ${lead.eventDate} · `}
                {lead.guestCount && `${lead.guestCount} convidados · `}
                {lead.budgetRange}
              </p>
              {lead.status === "novo" && (
                <div className="mt-2 flex gap-2">
                  <form action={updateLeadStatusAction.bind(null, vendor.id, lead.id, "respondido")}>
                    <button className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">
                      Marcar como respondido
                    </button>
                  </form>
                  <form action={updateLeadStatusAction.bind(null, vendor.id, lead.id, "perdido")}>
                    <button className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">
                      Marcar como perdido
                    </button>
                  </form>
                </div>
              )}
              {lead.status === "respondido" && (
                <form action={updateLeadStatusAction.bind(null, vendor.id, lead.id, "fechado")} className="mt-2">
                  <button className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">
                    Marcar como fechado
                  </button>
                </form>
              )}
            </li>
          ))}
          {leads.length === 0 && <p className="text-sm text-neutral-400">Nenhum lead ainda.</p>}
        </ul>
      </section>
    </div>
  );
}
