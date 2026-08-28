"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleMember } from "@/server/auth/guards";
import { addChecklistTask, deleteChecklistTask, toggleChecklistTask } from "@/server/repositories/planning";
import { createChecklistTaskSchema } from "@/lib/schemas/planning";

export type FormState = { error?: string; ok?: boolean };

export async function addTaskAction(
  coupleId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireCoupleMember(coupleId);
  const parsed = createChecklistTaskSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate"),
    category: formData.get("category"),
  });
  if (!parsed.success) return { error: "Informe um título válido." };

  await addChecklistTask(coupleId, parsed.data);
  revalidatePath(`/painel/${coupleId}/checklist`);
  return { ok: true };
}

export async function toggleTaskAction(coupleId: string, taskId: string, done: boolean) {
  await requireCoupleMember(coupleId);
  await toggleChecklistTask(coupleId, taskId, done);
  revalidatePath(`/painel/${coupleId}/checklist`);
}

export async function deleteTaskAction(coupleId: string, taskId: string) {
  await requireCoupleMember(coupleId);
  await deleteChecklistTask(coupleId, taskId);
  revalidatePath(`/painel/${coupleId}/checklist`);
}
