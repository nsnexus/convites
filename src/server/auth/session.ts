import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Sessão via cookie httpOnly (padrão recomendado do Firebase para SSR).
 * O cliente troca o ID token (do firebase/auth) por este cookie logo após
 * o login, chamando POST /api/auth/session. Depois disso, Server Components
 * e Server Actions leem o papel do usuário sem precisar de um round-trip
 * ao Firestore em toda página. Ver plano §04 e §3.1.
 */
const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias

export type SessionUser = {
  uid: string;
  email: string | null;
  roles: Array<"couple" | "vendor" | "admin" | "support">;
};

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS });
}

export { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN_MS };

function toSessionUser(decoded: DecodedIdToken): SessionUser {
  const roles = Array.isArray(decoded.roles) ? (decoded.roles as SessionUser["roles"]) : [];
  return { uid: decoded.uid, email: decoded.email ?? null, roles };
}

/** Usar em Server Components / Server Actions. Retorna null se não logado. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return toSessionUser(decoded);
  } catch {
    return null; // cookie expirado, revogado ou inválido
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

export async function requireRole(role: SessionUser["roles"][number]): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.roles.includes(role)) {
    throw new Error(`Ação restrita ao papel "${role}".`);
  }
  return user;
}
