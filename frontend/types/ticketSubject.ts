export interface TicketSubject {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}
export interface TicketSubjectPage {
  items: TicketSubject[];
  total: number;
}