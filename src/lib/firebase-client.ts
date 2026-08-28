"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { clientEnv } from "@/lib/env";

/**
 * SDK de cliente — só para painéis autenticados (listeners em tempo real:
 * chat, leads, RSVP chegando). Leitura pública (site do casal, perfil de
 * fornecedor) usa o Admin SDK no servidor + ISR. Ver plano §04.
 */
const firebaseConfig = {
  apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export const app = getFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Conecta aos emuladores em dev local. Guardado por globalThis para não
// reconectar em cada Fast Refresh.
declare global {
  var __firebaseEmulatorsConnected: boolean | undefined;
}

if (clientEnv.NEXT_PUBLIC_USE_FIREBASE_EMULATORS && !globalThis.__firebaseEmulatorsConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  globalThis.__firebaseEmulatorsConnected = true;
}

// App Check entra aqui quando a site key do reCAPTCHA Enterprise estiver
// configurada (plano §06 — obrigatório antes de sair da fase 0/1 para prod).
// import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
