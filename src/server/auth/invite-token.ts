import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env.server";

/**
 * Token assinado do link de convite (`/c/[slug]?g=<token>`). Convidado nunca
 * cria conta — este token é a identidade dele. Ver plano §3.3 e §06.
 *
 * Formato: base64url(payload) + "." + base64url(hmac-sha256(payload))
 * payload = `${coupleId}:${guestId}:${expiresAtMs}`
 */
const FALLBACK_DEV_SECRET = "dev-only-insecure-secret-troque-em-producao";

function getSecret(): string {
  const secret = serverEnv.INVITE_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("INVITE_TOKEN_SECRET não configurado — obrigatório em produção.");
    }
    return FALLBACK_DEV_SECRET;
  }
  return secret;
}

function toBase64Url(input: Buffer): string {
  return input.toString("base64url");
}

export function signInviteToken(
  coupleId: string,
  guestId: string,
  expiresAt: Date
): string {
  const payload = `${coupleId}:${guestId}:${expiresAt.getTime()}`;
  const payloadB64 = toBase64Url(Buffer.from(payload, "utf8"));
  const signature = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${toBase64Url(signature)}`;
}

export type InviteTokenPayload = { coupleId: string; guestId: string; expiresAt: number };

export function verifyInviteToken(token: string): InviteTokenPayload | null {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  const givenSig = Buffer.from(sigB64, "base64url");

  if (expectedSig.length !== givenSig.length || !timingSafeEqual(expectedSig, givenSig)) {
    return null;
  }

  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const [coupleId, guestId, expiresAtStr] = payload.split(":");
  const expiresAt = Number(expiresAtStr);
  if (!coupleId || !guestId || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  return { coupleId, guestId, expiresAt };
}
