import { apiClient } from "@/lib/api/client";
import type { TicketSubjectPage } from "@/types/ticketSubject";

const BASE = "/api/v1/ticket-subjects";

export function listTicketSubjects(accessToken: string): Promise<TicketSubjectPage> {
  return apiClient.get<TicketSubjectPage>(BASE, { accessToken });
}

export function listAllTicketSubjects(accessToken: string): Promise<TicketSubjectPage> {
  return apiClient.get<TicketSubjectPage>(`${BASE}/all`, { accessToken });
}

export function createTicketSubject(accessToken: string, name: string) {
  return apiClient.post(BASE, { name }, { accessToken });
}

export function updateTicketSubject(
  accessToken: string,
  subjectId: string,
  payload: { name?: string; is_active?: boolean; sort_order?: number },
) {
  return apiClient.patch(`${BASE}/${subjectId}`, payload, { accessToken });
}

export function deleteTicketSubject(accessToken: string, subjectId: string) {
  return apiClient.delete(`${BASE}/${subjectId}`, { accessToken });
}