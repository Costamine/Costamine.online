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
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          is_replied: boolean | null
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          currency: string
          id: string
          is_default: boolean | null
          rate_to_sar: number
          symbol: string
          updated_at: string
        }
        Insert: {
          currency: string
          id?: string
          is_default?: boolean | null
          rate_to_sar?: number
          symbol: string
          updated_at?: string
        }
        Update: {
          currency?: string
          id?: string
          is_default?: boolean | null
          rate_to_sar?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      demo_downloads: {
        Row: {
          downloaded_at: string
          id: string
          template_id: string
          user_agent: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          template_id: string
          user_agent?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          template_id?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_downloads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          currency: string
          id: string
          order_id: string
          price: number
          template_id: string | null
          template_name: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          order_id: string
          price: number
          template_id?: string | null
          template_name: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          price?: number
          template_id?: string | null
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency_used: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: string
          status: string
          total_egp: number
          total_sar: number
          total_usd: number
          transfer_proof_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_used?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          status?: string
          total_egp: number
          total_sar: number
          total_usd: number
          transfer_proof_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_used?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          total_egp?: number
          total_sar?: number
          total_usd?: number
          transfer_proof_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value_ar: string | null
          value_en: string | null
          value_json: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value_ar?: string | null
          value_en?: string | null
          value_json?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value_ar?: string | null
          value_en?: string | null
          value_json?: Json | null
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          id: string
          ip_hash: string | null
          page_path: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          page_path?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          id?: string
          ip_hash?: string | null
          page_path?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      template_downloads: {
        Row: {
          downloaded_at: string
          id: string
          template_id: string
          user_agent: string | null
        }
        Insert: {
          downloaded_at?: string
          id?: string
          template_id: string
          user_agent?: string | null
        }
        Update: {
          downloaded_at?: string
          id?: string
          template_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_downloads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category_id: string | null
          created_at: string
          demo_file_url: string | null
          description_ar: string | null
          description_en: string | null
          discount_active: boolean | null
          discount_expires_at: string | null
          discount_percentage: number | null
          discount_type: string
          discount_value: number | null
          downloads_count: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_free: boolean
          name_ar: string
          name_en: string
          preview_image_url: string | null
          price_egp: number
          price_sar: number
          price_usd: number
          show_new_badge: boolean | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          demo_file_url?: string | null
          description_ar?: string | null
          description_en?: string | null
          discount_active?: boolean | null
          discount_expires_at?: string | null
          discount_percentage?: number | null
          discount_type?: string
          discount_value?: number | null
          downloads_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean
          name_ar: string
          name_en: string
          preview_image_url?: string | null
          price_egp?: number
          price_sar?: number
          price_usd?: number
          show_new_badge?: boolean | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          demo_file_url?: string | null
          description_ar?: string | null
          description_en?: string | null
          discount_active?: boolean | null
          discount_expires_at?: string | null
          discount_percentage?: number | null
          discount_type?: string
          discount_value?: number | null
          downloads_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean
          name_ar?: string
          name_en?: string
          preview_image_url?: string | null
          price_egp?: number
          price_sar?: number
          price_usd?: number
          show_new_badge?: boolean | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          activity_ar: string | null
          activity_en: string | null
          avatar_url: string | null
          comment_ar: string
          comment_en: string
          created_at: string
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          rating: number
          sort_order: number | null
        }
        Insert: {
          activity_ar?: string | null
          activity_en?: string | null
          avatar_url?: string | null
          comment_ar: string
          comment_en: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          rating: number
          sort_order?: number | null
        }
        Update: {
          activity_ar?: string | null
          activity_en?: string | null
          avatar_url?: string | null
          comment_ar?: string
          comment_en?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          rating?: number
          sort_order?: number | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { coupon_code: string }
        Returns: undefined
      }
      lookup_coupon: {
        Args: { coupon_code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          expires_at: string
          id: string
          is_active: boolean
          max_uses: number
          min_order_amount: number
          used_count: number
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
