import type { TicketSubject } from "@/types/ticketSubject";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export interface SupportTicket {
  id: string;
  subject: TicketSubject | null;
  custom_subject: string | null;
  message: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}
export interface TicketPage {
  items: SupportTicket[];
  total: number;
}
export interface CreateTicketRequest {
  subject_id?: string | null;
  custom_subject?: string | null;
  message: string;
}
export interface UpdateTicketRequest {
  subject_id?: string | null;
  custom_subject?: string | null;
  message?: string;
}

export interface AdminTicket extends SupportTicket {
  raiser_name: string;
  raiser_email: string;
}
export interface AdminTicketPage {
  items: AdminTicket[];
  total: number;
}

