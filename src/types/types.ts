export interface User {
  id: string;
  username: string;
  name: string;
  role: "seller" | "validator" | "admin";
}

export type TicketStatus = "VALID" | "INVALIDATED" | "REDEEMED";

export interface Ticket {
  id: string;
  purchaser_name: string;
  purchase_date: string; // ISO string format
  status: TicketStatus;
  generated_by_id: string;
  generated_by_name: string;
}
