// src/modules/crm/hooks/useAutomationPolling.ts
// Sistema de polling interno que substitui cron jobs

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export function useAutomationPolling() {
  const { tenant } = useTenant();

  useEffect(() => {
    if (!tenant?.id) return;

    // Executar automation runner a cada 5 minutos
    const runAutomationRunner = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.functions.invoke('crm-automation-runner', {
          body: {},
        });

        if (error) {
          console.error('[Automation Polling] Erro ao executar automation runner:', error);
        } else {
          console.log('[Automation Polling] Automation runner executado');
        }
      } catch (error) {
        console.error('[Automation Polling] Erro ao executar automation runner:', error);
      }
    };

    // Executar reminder processor a cada hora
    const runReminderProcessor = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.functions.invoke('crm-reminder-processor', {
          body: {},
        });

        if (error) {
          console.error('[Automation Polling] Erro ao executar reminder processor:', error);
        } else {
          console.log('[Automation Polling] Reminder processor executado');
        }
      } catch (error) {
        console.error('[Automation Polling] Erro ao executar reminder processor:', error);
      }
    };

    // Executar imediatamente
    runAutomationRunner();
    runReminderProcessor();

    // Automation runner: a cada 5 minutos
    const automationInterval = setInterval(runAutomationRunner, 5 * 60 * 1000);

    // Reminder processor: a cada hora
    const reminderInterval = setInterval(runReminderProcessor, 60 * 60 * 1000);

    return () => {
      clearInterval(automationInterval);
      clearInterval(reminderInterval);
    };
  }, [tenant?.id]);
}
