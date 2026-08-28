import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Padrão de webhook (ver plano §04 e §07): valida a assinatura, grava o
 * evento bruto por ID do provedor (idempotência) e responde 200 rápido.
 * Processamento pesado (atualizar orders/ledger/wallets) fica para uma
 * Cloud Function disparada por esse documento — não roda aqui dentro.
 *
 * Fase 2 liga isto ao gateway real (Pagar.me — ver §07). Por enquanto o
 * handler só define o contrato: validação de assinatura por provedor e
 * gravação idempotente.
 */
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const raw = await request.text();

  const signatureValid = verifySignature(provider, request.headers, raw);
  if (!signatureValid) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const event = JSON.parse(raw) as { id?: string; type?: string };
  const eventId = event.id;
  if (!eventId) {
    return NextResponse.json({ error: "evento sem id" }, { status: 400 });
  }

  // ID do provedor como ID do documento: reentrega do webhook não duplica.
  await adminDb.collection("webhookEvents").doc(eventId).set(
    {
      provider,
      type: event.type ?? "unknown",
      raw: event,
      receivedAt: new Date(),
      processedAt: null,
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}

function verifySignature(provider: string, headers: Headers, raw: string): boolean {
  // TODO fase 2: implementar por provedor (ex.: Pagar.me manda a assinatura
  // em X-Hub-Signature). Usar PAGARME_WEBHOOK_SECRET (ver src/lib/env.server.ts).
  // headers/raw entram na verificação HMAC quando a integração real chegar.
  void headers;
  void raw;
  if (process.env.NODE_ENV !== "production") return true;
  console.warn(`verifySignature não implementado para o provedor "${provider}"`);
  return false;
}
