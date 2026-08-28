import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { walletRef, ledgerCol } from "@/server/repositories/orders";

/**
 * Saque — ver plano §07. Sem gateway real conectado ainda, isto registra o
 * pedido e move o saldo de "available" para "withdrawn" no mesmo instante
 * (não existe transferência de fato). TODO fase 2: KYC obrigatório antes de
 * liberar, e a transferência real via Pagar.me em vez do incremento direto.
 */
export async function requestWithdrawal(
  coupleId: string,
  amountCents: number,
  pixKey: string
): Promise<string> {
  const wRef = walletRef(coupleId);
  const withdrawalRef = adminDb.collection("withdrawals").doc();

  await adminDb.runTransaction(async (tx) => {
    const walletDoc = await tx.get(wRef);
    const available = (walletDoc.data()?.available as number | undefined) ?? 0;
    if (amountCents > available) {
      throw new Error("Saldo disponível insuficiente para este saque.");
    }

    tx.set(
      withdrawalRef,
      {
        coupleId,
        amount: amountCents,
        pixKey,
        kycStatus: "nao-verificado", // TODO fase 2
        status: "concluido-dev", // em produção: "pendente" até o gateway confirmar
        gatewayTransferId: null,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      wRef,
      { available: FieldValue.increment(-amountCents), withdrawn: FieldValue.increment(amountCents) },
      { merge: true }
    );

    tx.set(ledgerCol(coupleId).doc(), {
      type: "withdrawal",
      amount: -amountCents,
      orderId: null,
      withdrawalId: withdrawalRef.id,
      balanceAfter: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return withdrawalRef.id;
}

export async function listWithdrawals(coupleId: string) {
  const snap = await adminDb
    .collection("withdrawals")
    .where("coupleId", "==", coupleId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
