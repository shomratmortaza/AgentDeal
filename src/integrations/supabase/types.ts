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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          agent_id: string
          agreed_price: number
          buyer_id: string
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_note: string | null
          id: string
          offer_id: string
          request_id: string
          seller_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          agreed_price: number
          buyer_id: string
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_note?: string | null
          id?: string
          offer_id: string
          request_id: string
          seller_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agreed_price?: number
          buyer_id?: string
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_note?: string | null
          id?: string
          offer_id?: string
          request_id?: string
          seller_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "provider_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          sender_id: string | null
          sender_kind: string
          thread_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          sender_id?: string | null
          sender_kind: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          sender_id?: string | null
          sender_kind?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "direct_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_threads: {
        Row: {
          agent_id: string
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string
          seller_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          seller_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          seller_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_threads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "provider_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_events: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          kind: string
          viewer_id: string | null
          visitor: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          kind: string
          viewer_id?: string | null
          visitor: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          kind?: string
          viewer_id?: string | null
          visitor?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "provider_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          sender_id: string | null
          sender_kind: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          sender_id?: string | null
          sender_kind: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          sender_id?: string | null
          sender_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          agent_id: string
          ai_reason: string
          ai_score: number
          created_at: string
          delivery_hours: number
          id: string
          message: string
          price: number
          rank: number
          request_id: string
          score_breakdown: Json
          status: string
        }
        Insert: {
          agent_id: string
          ai_reason: string
          ai_score: number
          created_at?: string
          delivery_hours: number
          id?: string
          message: string
          price: number
          rank: number
          request_id: string
          score_breakdown?: Json
          status?: string
        }
        Update: {
          agent_id?: string
          ai_reason?: string
          ai_score?: number
          created_at?: string
          delivery_hours?: number
          id?: string
          message?: string
          price?: number
          rank?: number
          request_id?: string
          score_breakdown?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "provider_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked: boolean
          category: string | null
          company: string | null
          created_at: string
          email: string | null
          experience: string | null
          github: string | null
          headline: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          location: string | null
          name: string | null
          portfolio_url: string | null
          skills: string[]
          twitter: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          category?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          github?: string | null
          headline?: string | null
          id: string
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          name?: string | null
          portfolio_url?: string | null
          skills?: string[]
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          category?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          github?: string | null
          headline?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          name?: string | null
          portfolio_url?: string | null
          skills?: string[]
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      provider_agents: {
        Row: {
          base_price: number
          behance: string | null
          category: string
          completed_jobs: number
          created_at: string
          deleted_at: string | null
          delivery_hours: number
          description: string
          dribbble: string | null
          github: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          linkedin: string | null
          name: string
          negotiation_style: string
          owner_id: string | null
          portfolio_items: Json
          portfolio_url: string | null
          quality_score: number
          rating: number
          reputation_score: number
          review_count: number
          skills: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          base_price: number
          behance?: string | null
          category: string
          completed_jobs?: number
          created_at?: string
          deleted_at?: string | null
          delivery_hours: number
          description: string
          dribbble?: string | null
          github?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          linkedin?: string | null
          name: string
          negotiation_style: string
          owner_id?: string | null
          portfolio_items?: Json
          portfolio_url?: string | null
          quality_score: number
          rating?: number
          reputation_score: number
          review_count?: number
          skills: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          base_price?: number
          behance?: string | null
          category?: string
          completed_jobs?: number
          created_at?: string
          deleted_at?: string | null
          delivery_hours?: number
          description?: string
          dribbble?: string | null
          github?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          linkedin?: string | null
          name?: string
          negotiation_style?: string
          owner_id?: string | null
          portfolio_items?: Json
          portfolio_url?: string | null
          quality_score?: number
          rating?: number
          reputation_score?: number
          review_count?: number
          skills?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          agent_id: string
          buyer_id: string
          comment: string
          conversation_id: string
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          agent_id: string
          buyer_id: string
          comment?: string
          conversation_id: string
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          agent_id?: string
          buyer_id?: string
          comment?: string
          conversation_id?: string
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "provider_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget: number | null
          buyer_id: string
          category: string
          created_at: string
          deadline_hours: number | null
          id: string
          raw_request: string
          status: string
          structured_requirements: Json
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          buyer_id: string
          category: string
          created_at?: string
          deadline_hours?: number | null
          id?: string
          raw_request: string
          status?: string
          structured_requirements: Json
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          buyer_id?: string
          category?: string
          created_at?: string
          deadline_hours?: number | null
          id?: string
          raw_request?: string
          status?: string
          structured_requirements?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          from_admin: boolean
          id: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_admin?: boolean
          id?: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_admin?: boolean
          id?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          reference: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          agent_id: string
          amount: number
          buyer_id: string
          conversation_id: string
          created_at: string
          currency: string
          held_at: string | null
          id: string
          offer_id: string
          payout_status: string
          paypal_capture_id: string | null
          paypal_order_id: string
          platform_fee: number
          refunded_at: string | null
          released_at: string | null
          request_id: string
          seller_amount: number
          seller_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount: number
          buyer_id: string
          conversation_id: string
          created_at?: string
          currency?: string
          held_at?: string | null
          id?: string
          offer_id: string
          payout_status?: string
          paypal_capture_id?: string | null
          paypal_order_id: string
          platform_fee: number
          refunded_at?: string | null
          released_at?: string | null
          request_id: string
          seller_amount: number
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          buyer_id?: string
          conversation_id?: string
          created_at?: string
          currency?: string
          held_at?: string | null
          id?: string
          offer_id?: string
          payout_status?: string
          paypal_capture_id?: string | null
          paypal_order_id?: string
          platform_fee?: number
          refunded_at?: string | null
          released_at?: string | null
          request_id?: string
          seller_amount?: number
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "provider_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
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
      bootstrap_account: { Args: never; Returns: undefined }
      choose_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_participant: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      owns_agent: { Args: { _agent: string; _uid: string }; Returns: boolean }
      owns_request: { Args: { _req: string; _uid: string }; Returns: boolean }
      seller_on_request: {
        Args: { _req: string; _uid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "buyer" | "seller"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "buyer", "seller"],
    },
  },
} as const
