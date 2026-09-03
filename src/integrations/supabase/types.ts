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
  public: {
    Tables: {
      app_secrets: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          backdrop_path: string | null
          cast_members: Json
          country: string | null
          director: string | null
          episodes: number | null
          featured: boolean
          first_imported_at: string
          genres: string[]
          hidden: boolean
          id: string
          imdb_id: string | null
          industry: string
          language: string
          language_code: string
          media_type: string
          original_title: string | null
          overview: string
          popularity: number
          poster_path: string | null
          rating: number
          release_date: string | null
          runtime: number | null
          seasons: number | null
          source: string
          status: string | null
          title: string
          tmdb_id: number
          trailer_key: string | null
          updated_at: string
          vote_count: number
          year: number | null
        }
        Insert: {
          backdrop_path?: string | null
          cast_members?: Json
          country?: string | null
          director?: string | null
          episodes?: number | null
          featured?: boolean
          first_imported_at?: string
          genres?: string[]
          hidden?: boolean
          id?: string
          imdb_id?: string | null
          industry?: string
          language?: string
          language_code?: string
          media_type: string
          original_title?: string | null
          overview?: string
          popularity?: number
          poster_path?: string | null
          rating?: number
          release_date?: string | null
          runtime?: number | null
          seasons?: number | null
          source?: string
          status?: string | null
          title: string
          tmdb_id: number
          trailer_key?: string | null
          updated_at?: string
          vote_count?: number
          year?: number | null
        }
        Update: {
          backdrop_path?: string | null
          cast_members?: Json
          country?: string | null
          director?: string | null
          episodes?: number | null
          featured?: boolean
          first_imported_at?: string
          genres?: string[]
          hidden?: boolean
          id?: string
          imdb_id?: string | null
          industry?: string
          language?: string
          language_code?: string
          media_type?: string
          original_title?: string | null
          overview?: string
          popularity?: number
          poster_path?: string | null
          rating?: number
          release_date?: string | null
          runtime?: number | null
          seasons?: number | null
          source?: string
          status?: string | null
          title?: string
          tmdb_id?: number
          trailer_key?: string | null
          updated_at?: string
          vote_count?: number
          year?: number | null
        }
        Relationships: []
      }
      media_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          imdb_id: string | null
          media_type: string
          message: string | null
          query_title: string
          status: string
          tmdb_id: number | null
          updated_at: string
          user_id: string
          verified_poster_path: string | null
          verified_title: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          imdb_id?: string | null
          media_type?: string
          message?: string | null
          query_title: string
          status?: string
          tmdb_id?: number | null
          updated_at?: string
          user_id: string
          verified_poster_path?: string | null
          verified_title?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          imdb_id?: string | null
          media_type?: string
          message?: string | null
          query_title?: string
          status?: string
          tmdb_id?: number | null
          updated_at?: string
          user_id?: string
          verified_poster_path?: string | null
          verified_title?: string | null
        }
        Relationships: []
      }
      movie_feedback: {
        Row: {
          feedback: string
          movie_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          feedback: string
          movie_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          feedback?: string
          movie_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      movie_ratings: {
        Row: {
          movie_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          movie_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          movie_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email?: string
          id: string
          name?: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          added: number
          checked: number
          created_at: string
          errors: Json
          failed: number
          finished_at: string | null
          id: string
          mode: string
          skipped: number
          started_at: string
          status: string
          triggered_by: string
          updated: number
        }
        Insert: {
          added?: number
          checked?: number
          created_at?: string
          errors?: Json
          failed?: number
          finished_at?: string | null
          id?: string
          mode?: string
          skipped?: number
          started_at?: string
          status?: string
          triggered_by?: string
          updated?: number
        }
        Update: {
          added?: number
          checked?: number
          created_at?: string
          errors?: Json
          failed?: number
          finished_at?: string | null
          id?: string
          mode?: string
          skipped?: number
          started_at?: string
          status?: string
          triggered_by?: string
          updated?: number
        }
        Relationships: []
      }
      tmdb_releases: {
        Row: {
          backdrop_path: string | null
          cast_members: Json
          created_at: string
          director: string | null
          featured: boolean
          fetched_at: string
          genres: string[]
          hidden: boolean
          imdb_id: string | null
          language: string
          overview: string
          poster_path: string | null
          providers: Json
          rating: number
          release_date: string | null
          release_type: string
          runtime: number | null
          title: string
          tmdb_id: number
          trailer_key: string | null
        }
        Insert: {
          backdrop_path?: string | null
          cast_members?: Json
          created_at?: string
          director?: string | null
          featured?: boolean
          fetched_at?: string
          genres?: string[]
          hidden?: boolean
          imdb_id?: string | null
          language?: string
          overview?: string
          poster_path?: string | null
          providers?: Json
          rating?: number
          release_date?: string | null
          release_type: string
          runtime?: number | null
          title: string
          tmdb_id: number
          trailer_key?: string | null
        }
        Update: {
          backdrop_path?: string | null
          cast_members?: Json
          created_at?: string
          director?: string | null
          featured?: boolean
          fetched_at?: string
          genres?: string[]
          hidden?: boolean
          imdb_id?: string | null
          language?: string
          overview?: string
          poster_path?: string | null
          providers?: Json
          rating?: number
          release_date?: string | null
          release_type?: string
          runtime?: number | null
          title?: string
          tmdb_id?: number
          trailer_key?: string | null
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
      user_settings: {
        Row: {
          preferences: Json
          recently_viewed: Json
          search_history: Json
          targets: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          preferences?: Json
          recently_viewed?: Json
          search_history?: Json
          targets?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          preferences?: Json
          recently_viewed?: Json
          search_history?: Json
          targets?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          id: string
          movie_id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          id?: string
          movie_id: string
          user_id: string
          watched_at?: string
        }
        Update: {
          id?: string
          movie_id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
      watch_progress: {
        Row: {
          movie_id: string
          runtime: number
          seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          movie_id: string
          runtime?: number
          seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          movie_id?: string
          runtime?: number
          seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
