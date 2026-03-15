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
      child_vaccines: {
        Row: {
          applied_on: string | null
          child_id: string
          created_at: string
          id: string
          status: string | null
          updated_at: string
          vaccine_id: string
        }
        Insert: {
          applied_on?: string | null
          child_id: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          vaccine_id: string
        }
        Update: {
          applied_on?: string | null
          child_id?: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          vaccine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_vaccines_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_vaccines_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          allergies: Json | null
          avatar_url: string | null
          birth_date: string
          blood_type: string | null
          created_at: string
          family_id: string
          id: string
          medications: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          allergies?: Json | null
          avatar_url?: string | null
          birth_date: string
          blood_type?: string | null
          created_at?: string
          family_id: string
          id?: string
          medications?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          allergies?: Json | null
          avatar_url?: string | null
          birth_date?: string
          blood_type?: string | null
          created_at?: string
          family_id?: string
          id?: string
          medications?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
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
      health_events: {
        Row: {
          author_id: string
          child_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          severity: string | null
        }
        Insert: {
          author_id: string
          child_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          severity?: string | null
        }
        Update: {
          author_id?: string
          child_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      health_logs: {
        Row: {
          author_id: string
          child_id: string
          created_at: string
          details: Json | null
          id: string
          occurred_at: string
          type: Database["public"]["Enums"]["health_log_type"]
        }
        Insert: {
          author_id: string
          child_id: string
          created_at?: string
          details?: Json | null
          id?: string
          occurred_at?: string
          type: Database["public"]["Enums"]["health_log_type"]
        }
        Update: {
          author_id?: string
          child_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          occurred_at?: string
          type?: Database["public"]["Enums"]["health_log_type"]
        }
        Relationships: [
          {
            foreignKeyName: "health_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          family_id: string
          id: string
          invited_email: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          id: string
          name: string
          price_cents: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          price_cents?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_logs: {
        Row: {
          author_id: string
          child_id: string
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          start_time: string
          type: Database["public"]["Enums"]["routine_log_type"]
        }
        Insert: {
          author_id: string
          child_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          type: Database["public"]["Enums"]["routine_log_type"]
        }
        Update: {
          author_id?: string
          child_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          type?: Database["public"]["Enums"]["routine_log_type"]
        }
        Relationships: [
          {
            foreignKeyName: "routine_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
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
      vaccines_catalog: {
        Row: {
          calendar_type: string
          description: string | null
          dose_number: number | null
          id: string
          name: string
          recommended_age_days: number | null
        }
        Insert: {
          calendar_type?: string
          description?: string | null
          dose_number?: number | null
          id?: string
          name: string
          recommended_age_days?: number | null
        }
        Update: {
          calendar_type?: string
          description?: string | null
          dose_number?: number | null
          id?: string
          name?: string
          recommended_age_days?: number | null
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
    }
    Enums: {
      app_role: "admin" | "monitor" | "viewer"
      health_log_type: "vaccine" | "fever" | "medication" | "note"
      routine_log_type: "sleep" | "feed" | "diaper" | "note"
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
      app_role: ["admin", "monitor", "viewer"],
      health_log_type: ["vaccine", "fever", "medication", "note"],
      routine_log_type: ["sleep", "feed", "diaper", "note"],
    },
  },
} as const
