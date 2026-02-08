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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          archived_at: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_admins: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          created_at: string
          employee_id: string
          id: string
          quiz_id: string
          score: number
          total_questions: number
          updated_at: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          employee_id: string
          id?: string
          quiz_id: string
          score?: number
          total_questions?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          employee_id?: string
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_attempts_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_attempts_quiz"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_text: string
          order_index: number
          question_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text: string
          order_index?: number
          question_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text?: string
          order_index?: number
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          order_index: number
          question_text: string
          question_type: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          question_text: string
          question_type: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          quiz_attempt_id: string
          selected_option_id: string | null
          text_answer: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          quiz_attempt_id: string
          selected_option_id?: string | null
          text_answer?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          quiz_attempt_id?: string
          selected_option_id?: string | null
          text_answer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_responses_attempt"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_responses_option"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "quiz_question_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_responses_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          version_group_id: string
          video_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          version_group_id?: string
          video_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          version_group_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          due_date: string | null
          employee_id: string
          id: string
          updated_at: string
          video_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          due_date?: string | null
          employee_id: string
          id?: string
          updated_at?: string
          video_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          due_date?: string | null
          employee_id?: string
          id?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_assignments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          acknowledgment_viewing_seconds: number | null
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          presentation_acknowledged_at: string | null
          progress_percent: number
          updated_at: string
          video_id: string
        }
        Insert: {
          acknowledgment_viewing_seconds?: number | null
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          presentation_acknowledged_at?: string | null
          progress_percent?: number
          updated_at?: string
          video_id: string
        }
        Update: {
          acknowledgment_viewing_seconds?: number | null
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          presentation_acknowledged_at?: string | null
          progress_percent?: number
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          archived_at: string | null
          completion_rate: number
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          video_file_name: string | null
          video_url: string | null
        }
        Insert: {
          archived_at?: string | null
          completion_rate?: number
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          title: string
          type?: string
          updated_at?: string
          video_file_name?: string | null
          video_url?: string | null
        }
        Update: {
          archived_at?: string | null
          completion_rate?: number
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          video_file_name?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_quiz_usage: {
        Args: { quiz_id: string }
        Returns: {
          attempt_count: number
        }[]
      }
      check_video_usage: {
        Args: { video_id: string }
        Returns: {
          assigned_count: number
          completed_count: number
          quiz_completed_count: number
        }[]
      }
      create_quiz_version: {
        Args: { p_admin_user_id: string; p_quiz_id: string }
        Returns: string
      }
      get_all_employee_assignments: {
        Args: never
        Returns: {
          assignments: Json
          employee_email: string
          employee_full_name: string
          employee_id: string
        }[]
      }
      get_all_quiz_versions: {
        Args: { p_video_id: string }
        Returns: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          version_group_id: string
          video_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "quizzes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_correct_options_for_quiz: {
        Args: { p_quiz_id: string }
        Returns: {
          option_id: string
          question_id: string
        }[]
      }
      get_hidden_employee_assignments: {
        Args: never
        Returns: {
          archived_at: string
          assignments: Json
          employee_email: string
          employee_full_name: string
          employee_id: string
        }[]
      }
      get_safe_quiz_options: {
        Args: { p_question_id: string }
        Returns: {
          created_at: string
          id: string
          option_text: string
          order_index: number
          question_id: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_video_assignments: {
        Args: { user_email: string }
        Returns: {
          assignment: Json
          video: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_user_to_admin: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      submit_quiz_attempt: {
        Args: { p_employee_email: string; p_quiz_id: string; p_responses: Json }
        Returns: string
      }
      update_video_progress: {
        Args: {
          p_completed_at?: string
          p_employee_id: string
          p_progress_percent: number
          p_video_id: string
        }
        Returns: undefined
      }
      update_video_progress_by_email:
        | {
            Args: {
              p_completed_at?: string
              p_email: string
              p_progress_percent: number
              p_video_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_acknowledgment_viewing_seconds?: number
              p_completed_at?: string
              p_email: string
              p_presentation_acknowledged_at?: string
              p_progress_percent: number
              p_video_id: string
            }
            Returns: undefined
          }
    }
    Enums: {
      app_role: "admin" | "employee"
      content_type: "video" | "presentation"
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
      app_role: ["admin", "employee"],
      content_type: ["video", "presentation"],
    },
  },
} as const
