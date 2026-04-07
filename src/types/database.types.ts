/**
 * NINHO v2 — Database Types (Camada 1)
 * Ficheiro: src/types/database.types.ts
 *
 * GERADO AUTOMATICAMENTE via Supabase MCP — 2026-04-07
 * Projeto: Ninho app (xgjupcwyekkmizocvzil)
 *
 * NÃO EDITAR a secção "Database" manualmente.
 * Para regenerar: usar o MCP `generate_typescript_types` ou:
 *   npx supabase gen types typescript --project-id xgjupcwyekkmizocvzil > src/types/database.types.ts
 *
 * A secção "Tipos auxiliares Ninho" no fim pode ser editada manualmente.
 */

// ─────────────────────────────────────────────────────────────────
// TIPOS BASE (gerados automaticamente pelo Supabase)
// ─────────────────────────────────────────────────────────────────

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
      child_medications: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          dose: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          prescribed_by: string | null
          reason: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          dose: string
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          notes?: string | null
          prescribed_by?: string | null
          reason?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          dose?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          prescribed_by?: string | null
          reason?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_medications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      child_milestones: {
        Row: {
          achieved_at: string
          child_id: string
          created_at: string
          created_by: string | null
          id: string
          milestone_id: string
          notes: string | null
          photo_url: string | null
        }
        Insert: {
          achieved_at: string
          child_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          milestone_id: string
          notes?: string | null
          photo_url?: string | null
        }
        Update: {
          achieved_at?: string
          child_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          milestone_id?: string
          notes?: string | null
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_milestones_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      child_vaccines: {
        Row: {
          applied_date: string | null
          child_id: string
          created_at: string
          created_by: string | null
          dose_number: number
          had_reaction: boolean | null
          id: string
          location: string | null
          lot_number: string | null
          notes: string | null
          reaction_notes: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
          vaccine_id: string
        }
        Insert: {
          applied_date?: string | null
          child_id: string
          created_at?: string
          created_by?: string | null
          dose_number?: number
          had_reaction?: boolean | null
          id?: string
          location?: string | null
          lot_number?: string | null
          notes?: string | null
          reaction_notes?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          vaccine_id: string
        }
        Update: {
          applied_date?: string | null
          child_id?: string
          created_at?: string
          created_by?: string | null
          dose_number?: number
          had_reaction?: boolean | null
          id?: string
          location?: string | null
          lot_number?: string | null
          notes?: string | null
          reaction_notes?: string | null
          scheduled_date?: string | null
          status?: string
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
            foreignKeyName: "child_vaccines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          allergies: string[] | null
          birth_date: string | null
          birth_head_cm: number | null
          birth_hospital: string | null
          birth_length_cm: number | null
          birth_weight_grams: number | null
          blood_type: string | null
          chronic_conditions: string[] | null
          created_at: string
          family_id: string
          full_name: string | null
          gestational_weeks: number | null
          health_insurance: string | null
          id: string
          insurance_number: string | null
          is_premature: boolean
          photo_url: string | null
          preferred_name: string
          sex_at_birth: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          birth_date?: string | null
          birth_head_cm?: number | null
          birth_hospital?: string | null
          birth_length_cm?: number | null
          birth_weight_grams?: number | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          family_id: string
          full_name?: string | null
          gestational_weeks?: number | null
          health_insurance?: string | null
          id?: string
          insurance_number?: string | null
          is_premature?: boolean
          photo_url?: string | null
          preferred_name: string
          sex_at_birth?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          birth_date?: string | null
          birth_head_cm?: number | null
          birth_hospital?: string | null
          birth_length_cm?: number | null
          birth_weight_grams?: number | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          family_id?: string
          full_name?: string | null
          gestational_weeks?: number | null
          health_insurance?: string | null
          id?: string
          insurance_number?: string | null
          is_premature?: boolean
          photo_url?: string | null
          preferred_name?: string
          sex_at_birth?: string | null
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
      consultations: {
        Row: {
          child_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string | null
          id: string
          location: string | null
          notes: string | null
          reason: string | null
          scheduled_at: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reason?: string | null
          scheduled_at: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reason?: string | null
          scheduled_at?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          clinic_name: string | null
          created_at: string
          email: string | null
          family_id: string
          id: string
          name: string
          phone: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          email?: string | null
          family_id: string
          id?: string
          name: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          email?: string | null
          family_id?: string
          id?: string
          name?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_family_id_fkey"
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
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          accepted_by: string | null
          created_at: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string | null
          invited_email: string
          invited_phone: string | null
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          family_id: string
          id?: string
          invited_by?: string | null
          invited_email: string
          invited_phone?: string | null
          role: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          family_id?: string
          id?: string
          invited_by?: string | null
          invited_email?: string
          invited_phone?: string | null
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_measurements: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          head_circumference_cm: number | null
          id: string
          length_cm: number | null
          measured_at: string
          source: string | null
          weight_grams: number | null
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          head_circumference_cm?: number | null
          id?: string
          length_cm?: number | null
          measured_at: string
          source?: string | null
          weight_grams?: number | null
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          head_circumference_cm?: number | null
          id?: string
          length_cm?: number | null
          measured_at?: string
          source?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_measurements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_measurements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_logs: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          id: string
          log_type: string
          notes: string | null
          occurred_at: string
          photo_url: string | null
          value_numeric: number | null
          value_unit: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          log_type: string
          notes?: string | null
          occurred_at?: string
          photo_url?: string | null
          value_numeric?: number | null
          value_unit?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          log_type?: string
          notes?: string | null
          occurred_at?: string
          photo_url?: string | null
          value_numeric?: number | null
          value_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maternal_wellness: {
        Row: {
          created_at: string
          energy_level: number | null
          id: string
          mood_score: number | null
          notes: string | null
          sleep_quality: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: number | null
          id?: string
          mood_score?: number | null
          notes?: string | null
          sleep_quality?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number | null
          id?: string
          mood_score?: number | null
          notes?: string | null
          sleep_quality?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternal_wellness_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asked_at: string | null
          child_id: string
          consultation_id: string | null
          created_at: string
          created_by: string | null
          id: string
          question: string
          status: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asked_at?: string | null
          child_id: string
          consultation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          question: string
          status?: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asked_at?: string | null
          child_id?: string
          consultation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          question?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_questions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_questions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones_catalog: {
        Row: {
          age_months_max: number
          age_months_min: number
          category: string
          created_at: string
          description: string | null
          id: string
          source: string | null
          title: string
          typical_percentage: number | null
        }
        Insert: {
          age_months_max: number
          age_months_min: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          source?: string | null
          title: string
          typical_percentage?: number | null
        }
        Update: {
          age_months_max?: number
          age_months_min?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          source?: string | null
          title?: string
          typical_percentage?: number | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_period: string | null
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string | null
        }
        Insert: {
          billing_period?: string | null
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          stripe_price_id?: string | null
        }
        Update: {
          billing_period?: string | null
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      pregnancies: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          user_id: string
          weeks_at_signup: number | null
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          user_id: string
          weeks_at_signup?: number | null
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          user_id?: string
          weeks_at_signup?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pregnancies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          preferred_units: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          preferred_units?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          preferred_units?: Json
          updated_at?: string
        }
        Relationships: []
      }
      routine_logs: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          notes: string | null
          payload: Json
          photo_url: string | null
          routine_type: string
          started_at: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          payload?: Json
          photo_url?: string | null
          routine_type: string
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          payload?: Json
          photo_url?: string | null
          routine_type?: string
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reports: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          last_viewed_at: string | null
          unique_token: string
          view_count: number
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          last_viewed_at?: string | null
          unique_token?: string
          view_count?: number
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          last_viewed_at?: string | null
          unique_token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          family_id: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          family_id: string
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          family_id?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines_catalog: {
        Row: {
          calendar_type: string
          country_code: string
          created_at: string
          description: string | null
          doses_count: number
          id: string
          name: string
          protects_against: string[] | null
          recommended_ages_months: number[] | null
          short_name: string | null
          side_effects: string | null
          source_url: string | null
        }
        Insert: {
          calendar_type: string
          country_code?: string
          created_at?: string
          description?: string | null
          doses_count?: number
          id?: string
          name: string
          protects_against?: string[] | null
          recommended_ages_months?: number[] | null
          short_name?: string | null
          side_effects?: string | null
          source_url?: string | null
        }
        Update: {
          calendar_type?: string
          country_code?: string
          created_at?: string
          description?: string | null
          doses_count?: number
          id?: string
          name?: string
          protects_against?: string[] | null
          recommended_ages_months?: number[] | null
          short_name?: string | null
          side_effects?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_family_role: {
        Args: { p_family_id: string; p_min_role: string }
        Returns: boolean
      }
      is_family_member: { Args: { p_family_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ─────────────────────────────────────────────────────────────────
// NINHO v2 — Tipos auxiliares (mantidos manualmente)
// ─────────────────────────────────────────────────────────────────

/** Tipos de evento de rotina — chave do JSONB payload */
export type RoutineType =
  | 'feeding'
  | 'pumping'
  | 'diaper'
  | 'sleep'
  | 'bath'
  | 'medication'
  | 'activity'
  | 'food_intro'
  | 'other'

/** Papéis dos membros da família — campo role em family_members */
export type FamilyRole = 'owner' | 'admin' | 'caregiver' | 'viewer'

/** Sexo ao nascer — campo sex_at_birth em children */
export type SexAtBirth = 'female' | 'male' | 'unknown'

export type VaccineCalendarType = 'sus' | 'private' | 'indication'
export type VaccineStatus       = 'pending' | 'scheduled' | 'applied' | 'overdue'

export type MilestoneCategory =
  | 'motor_gross'
  | 'motor_fine'
  | 'language'
  | 'cognitive'
  | 'social_emotional'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type InvitationStatus   = 'pending' | 'accepted' | 'rejected' | 'expired'

export type HealthLogType =
  | 'temperature'
  | 'symptom'
  | 'reaction'
  | 'medication_reaction'
  | 'observation'

// ── Contratos de payload tipados para routine_logs ────────────────

export interface FeedingPayload {
  side?:        'left' | 'right' | 'both'
  duration_min?: number
  method?:      'breast' | 'bottle'
  volume_ml?:   number
}

export interface PumpingPayload {
  side?:      'left' | 'right' | 'both'
  volume_ml?: number
  method?:    'manual' | 'electric'
  storage?:   'freezer' | 'fridge' | 'immediate'
}

export interface DiaperPayload {
  type?:         'wet' | 'dirty' | 'both'
  consistency?:  'normal' | 'soft' | 'liquid' | 'hard'
  color?:        string
}

export interface SleepPayload {
  location?: 'crib' | 'bed' | 'stroller' | 'carrier' | 'arms'
  quality?:  'deep' | 'light' | 'restless'
}

export interface MedicationPayload {
  name?:          string
  dose?:          string
  reason?:        string
  medication_id?: string
}

export interface FoodIntroPayload {
  food?:     string
  reaction?: 'accepted' | 'refused' | 'allergic' | 'neutral'
  texture?:  'puree' | 'mashed' | 'chunks' | 'finger'
}

export interface ActivityPayload {
  type?:        string
  description?: string
}

export type RoutinePayload =
  | FeedingPayload
  | PumpingPayload
  | DiaperPayload
  | SleepPayload
  | MedicationPayload
  | FoodIntroPayload
  | ActivityPayload
  | Record<string, unknown>
