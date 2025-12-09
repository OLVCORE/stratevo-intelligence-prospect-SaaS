// src/hooks/useTextLeadCapture.tsx
// Hook para captura de leads via texto (WhatsApp, Chat, etc)
// Sistema redundante: Backend + Frontend

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import {
  extractLeadDataLocally,
  mergeLeadData,
  hasNewData,
  hasEssentialData,
  type ExtractedLeadData,
} from '@/utils/localLeadExtractor';
// MC2: Novo extrator B2B (STRATEVO One)
import {
  extractLeadDataB2B,
  type LeadB2B,
  type TenantLeadContext,
} from '@/utils/stratevoLeadExtractor';
import {
  mergeLeadB2B,
  hasNewB2BData,
  hasEssentialB2BData,
} from '@/utils/leadMergeEngine';

interface UseTextLeadCaptureOptions {
  sessionId?: string;
  source?: string;
  onLeadSaved?: (leadId: string) => void;
}

/**
 * Hook para captura de leads via texto com sistema redundante
 */
export function useTextLeadCapture(options: UseTextLeadCaptureOptions = {}) {
  const { tenant } = useTenant();
  const [capturedData, setCapturedData] = useState<Partial<ExtractedLeadData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Refs para controle de debounce e anti-redundância
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<Partial<ExtractedLeadData> | null>(null);
  const retryCountRef = useRef<number>(0);

  /**
   * Processa mensagem de texto e extrai dados do lead
   * Sistema redundante: Backend (primário) + Frontend (backup)
   */
  const processMessage = useCallback(
    async (message: string, backendData?: Partial<ExtractedLeadData>) => {
      // 1. Extração LOCAL (backup - imediata) - LEGADO (eventos)
      const localData = extractLeadDataLocally(message);
      console.log('MC2[data]: Extração local legado concluída');

      // 1.1. Extração LOCAL B2B (backup - imediata) - MC2/MC3 (STRATEVO One)
      // MC3: Criar contexto do tenant para extração neutra
      const tenantLeadContext: TenantLeadContext | undefined = tenant
        ? {
            tenantId: tenant.id,
            tenantName: tenant.nome,
            // MC3: Por enquanto arrays vazios - será preenchido quando tenant tiver portfólio cadastrado
            // Futuramente pode vir de tenant.portfolio, tenant.products, etc.
            solutionKeywords: [], // TODO: Buscar do tenant quando disponível
            vendorKeywords: [], // TODO: Buscar do tenant quando disponível
            interestKeywords: [], // TODO: Buscar do tenant quando disponível
          }
        : undefined;

      const localDataB2B = extractLeadDataB2B(message, tenantLeadContext);
      console.log('MC2[data]: Extração local B2B concluída', {
        hasTenantContext: !!tenantLeadContext,
        tenantId: tenantLeadContext?.tenantId,
      });

      // 2. MERGE (backend primeiro, local como fallback) - LEGADO
      const merged = mergeLeadData(backendData || {}, localData);

      // 2.1. MERGE B2B (backend primeiro, local B2B como fallback) - MC2
      // Normalizar backendData para formato B2B se disponível
      const backendDataB2B: Partial<LeadB2B> = backendData
        ? {
            companyName: (backendData as any).companyName || (backendData as any).empresa || null,
            cnpj: (backendData as any).cnpj || null,
            contactName: backendData.name || null,
            contactEmail: backendData.email || null,
            contactPhone: backendData.phone || null,
            contactTitle: (backendData as any).title || (backendData as any).cargo || null,
            source: 'ai',
          }
        : {};

      const mergedB2B = mergeLeadB2B(backendDataB2B, localDataB2B);
      console.log('MC2[data]: Merge B2B concluído', {
        hasCompany: !!(mergedB2B.companyName || mergedB2B.cnpj),
        hasContact: !!(mergedB2B.contactName || mergedB2B.contactEmail),
      });

      // 3. UPDATE com validação e debounce - LEGADO (mantido para compatibilidade)
      updateLeadData(merged);

      // 3.1. Log resultado final B2B - MC2
      console.log('MC2[data]: Resultado final B2B', {
        company: mergedB2B.companyName || mergedB2B.cnpj || 'não identificado',
        contact: mergedB2B.contactName || mergedB2B.contactEmail || 'não identificado',
        hasEssential: hasEssentialB2BData(mergedB2B),
      });
    },
    []
  );

  /**
   * Atualiza dados do lead com validação e debounce
   */
  const updateLeadData = useCallback((newData: Partial<ExtractedLeadData>) => {
    setCapturedData((prev) => {
      const updated = { ...prev, ...newData };

      // VALIDAÇÃO + DEBOUNCE (salvamento progressivo)
      if (hasEssentialData(updated) && hasNewData(updated, lastSavedDataRef.current)) {
        // Limpar timeout anterior
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Agendar salvamento após 3 segundos
        saveTimeoutRef.current = setTimeout(() => {
          saveOrUpdateLead(updated);
        }, 3000);
      }

      return updated;
    });
  }, []);

  /**
   * Salva ou atualiza lead no CRM (com retry)
   */
  const saveOrUpdateLead = useCallback(
    async (data: Partial<ExtractedLeadData>, retries = 3) => {
      if (!tenant) {
        console.warn('[TextLeadCapture] Tenant não disponível');
        return;
      }

      setIsSaving(true);
      retryCountRef.current = retries;

      try {
        // Normalizar dados
        const leadData = {
          name: data.name?.trim() || '',
          email: data.email?.trim() || null,
          phone: data.phone?.trim() || null,
          event_type: data.eventType || null,
          event_date: data.eventDate || null,
          guest_count: data.guestCount || null,
          visit_date: data.visitDate || null,
          conversation_summary: data.conversationSummary || null,
          source: options.source || 'chat_texto',
          source_metadata: {
            session_id: options.sessionId,
            captured_via: 'text_chat',
            extraction_method: 'redundant_backend_frontend',
          },
          tenant_id: tenant.id,
        };

        // Buscar lead existente (por email ou telefone)
        let existingLeadId: string | null = null;

        if (leadData.email || leadData.phone) {
          const orConditions: string[] = [];
          if (leadData.email) {
            orConditions.push(`email.eq.${leadData.email}`);
          }
          if (leadData.phone) {
            orConditions.push(`phone.eq.${leadData.phone}`);
          }

          const { data: existing } = await supabase
            .from('leads_quarantine')
            .select('id')
            .eq('tenant_id', tenant.id)
            .or(orConditions.join(','))
            .maybeSingle();

          existingLeadId = existing?.id || null;
        }

        // INSERT ou UPDATE
        if (existingLeadId) {
          const { error } = await supabase
            .from('leads_quarantine')
            .update({
              ...leadData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLeadId);

          if (error) throw error;

          lastSavedDataRef.current = data;
          retryCountRef.current = 0;

          // Toast discreto (não interrompe conversa)
          toast.success('Lead atualizado', {
            duration: 2000,
          });

          if (options.onLeadSaved) {
            options.onLeadSaved(existingLeadId);
          }
        } else {
          const { data: newLead, error } = await supabase
            .from('leads_quarantine')
            .insert(leadData)
            .select('id')
            .single();

          if (error) throw error;

          lastSavedDataRef.current = data;
          retryCountRef.current = 0;

          // Toast discreto
          toast.success('Lead capturado', {
            duration: 2000,
          });

          if (options.onLeadSaved && newLead) {
            options.onLeadSaved(newLead.id);
          }
        }
      } catch (error: any) {
        console.error('[TextLeadCapture] Erro ao salvar lead:', error);

        // RETRY com backoff exponencial
        if (retries > 0) {
          const delay = 2000 * (4 - retries); // 2s, 4s, 6s
          setTimeout(() => {
            saveOrUpdateLead(data, retries - 1);
          }, delay);
        } else {
          // Falha final
          toast.error('Erro ao salvar lead', {
            description: error.message || 'Tente novamente',
            duration: 5000,
          });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [tenant, options]
  );

  /**
   * Limpa dados capturados
   */
  const clearData = useCallback(() => {
    setCapturedData({});
    lastSavedDataRef.current = null;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  return {
    capturedData,
    isSaving,
    processMessage,
    updateLeadData,
    saveOrUpdateLead,
    clearData,
  };
}


