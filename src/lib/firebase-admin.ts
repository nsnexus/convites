import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { serverEnv } from "@/lib/env.server";

/**
 * Admin SDK — única porta de escrita para dado sensível (dinheiro, papéis,
 * moderação, tokens de convite). Repositórios em src/server/repositories/*
 * são o único lugar que deve importar este módulo. Ver plano §04.
 */
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  if (useEmulators) {
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
    process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";

    return initializeApp({ projectId: serverEnv.FIREBASE_ADMIN_PROJECT_ID });
  }

  return initializeApp({
    credential: cert({
      projectId: serverEnv.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: serverEnv.FIREBASE_ADMIN_CLIENT_EMAIL,
      // .env guarda a chave com \n escapado — precisa devolver quebras reais.
      privateKey: serverEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export { FieldValue, Timestamp };
