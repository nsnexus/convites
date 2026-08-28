import { z } from "zod";

/**
 * Variáveis expostas ao browser. Só o que começa com NEXT_PUBLIC_ chega aqui
 * em runtime no cliente — o restante (env server-only) fica em ./env.server.ts
 * e nunca deve ser importado de um Client Component.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_APP_CHECK_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

function parseClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_APP_CHECK_SITE_KEY: process.env.NEXT_PUBLIC_APP_CHECK_SITE_KEY,
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
  });

  if (!parsed.success) {
    console.error(
      "Variáveis de ambiente do Firebase (cliente) inválidas ou ausentes:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error(
      "Configuração do Firebase incompleta. Copie .env.local.example para .env.local e preencha os valores."
    );
  }

  return parsed.data;
}

export const clientEnv = parseClientEnv();
