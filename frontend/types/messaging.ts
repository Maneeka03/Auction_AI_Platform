export interface DmThread {
  user_id: string;
  full_name: string;
  last_message: string;
  last_at: string;
  unread: number;
}

export interface DmMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
}

export interface AdminThread {
  user_a_id: string;
  user_a_name: string;
  user_b_id: string;
  user_b_name: string;
  last_message: string;
  last_at: string;
}

export interface GroupChat {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  member_count: number;
  last_message: string | null;
  last_at: string | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface ChatUser {
  id: string;
  full_name: string;
  email: string;
}
