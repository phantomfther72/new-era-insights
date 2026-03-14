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
      ad_sales: {
        Row: {
          ad_date: string | null
          category: string | null
          client_name: string | null
          created_at: string
          dataset_id: string
          id: string
          placement: string | null
          raw_data: Json | null
          revenue: number | null
        }
        Insert: {
          ad_date?: string | null
          category?: string | null
          client_name?: string | null
          created_at?: string
          dataset_id: string
          id?: string
          placement?: string | null
          raw_data?: Json | null
          revenue?: number | null
        }
        Update: {
          ad_date?: string | null
          category?: string | null
          client_name?: string | null
          created_at?: string
          dataset_id?: string
          id?: string
          placement?: string | null
          raw_data?: Json | null
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_sales_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      circulation_records: {
        Row: {
          client: string | null
          created_at: string
          dataset_id: string
          delivered: number | null
          id: string
          period_end: string | null
          period_start: string | null
          raw_data: Json | null
          returned: number | null
          returned_percentage: number | null
          sell_through_rate: number | null
          sold: number | null
        }
        Insert: {
          client?: string | null
          created_at?: string
          dataset_id: string
          delivered?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          raw_data?: Json | null
          returned?: number | null
          returned_percentage?: number | null
          sell_through_rate?: number | null
          sold?: number | null
        }
        Update: {
          client?: string | null
          created_at?: string
          dataset_id?: string
          delivered?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          raw_data?: Json | null
          returned?: number | null
          returned_percentage?: number | null
          sell_through_rate?: number | null
          sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "circulation_records_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          columns: Json | null
          created_at: string
          error_message: string | null
          file_path: string
          file_size: number
          id: string
          mime_type: string
          name: string
          preview_data: Json | null
          row_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          columns?: Json | null
          created_at?: string
          error_message?: string | null
          file_path: string
          file_size?: number
          id?: string
          mime_type?: string
          name: string
          preview_data?: Json | null
          row_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          columns?: Json | null
          created_at?: string
          error_message?: string | null
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          name?: string
          preview_data?: Json | null
          row_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      forecasts: {
        Row: {
          confidence_high: number | null
          confidence_low: number | null
          created_at: string
          forecast_type: string
          id: string
          model_name: string | null
          period_end: string
          period_start: string
          predicted_value: number | null
        }
        Insert: {
          confidence_high?: number | null
          confidence_low?: number | null
          created_at?: string
          forecast_type: string
          id?: string
          model_name?: string | null
          period_end: string
          period_start: string
          predicted_value?: number | null
        }
        Update: {
          confidence_high?: number | null
          confidence_low?: number | null
          created_at?: string
          forecast_type?: string
          id?: string
          model_name?: string | null
          period_end?: string
          period_start?: string
          predicted_value?: number | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          delivered_copies: number | null
          demand_trend: string | null
          id: string
          name: string
          sold_copies: number | null
        }
        Insert: {
          created_at?: string
          delivered_copies?: number | null
          demand_trend?: string | null
          id?: string
          name: string
          sold_copies?: number | null
        }
        Update: {
          created_at?: string
          delivered_copies?: number | null
          demand_trend?: string | null
          id?: string
          name?: string
          sold_copies?: number | null
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          category: string | null
          copies_sold: number | null
          created_at: string
          dataset_id: string
          id: string
          raw_data: Json | null
          record_date: string | null
          region: string | null
          revenue: number | null
        }
        Insert: {
          category?: string | null
          copies_sold?: number | null
          created_at?: string
          dataset_id: string
          id?: string
          raw_data?: Json | null
          record_date?: string | null
          region?: string | null
          revenue?: number | null
        }
        Update: {
          category?: string | null
          copies_sold?: number | null
          created_at?: string
          dataset_id?: string
          id?: string
          raw_data?: Json | null
          record_date?: string | null
          region?: string | null
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          age_group: string | null
          created_at: string
          dataset_id: string
          id: string
          name: string | null
          plan: string | null
          preferred_category: string | null
          raw_data: Json | null
          region: string | null
          start_date: string | null
          subscriber_id: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          dataset_id: string
          id?: string
          name?: string | null
          plan?: string | null
          preferred_category?: string | null
          raw_data?: Json | null
          region?: string | null
          start_date?: string | null
          subscriber_id?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string
          dataset_id?: string
          id?: string
          name?: string | null
          plan?: string | null
          preferred_category?: string | null
          raw_data?: Json | null
          region?: string | null
          start_date?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
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
    Enums: {},
  },
} as const
