import { apiClient } from "@/lib/api/client";
import type { CreateTicketRequest,AdminTicketPage,AdminTicket,TicketStatus, SupportTicket, TicketPage, UpdateTicketRequest } from "@/types/supportTicket";

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

export function listAllTickets(
  accessToken: string,
  params: { page?: number; size?: number } = {},
): Promise<AdminTicketPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  const queryString = query.toString();
  return apiClient.get<AdminTicketPage>(`${BASE}/all${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function updateTicketStatus(
  accessToken: string,
  ticketId: string,
  status: TicketStatus,
): Promise<AdminTicket> {
  return apiClient.patch<AdminTicket>(`${BASE}/${ticketId}/status`, { status }, { accessToken });
}