import { apiClient } from "./client";
import type { CreateTaskPayload, Task, UpdateTaskPayload } from "@/types/task";

export function createTask(token: string, payload: CreateTaskPayload): Promise<Task> {
  return apiClient.post("/api/v1/tasks", payload, { accessToken: token });
}

export function listTasks(token: string, params: { status?: string; assigned_to?: string } = {}): Promise<Task[]> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.assigned_to) q.set("assigned_to", params.assigned_to);
  const qs = q.toString();
  return apiClient.get(`/api/v1/tasks${qs ? `?${qs}` : ""}`, { accessToken: token });
}

export function updateTask(token: string, taskId: string, payload: UpdateTaskPayload): Promise<Task> {
  return apiClient.patch(`/api/v1/tasks/${taskId}`, payload, { accessToken: token });
}

export function deleteTask(token: string, taskId: string): Promise<void> {
  return apiClient.delete(`/api/v1/tasks/${taskId}`, { accessToken: token });
}
