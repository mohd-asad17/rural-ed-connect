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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          educator_id: string
          id: string
          title: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          educator_id: string
          id?: string
          title: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          educator_id?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          max_marks: number | null
          title: string
        }
        Insert: {
          assignment_type: string
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          max_marks?: number | null
          title: string
        }
        Update: {
          assignment_type?: string
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          max_marks?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          content_type: string
          created_at: string
          id: string
          section_id: string
          sort_order: number
          storage_path: string | null
          title: string
          url: string | null
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          section_id: string
          sort_order?: number
          storage_path?: string | null
          title: string
          url?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          section_id?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      content_progress: {
        Row: {
          completed_at: string
          content_id: string
          id: string
          student_id: string
        }
        Insert: {
          completed_at?: string
          content_id: string
          id?: string
          student_id: string
        }
        Update: {
          completed_at?: string
          content_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          educator_id: string
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          educator_id: string
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          educator_id?: string
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      doubts: {
        Row: {
          ai_response: string | null
          course_id: string | null
          created_at: string
          expert_response: string | null
          id: string
          question: string
          resolved_at: string | null
          responded_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          ai_response?: string | null
          course_id?: string | null
          created_at?: string
          expert_response?: string | null
          id?: string
          question: string
          resolved_at?: string | null
          responded_by?: string | null
          status?: string
          student_id: string
        }
        Update: {
          ai_response?: string | null
          course_id?: string | null
          created_at?: string
          expert_response?: string | null
          id?: string
          question?: string
          resolved_at?: string | null
          responded_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string
          id: string
          rating: number
          student_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string
          id?: string
          rating: number
          student_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mcq_questions: {
        Row: {
          assignment_id: string
          correct_answer: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order: number
        }
        Insert: {
          assignment_id: string
          correct_answer: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order?: number
        }
        Update: {
          assignment_id?: string
          correct_answer?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "mcq_questions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string
          description: string | null
          educator_id: string
          id: string
          link: string | null
          opportunity_type: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          educator_id: string
          id?: string
          link?: string | null
          opportunity_type?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          educator_id?: string
          id?: string
          link?: string | null
          opportunity_type?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          educator_id: string
          file_url: string | null
          id: string
          link: string | null
          resource_type: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          educator_id: string
          file_url?: string | null
          id?: string
          link?: string | null
          resource_type?: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          educator_id?: string
          file_url?: string | null
          id?: string
          link?: string | null
          resource_type?: string
          title?: string
        }
        Relationships: []
      }
      scheduled_classes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          meeting_url: string | null
          scheduled_at: string
          status: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          scheduled_at: string
          status?: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          scheduled_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          answers: Json | null
          assignment_id: string
          feedback: string | null
          file_url: string | null
          id: string
          marks: number | null
          status: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json | null
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json | null
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_course_id_for_assignment: {
        Args: { _assignment_id: string }
        Returns: string
      }
      get_course_id_for_content: {
        Args: { _content_id: string }
        Returns: string
      }
      get_course_id_for_section: {
        Args: { _section_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_course_owner: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      is_enrolled: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "educator" | "student"
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
      app_role: ["educator", "student"],
    },
  },
} as const
