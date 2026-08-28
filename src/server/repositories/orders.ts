import "server-only";
import { randomUUID } from "node:crypto";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { giftItemRef, type GiftItemDoc } from "@/server/repositories/gift-items";
import type { ChargeMethod, CreateChargeResult } from "@/server/payments/provider";

/**
 * orders / wallets / ledger — o núcleo financeiro (ver plano §05 e §07).
 * Toda escrita aqui é transacional. Dinheiro sempre em centavos, inteiro.
 */

const ordersCol = () => adminDb.collection("orders");
const walletRef = (coupleId: string) => adminDb.collection("wallets").doc(coupleId);
const ledgerCol = (coupleId: string) => walletRef(coupleId).collection("ledger");

const HOLD_MINUTES = 15;

export type OrderStatus = "created" | "pending" | "paid" | "expired" | "refunded" | "chargeback";

export type OrderDoc = {
  coupleId: string;
  giftId: string;
  giftTitle: string;
  quotas: number;
  gross: number; // centavos
  feePlatform: number;
  feeGateway: number;
  net: number;
  method: ChargeMethod;
  payer: { name: string; email: string | null };
  note: string | null;
  anonymous: boolean;
  status: OrderStatus;
  gateway: { provider: string | null; chargeId: string | null; pixCopyPaste: string | null };
  idempotencyKey: string;
  holdExpiresAt: FirebaseFirestore.Timestamp | null;
  timeline: Array<{ type: string; at: FirebaseFirestore.Timestamp | Date }>;
  createdAt: FirebaseFirestore.Timestamp;
};

const PLATFORM_FEE_RATE = 0.049; // 4,9% — ver plano §07

/** Passo 1 do ciclo de vida (plano §07): reserva a cota e cria a intenção. */
export async function createOrderIntent(input: {
  coupleId: string;
  giftId: string;
  quotas: number;
  grossCents: number;
  method: ChargeMethod;
  payerName: string;
  payerEmail: string | null;
  note: string | null;
  anonymous: boolean;
  /** Quando o convidado cobre a taxa, a comissão já está embutida no gross
   * e não deve ser recalculada sobre ele — ver plano §07. */
  feePlatformCents?: number;
}): Promise<string> {
  const giftRef = giftItemRef(input.coupleId, input.giftId);
  const orderRef = ordersCol().doc();

  await adminDb.runTransaction(async (tx) => {
    const giftDoc = await tx.get(giftRef);
    if (!giftDoc.exists) throw new Error("Presente não encontrado.");
    const gift = giftDoc.data() as GiftItemDoc;
    if (!gift.active) throw new Error("Este presente não está mais disponível.");

    if (gift.mode !== "free") {
      const total = gift.quotas.total ?? 1;
      const nextSold = gift.quotas.sold + input.quotas;
      if (nextSold > total) {
        throw new Error("Não há cotas suficientes disponíveis para este presente.");
      }
      tx.update(giftRef, { "quotas.sold": FieldValue.increment(input.quotas) });
    }

    const feePlatform = input.feePlatformCents ?? Math.round(input.grossCents * PLATFORM_FEE_RATE);
    const order: OrderDoc = {
      coupleId: input.coupleId,
      giftId: input.giftId,
      giftTitle: gift.title,
      quotas: input.quotas,
      gross: input.grossCents,
      feePlatform,
      feeGateway: 0, // preenchido na confirmação, quando o gateway real informa a tarifa
      net: input.grossCents - feePlatform,
      method: input.method,
      payer: { name: input.payerName, email: input.payerEmail },
      note: input.note,
      anonymous: input.anonymous,
      status: "created",
      gateway: { provider: null, chargeId: null, pixCopyPaste: null },
      idempotencyKey: randomUUID(),
      holdExpiresAt: null,
      timeline: [{ type: "created", at: new Date() }],
      createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
    };
    tx.set(orderRef, order);
    tx.update(orderRef, {
      holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
    });
  });

  return orderRef.id;
}

/** Passo 2: registra a cobrança criada no gateway (real ou dev). */
export async function attachCharge(
  orderId: string,
  providerName: string,
  charge: CreateChargeResult
): Promise<void> {
  await ordersCol()
    .doc(orderId)
    .update({
      status: "pending",
      gateway: {
        provider: providerName,
        chargeId: charge.chargeId,
        pixCopyPaste: charge.pix?.copyPaste ?? null,
      },
      timeline: FieldValue.arrayUnion({ type: "charge_created", at: new Date() }),
    });
}

export async function getOrder(orderId: string): Promise<(OrderDoc & { id: string }) | null> {
  const doc = await ordersCol().doc(orderId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as OrderDoc) };
}

export async function listOrdersForCouple(coupleId: string): Promise<Array<OrderDoc & { id: string }>> {
  const snap = await ordersCol()
    .where("coupleId", "==", coupleId)
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as OrderDoc) }));
}

export async function getWallet(coupleId: string) {
  const doc = await walletRef(coupleId).get();
  // O documento é escrito por merge, um campo por vez (ver confirm-order.ts
  // e withdrawals.ts) — nunca assume que os quatro campos existem juntos,
  // mesmo quando o doc já existe.
  const data = (doc.data() ?? {}) as Partial<{
    pending: number;
    available: number;
    blocked: number;
    withdrawn: number;
    currency: "BRL";
  }>;
  return {
    pending: data.pending ?? 0,
    available: data.available ?? 0,
    blocked: data.blocked ?? 0,
    withdrawn: data.withdrawn ?? 0,
    currency: data.currency ?? ("BRL" as const),
  };
}

export { ordersCol, walletRef, ledgerCol };
