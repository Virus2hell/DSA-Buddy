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
      // ✅ NEW: DSA Folders
      dsa_folders: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dsa_folders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // ✅ NEW: DSA Problems
      dsa_problems: {
        Row: {
          id: string
          folder_id: string
          name: string
          link: string
          difficulty: 'easy' | 'medium' | 'hard'
          note: string | null
          solved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          name: string
          link: string
          difficulty?: 'easy' | 'medium' | 'hard'
          note?: string | null
          solved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          name?: string
          link?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          note?: string | null
          solved?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dsa_problems_folder_id_fkey"
            columns: ["folder_id"]
            referencedRelation: "dsa_folders"
            referencedColumns: ["id"]
          }
        ]
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
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends { Insert: infer I }
  ? I
  : never
  : never

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
