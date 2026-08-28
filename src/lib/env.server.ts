import "server-only";
import { z } from "zod";

/**
 * Variáveis server-only. Importar este módulo de um Client Component
 * quebra o build (o pacote "server-only" garante isso).
 */
const serverSchema = z.object({
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1),
  INVITE_TOKEN_SECRET: z.string().min(16).optional(),
  PAGARME_API_KEY: z.string().optional(),
  PAGARME_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

function parseServerEnv() {
  const parsed = serverSchema.safeParse({
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    INVITE_TOKEN_SECRET: process.env.INVITE_TOKEN_SECRET,
    PAGARME_API_KEY: process.env.PAGARME_API_KEY,
    PAGARME_WEBHOOK_SECRET: process.env.PAGARME_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });

  if (!parsed.success) {
    console.error(
      "Variáveis de ambiente do servidor inválidas ou ausentes:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error(
      "Configuração server-side incompleta. Copie .env.local.example para .env.local e preencha os valores."
    );
  }

  return parsed.data;
}

export const serverEnv = parseServerEnv();
