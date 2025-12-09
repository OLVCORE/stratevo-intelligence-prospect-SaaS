// src/hooks/useVoiceLeadCapture.tsx
// Hook para captura de leads via voz (ElevenLabs + Backup)
// Sistema redundante: Agent Tool (primário) + Frontend (backup)

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

interface UseVoiceLeadCaptureOptions {
  sessionId?: string;
  source?: string;
  onLeadSaved?: (leadId: string) => void;
}

/**
 * Hook para captura de leads via voz com sistema redundante
 * Fluxo: Transcrição → Agent Tool (primário) + Extração Local (backup) → Merge → Save
 */
export function useVoiceLeadCapture(options: UseVoiceLeadCaptureOptions = {}) {
  const { tenant } = useTenant();
  const [capturedData, setCapturedData] = useState<Partial<ExtractedLeadData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Refs para controle de debounce e anti-redundância
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<Partial<ExtractedLeadData> | null>(null);
  const retryCountRef = useRef<number>(0);

  /**
   * Processa transcrição de voz
   * Sistema redundante: Agent Tool (primário) + Extração Local (backup)
   */
  const processTranscript = useCallback(
    async (transcript: string, agentEntities?: any) => {
      // 1. Extração BACKEND (agent tool - primário)
      // Normalizar entidades do agent para formato ExtractedLeadData
      const agentData: Partial<ExtractedLeadData> = agentEntities
        ? {
            name: agentEntities.nome || agentEntities.name || null,
            phone: agentEntities.telefone || agentEntities.phone || null,
            email: agentEntities.email || null,
            eventType: agentEntities.tipo_evento || agentEntities.event_type || null,
            eventDate: agentEntities.data_evento || agentEntities.event_date || null,
            guestCount: agentEntities.numero_convidados || agentEntities.guest_count || null,
            visitDate: agentEntities.data_visita || agentEntities.visit_date || null,
            conversationSummary: transcript,
          }
        : {};

      // 2. Extração LOCAL (backup - imediata) - LEGADO (eventos)
      const localData = extractLeadDataLocally(transcript);
      console.log('MC2[data]: Extração local legado concluída');

      // 2.1. Extração LOCAL B2B (backup - imediata) - MC2/MC3 (STRATEVO One)
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

      const localDataB2B = extractLeadDataB2B(transcript, tenantLeadContext);
      console.log('MC2[data]: Extração local B2B concluída', {
        hasTenantContext: !!tenantLeadContext,
        tenantId: tenantLeadContext?.tenantId,
      });

      // 3. MERGE (agent primeiro, local como fallback) - LEGADO
      const merged = mergeLeadData(agentData, localData);

      // 3.1. MERGE B2B (agent primeiro, local B2B como fallback) - MC2
      // Normalizar agentEntities para formato B2B se disponível
      const agentDataB2B: Partial<LeadB2B> = agentEntities
        ? {
            companyName: agentEntities.empresa || agentEntities.company_name || null,
            cnpj: agentEntities.cnpj || null,
            contactName: agentEntities.nome || agentEntities.name || null,
            contactEmail: agentEntities.email || null,
            contactPhone: agentEntities.telefone || agentEntities.phone || null,
            contactTitle: agentEntities.cargo || agentEntities.title || null,
            totvsProducts: agentEntities.produtos_totvs || agentEntities.totvs_products || [],
            olvSolutions: agentEntities.solucoes_olv || agentEntities.olv_solutions || [],
            source: 'ai',
          }
        : {};

      const mergedB2B = mergeLeadB2B(agentDataB2B, localDataB2B);
      console.log('MC2[data]: Merge B2B concluído', {
        hasCompany: !!(mergedB2B.companyName || mergedB2B.cnpj),
        hasContact: !!(mergedB2B.contactName || mergedB2B.contactEmail),
      });

      // 4. UPDATE com validação e debounce - LEGADO (mantido para compatibilidade)
      updateLeadData(merged);

      // 4.1. Log resultado final B2B - MC2
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
        console.warn('[VoiceLeadCapture] Tenant não disponível');
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
          source: options.source || 'chat_voz',
          source_metadata: {
            session_id: options.sessionId,
            captured_via: 'voice_chat',
            extraction_method: 'redundant_agent_frontend',
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
        console.error('[VoiceLeadCapture] Erro ao salvar lead:', error);

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
    processTranscript,
    updateLeadData,
    saveOrUpdateLead,
    clearData,
  };
}


