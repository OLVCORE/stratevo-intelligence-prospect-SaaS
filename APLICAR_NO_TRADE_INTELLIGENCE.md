# 🚀 BOAS PRÁTICAS STRATEVO → TRADE INTELLIGENCE

## 🎯 **APLICAR ESTAS CORREÇÕES NO PROJETO TRADE:**

---

## 1️⃣ **SAVEBAR - ALERTA AO SAIR SEM SALVAR**

### **Problema no Trade:**
- Usuário sai da página sem salvar
- Perde dados preenchidos
- Gasta créditos Apollo sem salvar resultado

### **Solução do STRATEVO:**

Implementar em **TODAS as páginas de edição**:

```typescript
// Hook: useUnsavedChanges.ts
import { useEffect, useState } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  // Block navigation if has unsaved changes
  const blocker = useBlocker(hasUnsavedChanges);
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  // Show modal when blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Deseja realmente sair?'
      );
      
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}
```

**Usar em cada página:**

```typescript
// Em DealerDiscoveryPage.tsx
const [dealers, setDealers] = useState([]);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Marcar como "unsaved" quando buscar dealers
const handleSearch = async () => {
  const results = await searchDealers(...);
  setDealers(results);
  setHasUnsavedChanges(true); // ← IMPORTANTE!
};

// Marcar como "saved" quando salvar
const handleSave = async () => {
  await saveToDatabase(dealers);
  setHasUnsavedChanges(false); // ← IMPORTANTE!
};

// Hook de proteção
useUnsavedChanges(hasUnsavedChanges);
```

---

## 2️⃣ **FLUXO CORRETO: Dealers → Companies → Quarentena**

### **Implementar no Trade:**

```typescript
// services/dealerToCompanyFlow.ts

export async function saveDealersToCompanies(dealers: Dealer[]) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // ETAPA 1: Salvar em COMPANIES
  const companiesToInsert = dealers.map(dealer => ({
    cnpj: null, // International companies não têm CNPJ
    razao_social: dealer.name,
    nome_fantasia: dealer.name,
    country: dealer.country,
    website: dealer.website,
    employees_count: dealer.employeeCount,
    industry: dealer.industry,
    description: dealer.description,
    source: 'dealer_discovery',
    raw_data: {
      apollo_id: dealer.apolloId,
      linkedin_url: dealer.linkedinUrl,
      revenue_range: dealer.revenueRange,
      b2b_type: dealer.b2bType, // distributor/wholesaler/importer
    },
    created_by: user?.id,
  }));
  
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .insert(companiesToInsert)
    .select('id, razao_social');
  
  if (companyError) throw companyError;
  
  // ETAPA 2: Enviar para QUARENTENA (ICP Analysis)
  const quarantineEntries = companies.map(company => ({
    company_id: company.id,
    cnpj: null,
    razao_social: company.razao_social,
    status: 'pendente',
    temperatura: 'warm', // Dealers já são qualificados
    icp_score: 60, // Score inicial para dealers internacionais
    source: 'dealer_discovery',
    raw_analysis: {
      auto_approved: false,
      needs_review: true,
      origin: 'international_dealer'
    }
  }));
  
  const { error: quarentenaError } = await supabase
    .from('icp_analysis_results')
    .insert(quarantineEntries);
  
  if (quarentenaError) throw quarentenaError;
  
  return {
    companiesCreated: companies.length,
    message: `${companies.length} dealers salvos em Companies e enviados para Quarentena`
  };
}
```

---

## 3️⃣ **APOLLO FILTERS - BUSCA ULTRA-REFINADA**

### **Código correto para DealerDiscoveryForm.tsx:**

```typescript
// Apollo search com filtros B2B rigorosos
const searchParams = {
  // INDUSTRIES (B2B apenas)
  organization_industry_tag_ids: [
    'Wholesale',
    'Import/Export',
    'International Trade & Development',
    'Sporting Goods',
    'Sporting and Athletic Goods Manufacturing',
    'Health, Wellness & Fitness' // apenas se + Wholesale
  ],
  
  // KEYWORDS (focar em FUNÇÃO, não produto)
  q_organization_keyword_tags: [
    'fitness equipment distributor',
    'sporting goods distributor',
    'fitness equipment importer',
    'gym equipment wholesaler',
    'wellness equipment distributor',
  ],
  
  // EXCLUDE KEYWORDS (eliminar B2C)
  q_organization_not_keyword_tags: [
    'pilates studio',
    'yoga studio',
    'fitness studio',
    'gym franchise',
    'instructor',
    'teacher',
    'blog',
    'magazine',
    'news',
    'certification',
    'course',
    'training center'
  ],
  
  // SIZE (B2B real)
  organization_num_employees_ranges: [
    '51,200',    // Small B2B
    '201,500',   // Medium B2B
    '501,1000',  // Large B2B
    '1001,5000'  // Enterprise
  ],
  
  // REVENUE (eliminar muito pequenos)
  revenue_range: [
    '5000000,10000000',   // $5M-$10M
    '10000000,50000000',  // $10M-$50M
    '50000000,100000000', // $50M-$100M
    '100000000+'          // $100M+
  ],
  
  // COUNTRIES (TIER 1 primeiro)
  organization_locations: [
    'United States',
    'United Kingdom',
    'Germany',
    'Canada',
    'Australia',
    'France',
    'Spain',
    'Italy',
    'Netherlands'
  ],
  
  // Paginação
  page: 1,
  per_page: 50,
};
```

