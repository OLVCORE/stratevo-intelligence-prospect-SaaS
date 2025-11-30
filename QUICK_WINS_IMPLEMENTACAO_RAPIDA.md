# ⚡ QUICK WINS: Implementação Rápida (Hoje)

## 🎯 Objetivo
Melhorias que podem ser implementadas em **menos de 1 dia** com **alto impacto**.

---

## 1. 🔴 SENTRY ERROR TRACKING (2 horas)

### Por quê?
- Captura automática de erros em produção
- Stack traces completos
- Contexto do usuário
- Alertas em tempo real

### Implementação:

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1, // 10% das transações
  environment: import.meta.env.MODE,
  beforeSend(event, hint) {
    // Filtrar erros conhecidos
    if (event.exception) {
      const error = hint.originalException;
      if (error?.message?.includes('ResizeObserver')) {
        return null; // Ignorar erro conhecido
      }
    }
    return event;
  },
});
```

```typescript
// src/App.tsx
import * as Sentry from "@sentry/react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Wrappear app com Sentry ErrorBoundary
<Sentry.ErrorBoundary fallback={ErrorFallback}>
  <ErrorBoundary context="App">
    {/* ... */}
  </ErrorBoundary>
</Sentry.ErrorBoundary>
```

**Resultado:** Visibilidade completa de erros em produção.

---

## 2. 🎨 SKELETON LOADING CONSISTENTE (3 horas)

### Por quê?
- Melhora percepção de velocidade
- Reduz ansiedade do usuário
- Consistência visual

### Implementação:

```typescript
// src/components/ui/skeletons.tsx
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Aplicar em:**
- `CompaniesManagementPage.tsx` - Substituir `<Loader2 />` por `<TableSkeleton />`
- `UsageVerificationReport.tsx` - Adicionar `<CardSkeleton />` durante loading
- Listas de empresas - Usar `<ListSkeleton />`

**Resultado:** Loading states profissionais e consistentes.

---

## 3. ♿ ARIA LABELS BÁSICOS (2 horas)

### Por quê?
- Acessibilidade básica
- Melhor SEO
- Compliance WCAG

### Implementação:

```typescript
// Criar hook helper
export function useAriaLabel(action: string, context?: string) {
  return {
    'aria-label': context ? `${action} - ${context}` : action,
    'aria-describedby': context ? `${action}-description` : undefined,
  };
}

// Aplicar em componentes críticos
<Button
  {...useAriaLabel('Verificar uso de produtos', companyName)}
  aria-describedby="verification-help"
>
  Verificar
</Button>
<span id="verification-help" className="sr-only">
  Inicia verificação de produtos em uso pela empresa
</span>
```

**Componentes prioritários:**
- Botões de ação principais
- Inputs de formulário
- Links de navegação
- Ícones sem texto

**Resultado:** Acessibilidade básica implementada.

---

## 4. 🎓 TOUR GUIADO BÁSICO (4 horas)

### Por quê?
- Reduz curva de aprendizado
- Aumenta adoção de features
- Melhora primeira impressão

### Implementação:

```bash
npm install react-joyride
```

```typescript
// src/components/onboarding/ProductTour.tsx
import Joyride, { CallBackProps, STATUS } from 'react-joyride';

const TOUR_STEPS = [
  {
    target: '.verification-card',
    content: 'Aqui você verifica quais produtos a empresa investigada já utiliza.',
    placement: 'bottom',
  },
  {
    target: '.opportunities-tab',
    content: 'Veja oportunidades de cross-sell identificadas por IA baseadas no setor da empresa.',
    placement: 'top',
  },
  {
    target: '.decisores-tab',
    content: 'Encontre os decisores-chave da empresa para sua abordagem comercial.',
    placement: 'top',
  },
  {
    target: '.analysis-360-tab',
    content: 'Análise completa 360° com recomendações estratégicas personalizadas.',
    placement: 'top',
  },
];

export function ProductTour() {
  const [run, setRun] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Verificar se usuário já completou o tour
    const hasCompletedTour = localStorage.getItem(`tour-completed-${user?.id}`);
    if (!hasCompletedTour) {
      // Delay para garantir que DOM está pronto
      setTimeout(() => setRun(true), 1000);
    }
  }, [user]);
  
  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(`tour-completed-${user?.id}`, 'true');
      setRun(false);
    }
  };
  
  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleTourCallback}
      styles={{
        options: {
          primaryColor: 'var(--primary)',
        },
      }}
    />
  );
}
```

**Adicionar em `App.tsx`:**
```typescript
<ProductTour />
```

**Resultado:** Onboarding interativo para novos usuários.

---

## 5. 📊 POSTHOG ANALYTICS (2 horas)

### Por quê?
- Tracking de eventos de produto
- Funnels de conversão
- Feature usage
- Retenção

### Implementação:

```bash
npm install posthog-js
```

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    loaded: (posthog) => {
      if (import.meta.env.MODE === 'development') {
        posthog.debug(); // Debug mode em dev
      }
    },
  });
}

export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    posthog.capture(event, properties);
  },
  identify: (userId: string, traits?: Record<string, any>) => {
    posthog.identify(userId, traits);
  },
  reset: () => {
    posthog.reset();
  },
};
```

```typescript
// Hook para usar analytics
export function useAnalytics() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  useEffect(() => {
    if (user && tenant) {
      analytics.identify(user.id, {
        email: user.email,
        tenantId: tenant.id,
        tenantName: tenant.name,
      });
    }
  }, [user, tenant]);
  
  return analytics;
}
```

**Eventos críticos para trackear:**
- `verification_started`
- `verification_completed`
- `opportunity_viewed`
- `deal_created`
- `report_exported`

**Resultado:** Visibilidade completa de uso do produto.

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Hoje (8 horas):
- [ ] 1. Sentry Error Tracking (2h)
- [ ] 2. Skeleton Loading (3h)
- [ ] 3. ARIA Labels básicos (2h)
- [ ] 4. PostHog Analytics (1h)

### Esta Semana:
- [ ] 5. Tour Guiado (4h)
- [ ] 6. Virtual Scrolling em listas grandes (4h)
- [ ] 7. Empty States informativos (3h)

---

## 🎯 IMPACTO ESPERADO

### **Imediato:**
- 🔍 100% de visibilidade de erros
- 📊 Métricas de produto reais
- 🎨 UX mais polida

### **Curto Prazo (1 mês):**
- 📈 +30% adoção de features
- ⚡ -40% tempo de carregamento percebido
- 😊 +15 pontos NPS

---

**Prioridade:** 🔴 ALTA  
**Esforço:** ⚡ BAIXO  
**Impacto:** 🚀 ALTO

