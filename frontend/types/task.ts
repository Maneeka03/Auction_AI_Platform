export type TaskStatus = "open" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  assignee_name: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assigned_to?: string | null;
  due_date?: string | null;
}
