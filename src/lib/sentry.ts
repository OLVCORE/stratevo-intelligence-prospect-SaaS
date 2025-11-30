/**
 * Sentry Error Tracking Configuration
 * 
 * Captura erros automaticamente em produção com contexto completo
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0, // 10% em prod, 100% em dev
    // Session Replay
    replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Sempre gravar quando há erro
    
    environment: import.meta.env.MODE,
    enabled: import.meta.env.MODE === 'production',
    
    beforeSend(event, hint) {
      // Filtrar erros conhecidos que não são críticos
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignorar erros conhecidos do browser
        if (error instanceof Error) {
          // ResizeObserver loop limit exceeded (não crítico)
          if (error.message?.includes('ResizeObserver')) {
            return null;
          }
          
          // Network errors que são tratados pelo retry logic
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('NetworkError')) {
            return null;
          }
        }
      }
      
      return event;
    },
    
    // Adicionar contexto do usuário
    beforeBreadcrumb(breadcrumb) {
      // Filtrar breadcrumbs muito verbosos
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },
  });
  
  // Adicionar tags padrão
  Sentry.setTag("app", "stratevo-intelligence");
  Sentry.setTag("version", import.meta.env.VITE_APP_VERSION || "1.0.0");
}

export { Sentry };

