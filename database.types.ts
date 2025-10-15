export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      audio_files: {
        Row: {
          bit_rate: number | null;
          channels: number | null;
          created_at: string | null;
          duration: number;
          file_path: string;
          file_size: number;
          filename: string;
          format: string;
          id: string;
          sample_rate: number | null;
          transcription_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          bit_rate?: number | null;
          channels?: number | null;
          created_at?: string | null;
          duration: number;
          file_path: string;
          file_size: number;
          filename: string;
          format: string;
          id?: string;
          sample_rate?: number | null;
          transcription_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bit_rate?: number | null;
          channels?: number | null;
          created_at?: string | null;
          duration?: number;
          file_path?: string;
          file_size?: number;
          filename?: string;
          format?: string;
          id?: string;
          sample_rate?: number | null;
          transcription_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audio_files_transcription_id_fkey";
            columns: ["transcription_id"];
            isOneToOne: false;
            referencedRelation: "transcriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      cases: {
        Row: {
          created_at: string | null;
          id: string;
          status: Database["public"]["Enums"]["CaseStatus"] | null;
          type: Database["public"]["Enums"]["CaseType"] | null;
          updated_at: string | null;
          user_id: string | null;
          visibility: Database["public"]["Enums"]["CaseVisibility"] | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["CaseStatus"] | null;
          type?: Database["public"]["Enums"]["CaseType"] | null;
          updated_at?: string | null;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["CaseVisibility"] | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["CaseStatus"] | null;
          type?: Database["public"]["Enums"]["CaseType"] | null;
          updated_at?: string | null;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["CaseVisibility"] | null;
        };
        Relationships: [];
      };
      discharge_summaries: {
        Row: {
          case_id: string;
          created_at: string | null;
          id: string;
          summary: string | null;
          transcript: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          case_id: string;
          created_at?: string | null;
          id?: string;
          summary?: string | null;
          transcript?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          case_id?: string;
          created_at?: string | null;
          id?: string;
          summary?: string | null;
          transcript?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discharge_summaries_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          case_id: string | null;
          created_at: string;
          id: string;
          name: string;
          owner_email: string | null;
          owner_name: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          case_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          owner_email?: string | null;
          owner_name: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          case_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          owner_email?: string | null;
          owner_name?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      soap_notes: {
        Row: {
          assessment: string | null;
          case_id: string | null;
          client_instructions: string | null;
          created_at: string;
          id: string;
          objective: string | null;
          plan: string | null;
          subjective: string | null;
          transcript: string | null;
          updated_at: string | null;
        };
        Insert: {
          assessment?: string | null;
          case_id?: string | null;
          client_instructions?: string | null;
          created_at?: string;
          id?: string;
          objective?: string | null;
          plan?: string | null;
          subjective?: string | null;
          transcript?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assessment?: string | null;
          case_id?: string | null;
          client_instructions?: string | null;
          created_at?: string;
          id?: string;
          objective?: string | null;
          plan?: string | null;
          subjective?: string | null;
          transcript?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "soap_notes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      temp_soap_templates: {
        Row: {
          assessment_prompt: string | null;
          assessment_template: string | null;
          client_instructions_prompt: string | null;
          client_instructions_template: string | null;
          created_at: string | null;
          display_name: string;
          icon_name: string;
          id: string;
          is_default: boolean | null;
          objective_prompt: string | null;
          objective_template: string | null;
          person_name: string;
          plan_prompt: string | null;
          plan_template: string | null;
          subjective_prompt: string | null;
          subjective_template: string | null;
          system_prompt_addition: string | null;
          template_id: string;
          template_name: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assessment_prompt?: string | null;
          assessment_template?: string | null;
          client_instructions_prompt?: string | null;
          client_instructions_template?: string | null;
          created_at?: string | null;
          display_name: string;
          icon_name: string;
          id?: string;
          is_default?: boolean | null;
          objective_prompt?: string | null;
          objective_template?: string | null;
          person_name: string;
          plan_prompt?: string | null;
          plan_template?: string | null;
          subjective_prompt?: string | null;
          subjective_template?: string | null;
          system_prompt_addition?: string | null;
          template_id: string;
          template_name: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assessment_prompt?: string | null;
          assessment_template?: string | null;
          client_instructions_prompt?: string | null;
          client_instructions_template?: string | null;
          created_at?: string | null;
          display_name?: string;
          icon_name?: string;
          id?: string;
          is_default?: boolean | null;
          objective_prompt?: string | null;
          objective_template?: string | null;
          person_name?: string;
          plan_prompt?: string | null;
          plan_template?: string | null;
          subjective_prompt?: string | null;
          subjective_template?: string | null;
          system_prompt_addition?: string | null;
          template_id?: string;
          template_name?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          content: Json | null;
          created_at: string | null;
          description: string | null;
          id: string;
          key: string | null;
          metadata: Json | null;
          model: string | null;
          name: string | null;
          output_format: string | null;
          prompt: string | null;
          type: string | null;
          updated_at: string | null;
          validation_schema: Json | null;
        };
        Insert: {
          content?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string | null;
          metadata?: Json | null;
          model?: string | null;
          name?: string | null;
          output_format?: string | null;
          prompt?: string | null;
          type?: string | null;
          updated_at?: string | null;
          validation_schema?: Json | null;
        };
        Update: {
          content?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string | null;
          metadata?: Json | null;
          model?: string | null;
          name?: string | null;
          output_format?: string | null;
          prompt?: string | null;
          type?: string | null;
          updated_at?: string | null;
          validation_schema?: Json | null;
        };
        Relationships: [];
      };
      transcriptions: {
        Row: {
          audio_file_id: string | null;
          case_id: string | null;
          created_at: string;
          id: string;
          processing_status: string | null;
          speaker_segments: Json | null;
          transcript: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          audio_file_id?: string | null;
          case_id?: string | null;
          created_at?: string;
          id?: string;
          processing_status?: string | null;
          speaker_segments?: Json | null;
          transcript?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          audio_file_id?: string | null;
          case_id?: string | null;
          created_at?: string;
          id?: string;
          processing_status?: string | null;
          speaker_segments?: Json | null;
          transcript?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transcriptions_audio_file_id_fkey";
            columns: ["audio_file_id"];
            isOneToOne: false;
            referencedRelation: "audio_files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transcriptions_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transcriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          clinic_name: string | null;
          created_at: string;
          email: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          license_number: string | null;
          onboarding_completed: boolean | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          clinic_name?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          license_number?: string | null;
          onboarding_completed?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          clinic_name?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          license_number?: string | null;
          onboarding_completed?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      waitlist_signups: {
        Row: {
          campaign: string;
          confirmed_at: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          ip: unknown | null;
          metadata: Json;
          source: string | null;
          status: Database["public"]["Enums"]["waitlist_status"];
          user_agent: string | null;
        };
        Insert: {
          campaign?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id?: string;
          ip?: unknown | null;
          metadata?: Json;
          source?: string | null;
          status?: Database["public"]["Enums"]["waitlist_status"];
          user_agent?: string | null;
        };
        Update: {
          campaign?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          ip?: unknown | null;
          metadata?: Json;
          source?: string | null;
          status?: Database["public"]["Enums"]["waitlist_status"];
          user_agent?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      templates_enhanced: {
        Row: {
          category: string | null;
          content: Json | null;
          created_at: string | null;
          description: string | null;
          element_count: number | null;
          id: string | null;
          key: string | null;
          metadata: Json | null;
          model: string | null;
          name: string | null;
          output_format: string | null;
          prompt: string | null;
          section_count: number | null;
          tags: Json | null;
          type: string | null;
          updated_at: string | null;
          validation_schema: Json | null;
          version: string | null;
        };
        Insert: {
          category?: never;
          content?: Json | null;
          created_at?: string | null;
          description?: string | null;
          element_count?: never;
          id?: string | null;
          key?: string | null;
          metadata?: Json | null;
          model?: string | null;
          name?: string | null;
          output_format?: string | null;
          prompt?: string | null;
          section_count?: never;
          tags?: never;
          type?: string | null;
          updated_at?: string | null;
          validation_schema?: Json | null;
          version?: never;
        };
        Update: {
          category?: never;
          content?: Json | null;
          created_at?: string | null;
          description?: string | null;
          element_count?: never;
          id?: string | null;
          key?: string | null;
          metadata?: Json | null;
          model?: string | null;
          name?: string | null;
          output_format?: string | null;
          prompt?: string | null;
          section_count?: never;
          tags?: never;
          type?: string | null;
          updated_at?: string | null;
          validation_schema?: Json | null;
          version?: never;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_usage_limit: {
        Args: { resource: string; user_uuid: string };
        Returns: boolean;
      };
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown };
        Returns: string;
      };
      citext_hash: {
        Args: { "": string };
        Returns: number;
      };
      citextin: {
        Args: { "": unknown };
        Returns: string;
      };
      citextout: {
        Args: { "": string };
        Returns: unknown;
      };
      citextrecv: {
        Args: { "": unknown };
        Returns: string;
      };
      citextsend: {
        Args: { "": string };
        Returns: string;
      };
      get_current_usage: {
        Args: { user_uuid: string };
        Returns: {
          period_end: string;
          period_start: string;
          quantity: number;
          resource_type: string;
        }[];
      };
    };
    Enums: {
      CaseStatus: "reviewed" | "ongoing" | "completed" | "draft";
      CaseType: "checkup" | "emergency" | "surgery" | "follow_up";
      CaseVisibility: "public" | "private";
      contact_submission_status: "pending" | "reviewed" | "responded";
      user_role:
        | "veterinarian"
        | "vet_tech"
        | "admin"
        | "practice_owner"
        | "client";
      waitlist_status: "waiting" | "invited" | "joined" | "declined";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      CaseStatus: ["reviewed", "ongoing", "completed", "draft"],
      CaseType: ["checkup", "emergency", "surgery", "follow_up"],
      CaseVisibility: ["public", "private"],
      contact_submission_status: ["pending", "reviewed", "responded"],
      user_role: [
        "veterinarian",
        "vet_tech",
        "admin",
        "practice_owner",
        "client",
      ],
      waitlist_status: ["waiting", "invited", "joined", "declined"],
    },
  },
} as const;
