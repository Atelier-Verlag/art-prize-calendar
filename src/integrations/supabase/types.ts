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
      art_prizes: {
        Row: {
          age_max: number | null
          age_min: number | null
          category: Database["public"]["Enums"]["art_category"]
          country: string
          created_at: string
          currency: string
          deadline: string
          description: string
          fee: number | null
          id: string
          is_archived: boolean
          is_short_term: boolean
          name: string
          organizer: string
          prize_amount: number | null
          region: string
          requirements: string[] | null
          updated_at: string
          website: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          category: Database["public"]["Enums"]["art_category"]
          country: string
          created_at?: string
          currency?: string
          deadline: string
          description: string
          fee?: number | null
          id?: string
          is_archived?: boolean
          is_short_term?: boolean
          name: string
          organizer: string
          prize_amount?: number | null
          region: string
          requirements?: string[] | null
          updated_at?: string
          website: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          category?: Database["public"]["Enums"]["art_category"]
          country?: string
          created_at?: string
          currency?: string
          deadline?: string
          description?: string
          fee?: number | null
          id?: string
          is_archived?: boolean
          is_short_term?: boolean
          name?: string
          organizer?: string
          prize_amount?: number | null
          region?: string
          requirements?: string[] | null
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          is_pro_user: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean
          is_pro_user?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_pro_user?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      scraper_logs: {
        Row: {
          created_at: string
          id: string
          items_found: number | null
          message: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          items_found?: number | null
          message: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          items_found?: number | null
          message?: string
          status?: string
        }
        Relationships: []
      }
      scraper_sources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string
          created_at: string
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      art_category:
        | "painting"
        | "sculpture"
        | "media"
        | "photography"
        | "performance"
        | "mixed"
        | "residency"
        | "grant"
        | "exhibition"
        | "public_art"
        | "Kunstpreis"
        | "Wettbewerb"
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
      art_category: [
        "painting",
        "sculpture",
        "media",
        "photography",
        "performance",
        "mixed",
        "residency",
        "grant",
        "exhibition",
        "public_art",
        "Kunstpreis",
        "Wettbewerb",
      ],
    },
  },
} as const
