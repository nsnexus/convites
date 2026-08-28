import { notFound } from "next/navigation";
import { getCoupleById } from "@/server/repositories/couples";
import { listGiftItems } from "@/server/repositories/gift-items";
import { getWallet, listOrdersForCouple } from "@/server/repositories/orders";
import { formatBRL } from "@/lib/money";
import { AddGiftItemForm, WithdrawForm } from "./gift-forms";
import { toggleGiftItemAction, deleteGiftItemAction } from "./actions";

const MODE_LABEL: Record<string, string> = { item: "Simbólico", quota: "Cotas", free: "Valor livre" };
const ORDER_STATUS_LABEL: Record<string, string> = {
  created: "Aguardando pagamento",
  pending: "Processando",
  paid: "Pago",
  expired: "Expirado",
  refunded: "Estornado",
  chargeback: "Contestado",
};

export default async function GiftsPage({
  params,
}: {
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const couple = await getCoupleById(coupleId);
  if (!couple) notFound();

  const [items, wallet, orders] = await Promise.all([
    listGiftItems(coupleId),
    getWallet(coupleId),
    listOrdersForCouple(coupleId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Disponível" value={formatBRL(wallet.available)} />
        <Stat label="Em processamento" value={formatBRL(wallet.pending)} />
        <Stat label="Sacado" value={formatBRL(wallet.withdrawn)} />
        <Stat label="Bloqueado" value={formatBRL(wallet.blocked)} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Solicitar saque</h2>
        <WithdrawForm coupleId={coupleId} availableCents={wallet.available} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Adicionar presente ao catálogo</h2>
        <AddGiftItemForm coupleId={coupleId} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Catálogo</h2>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-neutral-500">
                  {MODE_LABEL[item.mode]} · {formatBRL(item.price)}
                  {item.mode === "quota" && ` · ${item.quotas.sold}/${item.quotas.total} cotas`}
                  {!item.active && " · inativo"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={toggleGiftItemAction.bind(null, coupleId, item.id, !item.active)}>
                  <button className="text-xs text-neutral-500 underline">{item.active ? "desativar" : "ativar"}</button>
                </form>
                <form action={deleteGiftItemAction.bind(null, coupleId, item.id)}>
                  <button className="text-xs text-red-600 underline">remover</button>
                </form>
              </div>
            </li>
          ))}
          {items.length === 0 && <p className="text-sm text-neutral-400">Nenhum presente cadastrado ainda.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Extrato</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2 pr-3">Presente</th>
                <th className="py-2 pr-3">De</th>
                <th className="py-2 pr-3">Valor</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-3">{order.giftTitle}</td>
                  <td className="py-2 pr-3">{order.anonymous ? "Anônimo" : order.payer.name}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatBRL(order.gross)}</td>
                  <td className="py-2 pr-3">{ORDER_STATUS_LABEL[order.status]}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-400">
                    Nenhuma contribuição ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
