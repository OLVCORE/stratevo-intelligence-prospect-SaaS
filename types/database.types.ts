/**
 * Tipos TypeScript gerados do schema Supabase
 * Atualizar com: supabase gen types typescript --local > types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          cnpj: string | null;
          website: string | null;
          name: string;
          trading_name: string | null;
          status: string;
          enrichment_status: 'pending' | 'enriching' | 'completed' | 'failed';
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cnpj?: string | null;
          website?: string | null;
          name: string;
          trading_name?: string | null;
          status?: string;
          enrichment_status?: 'pending' | 'enriching' | 'completed' | 'failed';
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cnpj?: string | null;
          website?: string | null;
          name?: string;
          trading_name?: string | null;
          status?: string;
          enrichment_status?: 'pending' | 'enriching' | 'completed' | 'failed';
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      enrichment_logs: {
        Row: {
          id: string;
          company_id: string;
          source: string;
          raw_data: Json;
          processed_data: Json;
          status: 'success' | 'error';
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          source: string;
          raw_data: Json;
          processed_data?: Json;
          status?: 'success' | 'error';
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          source?: string;
          raw_data?: Json;
          processed_data?: Json;
          status?: 'success' | 'error';
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

