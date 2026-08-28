import { listBudgetItems } from "@/server/repositories/planning";
import { formatBRL, sumCents } from "@/lib/money";
import { AddBudgetItemForm } from "./budget-form";
import { deleteBudgetItemAction } from "./actions";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const items = await listBudgetItems(coupleId);

  const totals = {
    planned: sumCents(...items.map((i) => i.planned)),
    contracted: sumCents(...items.map((i) => i.contracted)),
    paid: sumCents(...items.map((i) => i.paid)),
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-3 gap-4">
        <Stat label="Previsto" value={formatBRL(totals.planned)} />
        <Stat label="Contratado" value={formatBRL(totals.contracted)} />
        <Stat label="Pago" value={formatBRL(totals.paid)} />
      </section>

      <AddBudgetItemForm coupleId={coupleId} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2 pr-3">Categoria</th>
              <th className="py-2 pr-3">Fornecedor</th>
              <th className="py-2 pr-3">Previsto</th>
              <th className="py-2 pr-3">Contratado</th>
              <th className="py-2 pr-3">Pago</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const overBudget = item.contracted > item.planned && item.planned > 0;
              return (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-3">{item.category}</td>
                  <td className="py-2 pr-3 text-neutral-500">{item.vendorName ?? "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatBRL(item.planned)}</td>
                  <td className={`py-2 pr-3 tabular-nums ${overBudget ? "text-red-600" : ""}`}>
                    {formatBRL(item.contracted)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{formatBRL(item.paid)}</td>
                  <td className="py-2 pr-3 text-right">
                    <form action={deleteBudgetItemAction.bind(null, coupleId, item.id)}>
                      <button className="text-xs text-red-600 underline">remover</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-400">
                  Nenhum item de orçamento ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-200 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
