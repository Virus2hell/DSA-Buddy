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
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][Extract<keyof Database[PublicTableNameOrOptions['schema']]['Tables'], string>]
  : keyof Database['public']['Tables'] extends PublicTableNameOrOptions
  ? Database['public']['Tables'][PublicTableNameOrOptions]
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][Extract<keyof Database[PublicTableNameOrOptions['schema']]['Tables'], string>]['Insert']
  : keyof Database['public']['Tables'] extends PublicTableNameOrOptions
  ? Database['public']['Tables'][PublicTableNameOrOptions]['Insert']
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][Extract<keyof Database[PublicTableNameOrOptions['schema']]['Tables'], string>]['Update']
  : keyof Database['public']['Tables'] extends PublicTableNameOrOptions
  ? Database['public']['Tables'][PublicTableNameOrOptions]['Update']
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database }
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][keyof Database[PublicEnumNameOrOptions['schema']]['Enums']]
  : keyof Database['public']['Enums'] extends PublicEnumNameOrOptions
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database['public']['CompositeTypes']
    | { schema: keyof Database }
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']]
  : keyof Database['public']['CompositeTypes'] extends PublicCompositeTypeNameOrOptions
  ? Database['public']['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never
