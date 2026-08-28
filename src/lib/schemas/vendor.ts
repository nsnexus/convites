import { z } from "zod";

export const vendorCategorySchema = z.enum([
  "espaco",
  "buffet",
  "fotografia",
  "video",
  "cerimonial",
  "decoracao",
  "musica-e-dj",
  "beleza",
  "vestido-e-traje",
  "doces-e-bolo",
  "convites",
  "transporte",
  "lua-de-mel",
]);

export const createVendorSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
  categories: z.array(vendorCategorySchema).min(1).max(5),
  cities: z.array(z.string().min(2)).min(1).max(10),
  priceFrom: z.coerce.number().int().min(0),
  about: z.string().max(1000).optional().or(z.literal("")),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const createLeadSchema = z.object({
  vendorId: z.string().min(1),
  eventDate: z.string().date().optional().or(z.literal("")),
  guestCount: z.coerce.number().int().min(1).max(5000).optional(),
  budgetRange: z.string().max(60).optional().or(z.literal("")),
  message: z.string().min(10).max(1000),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
