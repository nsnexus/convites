"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { createCouple } from "@/server/repositories/couples";
import { createCoupleSchema } from "@/lib/schemas/couple";

/**
 * Exemplo do padrão de Server Action: valida com zod, checa a sessão,
 * escreve pelo repositório (que fala com o Admin SDK). Nenhum Firestore
 * direto aqui — ver plano §04. Usada com useActionState no client.
 */
export type CreateCoupleState = {
  fieldErrors?: Partial<Record<"slug" | "weddingDate" | "city", string[]>>;
  formError?: string;
};

export async function createCoupleAction(
  _prevState: CreateCoupleState,
  formData: FormData
): Promise<CreateCoupleState> {
  const user = await requireUser();

  const parsed = createCoupleSchema.safeParse({
    slug: formData.get("slug"),
    weddingDate: formData.get("weddingDate"),
    city: formData.get("city"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let coupleId: string;
  try {
    coupleId = await createCouple(user.uid, parsed.data);
  } catch (err) {
    return { formError: err instanceof Error ? err.message : "Não foi possível criar o site." };
  }

  redirect(`/painel/${coupleId}`);
}
