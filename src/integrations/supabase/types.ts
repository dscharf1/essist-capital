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
      card_allocations: {
        Row: {
          application_id: string
          card_number_masked: string
          created_at: string
          id: string
          labor_amount: number
          labor_unlocked: boolean
          materials_amount: number
          materials_unlocked: boolean
          merchant_category_lock: string[] | null
          total_amount: number
        }
        Insert: {
          application_id: string
          card_number_masked: string
          created_at?: string
          id?: string
          labor_amount: number
          labor_unlocked?: boolean
          materials_amount: number
          materials_unlocked?: boolean
          merchant_category_lock?: string[] | null
          total_amount: number
        }
        Update: {
          application_id?: string
          card_number_masked?: string
          created_at?: string
          id?: string
          labor_amount?: number
          labor_unlocked?: boolean
          materials_amount?: number
          materials_unlocked?: boolean
          merchant_category_lock?: string[] | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_allocations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          envelope_id: string | null
          id: string
          sent_at: string | null
          signed_at: string | null
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          envelope_id?: string | null
          id?: string
          sent_at?: string | null
          signed_at?: string | null
          status?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          envelope_id?: string | null
          id?: string
          sent_at?: string | null
          signed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          application_id: string
          completed_date: string | null
          created_at: string
          id: string
          inspector_name: string | null
          notes: string | null
          passed: boolean | null
          scheduled_date: string | null
          status: string
        }
        Insert: {
          application_id: string
          completed_date?: string | null
          created_at?: string
          id?: string
          inspector_name?: string | null
          notes?: string | null
          passed?: boolean | null
          scheduled_date?: string | null
          status?: string
        }
        Update: {
          application_id?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          inspector_name?: string | null
          notes?: string | null
          passed?: boolean | null
          scheduled_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          address: string | null
          city: string | null
          contractor_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          project_description: string | null
          project_type: string
          requested_amount: number
          state: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contractor_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          project_description?: string | null
          project_type: string
          requested_amount: number
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contractor_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          project_description?: string | null
          project_type?: string
          requested_amount?: number
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          application_id: string | null
          bank_name: string | null
          brand: string | null
          created_at: string
          id: string
          is_default: boolean | null
          last_four: string | null
          payment_type: string
          stripe_customer_id: string
          stripe_payment_method_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          bank_name?: string | null
          brand?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          payment_type: string
          stripe_customer_id: string
          stripe_payment_method_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          bank_name?: string | null
          brand?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          payment_type?: string
          stripe_customer_id?: string
          stripe_payment_method_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string
          created_at: string
          failure_reason: string | null
          id: string
          payment_date: string
          processed_at: string | null
          schedule_id: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          application_id: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          payment_date: string
          processed_at?: string | null
          schedule_id: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          payment_date?: string
          processed_at?: string | null
          schedule_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "repayment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repayment_schedules: {
        Row: {
          application_id: string
          created_at: string
          id: string
          monthly_amount: number
          next_payment_date: string
          payment_method_id: string | null
          payments_made: number | null
          remaining_balance: number
          reminder_3_day_sent: boolean | null
          reminder_7_day_sent: boolean | null
          status: string
          total_amount: number
          total_payments: number
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          monthly_amount: number
          next_payment_date: string
          payment_method_id?: string | null
          payments_made?: number | null
          remaining_balance: number
          reminder_3_day_sent?: boolean | null
          reminder_7_day_sent?: boolean | null
          status?: string
          total_amount: number
          total_payments: number
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          monthly_amount?: number
          next_payment_date?: string
          payment_method_id?: string | null
          payments_made?: number | null
          remaining_balance?: number
          reminder_3_day_sent?: boolean | null
          reminder_7_day_sent?: boolean | null
          status?: string
          total_amount?: number
          total_payments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repayment_schedules_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repayment_schedules_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      workflow_events: {
        Row: {
          application_id: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          triggered_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          triggered_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cron_job_history: {
        Row: {
          command: string | null
          database: string | null
          end_time: string | null
          job_pid: number | null
          jobid: number | null
          jobname: string | null
          return_message: string | null
          runid: number | null
          start_time: string | null
          status: string | null
          username: string | null
        }
        Relationships: []
      }
      cron_job_status: {
        Row: {
          active: boolean | null
          command: string | null
          database: string | null
          jobid: number | null
          jobname: string | null
          nodename: string | null
          nodeport: number | null
          schedule: string | null
          username: string | null
        }
        Insert: {
          active?: boolean | null
          command?: string | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          nodeport?: number | null
          schedule?: string | null
          username?: string | null
        }
        Update: {
          active?: boolean | null
          command?: string | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          nodeport?: number | null
          schedule?: string | null
          username?: string | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "moderator" | "user"
      application_status:
        | "draft"
        | "submitted"
        | "document_sent"
        | "document_signed"
        | "card_provisioned"
        | "project_started"
        | "inspection_pending"
        | "inspection_passed"
        | "funds_released"
        | "completed"
        | "rejected"
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
      application_status: [
        "draft",
        "submitted",
        "document_sent",
        "document_signed",
        "card_provisioned",
        "project_started",
        "inspection_pending",
        "inspection_passed",
        "funds_released",
        "completed",
        "rejected",
      ],
    },
  },
} as const
