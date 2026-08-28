import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";

initializeApp();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 10 });

/**
 * Ao criar um casal, garante a custom claim "couple" no token do dono.
 * Custom claims só são gravadas aqui — nunca pelo cliente (ver plano §3.1).
 */
export const onCoupleCreatedGrantRole = onDocumentCreated("couples/{coupleId}", async (event) => {
  const data = event.data?.data();
  const ownerUid = data?.members?.[0];
  if (!ownerUid) return;

  const auth = getAuth();
  const user = await auth.getUser(ownerUid);
  const roles: string[] = Array.isArray(user.customClaims?.roles) ? user.customClaims!.roles : [];

  if (!roles.includes("couple")) {
    await auth.setCustomUserClaims(ownerUid, { ...user.customClaims, roles: [...roles, "couple"] });
    logger.info(`Claim "couple" concedida a ${ownerUid}`, { coupleId: event.params.coupleId });
  }
});

/**
 * Ao criar um fornecedor, concede a claim "vendor" ao dono do perfil.
 */
export const onVendorCreatedGrantRole = onDocumentCreated("vendors/{vendorId}", async (event) => {
  const data = event.data?.data();
  const ownerUid = data?.ownerUid as string | undefined;
  if (!ownerUid) return;

  const auth = getAuth();
  const user = await auth.getUser(ownerUid);
  const roles: string[] = Array.isArray(user.customClaims?.roles) ? user.customClaims!.roles : [];

  if (!roles.includes("vendor")) {
    await auth.setCustomUserClaims(ownerUid, { ...user.customClaims, roles: [...roles, "vendor"] });
    logger.info(`Claim "vendor" concedida a ${ownerUid}`, { vendorId: event.params.vendorId });
  }
});

/**
 * Espelha o fornecedor no índice de busca (Typesense/Algolia) a cada
 * escrita. Stub — fase 3 do plano (§08). Implementar client do índice em
 * functions/src/search.ts quando a integração entrar.
 */
export const onVendorWrittenSyncSearchIndex = onDocumentWritten("vendors/{vendorId}", async (event) => {
  if (!event.data?.after.exists) {
    logger.info(`TODO fase 3: remover ${event.params.vendorId} do índice de busca`);
    return;
  }

  const vendor = event.data.after.data();
  logger.info(`TODO fase 3: sincronizar vendor ${event.params.vendorId} no índice de busca`, {
    status: vendor?.status,
  });
});

/**
 * Lembretes automáticos de RSVP em D-30 e D-7 (ver plano §3.3).
 * Stub — roda todo dia às 9h (horário de Brasília) e, por enquanto, só
 * loga quantos casais têm data de casamento nas janelas de lembrete.
 */
export const dailyReminderSweep = onSchedule(
  { schedule: "0 9 * * *", timeZone: "America/Fortaleza" },
  async () => {
    logger.info("TODO fase 1: varrer couples com weddingDate em D-30/D-7 e disparar lembrete");
  }
);

/**
 * Libera cotas de presente reservadas por um pedido que nunca foi pago
 * (hold de 15 minutos — ver plano §07, passo 1 do ciclo de vida). Roda a
 * cada 5 minutos. Espelha a lógica de src/server/repositories/orders.ts
 * (createOrderIntent) — funções não compartilham código com o app Next.js
 * (projetos TypeScript separados), então a regra é duplicada aqui de
 * propósito, com o mesmo comentário nos dois lados.
 */
export const releaseExpiredGiftHolds = onSchedule({ schedule: "every 5 minutes" }, async () => {
  const db = getFirestore();
  const now = new Date();

  const expired = await db
    .collection("orders")
    .where("status", "==", "created")
    .where("holdExpiresAt", "<=", now)
    .limit(200)
    .get();

  if (expired.empty) return;

  for (const doc of expired.docs) {
    const order = doc.data();
    await db.runTransaction(async (tx) => {
      const orderRef = doc.ref;
      const fresh = await tx.get(orderRef);
      if (!fresh.exists || fresh.data()?.status !== "created") return; // já mudou de status

      tx.update(orderRef, {
        status: "expired",
        timeline: FieldValue.arrayUnion({ type: "expired", at: now }),
      });

      if (order.giftId && order.quotas) {
        const giftRef = db
          .collection("couples")
          .doc(order.coupleId)
          .collection("giftItems")
          .doc(order.giftId);
        tx.update(giftRef, { "quotas.sold": FieldValue.increment(-order.quotas) });
      }
    });
  }

  logger.info(`releaseExpiredGiftHolds: ${expired.size} pedido(s) expirado(s) processado(s)`);
});
