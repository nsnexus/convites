import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { ordersCol, walletRef, ledgerCol, type OrderDoc } from "@/server/repositories/orders";

/**
 * Passo 3 do ciclo de vida (plano §07): confirmação de pagamento.
 * Chamado tanto pelo webhook real (fase 2) quanto pelo botão de simulação
 * em dev (/api/dev/simulate-payment) — é o único caminho que move dinheiro
 * entre "pending" e "available" na carteira do casal. Idempotente: reentrega
 * do mesmo evento não duplica o crédito.
 */
export async function confirmOrderPaid(orderId: string): Promise<{ alreadyProcessed: boolean }> {
  const orderRef = ordersCol().doc(orderId);

  return adminDb.runTransaction(async (tx) => {
    const orderDoc = await tx.get(orderRef);
    if (!orderDoc.exists) throw new Error(`Pedido ${orderId} não encontrado.`);
    const order = orderDoc.data() as OrderDoc;

    if (order.status === "paid") {
      return { alreadyProcessed: true };
    }
    if (order.status !== "pending" && order.status !== "created") {
      throw new Error(`Pedido ${orderId} está em status "${order.status}" — não pode ser confirmado.`);
    }

    tx.update(orderRef, {
      status: "paid",
      timeline: FieldValue.arrayUnion({ type: "paid", at: new Date() }),
    });

    // Pix liquida quase na hora (D+0/D+1); cartão fica retido até D+30 no
    // gateway real. Em dev, simplificamos cartão para "pending" mesmo assim,
    // só para o extrato mostrar os dois estados.
    const bucket = order.method === "pix" ? "available" : "pending";

    const wRef = walletRef(order.coupleId);
    tx.set(
      wRef,
      { [bucket]: FieldValue.increment(order.net), currency: "BRL" },
      { merge: true }
    );

    const ledgerRef = ledgerCol(order.coupleId).doc();
    tx.set(ledgerRef, {
      type: "credit",
      amount: order.net,
      orderId,
      balanceAfter: null, // agregado é o wallet; ledger é o extrato de auditoria
      createdAt: FieldValue.serverTimestamp(),
    });

    const feeLedgerRef = ledgerCol(order.coupleId).doc();
    tx.set(feeLedgerRef, {
      type: "fee",
      amount: -order.feePlatform,
      orderId,
      balanceAfter: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    const coupleRef = adminDb.collection("couples").doc(order.coupleId);
    tx.update(coupleRef, { "stats.giftsTotal": FieldValue.increment(order.gross) });

    return { alreadyProcessed: false };
  });
}

/** Estorno — ver plano §07 "Exceções". Libera a cota e reverte o crédito. */
export async function refundOrder(orderId: string): Promise<void> {
  const orderRef = ordersCol().doc(orderId);

  await adminDb.runTransaction(async (tx) => {
    const orderDoc = await tx.get(orderRef);
    if (!orderDoc.exists) throw new Error(`Pedido ${orderId} não encontrado.`);
    const order = orderDoc.data() as OrderDoc;
    if (order.status !== "paid") throw new Error("Só é possível estornar um pedido pago.");

    tx.update(orderRef, {
      status: "refunded",
      timeline: FieldValue.arrayUnion({ type: "refunded", at: new Date() }),
    });

    const bucket = order.method === "pix" ? "available" : "pending";
    tx.set(walletRef(order.coupleId), { [bucket]: FieldValue.increment(-order.net) }, { merge: true });

    const ledgerRef = ledgerCol(order.coupleId).doc();
    tx.set(ledgerRef, {
      type: "refund",
      amount: -order.net,
      orderId,
      balanceAfter: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (order.giftId) {
      const giftRef = adminDb
        .collection("couples")
        .doc(order.coupleId)
        .collection("giftItems")
        .doc(order.giftId);
      tx.update(giftRef, { "quotas.sold": FieldValue.increment(-order.quotas) });
    }

    const coupleRef = adminDb.collection("couples").doc(order.coupleId);
    tx.update(coupleRef, { "stats.giftsTotal": FieldValue.increment(-order.gross) });
  });
}
