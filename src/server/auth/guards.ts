import "server-only";
import { requireUser, type SessionUser } from "@/server/auth/session";
import { getCoupleById } from "@/server/repositories/couples";
import { getVendorById } from "@/server/repositories/vendors";

/** Usado no topo de toda Server Action que mexe em dado de um casal específico. */
export async function requireCoupleMember(coupleId: string): Promise<SessionUser> {
  const user = await requireUser();
  const couple = await getCoupleById(coupleId);
  if (!couple || !couple.members.includes(user.uid)) {
    throw new Error("Você não tem acesso a este casamento.");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.roles.includes("admin")) {
    throw new Error("Ação restrita a administradores.");
  }
  return user;
}

export async function requireVendorOwner(vendorId: string): Promise<SessionUser> {
  const user = await requireUser();
  const vendor = await getVendorById(vendorId);
  if (!vendor || vendor.ownerUid !== user.uid) {
    throw new Error("Você não tem acesso a este perfil de fornecedor.");
  }
  return user;
}
