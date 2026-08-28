import { z } from "zod";

export const mealPreferenceSchema = z.enum(["padrao", "vegetariano", "vegano", "sem-gluten", "outro"]);

export const createGuestSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(20).optional().or(z.literal("")),
  email: z.email().optional().or(z.literal("")),
  seats: z.coerce.number().int().min(1).max(20).default(1),
  groupLabel: z.string().max(80).optional().or(z.literal("")),
});
export type CreateGuestInput = z.infer<typeof createGuestSchema>;

export const rsvpSchema = z.object({
  status: z.enum(["confirmado", "recusado"]),
  companions: z.coerce.number().int().min(0).max(20).default(0),
  meal: mealPreferenceSchema.default("padrao"),
  note: z.string().max(300).optional().or(z.literal("")),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;

/** Uma linha de CSV importado — bem tolerante, valida em createGuestSchema depois. */
export const csvGuestRowSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  seats: z.string().optional(),
  groupLabel: z.string().optional(),
});
