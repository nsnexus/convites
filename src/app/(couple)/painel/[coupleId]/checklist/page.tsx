import { listChecklistTasks } from "@/server/repositories/planning";
import { AddTaskForm } from "./add-task-form";
import { toggleTaskAction, deleteTaskAction } from "./actions";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const tasks = await listChecklistTasks(coupleId);

  return (
    <div className="flex flex-col gap-6">
      <AddTaskForm coupleId={coupleId} />
      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              <form action={toggleTaskAction.bind(null, coupleId, task.id, !task.done)}>
                <button
                  type="submit"
                  aria-label={task.done ? "Marcar como pendente" : "Marcar como concluída"}
                  className={`h-4 w-4 rounded border ${task.done ? "border-rose-700 bg-rose-700" : "border-neutral-300"}`}
                />
              </form>
              <span className={task.done ? "text-neutral-400 line-through" : ""}>{task.title}</span>
              {task.dueDate && <span className="text-xs text-neutral-400">{task.dueDate}</span>}
              {task.category && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{task.category}</span>}
            </div>
            <form action={deleteTaskAction.bind(null, coupleId, task.id)}>
              <button className="text-xs text-red-600 underline">remover</button>
            </form>
          </li>
        ))}
        {tasks.length === 0 && <p className="text-sm text-neutral-400">Nenhuma tarefa ainda.</p>}
      </ul>
    </div>
  );
}