---

## 4️⃣ **CARD SEMPRE VISÍVEL - Enriquecer em todas etapas**

### **Implementar DrawerPersistente:**

```typescript
// components/trade/PersistentDealerCard.tsx

export function PersistentDealerCard({ dealer, onSave }: Props) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  return (
    <div className={cn(
      "fixed right-4 top-20 z-50 w-96 transition-all",
      isMinimized && "w-16"
    )}>
      {!isMinimized ? (
        <Card>
          {/* Dados do dealer */}
          {/* Tabs para enriquecer */}
          <Tabs>
            <Tab value="basic">Dados Básicos</Tab>
            <Tab value="receita">Receita Federal</Tab>
            <Tab value="apollo">Apollo Enrich</Tab>
            <Tab value="decision-makers">Decisores</Tab>
          </Tabs>
          
          {/* Botão salvar sempre visível */}
          <Button onClick={onSave}>
            Salvar e Ir para Quarentena
          </Button>
        </Card>
      ) : (
        <Button onClick={() => setIsMinimized(false)}>
          📋 Ver Card
        </Button>
      )}
    </div>
  );
}
```

---

## 5️⃣ **PROTEÇÃO CONTRA PERDA DE CRÉDITOS**

### **Implementar em DealerDiscoveryForm:**

```typescript
const [searchResults, setSearchResults] = useState([]);
const [creditsCost, setCreditsCost] = useState(0);

const handleSearch = async () => {
  // ANTES de buscar, avisar custo
  const estimatedCost = calculateCost(filters);
  
  const confirmed = window.confirm(
    `Esta busca vai custar ~${estimatedCost} créditos Apollo. 
     Você tem ${remainingCredits} créditos restantes.
     Deseja continuar?`
  );
  
  if (!confirmed) return;
  
  // Buscar
  const results = await searchApollo(filters);
  setSearchResults(results);
  setCreditsCost(estimatedCost);
  
  // MARCAR como unsaved
  setHasUnsavedChanges(true);
  
  // AVISAR que precisa salvar
  toast({
    title: '⚠️ Resultado da busca carregado',
    description: `${results.length} dealers encontrados. SALVE antes de sair!`,
    duration: 10000,
  });
};

const handleSave = async () => {
  await saveDealersToCompanies(searchResults);
  setHasUnsavedChanges(false);
  
  toast({
    title: '✅ Dealers salvos!',
    description: `${searchResults.length} empresas salvas e enviadas para Quarentena`,
  });
};
```

---

## 6️⃣ **FORMATO CORRETO COMPANY TABLE (Internacional)**

### **Schema para empresas internacionais:**

```sql
-- Adicionar colunas para empresas internacionais
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS employees_count INTEGER,
  ADD COLUMN IF NOT EXISTS b2b_type TEXT, -- distributor/wholesaler/importer
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS hunter_domain_search JSONB;

-- CNPJ deve ser nullable (empresas internacionais não têm)
ALTER TABLE companies
  ALTER COLUMN cnpj DROP NOT NULL;
```

---

## 7️⃣ **CHECKPOINT SYSTEM (salvar progresso)**

### **Implementar auto-save a cada N resultados:**

```typescript
const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
const [savedCount, setSavedCount] = useState(0);

useEffect(() => {
  if (autoSaveEnabled && dealers.length > 0 && dealers.length % 10 === 0) {
    // Auto-save a cada 10 dealers
    handleAutoSave();
  }
}, [dealers.length]);

const handleAutoSave = async () => {
  const unsaved = dealers.slice(savedCount);
  if (unsaved.length === 0) return;
  
  await saveDealersToCompanies(unsaved);
  setSavedCount(dealers.length);
  
  toast({
    title: '💾 Auto-save',
    description: `${unsaved.length} dealers salvos automaticamente`,
    duration: 3000,
  });
};
```

---

## 📋 **RESUMO EXECUTIVO PARA TRADE:**

### **Aplicar estas 7 correções:**

1. ✅ Hook `useUnsavedChanges` em TODAS páginas de busca
2. ✅ Fluxo correto: Dealers → Companies → Quarentena
3. ✅ Filtros Apollo ultra-refinados (B2B only)
4. ✅ Card persistente para enriquecer
5. ✅ Proteção contra gasto de créditos
6. ✅ Schema companies para internacional
7. ✅ Auto-save a cada 10 resultados

---

## 🎯 **QUER QUE EU:**

**A)** Crie um arquivo `.md` completo para o Cursor do Trade aplicar  
**B)** Vá direto no projeto Trade e aplique as correções  
**C)** Primeiro termine Twilio aqui, depois vá para Trade  

**Me diga qual opção!** 🚀
