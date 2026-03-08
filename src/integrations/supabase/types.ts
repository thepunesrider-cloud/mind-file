export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      file_tags: {
        Row: {
          confidence: number
          file_id: string
          id: string
          tag_id: string
        }
        Insert: {
          confidence?: number
          file_id: string
          id?: string
          tag_id: string
        }
        Update: {
          confidence?: number
          file_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_tags_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          ai_description: string | null
          ai_summary: string | null
          created_at: string
          entities: Json | null
          expiry_date: string | null
          extracted_text: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          semantic_keywords: string | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          ai_description?: string | null
          ai_summary?: string | null
          created_at?: string
          entities?: Json | null
          expiry_date?: string | null
          extracted_text?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          semantic_keywords?: string | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          ai_description?: string | null
          ai_summary?: string | null
          created_at?: string
          entities?: Json | null
          expiry_date?: string | null
          extracted_text?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          semantic_keywords?: string | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      google_drive_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          file_id: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_id?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string
          current_storage_method: string | null
          designation: string | null
          estimated_monthly_docs: string | null
          full_name: string
          id: string
          industry: string | null
          onboarding_completed: boolean
          phone_number: string | null
          plan: string
          referral_source: string | null
          state: string | null
          team_size: string | null
          updated_at: string
          use_case: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          current_storage_method?: string | null
          designation?: string | null
          estimated_monthly_docs?: string | null
          full_name?: string
          id?: string
          industry?: string | null
          onboarding_completed?: boolean
          phone_number?: string | null
          plan?: string
          referral_source?: string | null
          state?: string | null
          team_size?: string | null
          updated_at?: string
          use_case?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          current_storage_method?: string | null
          designation?: string | null
          estimated_monthly_docs?: string | null
          full_name?: string
          id?: string
          industry?: string | null
          onboarding_completed?: boolean
          phone_number?: string | null
          plan?: string
          referral_source?: string | null
          state?: string | null
          team_size?: string | null
          updated_at?: string
          use_case?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          created_at: string
          expires_at: string | null
          file_id: string
          id: string
          token: string
          user_id: string
          view_once: boolean
          viewed: boolean
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_id: string
          id?: string
          token?: string
          user_id: string
          view_once?: boolean
          viewed?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_id?: string
          id?: string
          token?: string
          user_id?: string
          view_once?: boolean
          viewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "shared_links_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      team_folder_files: {
        Row: {
          added_at: string
          added_by: string
          file_id: string
          folder_id: string
          id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          file_id: string
          folder_id: string
          id?: string
        }
        Update: {
          added_at?: string
          added_by?: string
          file_id?: string
          folder_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_folder_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_folder_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "team_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      team_folders: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          team_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          team_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_folders_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          phone_number: string
          session_data: Json | null
          session_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number: string
          session_data?: Json | null
          session_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string
          session_data?: Json | null
          session_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_users: {
        Row: {
          created_at: string
          id: string
          phone_number: string
          user_id: string
          verification_code: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number: string
          user_id: string
          verification_code?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string
          user_id?: string
          verification_code?: string | null
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      owner_id_matches: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
