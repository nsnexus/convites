import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import type { CreateChecklistTaskInput, CreateBudgetItemInput } from "@/lib/schemas/planning";

/** Checklist e orçamento — ver plano §3.6. CRUD simples, sem transação. */

const checklistCol = (coupleId: string) =>
  adminDb.collection("couples").doc(coupleId).collection("checklist");
const budgetCol = (coupleId: string) =>
  adminDb.collection("couples").doc(coupleId).collection("budgetItems");

export type ChecklistTaskDoc = {
  title: string;
  dueDate: string | null;
  category: string | null;
  done: boolean;
  createdAt: FirebaseFirestore.Timestamp;
};

export async function addChecklistTask(coupleId: string, input: CreateChecklistTaskInput): Promise<string> {
  const ref = checklistCol(coupleId).doc();
  await ref.set({
    title: input.title,
    dueDate: input.dueDate || null,
    category: input.category || null,
    done: false,
    createdAt: FieldValue.serverTimestamp(),
  } satisfies Omit<ChecklistTaskDoc, "createdAt"> & { createdAt: FirebaseFirestore.FieldValue });
  return ref.id;
}

export async function listChecklistTasks(coupleId: string): Promise<Array<ChecklistTaskDoc & { id: string }>> {
  const snap = await checklistCol(coupleId).orderBy("createdAt", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ChecklistTaskDoc) }));
}

export async function toggleChecklistTask(coupleId: string, taskId: string, done: boolean): Promise<void> {
  await checklistCol(coupleId).doc(taskId).update({ done });
}

export async function deleteChecklistTask(coupleId: string, taskId: string): Promise<void> {
  await checklistCol(coupleId).doc(taskId).delete();
}

export type BudgetItemDoc = {
  category: string;
  planned: number;
  contracted: number;
  paid: number;
  vendorName: string | null;
  createdAt: FirebaseFirestore.Timestamp;
};

export async function addBudgetItem(coupleId: string, input: CreateBudgetItemInput): Promise<string> {
  const ref = budgetCol(coupleId).doc();
  await ref.set({
    category: input.category,
    planned: input.plannedCents,
    contracted: input.contractedCents,
    paid: input.paidCents,
    vendorName: input.vendorName || null,
    createdAt: FieldValue.serverTimestamp(),
  } satisfies Omit<BudgetItemDoc, "createdAt"> & { createdAt: FirebaseFirestore.FieldValue });
  return ref.id;
}

export async function listBudgetItems(coupleId: string): Promise<Array<BudgetItemDoc & { id: string }>> {
  const snap = await budgetCol(coupleId).orderBy("createdAt", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as BudgetItemDoc) }));
}

export async function deleteBudgetItem(coupleId: string, itemId: string): Promise<void> {
  await budgetCol(coupleId).doc(itemId).delete();
}
