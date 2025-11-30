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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          subject: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          subject: string
          tenant_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          subject?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          actioned_at: string | null
          confidence: number | null
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_actioned: boolean | null
          is_read: boolean | null
          lead_id: string | null
          metadata: Json | null
          priority: string | null
          suggested_action: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actioned_at?: string | null
          confidence?: number | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          lead_id?: string | null
          metadata?: Json | null
          priority?: string | null
          suggested_action?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actioned_at?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          lead_id?: string | null
          metadata?: Json | null
          priority?: string | null
          suggested_action?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_lead_analysis: {
        Row: {
          analysis_data: Json | null
          churn_risk: string | null
          confidence_level: number | null
          created_at: string | null
          id: string
          lead_id: string | null
          predicted_close_date: string | null
          predicted_probability: number
          recommended_actions: Json | null
          score_version: string
          updated_at: string | null
        }
        Insert: {
          analysis_data?: Json | null
          churn_risk?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          predicted_close_date?: string | null
          predicted_probability: number
          recommended_actions?: Json | null
          score_version: string
          updated_at?: string | null
        }
        Update: {
          analysis_data?: Json | null
          churn_risk?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          predicted_close_date?: string | null
          predicted_probability?: number
          recommended_actions?: Json | null
          score_version?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lead_analysis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_predictions_history: {
        Row: {
          accuracy_score: number | null
          actual_value: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          model_version: string | null
          predicted_at: string
          predicted_value: string
          prediction_type: string
          resolved_at: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_value?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          model_version?: string | null
          predicted_at: string
          predicted_value: string
          prediction_type: string
          resolved_at?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          model_version?: string | null
          predicted_at?: string
          predicted_value?: string
          prediction_type?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string | null
          confirmed_by: string | null
          created_at: string
          duration_minutes: number | null
          email: string
          event_date: string | null
          event_type: string
          guest_count: number | null
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          phone: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: string | null
          confirmed_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          email: string
          event_date?: string | null
          event_type: string
          guest_count?: number | null
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          phone: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: string | null
          confirmed_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          email?: string
          event_date?: string | null
          event_type?: string
          guest_count?: number | null
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          phone?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_data: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_data?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_data?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automated_reminders: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          reminder_type: string
          trigger_days: number
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reminder_type: string
          trigger_days: number
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reminder_type?: string
          trigger_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          actions_executed: Json | null
          error_message: string | null
          executed_at: string | null
          id: string
          lead_id: string | null
          rule_id: string | null
          status: string | null
          trigger_data: Json | null
        }
        Insert: {
          actions_executed?: Json | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
        }
        Update: {
          actions_executed?: Json | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string | null
          trigger_condition: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id?: string | null
          trigger_condition: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string | null
          trigger_condition?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          settings: Json | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      call_history: {
        Row: {
          activity_id: string | null
          created_at: string | null
          created_by: string | null
          direction: string
          duration: number | null
          id: string
          lead_id: string | null
          notes: string | null
          recording_url: string | null
          status: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direction: string
          duration?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          recording_url?: string | null
          status?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string
          duration?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          recording_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_history_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcriptions: {
        Row: {
          action_items: Json | null
          ai_summary: string | null
          call_id: string | null
          confidence: number | null
          created_at: string | null
          duration_seconds: number | null
          entities: Json | null
          id: string
          key_phrases: Json | null
          keywords: Json | null
          language: string | null
          lead_id: string | null
          processed_at: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          transcription_text: string
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: string | null
          call_id?: string | null
          confidence?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          id?: string
          key_phrases?: Json | null
          keywords?: Json | null
          language?: string | null
          lead_id?: string | null
          processed_at?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          transcription_text: string
        }
        Update: {
          action_items?: Json | null
          ai_summary?: string | null
          call_id?: string | null
          confidence?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          id?: string
          key_phrases?: Json | null
          keywords?: Json | null
          language?: string | null
          lead_id?: string | null
          processed_at?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          transcription_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcriptions_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_transcriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          session_data: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          session_data?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          session_data?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_insights: {
        Row: {
          action_items: Json | null
          created_at: string | null
          description: string | null
          id: string
          insight_type: string
          is_read: boolean | null
          priority: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          insight_type: string
          is_read?: boolean | null
          priority?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          insight_type?: string
          is_read?: boolean | null
          priority?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      confirmed_events: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          checklist: Json | null
          contract_signed_at: string | null
          created_at: string | null
          deal_id: string | null
          event_date: string
          event_type: string
          guest_count: number | null
          id: string
          lead_id: string | null
          notes: string | null
          payment_status: string | null
          proposal_id: string | null
          status: string
          suppliers: Json | null
          tenant_id: string | null
          total_value: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          checklist?: Json | null
          contract_signed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          event_date: string
          event_type: string
          guest_count?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_status?: string | null
          proposal_id?: string | null
          status?: string
          suppliers?: Json | null
          tenant_id?: string | null
          total_value?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          checklist?: Json | null
          contract_signed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          event_date?: string
          event_type?: string
          guest_count?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_status?: string | null
          proposal_id?: string | null
          status?: string
          suppliers?: Json | null
          tenant_id?: string | null
          total_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmed_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmed_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmed_events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmed_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sentiment: {
        Row: {
          analyzed_at: string | null
          conversation_type: string
          created_at: string | null
          customer_satisfaction: number | null
          emotions: Json | null
          id: string
          lead_id: string | null
          reference_id: string | null
          sentiment_label: string
          sentiment_score: number
          urgency_level: string | null
        }
        Insert: {
          analyzed_at?: string | null
          conversation_type: string
          created_at?: string | null
          customer_satisfaction?: number | null
          emotions?: Json | null
          id?: string
          lead_id?: string | null
          reference_id?: string | null
          sentiment_label: string
          sentiment_score: number
          urgency_level?: string | null
        }
        Update: {
          analyzed_at?: string | null
          conversation_type?: string
          created_at?: string | null
          customer_satisfaction?: number | null
          emotions?: Json | null
          id?: string
          lead_id?: string | null
          reference_id?: string | null
          sentiment_label?: string
          sentiment_score?: number
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sentiment_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          created_at: string
          description: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          owner_id: string | null
          priority: string | null
          probability: number | null
          source: string | null
          stage: string
          tags: string[] | null
          tenant_id: string | null
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          actual_close_date?: string | null
          created_at?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          owner_id?: string | null
          priority?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          tags?: string[] | null
          tenant_id?: string | null
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          actual_close_date?: string | null
          created_at?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          owner_id?: string | null
          priority?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          tags?: string[] | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_history: {
        Row: {
          activity_id: string | null
          body: string
          clicked_at: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string
        }
        Insert: {
          activity_id?: string | null
          body: string
          clicked_at?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          activity_id?: string | null
          body?: string
          clicked_at?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_history_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          subject: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          subject: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_blocks: {
        Row: {
          block_type: string
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          is_full_day: boolean | null
          reason: string
          tenant_id: string | null
          time_slots_blocked: Json | null
          updated_at: string | null
        }
        Insert: {
          block_type: string
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          is_full_day?: boolean | null
          reason: string
          tenant_id?: string | null
          time_slots_blocked?: Json | null
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          is_full_day?: boolean | null
          reason?: string
          tenant_id?: string | null
          time_slots_blocked?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          event_id: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "confirmed_events"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification: {
        Row: {
          achievements: Json | null
          badges: Json | null
          created_at: string | null
          id: string
          last_activity_date: string | null
          level: number | null
          points: number | null
          streak_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievements?: Json | null
          badges?: Json | null
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          points?: number | null
          streak_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievements?: Json | null
          badges?: Json | null
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          points?: number | null
          streak_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          goal_type: string
          id: string
          metric: string
          period: string
          period_end: string
          period_start: string
          role_filter: string | null
          status: string | null
          target_value: number
          team_id: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          goal_type: string
          id?: string
          metric: string
          period: string
          period_end: string
          period_start: string
          role_filter?: string | null
          status?: string | null
          target_value: number
          team_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          goal_type?: string
          id?: string
          metric?: string
          period?: string
          period_end?: string
          period_start?: string
          role_filter?: string | null
          status?: string | null
          target_value?: number
          team_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_config: {
        Row: {
          config_data: Json
          created_at: string
          id: string
          integration_name: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          config_data?: Json
          created_at?: string
          id?: string
          integration_name: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          config_data?: Json
          created_at?: string
          id?: string
          integration_name?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          lead_id: string
          name: string
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          lead_id: string
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          lead_id?: string
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_distribution_config: {
        Row: {
          created_at: string | null
          distribution_method: string | null
          eligible_roles: string[] | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distribution_method?: string | null
          eligible_roles?: string[] | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distribution_method?: string | null
          eligible_roles?: string[] | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_duplicates: {
        Row: {
          created_at: string | null
          duplicate_lead_id: string
          id: string
          lead_id: string
          match_fields: string[]
          resolved_at: string | null
          resolved_by: string | null
          similarity_score: number
          status: string
        }
        Insert: {
          created_at?: string | null
          duplicate_lead_id: string
          id?: string
          lead_id: string
          match_fields?: string[]
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number
          status?: string
        }
        Update: {
          created_at?: string | null
          duplicate_lead_id?: string
          id?: string
          lead_id?: string
          match_fields?: string[]
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_duplicates_duplicate_lead_id_fkey"
            columns: ["duplicate_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_duplicates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_files: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          lead_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          field_name: string | null
          id: string
          lead_id: string
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          field_name?: string | null
          id?: string
          lead_id: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          field_name?: string | null
          id?: string
          lead_id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget: number | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          custom_fields: Json | null
          decision_maker: boolean | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          event_date: string | null
          event_type: string
          files_count: number | null
          id: string
          last_contact_date: string | null
          lead_score: number | null
          message: string | null
          name: string
          next_followup_date: string | null
          notes_count: number | null
          phone: string
          position: string | null
          priority: string | null
          source: string | null
          state: string | null
          status: string
          tags: string[] | null
          tasks_count: number | null
          tenant_id: string | null
          timeline: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget?: number | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          decision_maker?: boolean | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          event_date?: string | null
          event_type: string
          files_count?: number | null
          id?: string
          last_contact_date?: string | null
          lead_score?: number | null
          message?: string | null
          name: string
          next_followup_date?: string | null
          notes_count?: number | null
          phone: string
          position?: string | null
          priority?: string | null
          source?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          tasks_count?: number | null
          tenant_id?: string | null
          timeline?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget?: number | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          decision_maker?: boolean | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          event_date?: string | null
          event_type?: string
          files_count?: number | null
          id?: string
          last_contact_date?: string | null
          lead_score?: number | null
          message?: string | null
          name?: string
          next_followup_date?: string | null
          notes_count?: number | null
          phone?: string
          position?: string | null
          priority?: string | null
          source?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          tasks_count?: number | null
          tenant_id?: string | null
          timeline?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_subscriptions: {
        Row: {
          amount: number
          cancel_at: string | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          interval: string
          lead_id: string | null
          metadata: Json | null
          plan_name: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval: string
          lead_id?: string | null
          metadata?: Json | null
          plan_name: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string
          lead_id?: string | null
          metadata?: Json | null
          plan_name?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_subscriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          error_message: string | null
          event_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          paid_at: string | null
          payment_method: string
          pix_code: string | null
          pix_expires_at: string | null
          pix_qr_code: string | null
          proposal_id: string | null
          refunded_at: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          paid_at?: string | null
          payment_method: string
          pix_code?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          proposal_id?: string | null
          refunded_at?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string
          pix_code?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          proposal_id?: string | null
          refunded_at?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "confirmed_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      point_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          points_earned: number
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_earned: number
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id?: string | null
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          proposal_id: string | null
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          proposal_id?: string | null
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          proposal_id?: string | null
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_templates: {
        Row: {
          blocks: Json
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      proposal_versions: {
        Row: {
          change_description: string | null
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          proposal_id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          data: Json
          id?: string
          proposal_id: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          proposal_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          appointment_id: string | null
          blocks: Json | null
          catering_price: number | null
          created_at: string
          deal_id: string | null
          decoration_price: number | null
          discount_percentage: number | null
          event_date: string | null
          event_type: string
          extra_services: Json | null
          final_price: number
          guest_count: number | null
          id: string
          lead_id: string | null
          notes: string | null
          pdf_url: string | null
          proposal_number: string
          sent_at: string | null
          signature_data: Json | null
          signed_at: string | null
          status: string
          tenant_id: string | null
          terms_and_conditions: string | null
          total_price: number
          updated_at: string
          valid_until: string
          venue_price: number
        }
        Insert: {
          appointment_id?: string | null
          blocks?: Json | null
          catering_price?: number | null
          created_at?: string
          deal_id?: string | null
          decoration_price?: number | null
          discount_percentage?: number | null
          event_date?: string | null
          event_type: string
          extra_services?: Json | null
          final_price: number
          guest_count?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pdf_url?: string | null
          proposal_number: string
          sent_at?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          status?: string
          tenant_id?: string | null
          terms_and_conditions?: string | null
          total_price: number
          updated_at?: string
          valid_until: string
          venue_price: number
        }
        Update: {
          appointment_id?: string | null
          blocks?: Json | null
          catering_price?: number | null
          created_at?: string
          deal_id?: string | null
          decoration_price?: number | null
          discount_percentage?: number | null
          event_date?: string | null
          event_type?: string
          extra_services?: Json | null
          final_price?: number
          guest_count?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pdf_url?: string | null
          proposal_number?: string
          sent_at?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          status?: string
          tenant_id?: string | null
          terms_and_conditions?: string | null
          total_price?: number
          updated_at?: string
          valid_until?: string
          venue_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          timestamp?: string
        }
        Relationships: []
      }
      synced_calendar_events: {
        Row: {
          appointment_id: string | null
          attendees: Json | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string
          external_event_id: string
          id: string
          integration_id: string | null
          last_synced_at: string | null
          location: string | null
          start_time: string
          sync_status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          attendees?: Json | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type: string
          external_event_id: string
          id?: string
          integration_id?: string | null
          last_synced_at?: string | null
          location?: string | null
          start_time: string
          sync_status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          attendees?: Json | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          external_event_id?: string
          id?: string
          integration_id?: string | null
          last_synced_at?: string | null
          location?: string | null
          start_time?: string
          sync_status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "synced_calendar_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_calendar_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "calendar_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          business_model: string
          created_at: string | null
          crm_config: Json | null
          id: string
          is_active: boolean | null
          name: string
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          business_model?: string
          created_at?: string | null
          crm_config?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          business_model?: string
          created_at?: string | null
          crm_config?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          subdomain?: string
          updated_at?: string | null
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
      webhook_logs: {
        Row: {
          attempt: number | null
          error_message: string | null
          event: string
          http_status: number | null
          id: string
          sent_at: string
          status: string
          webhook_id: string | null
        }
        Insert: {
          attempt?: number | null
          error_message?: string | null
          event: string
          http_status?: number | null
          id?: string
          sent_at?: string
          status: string
          webhook_id?: string | null
        }
        Update: {
          attempt?: number | null
          error_message?: string | null
          event?: string
          http_status?: number | null
          id?: string
          sent_at?: string
          status?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean | null
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events: string[]
          id?: string
          is_active?: boolean | null
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean | null
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          activity_id: string | null
          direction: string
          id: string
          lead_id: string | null
          message: string
          read_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
        }
        Insert: {
          activity_id?: string | null
          direction: string
          id?: string
          lead_id?: string | null
          message: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          activity_id?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          message?: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_points: {
        Args: {
          p_activity_type: string
          p_description?: string
          p_points: number
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_goal_progress: { Args: { goal_id: string }; Returns: number }
      clean_old_rate_limit_logs: { Args: never; Returns: undefined }
      detect_lead_duplicates: {
        Args: { p_lead_id: string }
        Returns: {
          duplicate_id: string
          match_fields: string[]
          similarity_score: number
        }[]
      }
      generate_proposal_number: { Args: never; Returns: string }
      get_current_tenant_id: { Args: never; Returns: string }
      get_next_sales_rep: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      get_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          roles: string[]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["tenant_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      merge_leads: {
        Args: {
          p_merged_by: string
          p_source_lead_id: string
          p_target_lead_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "sales"
        | "viewer"
        | "direcao"
        | "gerencia"
        | "gestor"
        | "sdr"
        | "vendedor"
      tenant_role: "owner" | "admin" | "manager" | "sales" | "viewer"
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
      app_role: [
        "admin",
        "sales",
        "viewer",
        "direcao",
        "gerencia",
        "gestor",
        "sdr",
        "vendedor",
      ],
      tenant_role: ["owner", "admin", "manager", "sales", "viewer"],
    },
  },
} as const
