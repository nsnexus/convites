import { z } from "zod";

/** Slug público: nsconvites.com.br/c/{slug}. Ver plano §3.2. */
export const slugSchema = z
  .string()
  .min(3, "Use pelo menos 3 caracteres")
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen");

export const createCoupleSchema = z.object({
  slug: slugSchema,
  weddingDate: z.string().date(), // "AAAA-MM-DD"
  city: z.string().min(2).max(80),
});

export type CreateCoupleInput = z.infer<typeof createCoupleSchema>;

export const coupleSiteSectionSchema = z.enum([
  "historia",
  "contagem-regressiva",
  "cerimonia-e-festa",
  "cronograma",
  "padrinhos",
  "galeria",
  "dress-code",
  "hospedagem",
  "faq",
  "rsvp",
  "lista-de-presentes",
  "recados",
]);

/** Seções de texto livre — o casal escreve, o site público exibe. */
export const CONTENT_SECTION_IDS = ["historia", "cronograma", "dress-code", "hospedagem", "faq"] as const;

export const updateCoupleSiteSchema = z.object({
  template: z.string().min(1),
  theme: z.record(z.string(), z.string()),
  sections: z.array(coupleSiteSectionSchema),
  content: z.record(z.string(), z.string().max(4000)).default({}),
});

export type UpdateCoupleSiteInput = z.infer<typeof updateCoupleSiteSchema>;
