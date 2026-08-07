"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { AdminShell } from "@/components/layout/AdminShell";
import { createTask, deleteTask, listTasks, updateTask } from "@/lib/api/tasks";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Task, TaskStatus } from "@/types/task";

const STATUS_TABS: { key: TaskStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  open: "bg-amber-50 text-amber-700",
  in_progress: "bg-brand-50 text-brand-700",
  done: "bg-green-50 text-green-700",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function TasksPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<TaskStatus | "all">("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listTasks(accessToken, { status: tab === "all" ? undefined : tab });
      setTasks(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, tab]);

  useEffect(() => { void fetchTasks(); }, [fetchTasks]);

  async function handleCreate() {
    if (!accessToken || !title.trim()) return;
    setSaving(true);
    try {
      const task = await createTask(accessToken, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
      });
      setTasks((prev) => [task, ...prev]);
      toast.success("Task created successfully");
      setTitle(""); setDescription(""); setDueDate("");
      setShowForm(false);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    if (!accessToken) return;
    try {
      const updated = await updateTask(accessToken, taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
      toast.success("Task updated successfully");
    } catch (err) { toast.error(err instanceof ApiRequestError ? err.message : "Failed to update task."); }
  }

  async function handleDelete(taskId: string) {
    if (!accessToken) return;
    try {
      await deleteTask(accessToken, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (err) { toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete task."); }
  }

  return (
    <AdminShell>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Daily Tasks</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Manage staff tasks and assignments.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus size={15} /> New Task
          </button>
        </div>

        {showForm ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
            <p className="font-medium text-neutral-900">New Task</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={!title.trim() || saving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setTitle(""); setDescription(""); setDueDate(""); }}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex gap-1">
          {STATUS_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-brand-500 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-neutral-500">No tasks found.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{task.title}</p>
                  {task.description ? <p className="mt-0.5 text-sm text-neutral-500">{task.description}</p> : null}
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-neutral-400">
                    {task.assignee_name ? <span>Assigned to: {task.assignee_name}</span> : null}
                    <span>Due: {formatDate(task.due_date)}</span>
                  </div>
                </div>
                <SearchableSelect
                  value={task.status}
                  options={[
                    { value: "open", label: "Open" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "done", label: "Done" },
                  ]}
                  onChange={(v) => void handleStatusChange(task.id, v as TaskStatus)}
                />
                <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${STATUS_COLORS[task.status]}`}>
                  {task.status.replace("_", " ")}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(task.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
