export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wff_landing_sections: {
        Row: {
          id: string
          type: string
          title: string | null
          subtitle: string | null
          description: string | null
          media_url: string | null
          poster_url: string | null
          cta_text: string | null
          cta_href: string | null
          order_index: number
          is_active: boolean
          hide_content: boolean
          anchor_tag: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          type: string
          title?: string | null
          subtitle?: string | null
          description?: string | null
          media_url?: string | null
          poster_url?: string | null
          cta_text?: string | null
          cta_href?: string | null
          order_index?: number
          is_active?: boolean
          hide_content?: boolean
          anchor_tag?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          title?: string | null
          subtitle?: string | null
          description?: string | null
          media_url?: string | null
          poster_url?: string | null
          cta_text?: string | null
          cta_href?: string | null
          order_index?: number
          is_active?: boolean
          hide_content?: boolean
          anchor_tag?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wff_creators: {
        Row: {
          certifications: string | null
          created_at: string | null
          headline: string | null
          id: string
          is_verified: boolean | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          endorsed_by_mentor_id: string | null
          social_instagram: string | null
          social_linkedin: string | null
          specialization: string[] | null
          website: string | null
          years_experience: string | null
        }
        Insert: {
          certifications?: string | null
          created_at?: string | null
          headline?: string | null
          id: string
          is_verified?: boolean | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          endorsed_by_mentor_id?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          specialization?: string[] | null
          website?: string | null
          years_experience?: string | null
        }
        Update: {
          certifications?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          is_verified?: boolean | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          endorsed_by_mentor_id?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          specialization?: string[] | null
          website?: string | null
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          equipment_access: string[] | null
          experience_level: string | null
          full_name: string | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          id: string
          injuries: string[] | null
          role: Database["public"]["Enums"]["user_role"] | null
          training_availability: string[] | null
          updated_at: string | null
          username: string | null
          vibe_type: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          equipment_access?: string[] | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          injuries?: string[] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          training_availability?: string[] | null
          updated_at?: string | null
          username?: string | null
          vibe_type?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          equipment_access?: string[] | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string[] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          training_availability?: string[] | null
          updated_at?: string | null
          username?: string | null
          vibe_type?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wff_vibe_assessments: {
        Row: {
          answers: Json
          calculated_vibe: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          answers: Json
          calculated_vibe: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          answers?: Json
          calculated_vibe?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_assessments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wff_programs: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          price: number
          duration_weeks: number | null
          difficulty: "beginner" | "intermediate" | "advanced" | null
          vibe_type: string | null
          image_url: string | null
          is_published: boolean | null
          is_master_template: boolean | null
          parent_template_id: string | null
          origin_mentor_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          price?: number
          duration_weeks?: number | null
          difficulty?: "beginner" | "intermediate" | "advanced" | null
          vibe_type?: string | null
          image_url?: string | null
          is_published?: boolean | null
          is_master_template?: boolean | null
          parent_template_id?: string | null
          origin_mentor_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          price?: number
          duration_weeks?: number | null
          difficulty?: "beginner" | "intermediate" | "advanced" | null
          vibe_type?: string | null
          image_url?: string | null
          is_published?: boolean | null
          is_master_template?: boolean | null
          parent_template_id?: string | null
          origin_mentor_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_coach_id_fkey"
            columns: ["coach_id"]
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          }
        ]
      },
      wff_program_weeks: {
        Row: {
          created_at: string | null
          id: string
          program_id: string
          title: string | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          program_id: string
          title?: string | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          program_id?: string
          title?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            referencedRelation: "programs"
            referencedColumns: ["id"]
          }
        ]
      },
      wff_program_days: {
        Row: {
          created_at: string | null
          day_number: number
          id: string
          title: string | null
          week_id: string
        }
        Insert: {
          created_at?: string | null
          day_number: number
          id?: string
          title?: string | null
          week_id: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          id?: string
          title?: string | null
          week_id: string
        }
        Relationships: [
          {
            foreignKeyName: "program_days_week_id_fkey"
            columns: ["week_id"]
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          }
        ]
      },
      wff_global_exercises: {
        Row: {
          created_at: string | null
          id: string
          muscle_group: string | null
          name: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          video_url?: string | null
        }
        Relationships: []
      },
      wff_program_exercises: {
        Row: {
          created_at: string | null
          day_id: string
          exercise_name: string
          id: string
          notes: string | null
          order_index: number | null
          reps: string | null
          rest_seconds: number | null
          rpe: string | null
          sets: number | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          day_id: string
          exercise_name: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_seconds?: number | null
          rpe?: string | null
          sets?: number | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          day_id?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_seconds?: number | null
          rpe?: string | null
          sets?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_day_id_fkey"
            columns: ["day_id"]
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          }
        ]
      },
      wff_enrollments: {
        Row: {
          id: string
          user_id: string
          program_id: string
          status: string | null
          enrolled_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          status?: string | null
          enrolled_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          program_id?: string
          status?: string | null
          enrolled_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wff_enrollments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wff_enrollments_program_id_fkey"
            columns: ["program_id"]
            referencedRelation: "wff_programs"
            referencedColumns: ["id"]
          }
        ]
      },
      wff_user_workout_logs: {
        Row: {
          completed_at: string | null
          day_id: string
          exercise_id: string
          id: string
          program_id: string
          reps_completed: number | null
          rpe_actual: number | null
          set_number: number
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          completed_at?: string | null
          day_id: string
          exercise_id: string
          id?: string
          program_id: string
          reps_completed?: number | null
          rpe_actual?: number | null
          set_number: number
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          completed_at?: string | null
          day_id?: string
          exercise_id?: string
          id?: string
          program_id?: string
          reps_completed?: number | null
          rpe_actual?: number | null
          set_number?: number
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workout_logs_day_id_fkey"
            columns: ["day_id"]
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "program_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_logs_program_id_fkey"
            columns: ["program_id"]
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "consumer" | "coach" | "mentor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
