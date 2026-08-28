import { z } from "zod";

export const giftModeSchema = z.enum(["item", "quota", "free"]);

export const createGiftItemSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
  priceCents: z.coerce.number().int().min(500), // mínimo R$5
  mode: giftModeSchema,
  quotasTotal: z.coerce.number().int().min(1).max(1000).optional(), // só para mode "quota"
});
export type CreateGiftItemInput = z.infer<typeof createGiftItemSchema>;

export const contributeSchema = z.object({
  quotas: z.coerce.number().int().min(1).max(1000).default(1),
  amountCents: z.coerce.number().int().min(500).optional(), // usado em mode "free"
  payerName: z.string().min(2).max(120),
  payerEmail: z.email().optional().or(z.literal("")),
  note: z.string().max(300).optional().or(z.literal("")),
  anonymous: z.coerce.boolean().default(false),
  method: z.enum(["pix", "cartao"]),
  guestCoversFee: z.coerce.boolean().default(false),
});
export type ContributeInput = z.infer<typeof contributeSchema>;
