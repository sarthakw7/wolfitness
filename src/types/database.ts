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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      coaches: {
        Row: {
          certifications: string[] | null
          created_at: string
          headline: string | null
          id: string
          is_verified: boolean | null
          social_links: Json | null
          specializations: string[] | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string
          headline?: string | null
          id: string
          is_verified?: boolean | null
          social_links?: Json | null
          specializations?: string[] | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          certifications?: string[] | null
          created_at?: string
          headline?: string | null
          id?: string
          is_verified?: boolean | null
          social_links?: Json | null
          specializations?: string[] | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_nutrition_summaries: {
        Row: {
          created_at: string
          date: string
          id: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_nutrition_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_sections: {
        Row: {
          id: string
          section_key: string
          type: string
          title: string | null
          subtitle: string | null
          content: Json | null
          image_url: string | null
          order_index: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_key: string
          type: string
          title?: string | null
          subtitle?: string | null
          content?: Json | null
          image_url?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section_key?: string
          type?: string
          title?: string | null
          subtitle?: string | null
          content?: Json | null
          image_url?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          enrolled_at: string
          expires_at: string | null
          id: string
          program_id: string
          status: Database["public"]["Enums"]["enrollment_status"] | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          program_id: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          program_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises_library: {
        Row: {
          created_at: string
          id: string
          name: string
          pattern: Database["public"]["Enums"]["movement_pattern"] | null
          primary_muscle: string | null
          secondary_muscles: string[] | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pattern?: Database["public"]["Enums"]["movement_pattern"] | null
          primary_muscle?: string | null
          secondary_muscles?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pattern?: Database["public"]["Enums"]["movement_pattern"] | null
          primary_muscle?: string | null
          secondary_muscles?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      fitness_profiles: {
        Row: {
          allergies: string[] | null
          created_at: string
          dietary_preference: string | null
          equipment_access: string[] | null
          experience_level: string | null
          height_cm: number | null
          id: string
          injuries: string[] | null
          primary_goal: string | null
          training_availability: string[] | null
          updated_at: string
          user_id: string
          vibe_type: string | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string[] | null
          created_at?: string
          dietary_preference?: string | null
          equipment_access?: string[] | null
          experience_level?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string[] | null
          primary_goal?: string | null
          training_availability?: string[] | null
          updated_at?: string
          user_id: string
          vibe_type?: string | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string[] | null
          created_at?: string
          dietary_preference?: string | null
          equipment_access?: string[] | null
          experience_level?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string[] | null
          primary_goal?: string | null
          training_availability?: string[] | null
          updated_at?: string
          user_id?: string
          vibe_type?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fitness_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_targets: {
        Row: {
          active_from: string
          active_to: string | null
          created_at: string
          daily_calorie_target: number
          daily_carbs_target: number
          daily_fat_target: number
          daily_protein_target: number
          id: string
          user_id: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          daily_calorie_target: number
          daily_carbs_target: number
          daily_fat_target: number
          daily_protein_target: number
          id?: string
          user_id: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          daily_calorie_target?: number
          daily_carbs_target?: number
          daily_fat_target?: number
          daily_protein_target?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "macro_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          food_name: string
          id: string
          meal_id: string
          notes: string | null
          order_index: number | null
          protein: number | null
          serving_size: number
          serving_unit: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_name: string
          id?: string
          meal_id: string
          notes?: string | null
          order_index?: number | null
          protein?: number | null
          serving_size: number
          serving_unit: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_name?: string
          id?: string
          meal_id?: string
          notes?: string | null
          order_index?: number | null
          protein?: number | null
          serving_size?: number
          serving_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          plan_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          plan_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          plan_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          barcode_upc: string | null
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          food_name: string
          id: string
          logged_at: string
          meal_category: string | null
          protein: number | null
          user_id: string
        }
        Insert: {
          barcode_upc?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_name: string
          id?: string
          logged_at?: string
          meal_category?: string | null
          protein?: number | null
          user_id: string
        }
        Update: {
          barcode_upc?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_name?: string
          id?: string
          logged_at?: string
          meal_category?: string | null
          protein?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_published: boolean | null
          program_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          program_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          program_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plans_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_assessments: {
        Row: {
          calculated_vibe: string
          created_at: string
          id: string
          raw_raw_answers: Json
          user_id: string
        }
        Insert: {
          calculated_vibe: string
          created_at?: string
          id?: string
          raw_raw_answers: Json
          user_id: string
        }
        Update: {
          calculated_vibe?: string
          created_at?: string
          id?: string
          raw_answers?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      program_days: {
        Row: {
          created_at: string
          day_number: number
          id: string
          title: string | null
          week_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          title?: string | null
          week_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          title?: string | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      program_exercises: {
        Row: {
          created_at: string
          day_id: string
          exercise_library_id: string
          id: string
          notes: string | null
          order_index: number | null
          rest_seconds: number | null
          target_reps: string | null
          target_rpe: number | null
          target_sets: number | null
        }
        Insert: {
          created_at?: string
          day_id: string
          exercise_library_id: string
          id?: string
          notes?: string | null
          order_index?: number | null
          rest_seconds?: number | null
          target_reps?: string | null
          target_rpe?: number | null
          target_sets?: number | null
        }
        Update: {
          created_at?: string
          day_id?: string
          exercise_library_id?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          rest_seconds?: number | null
          target_reps?: string | null
          target_rpe?: number | null
          target_sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_exercise_library_id_fkey"
            columns: ["exercise_library_id"]
            isOneToOne: false
            referencedRelation: "exercises_library"
            referencedColumns: ["id"]
          },
        ]
      }
      program_weeks: {
        Row: {
          created_at: string
          id: string
          program_id: string
          title: string | null
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          title?: string | null
          week_number: number
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          title?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          duration_weeks: number | null
          id: string
          image_url: string | null
          is_published: boolean | null
          is_subscription: boolean | null
          parent_template_id: string | null
          price: number
          title: string
          updated_at: string
          version_number: number | null
          vibe_type: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          duration_weeks?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          is_subscription?: boolean | null
          parent_template_id?: string | null
          price?: number
          title: string
          updated_at?: string
          version_number?: number | null
          vibe_type?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          duration_weeks?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          is_subscription?: boolean | null
          parent_template_id?: string | null
          price?: number
          title?: string
          updated_at?: string
          version_number?: number | null
          vibe_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["wff_role"]
          stripe_customer_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["wff_role"]
          stripe_customer_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["wff_role"]
          stripe_customer_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      workout_log_sets: {
        Row: {
          exercise_library_id: string
          id: string
          logged_at: string
          reps_completed: number | null
          rpe_actual: number | null
          session_id: string
          set_number: number
          weight_kg: number | null
        }
        Insert: {
          exercise_library_id: string
          id?: string
          logged_at?: string
          reps_completed?: number | null
          rpe_actual?: number | null
          session_id: string
          set_number: number
          weight_kg?: number | null
        }
        Update: {
          exercise_library_id?: string
          id?: string
          logged_at?: string
          reps_completed?: number | null
          rpe_actual?: number | null
          session_id?: string
          set_number?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_log_sets_exercise_library_id_fkey"
            columns: ["exercise_library_id"]
            isOneToOne: false
            referencedRelation: "exercises_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          day_id: string | null
          id: string
          notes: string | null
          program_id: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          day_id?: string | null
          id?: string
          notes?: string | null
          program_id?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          day_id?: string | null
          id?: string
          notes?: string | null
          program_id?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
      difficulty_level: "beginner" | "intermediate" | "advanced"
      enrollment_status: "active" | "pending" | "completed" | "cancelled" | "refunded"
      movement_pattern:
        | "push"
        | "pull"
        | "hinge"
        | "squat"
        | "core"
        | "isolation"
        | "cardio"
      wff_role: "admin" | "coach" | "client"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      difficulty_level: ["beginner", "intermediate", "advanced"],
      enrollment_status: ["active", "pending", "completed", "cancelled", "refunded"],
      movement_pattern: [
        "push",
        "pull",
        "hinge",
        "squat",
        "core",
        "isolation",
        "cardio",
      ],
      wff_role: ["admin", "coach", "client"],
    },
  },
} as const
