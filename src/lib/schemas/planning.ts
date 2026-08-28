import { z } from "zod";

export const createChecklistTaskSchema = z.object({
  title: z.string().min(2).max(160),
  dueDate: z.string().date().optional().or(z.literal("")),
  category: z.string().max(60).optional().or(z.literal("")),
});
export type CreateChecklistTaskInput = z.infer<typeof createChecklistTaskSchema>;

export const createBudgetItemSchema = z.object({
  category: z.string().min(2).max(60),
  plannedCents: z.coerce.number().int().min(0),
  contractedCents: z.coerce.number().int().min(0).default(0),
  paidCents: z.coerce.number().int().min(0).default(0),
  vendorName: z.string().max(120).optional().or(z.literal("")),
});
export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
