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
      call_patients: {
        Row: {
          clinic_name: string | null;
          clinic_phone: string | null;
          created_at: string;
          discharge_summary: string | null;
          id: string;
          owner_name: string;
          owner_phone: string;
          pet_name: string;
          updated_at: string;
          user_id: string;
          vet_name: string | null;
        };
        Insert: {
          clinic_name?: string | null;
          clinic_phone?: string | null;
          created_at?: string;
          discharge_summary?: string | null;
          id?: string;
          owner_name: string;
          owner_phone: string;
          pet_name: string;
          updated_at?: string;
          user_id: string;
          vet_name?: string | null;
        };
        Update: {
          clinic_name?: string | null;
          clinic_phone?: string | null;
          created_at?: string;
          discharge_summary?: string | null;
          id?: string;
          owner_name?: string;
          owner_phone?: string;
          pet_name?: string;
          updated_at?: string;
          user_id?: string;
          vet_name?: string | null;
        };
        Relationships: [];
      };
      case_shares: {
        Row: {
          case_id: string;
          created_at: string | null;
          id: string;
          shared_by_user_id: string | null;
          shared_with_user_id: string;
          updated_at: string | null;
        };
        Insert: {
          case_id: string;
          created_at?: string | null;
          id?: string;
          shared_by_user_id?: string | null;
          shared_with_user_id: string;
          updated_at?: string | null;
        };
        Update: {
          case_id?: string;
          created_at?: string | null;
          id?: string;
          shared_by_user_id?: string | null;
          shared_with_user_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_shares_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      cases: {
        Row: {
          created_at: string | null;
          external_id: string | null;
          id: string;
          metadata: Json | null;
          scheduled_at: string | null;
          source: string | null;
          status: Database["public"]["Enums"]["CaseStatus"] | null;
          type: Database["public"]["Enums"]["CaseType"] | null;
          updated_at: string | null;
          user_id: string | null;
          visibility: Database["public"]["Enums"]["CaseVisibility"] | null;
        };
        Insert: {
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          scheduled_at?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["CaseStatus"] | null;
          type?: Database["public"]["Enums"]["CaseType"] | null;
          updated_at?: string | null;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["CaseVisibility"] | null;
        };
        Update: {
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          scheduled_at?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["CaseStatus"] | null;
          type?: Database["public"]["Enums"]["CaseType"] | null;
          updated_at?: string | null;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["CaseVisibility"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "cases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      discharge_summaries: {
        Row: {
          case_id: string;
          content: string;
          created_at: string;
          generation_id: string | null;
          id: string;
          soap_note_id: string | null;
          template_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          case_id: string;
          content: string;
          created_at?: string;
          generation_id?: string | null;
          id?: string;
          soap_note_id?: string | null;
          template_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          case_id?: string;
          content?: string;
          created_at?: string;
          generation_id?: string | null;
          id?: string;
          soap_note_id?: string | null;
          template_id?: string | null;
          updated_at?: string;
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
          {
            foreignKeyName: "discharge_summaries_generation_id_fkey";
            columns: ["generation_id"];
            isOneToOne: false;
            referencedRelation: "generations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discharge_summaries_soap_note_id_fkey";
            columns: ["soap_note_id"];
            isOneToOne: false;
            referencedRelation: "soap_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discharge_summaries_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "temp_discharge_summary_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discharge_summaries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      discharge_template_shares: {
        Row: {
          created_at: string | null;
          id: string;
          shared_by_user_id: string | null;
          shared_with_user_id: string;
          template_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          shared_by_user_id?: string | null;
          shared_with_user_id: string;
          template_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          shared_by_user_id?: string | null;
          shared_with_user_id?: string;
          template_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "discharge_template_shares_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "temp_discharge_summary_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      generations: {
        Row: {
          case_id: string | null;
          content: string | null;
          created_at: string;
          id: string;
          prompt: string | null;
          template_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          case_id?: string | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          prompt?: string | null;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          case_id?: string | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          prompt?: string | null;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generations_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generations_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generations_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates_enhanced";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          breed: string | null;
          case_id: string | null;
          created_at: string;
          date_of_birth: string | null;
          external_id: string | null;
          id: string;
          metadata: Json | null;
          name: string;
          owner_email: string | null;
          owner_name: string | null;
          owner_phone: string | null;
          sex: string | null;
          source: string | null;
          species: string | null;
          updated_at: string | null;
          user_id: string | null;
          weight_kg: number | null;
        };
        Insert: {
          breed?: string | null;
          case_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          owner_email?: string | null;
          owner_name?: string | null;
          owner_phone?: string | null;
          sex?: string | null;
          source?: string | null;
          species?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_kg?: number | null;
        };
        Update: {
          breed?: string | null;
          case_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          owner_email?: string | null;
          owner_name?: string | null;
          owner_phone?: string | null;
          sex?: string | null;
          source?: string | null;
          species?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patients_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      retell_calls: {
        Row: {
          agent_id: string;
          call_analysis: Json | null;
          call_variables: Json | null;
          created_at: string | null;
          created_by: string | null;
          disconnection_reason: string | null;
          duration_seconds: number | null;
          end_timestamp: string | null;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          patient_id: string | null;
          phone_number: string;
          phone_number_pretty: string | null;
          public_log_url: string | null;
          recording_url: string | null;
          retell_call_id: string;
          retell_response: Json | null;
          scheduled_for: string | null;
          start_timestamp: string | null;
          status: string;
          transcript: string | null;
          transcript_object: Json | null;
          updated_at: string | null;
        };
        Insert: {
          agent_id: string;
          call_analysis?: Json | null;
          call_variables?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          disconnection_reason?: string | null;
          duration_seconds?: number | null;
          end_timestamp?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          patient_id?: string | null;
          phone_number: string;
          phone_number_pretty?: string | null;
          public_log_url?: string | null;
          recording_url?: string | null;
          retell_call_id: string;
          retell_response?: Json | null;
          scheduled_for?: string | null;
          start_timestamp?: string | null;
          status?: string;
          transcript?: string | null;
          transcript_object?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string;
          call_analysis?: Json | null;
          call_variables?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          disconnection_reason?: string | null;
          duration_seconds?: number | null;
          end_timestamp?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          patient_id?: string | null;
          phone_number?: string;
          phone_number_pretty?: string | null;
          public_log_url?: string | null;
          recording_url?: string | null;
          retell_call_id?: string;
          retell_response?: Json | null;
          scheduled_for?: string | null;
          start_timestamp?: string | null;
          status?: string;
          transcript?: string | null;
          transcript_object?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_retell_calls_patient";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "call_patients";
            referencedColumns: ["id"];
          },
        ];
      };
      scheduled_discharge_calls: {
        Row: {
          assistant_id: string | null;
          call_analysis: Json | null;
          case_id: string | null;
          condition_category: string | null;
          cost: number | null;
          created_at: string;
          customer_phone: string | null;
          duration_seconds: number | null;
          dynamic_variables: Json;
          ended_at: string | null;
          ended_reason: string | null;
          id: string;
          knowledge_base_used: string | null;
          metadata: Json | null;
          phone_number_id: string | null;
          qstash_message_id: string | null;
          recording_url: string | null;
          scheduled_for: string | null;
          started_at: string | null;
          status: string | null;
          stereo_recording_url: string | null;
          structured_data: Json | null;
          success_evaluation: string | null;
          summary: string | null;
          transcript: string | null;
          transcript_messages: Json | null;
          updated_at: string;
          user_id: string;
          user_sentiment: string | null;
          vapi_call_id: string | null;
        };
        Insert: {
          assistant_id?: string | null;
          call_analysis?: Json | null;
          case_id?: string | null;
          condition_category?: string | null;
          cost?: number | null;
          created_at?: string;
          customer_phone?: string | null;
          duration_seconds?: number | null;
          dynamic_variables: Json;
          ended_at?: string | null;
          ended_reason?: string | null;
          id?: string;
          knowledge_base_used?: string | null;
          metadata?: Json | null;
          phone_number_id?: string | null;
          qstash_message_id?: string | null;
          recording_url?: string | null;
          scheduled_for?: string | null;
          started_at?: string | null;
          status?: string | null;
          stereo_recording_url?: string | null;
          structured_data?: Json | null;
          success_evaluation?: string | null;
          summary?: string | null;
          transcript?: string | null;
          transcript_messages?: Json | null;
          updated_at?: string;
          user_id: string;
          user_sentiment?: string | null;
          vapi_call_id?: string | null;
        };
        Update: {
          assistant_id?: string | null;
          call_analysis?: Json | null;
          case_id?: string | null;
          condition_category?: string | null;
          cost?: number | null;
          created_at?: string;
          customer_phone?: string | null;
          duration_seconds?: number | null;
          dynamic_variables?: Json;
          ended_at?: string | null;
          ended_reason?: string | null;
          id?: string;
          knowledge_base_used?: string | null;
          metadata?: Json | null;
          phone_number_id?: string | null;
          qstash_message_id?: string | null;
          recording_url?: string | null;
          scheduled_for?: string | null;
          started_at?: string | null;
          status?: string | null;
          stereo_recording_url?: string | null;
          structured_data?: Json | null;
          success_evaluation?: string | null;
          summary?: string | null;
          transcript?: string | null;
          transcript_messages?: Json | null;
          updated_at?: string;
          user_id?: string;
          user_sentiment?: string | null;
          vapi_call_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_discharge_calls_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      scheduled_discharge_emails: {
        Row: {
          case_id: string | null;
          created_at: string;
          html_content: string;
          id: string;
          metadata: Json | null;
          qstash_message_id: string | null;
          recipient_email: string;
          recipient_name: string | null;
          resend_email_id: string | null;
          scheduled_for: string;
          sent_at: string | null;
          status: string;
          subject: string;
          text_content: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          case_id?: string | null;
          created_at?: string;
          html_content: string;
          id?: string;
          metadata?: Json | null;
          qstash_message_id?: string | null;
          recipient_email: string;
          recipient_name?: string | null;
          resend_email_id?: string | null;
          scheduled_for: string;
          sent_at?: string | null;
          status?: string;
          subject: string;
          text_content?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          case_id?: string | null;
          created_at?: string;
          html_content?: string;
          id?: string;
          metadata?: Json | null;
          qstash_message_id?: string | null;
          recipient_email?: string;
          recipient_name?: string | null;
          resend_email_id?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          text_content?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_discharge_emails_case_id_fkey";
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
      soap_template_shares: {
        Row: {
          created_at: string | null;
          id: string;
          shared_by_user_id: string | null;
          shared_with_user_id: string;
          template_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          shared_by_user_id?: string | null;
          shared_with_user_id: string;
          template_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          shared_by_user_id?: string | null;
          shared_with_user_id?: string;
          template_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "soap_template_shares_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "temp_soap_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      temp_discharge_summary_templates: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_default: boolean | null;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_default?: boolean | null;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "temp_discharge_summary_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
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
        Relationships: [
          {
            foreignKeyName: "temp_soap_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          clinic_email: string | null;
          clinic_name: string | null;
          clinic_phone: string | null;
          created_at: string;
          default_discharge_template_id: string | null;
          default_schedule_delay_minutes: number | null;
          email: string | null;
          emergency_phone: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          license_number: string | null;
          onboarding_completed: boolean | null;
          pims_credentials: Json | null;
          pims_systems: Json | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          test_contact_email: string | null;
          test_contact_name: string | null;
          test_contact_phone: string | null;
          test_mode_enabled: boolean | null;
          updated_at: string;
          voicemail_detection_enabled: boolean | null;
        };
        Insert: {
          avatar_url?: string | null;
          clinic_email?: string | null;
          clinic_name?: string | null;
          clinic_phone?: string | null;
          created_at?: string;
          default_discharge_template_id?: string | null;
          default_schedule_delay_minutes?: number | null;
          email?: string | null;
          emergency_phone?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          license_number?: string | null;
          onboarding_completed?: boolean | null;
          pims_credentials?: Json | null;
          pims_systems?: Json | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          test_contact_email?: string | null;
          test_contact_name?: string | null;
          test_contact_phone?: string | null;
          test_mode_enabled?: boolean | null;
          updated_at?: string;
          voicemail_detection_enabled?: boolean | null;
        };
        Update: {
          avatar_url?: string | null;
          clinic_email?: string | null;
          clinic_name?: string | null;
          clinic_phone?: string | null;
          created_at?: string;
          default_discharge_template_id?: string | null;
          default_schedule_delay_minutes?: number | null;
          email?: string | null;
          emergency_phone?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          license_number?: string | null;
          onboarding_completed?: boolean | null;
          pims_credentials?: Json | null;
          pims_systems?: Json | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          test_contact_email?: string | null;
          test_contact_name?: string | null;
          test_contact_phone?: string | null;
          test_mode_enabled?: boolean | null;
          updated_at?: string;
          voicemail_detection_enabled?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_default_discharge_template_id_fkey";
            columns: ["default_discharge_template_id"];
            isOneToOne: false;
            referencedRelation: "temp_discharge_summary_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      vital_signs: {
        Row: {
          case_id: string | null;
          created_at: string | null;
          diastolic: number | null;
          extracted_from: string | null;
          id: string;
          measured_at: string | null;
          metadata: Json | null;
          notes: string | null;
          pulse: number | null;
          respiration: number | null;
          soap_note_id: string | null;
          source: string | null;
          systolic: number | null;
          temperature: number | null;
          temperature_unit: string | null;
          updated_at: string | null;
          user_id: string;
          weight: number | null;
          weight_unit: string | null;
        };
        Insert: {
          case_id?: string | null;
          created_at?: string | null;
          diastolic?: number | null;
          extracted_from?: string | null;
          id?: string;
          measured_at?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          pulse?: number | null;
          respiration?: number | null;
          soap_note_id?: string | null;
          source?: string | null;
          systolic?: number | null;
          temperature?: number | null;
          temperature_unit?: string | null;
          updated_at?: string | null;
          user_id: string;
          weight?: number | null;
          weight_unit?: string | null;
        };
        Update: {
          case_id?: string | null;
          created_at?: string | null;
          diastolic?: number | null;
          extracted_from?: string | null;
          id?: string;
          measured_at?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          pulse?: number | null;
          respiration?: number | null;
          soap_note_id?: string | null;
          source?: string | null;
          systolic?: number | null;
          temperature?: number | null;
          temperature_unit?: string | null;
          updated_at?: string | null;
          user_id?: string;
          weight?: number | null;
          weight_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vital_signs_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vital_signs_soap_note_id_fkey";
            columns: ["soap_note_id"];
            isOneToOne: false;
            referencedRelation: "soap_notes";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist_signups: {
        Row: {
          campaign: string;
          confirmed_at: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          ip: unknown;
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
          ip?: unknown;
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
          ip?: unknown;
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
      get_current_usage: {
        Args: { user_uuid: string };
        Returns: {
          period_end: string;
          period_start: string;
          quantity: number;
          resource_type: string;
        }[];
      };
      set_user_default_soap_template: {
        Args: { template_uuid: string; user_uuid: string };
        Returns: boolean;
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
