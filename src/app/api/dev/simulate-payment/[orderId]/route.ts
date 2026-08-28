import { NextResponse } from "next/server";
import { confirmOrderPaid } from "@/server/payments/confirm-order";

/**
 * Só existe para o ambiente de desenvolvimento simular a confirmação de um
 * pagamento sem gateway real conectado. Chama o MESMO confirmOrderPaid que
 * o webhook real (fase 2) chamaria — ver src/server/payments/confirm-order.ts
 * e src/server/payments/dev-provider.ts.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Indisponível em produção." }, { status: 403 });
  }

  const { orderId } = await params;
  try {
    const result = await confirmOrderPaid(orderId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao confirmar pagamento." },
      { status: 400 }
    );
  }
}
