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
      connected_accounts: {
        Row: {
          contact_email: string | null
          created_at: string
          display_name: string | null
          id: string
          session_id: string
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          session_id: string
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          session_id?: string
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      echoes: {
        Row: {
          created_at: string
          expires_at: string
          fragment_text: string
          id: string
          session_id: string
          thought_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          fragment_text: string
          id?: string
          session_id: string
          thought_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          fragment_text?: string
          id?: string
          session_id?: string
          thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echoes_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "public_thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echoes_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts_with_decay"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_whispers: {
        Row: {
          created_at: string
          id: string
          message: string
          seen: boolean
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          seen?: boolean
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          seen?: boolean
          session_id?: string
        }
        Relationships: []
      }
      private_notes: {
        Row: {
          category: string
          content: string
          created_at: string
          expires_at: string
          id: string
          last_watered_at: string | null
          mode: string
          session_id: string
          starred: boolean
          water_count: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          expires_at: string
          id?: string
          last_watered_at?: string | null
          mode?: string
          session_id: string
          starred?: boolean
          water_count?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_watered_at?: string | null
          mode?: string
          session_id?: string
          starred?: boolean
          water_count?: number
        }
        Relationships: []
      }
      public_thoughts: {
        Row: {
          content: string
          created_at: string
          decay_level: number
          decay_speed: Database["public"]["Enums"]["decay_speed"]
          expires_at: string
          id: string
          mode: Database["public"]["Enums"]["decay_mode"]
          session_id: string
          share_slug: string | null
          zone: string
        }
        Insert: {
          content: string
          created_at?: string
          decay_level?: number
          decay_speed?: Database["public"]["Enums"]["decay_speed"]
          expires_at: string
          id?: string
          mode?: Database["public"]["Enums"]["decay_mode"]
          session_id: string
          share_slug?: string | null
          zone?: string
        }
        Update: {
          content?: string
          created_at?: string
          decay_level?: number
          decay_speed?: Database["public"]["Enums"]["decay_speed"]
          expires_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["decay_mode"]
          session_id?: string
          share_slug?: string | null
          zone?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          created_at: string
          id: string
          session_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          session_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          session_id?: string
        }
        Relationships: []
      }
      subscription_status: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          id: string
          premium_until: string | null
          price_id: string | null
          status: string
          stripe_account_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          premium_until?: string | null
          price_id?: string | null
          status?: string
          stripe_account_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          premium_until?: string | null
          price_id?: string | null
          status?: string
          stripe_account_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      echoes_with_info: {
        Row: {
          created_at: string | null
          expires_at: string | null
          fragment_text: string | null
          id: string | null
          thought_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          fragment_text?: string | null
          id?: string | null
          thought_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          fragment_text?: string | null
          id?: string | null
          thought_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "echoes_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "public_thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echoes_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts_with_decay"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts_with_decay: {
        Row: {
          content: string | null
          created_at: string | null
          decay_level: number | null
          decay_speed: Database["public"]["Enums"]["decay_speed"] | null
          expires_at: string | null
          id: string | null
          mode: Database["public"]["Enums"]["decay_mode"] | null
          zone: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          decay_level?: never
          decay_speed?: Database["public"]["Enums"]["decay_speed"] | null
          expires_at?: string | null
          id?: string | null
          mode?: Database["public"]["Enums"]["decay_mode"] | null
          zone?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          decay_level?: never
          decay_speed?: Database["public"]["Enums"]["decay_speed"] | null
          expires_at?: string | null
          id?: string | null
          mode?: Database["public"]["Enums"]["decay_mode"] | null
          zone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_decay_level: {
        Args: { created_at: string; expires_at: string }
        Returns: number
      }
      check_rate_limit: {
        Args: { p_action_type: string; p_session_id: string }
        Returns: boolean
      }
      cleanup_expired_notes: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      count_faded_thoughts: { Args: never; Returns: number }
      delete_private_note: {
        Args: { p_note_id: string; p_session_id: string }
        Returns: undefined
      }
      dissolve_all_notes: { Args: { p_session_id: string }; Returns: undefined }
      get_private_notes: {
        Args: { p_session_id: string }
        Returns: {
          category: string
          content: string
          created_at: string
          expires_at: string
          id: string
          last_watered_at: string
          mode: string
          session_id: string
          starred: boolean
          water_count: number
        }[]
      }
      is_own_session: {
        Args: { current_session_id: string; thought_session_id: string }
        Returns: boolean
      }
      toggle_note_star: {
        Args: { p_note_id: string; p_session_id: string; p_starred: boolean }
        Returns: undefined
      }
      water_private_note: {
        Args: { p_note_id: string; p_session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      decay_mode: "clean" | "rot"
      decay_speed: "normal" | "fast" | "sink"
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
      decay_mode: ["clean", "rot"],
      decay_speed: ["normal", "fast", "sink"],
    },
  },
} as const
