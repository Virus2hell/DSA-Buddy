export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          skill_level: string
          role: string
          preferred_language: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          skill_level: string
          role: string
          preferred_language: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          skill_level?: string
          role?: string
          preferred_language?: string
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending'
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id_1: string
          user_id_2: string
          accepted_at: string
        }
        Insert: {
          id?: string
          user_id_1: string
          user_id_2: string
          accepted_at?: string
        }
        Update: {
          id?: string
          user_id_1?: string
          user_id_2?: string
          accepted_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          receiver_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          receiver_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          receiver_id?: string
          message?: string
          created_at?: string
        }
      }
    }
  }
}

// ✅ EXPORTS - No red lines!
export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][Extract<keyof Database[PublicTableNameOrOptions['schema']]['Tables'], string>]
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions]
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][Extract<keyof Database[PublicTableNameOrOptions['schema']]['Tables'], string>] extends infer T
    ? T extends { Insert: any }
    ? T['Insert']
    : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'][Extract<
      keyof Database[PublicTableNameOrOptions['schema']]['Tables'],
      string
    >] extends { Update: infer U }
      ? U
      : never)
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? (Database['public']['Tables'][PublicTableNameOrOptions] extends { Update: infer U }
      ? U
      : never)
  : never
