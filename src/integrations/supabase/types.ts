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
      ai_agents: {
        Row: {
          business_id: string
          business_profile: Json | null
          created_at: string
          id: string
          last_learning_at: string | null
          mode: Database["public"]["Enums"]["agent_mode"] | null
          posts_per_day: number
          status: Database["public"]["Enums"]["agent_status"] | null
          updated_at: string
        }
        Insert: {
          business_id: string
          business_profile?: Json | null
          created_at?: string
          id?: string
          last_learning_at?: string | null
          mode?: Database["public"]["Enums"]["agent_mode"] | null
          posts_per_day?: number
          status?: Database["public"]["Enums"]["agent_status"] | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          business_profile?: Json | null
          created_at?: string
          id?: string
          last_learning_at?: string | null
          mode?: Database["public"]["Enums"]["agent_mode"] | null
          posts_per_day?: number
          status?: Database["public"]["Enums"]["agent_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          avatar_url: string | null
          brand_keywords: string[] | null
          brand_tone: Database["public"]["Enums"]["brand_tone"] | null
          created_at: string
          id: string
          industry: string | null
          name: string
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          avatar_url?: string | null
          brand_keywords?: string[] | null
          brand_tone?: Database["public"]["Enums"]["brand_tone"] | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          avatar_url?: string | null
          brand_keywords?: string[] | null
          brand_tone?: Database["public"]["Enums"]["brand_tone"] | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
      comment_responses: {
        Row: {
          ai_response: string
          business_id: string
          comment_id: string
          created_at: string
          edited_response: string | null
          id: string
          platform_response_id: string | null
          posted_at: string | null
          status: Database["public"]["Enums"]["comment_response_status"]
          updated_at: string
        }
        Insert: {
          ai_response: string
          business_id: string
          comment_id: string
          created_at?: string
          edited_response?: string | null
          id?: string
          platform_response_id?: string | null
          posted_at?: string | null
          status?: Database["public"]["Enums"]["comment_response_status"]
          updated_at?: string
        }
        Update: {
          ai_response?: string
          business_id?: string
          comment_id?: string
          created_at?: string
          edited_response?: string | null
          id?: string
          platform_response_id?: string | null
          posted_at?: string | null
          status?: Database["public"]["Enums"]["comment_response_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_responses_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_settings: {
        Row: {
          auto_fetch_enabled: boolean
          business_id: string
          created_at: string
          fetch_interval_minutes: number
          id: string
          last_fetched_at: string | null
          response_mode: Database["public"]["Enums"]["comment_response_mode"]
          updated_at: string
        }
        Insert: {
          auto_fetch_enabled?: boolean
          business_id: string
          created_at?: string
          fetch_interval_minutes?: number
          id?: string
          last_fetched_at?: string | null
          response_mode?: Database["public"]["Enums"]["comment_response_mode"]
          updated_at?: string
        }
        Update: {
          auto_fetch_enabled?: boolean
          business_id?: string
          created_at?: string
          fetch_interval_minutes?: number
          id?: string
          last_fetched_at?: string | null
          response_mode?: Database["public"]["Enums"]["comment_response_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          author_username: string | null
          business_id: string
          commented_at: string | null
          content: string
          created_at: string
          fetched_at: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          platform_comment_id: string
          platform_post_id: string | null
          post_id: string | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string | null
          author_username?: string | null
          business_id: string
          commented_at?: string | null
          content: string
          created_at?: string
          fetched_at?: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          platform_comment_id: string
          platform_post_id?: string | null
          post_id?: string | null
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string | null
          author_username?: string | null
          business_id?: string
          commented_at?: string | null
          content?: string
          created_at?: string
          fetched_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_comment_id?: string
          platform_post_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_proof_url: string | null
          plan_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          plan_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          plan_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          business_id: string
          clicks: number
          comments: number
          created_at: string
          engagement_rate: number | null
          id: string
          impressions: number
          likes: number
          post_id: string
          reach: number
          recorded_at: string
          saves: number
          shares: number
          updated_at: string
        }
        Insert: {
          business_id: string
          clicks?: number
          comments?: number
          created_at?: string
          engagement_rate?: number | null
          id?: string
          impressions?: number
          likes?: number
          post_id: string
          reach?: number
          recorded_at?: string
          saves?: number
          shares?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          clicks?: number
          comments?: number
          created_at?: string
          engagement_rate?: number | null
          id?: string
          impressions?: number
          likes?: number
          post_id?: string
          reach?: number
          recorded_at?: string
          saves?: number
          shares?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_generated: boolean | null
          business_id: string
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          scheduled_at: string | null
          status: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          business_id: string
          content: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          business_id?: string
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          business_id: string
          created_at: string
          id: string
          is_connected: boolean | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_connected?: boolean | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_connected?: boolean | null
          platform?: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          trial_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          trial_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          trial_days?: number
          updated_at?: string
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
      user_subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          plan_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_mode: "autopilot" | "review"
      agent_status: "inactive" | "learning" | "active" | "paused"
      app_role: "admin" | "moderator" | "user"
      brand_tone:
        | "professional"
        | "friendly"
        | "luxury"
        | "playful"
        | "bold"
        | "minimal"
      comment_response_mode: "autopilot" | "review"
      comment_response_status:
        | "pending_review"
        | "approved"
        | "posted"
        | "rejected"
        | "failed"
      content_type: "feed" | "story" | "reel"
      social_platform:
        | "instagram"
        | "facebook"
        | "twitter"
        | "linkedin"
        | "tiktok"
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
      agent_mode: ["autopilot", "review"],
      agent_status: ["inactive", "learning", "active", "paused"],
      app_role: ["admin", "moderator", "user"],
      brand_tone: [
        "professional",
        "friendly",
        "luxury",
        "playful",
        "bold",
        "minimal",
      ],
      comment_response_mode: ["autopilot", "review"],
      comment_response_status: [
        "pending_review",
        "approved",
        "posted",
        "rejected",
        "failed",
      ],
      content_type: ["feed", "story", "reel"],
      social_platform: [
        "instagram",
        "facebook",
        "twitter",
        "linkedin",
        "tiktok",
      ],
    },
  },
} as const
