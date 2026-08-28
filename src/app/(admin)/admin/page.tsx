import { listPendingVendors } from "@/server/repositories/vendors";
import { VENDOR_CATEGORY_LABEL } from "@/lib/vendor-categories";
import { setVendorStatusAction } from "./actions";

export default async function AdminHomePage() {
  const pending = await listPendingVendors();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Moderação de fornecedores</h1>
      <ul className="flex flex-col gap-2">
        {pending.map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded border border-neutral-200 p-3 text-sm">
            <div>
              <p className="font-medium">{v.name}</p>
              <p className="text-neutral-500">
                {v.categories.map((c) => VENDOR_CATEGORY_LABEL[c] ?? c).join(", ")} · {v.cities.join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={setVendorStatusAction.bind(null, v.id, "active")}>
                <button className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white hover:bg-emerald-800">Aprovar</button>
              </form>
              <form action={setVendorStatusAction.bind(null, v.id, "suspended")}>
                <button className="rounded border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50">Recusar</button>
              </form>
            </div>
          </li>
        ))}
        {pending.length === 0 && <p className="text-neutral-400">Nenhum fornecedor aguardando aprovação.</p>}
      </ul>
    </div>
  );
}
