import { apiClient } from "@/lib/api/client";
import type { CreateTicketRequest, SupportTicket, TicketPage, UpdateTicketRequest } from "@/types/supportTicket";

const BASE = "/api/v1/support-tickets";

export function listMyTickets(accessToken: string): Promise<TicketPage> {
  return apiClient.get<TicketPage>(BASE, { accessToken });
}

export function createTicket(accessToken: string, payload: CreateTicketRequest): Promise<SupportTicket> {
  return apiClient.post<SupportTicket>(BASE, payload, { accessToken });
}

export function updateTicket(
  accessToken: string,
  ticketId: string,
  payload: UpdateTicketRequest,
): Promise<SupportTicket> {
  return apiClient.patch<SupportTicket>(`${BASE}/${ticketId}`, payload, { accessToken });
}

export function deleteTicket(accessToken: string, ticketId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${ticketId}`, { accessToken });
}