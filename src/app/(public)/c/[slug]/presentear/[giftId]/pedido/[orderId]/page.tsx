import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/server/repositories/orders";
import { formatBRL } from "@/lib/money";
import { SimulatePaymentButton } from "./simulate-payment-button";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ slug: string; giftId: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  if (order.status === "paid") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Presente confirmado! 🎉</h1>
        <p className="text-neutral-600">
          Obrigado por presentear com {formatBRL(order.gross)} — {order.giftTitle}.
        </p>
        <Link href={`/c/${slug}`} className="mt-4 text-rose-700 underline">
          Voltar ao site do casal
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Quase lá</h1>
        <p className="mt-1 text-neutral-600">
          {order.giftTitle} · {formatBRL(order.gross)}
        </p>
      </div>

      {order.method === "pix" && order.gateway.pixCopyPaste && (
        <div className="rounded border border-neutral-200 p-4">
          <p className="text-sm font-medium">Pix copia e cola</p>
          <p className="mt-1 break-all rounded bg-neutral-100 p-2 font-mono text-xs">
            {order.gateway.pixCopyPaste}
          </p>
        </div>
      )}

      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Ambiente de desenvolvimento</p>
        <p className="mt-1">
          Nenhuma cobrança real acontece aqui. Clique abaixo para simular a confirmação do pagamento
          — no fluxo real (fase 2), isso vem do webhook do gateway.
        </p>
        <SimulatePaymentButton orderId={orderId} />
      </div>
    </main>
  );
}
