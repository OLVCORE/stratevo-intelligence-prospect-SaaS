# 🚀 OLV TRADE INTELLIGENCE - INICIALIZAÇÃO MULTI-TENANT

---

## 📋 CONTEXTO HISTÓRICO

Este projeto foi **CLONADO** de `olv-intelligence-prospect-v2` (plataforma TOTVS).

Vamos transformá-lo em um **SaaS Multi-Tenant** para **Export/Import Intelligence**.

---

## 🎯 OBJETIVO PRINCIPAL

Criar plataforma **OLV Trade Intelligence** com:
- ✅ Multi-tenancy (múltiplos clientes independentes)
- ✅ 3 Workspaces por tenant: Domestic, Export, Import
- ✅ Product Catalog dinâmico (importado do site do cliente)
- ✅ Importer/Supplier Discovery
- ✅ Trade Data Integration
- ✅ 70% código reaproveitado do TOTVS
- ✅ 30% novo (multi-tenant, export features)

---

## 🏭 PRIMEIRO TENANT: MetaLife Pilates

**Empresa:** MetaLife Indústria e Comércio de Móveis S.A.
**CNPJ:** 06.334.616/0001-85
**Website:** https://metalifepilates.com.br/
**Indústria:** Fabricante de Equipamentos de Pilates
**Posição:** Líder da América Latina em Pilates

**Produtos (246 itens):**
- Reformer Infinity Series
- Reformer W23 Series
- Reformer Original
- Reformer Advanced
- Acessórios (Toning Balls, Alças, Bolas)
- Móveis (Balcões, Aparadores)

**Mercados-Alvo (Export):**
- 🇺🇸 USA (Pilates Studios, Gyms)
- 🇩🇪 Germany (Wellness Centers)
- 🇯🇵 Japan (Fitness Centers)
- 🇦🇺 Australia (Pilates Studios)

**HS Codes Principais:**
- 9506.91.00 (Pilates Equipment)
- 9506.99.00 (Fitness Accessories)
- 9403.60.00 (Furniture)

---

## 🗂️ ESTRUTURA DE DATABASE

### TABELAS A CRIAR:

#### 1. `tenants` (Clientes da plataforma SaaS)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cnpj TEXT UNIQUE,
  website TEXT,
  industry TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0052CC',
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'pro', -- 'starter', 'pro', 'enterprise'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir MetaLife
INSERT INTO tenants (name, slug, cnpj, website, industry, primary_color) VALUES
('MetaLife Pilates', 'metalife', '06334616000185', 'https://metalifepilates.com.br/', 'Fitness Equipment Manufacturing', '#10B981');
```

#### 2. `workspaces` (Operações dentro de cada tenant)
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'domestic', 'export', 'import'
  description TEXT,
  target_countries TEXT[], -- Para export/import
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, type)
);

-- Inserir workspaces MetaLife
INSERT INTO workspaces (tenant_id, name, type, target_countries) VALUES
((SELECT id FROM tenants WHERE slug = 'metalife'), 'Prospecção Brasil', 'domestic', ARRAY['BR']),
((SELECT id FROM tenants WHERE slug = 'metalife'), 'Export Intelligence', 'export', ARRAY['US', 'DE', 'JP', 'AU']),
((SELECT id FROM tenants WHERE slug = 'metalife'), 'Import Sourcing', 'import', ARRAY['CN', 'TW', 'KR']);
```

#### 3. `tenant_products` (Catálogo de produtos do tenant)
```sql
CREATE TABLE tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT,
  hs_code TEXT, -- Código NCM/SH internacional
  price_brl DECIMAL,
  price_usd DECIMAL,
  price_eur DECIMAL,
  moq INTEGER, -- Minimum Order Quantity
  lead_time_days INTEGER,
  certifications TEXT[], -- ['ISO 9001', 'CE', 'FDA']
  target_segments TEXT[], -- ['Pilates Studios', 'Gyms', 'Wellness Centers']
  image_url TEXT,
  product_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. ADICIONAR `tenant_id` e `workspace_id` em TODAS as tabelas existentes:
```sql
-- Companies
ALTER TABLE companies ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE companies ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- ICP Analysis
ALTER TABLE icp_analysis_results ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE icp_analysis_results ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Leads Pool
ALTER TABLE leads_pool ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE leads_pool ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Decision Makers
ALTER TABLE decision_makers ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE decision_makers ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Users (já existe, só adicionar tenant_id)
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN default_workspace_id UUID REFERENCES workspaces(id);
```

#### 5. ROW LEVEL SECURITY (RLS):
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só vê dados do seu tenant
CREATE POLICY "tenant_isolation_companies" ON companies
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "tenant_isolation_icp" ON icp_analysis_results
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "tenant_isolation_leads" ON leads_pool
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "tenant_isolation_decisors" ON decision_makers
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);
```

---

## 🔧 MUDANÇAS NO CÓDIGO

### ARQUIVOS A MODIFICAR:

#### 1️⃣ **REMOVER COMPLETAMENTE (Hard-coded TOTVS):**
- ❌ `src/constants/totvsProducts.ts` (se existir)
- ❌ `src/constants/PRODUCT_SEGMENT_MATRIX.ts`
- ❌ Qualquer referência hard-coded a "TOTVS", "Protheus", "Fluig"

#### 2️⃣ **RENOMEAR:**
```
src/components/totvs/TOTVSCheckCard.tsx
  → src/components/analysis/ProductAnalysisCard.tsx

src/components/totvs/RecommendedProductsTab.tsx
  → src/components/analysis/RecommendedProductsTab.tsx

supabase/functions/simple-totvs-check/
  → supabase/functions/simple-product-check/

supabase/functions/detect-totvs-usage/
  → supabase/functions/detect-product-usage/
```

#### 3️⃣ **CRIAR NOVOS COMPONENTES:**

**`src/contexts/TenantContext.tsx`:**
```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  currentTenant: any;
  currentWorkspace: any;
  switchWorkspace: (workspaceId: string) => void;
  isLoading: boolean;
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenantData();
  }, []);

  async function loadTenantData() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Buscar tenant do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, default_workspace_id, tenants(*), workspaces(*)')
      .eq('id', user.user.id)
      .single();

    setCurrentTenant(userData?.tenants);
    setCurrentWorkspace(userData?.workspaces);
    setIsLoading(false);
  }

  async function switchWorkspace(workspaceId: string) {
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    setCurrentWorkspace(data);
    
    // Atualizar workspace padrão do usuário
    await supabase
      .from('users')
      .update({ default_workspace_id: workspaceId })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);
  }

  return (
    <TenantContext.Provider value={{ currentTenant, currentWorkspace, switchWorkspace, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
```

**`src/components/layout/WorkspaceSwitcher.tsx`:**
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/contexts/TenantContext';
import { Globe, Home, ShoppingCart } from 'lucide-react';

const WORKSPACE_ICONS = {
  domestic: Home,
  export: Globe,
  import: ShoppingCart
};

export function WorkspaceSwitcher() {
  const { currentTenant, currentWorkspace, switchWorkspace } = useTenant();
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    loadWorkspaces();
  }, [currentTenant]);

  async function loadWorkspaces() {
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .eq('is_active', true);
    
    setWorkspaces(data || []);
  }

  return (
    <Select value={currentWorkspace?.id} onValueChange={switchWorkspace}>
      <SelectTrigger className="w-[300px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((ws) => {
          const Icon = WORKSPACE_ICONS[ws.type];
          return (
            <SelectItem key={ws.id} value={ws.id}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{ws.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({ws.type})
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
```

**`src/components/admin/ProductCatalogManager.tsx`:**
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export function ProductCatalogManager() {
  const { currentTenant } = useTenant();
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  async function handleImportFromWebsite() {
    setIsImporting(true);
    
    try {
      // Chamar Edge Function que faz crawl do site
      const { data, error } = await supabase.functions.invoke('import-product-catalog', {
        body: {
          tenant_id: currentTenant.id,
          website_url: importUrl
        }
      });

      if (error) throw error;

      toast.success(`✅ ${data.products_count} produtos importados!`);
    } catch (err) {
      toast.error('Erro ao importar catálogo');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogo de Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input 
            placeholder="https://metalifepilates.com.br/"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
          />
          <Button onClick={handleImportFromWebsite} disabled={isImporting}>
            {isImporting ? 'Importando...' : 'Importar do Site'}
          </Button>
        </div>
        
        {/* Tabela de produtos aqui */}
      </CardContent>
    </Card>
  );
}
```

#### 4️⃣ **MODIFICAR HOOKS EXISTENTES:**

**`src/hooks/useCompanies.ts`:**
```typescript
// ANTES:
const { data, error } = await supabase
  .from('companies')
  .select('*');

// DEPOIS:
const { currentWorkspace } = useTenant();
const { data, error } = await supabase
  .from('companies')
  .select('*')
  .eq('workspace_id', currentWorkspace.id); // ✅ Filtro automático por workspace
```

#### 5️⃣ **SUBSTITUIR LÓGICA DE QUALIFICAÇÃO:**

**`src/services/icpScoring.ts`:**
```typescript
// REMOVER: Lógica "sem TOTVS = quente"
// ADICIONAR: Lógica por workspace type

export function calculateICPScore(company: any, workspaceType: string): number {
  switch (workspaceType) {
    case 'domestic':
      return calculateDomesticScore(company);
    case 'export':
      return calculateExportScore(company);
    case 'import':
      return calculateImportScore(company);
    default:
      return 0;
  }
}

function calculateExportScore(importer: any): number {
  let score = 0;
  
  // ✅ QUENTE: Já importa do Brasil
  if (importer.import_history?.countries?.includes('BR')) score += 50;
  
  // ✅ QUENTE: Importa HS Code que temos
  if (importsTargetHSCode(importer)) score += 40;
  
  // ✅ MORNO: Importa HS similares
  if (importsSimilarHSCode(importer)) score += 30;
  
  // ✅ Capacidade financeira
  if (importer.annual_revenue > 1000000) score += 20;
  
  return Math.min(score, 100);
}
```

---

## 🌍 FUNCIONALIDADES NOVAS (Export/Import)

### EDGE FUNCTION: `import-product-catalog`
```typescript
// Crawl do site do cliente e extrai produtos automaticamente
// Input: website URL
// Output: Array de produtos com IA identificando HS Codes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { tenant_id, website_url } = await req.json();
  
  // 1️⃣ Crawl do site
  const siteContent = await crawlWebsite(website_url);
  
  // 2️⃣ IA extrai produtos
  const products = await extractProductsWithAI(siteContent);
  
  // 3️⃣ IA sugere HS Codes
  const productsWithHS = await enrichWithHSCodes(products);
  
  // 4️⃣ Salvar no banco
  await supabase.from('tenant_products').insert(
    productsWithHS.map(p => ({
      tenant_id,
      name: p.name,
      description: p.description,
      hs_code: p.hs_code,
      price_brl: p.price,
      category: p.category
    }))
  );
  
  return { products_count: products.length };
});
```

### EDGE FUNCTION: `discover-importers`
```typescript
// Descobre importadores por HS Code usando Trade Data APIs
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { hs_code, country, min_volume } = await req.json();
  
  // 1️⃣ Buscar em Import Genius / Panjiva
  const importers = await tradeDataAPI.search({
    hs_code,
    import_country: country,
    min_annual_volume: min_volume
  });
  
  // 2️⃣ Enriquecer com Apollo (decisores)
  for (const importer of importers) {
    const apolloData = await enrichWithApollo(importer.name, country);
    importer.decision_makers = apolloData.people;
  }
  
  // 3️⃣ Calcular Export Fit Score
  for (const importer of importers) {
    importer.export_fit_score = calculateExportScore(importer);
  }
  
  return { importers };
});
```

---

## 🎨 UI CHANGES

### HEADER (Adicionar Workspace Switcher):
```typescript
// Em src/components/layout/Header.tsx ou AppLayout.tsx

import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';

// Adicionar no header, ao lado do logo:
<div className="flex items-center gap-4">
  <Logo />
  <WorkspaceSwitcher />
</div>
```

### SIDEBAR (Menus dinâmicos por workspace type):
```typescript
function Sidebar() {
  const { currentWorkspace } = useTenant();
  
  if (currentWorkspace.type === 'export') {
    return (
      <SidebarItems>
        <SidebarItem icon={Globe} href="/importers">Importadores</SidebarItem>
        <SidebarItem icon={Package} href="/catalog">Catálogo</SidebarItem>
        <SidebarItem icon={BarChart} href="/trade-data">Trade Data</SidebarItem>
        <SidebarItem icon={FileText} href="/proposals">Propostas</SidebarItem>
        <SidebarItem icon={DollarSign} href="/pipeline">Pipeline Export</SidebarItem>
      </SidebarItems>
    );
  }
  
  if (currentWorkspace.type === 'import') {
    return (
      <SidebarItems>
        <SidebarItem icon={Factory} href="/suppliers">Fornecedores</SidebarItem>
        <SidebarItem icon={Shield} href="/verification">Verificação</SidebarItem>
        <SidebarItem icon={Truck} href="/logistics">Logística</SidebarItem>
        <SidebarItem icon={DollarSign} href="/pipeline">Pipeline Import</SidebarItem>
      </SidebarItems>
    );
  }
  
  // Domestic (igual ao atual)
  return <SidebarItemsDefault />;
}
```

### PRODUCT ANALYSIS TAB (Substituir TOTVS Check):
```typescript
// Substituir aba 9 "TOTVS Check" por "Product-Market Fit"

function ProductMarketFitTab({ companyId, workspaceType }) {
  const { currentTenant } = useTenant();
  const { data: products } = useQuery(['tenant-products'], () =>
    supabase
      .from('tenant_products')
      .select('*')
      .eq('tenant_id', currentTenant.id)
  );

  if (workspaceType === 'export') {
    return <ExportFitAnalysis company={company} products={products} />;
  }
  
  if (workspaceType === 'import') {
    return <ImportFitAnalysis company={company} />;
  }
  
  // Domestic
  return <DomesticFitAnalysis company={company} products={products} />;
}
```

---

## 📋 CHECKLIST DE TAREFAS

### FASE 1: Database & Multi-Tenancy (Semana 1)
- [ ] Criar tabelas `tenants`, `workspaces`, `tenant_products`
- [ ] Adicionar `tenant_id` e `workspace_id` em todas as tabelas
- [ ] Implementar RLS policies
- [ ] Criar tenant MetaLife
- [ ] Criar 3 workspaces (Domestic, Export, Import)

### FASE 2: Core Multi-Tenant (Semana 1-2)
- [ ] Criar `TenantContext` e `TenantProvider`
- [ ] Criar `WorkspaceSwitcher` component
- [ ] Modificar todos os hooks para filtrar por `workspace_id`
- [ ] Adicionar workspace switcher no header
- [ ] Testar isolamento de dados (RLS)

### FASE 3: Product Catalog (Semana 2)
- [ ] Criar `ProductCatalogManager` component
- [ ] Criar Edge Function `import-product-catalog`
- [ ] Crawl de https://metalifepilates.com.br/
- [ ] IA para extrair produtos (OpenAI)
- [ ] IA para sugerir HS Codes
- [ ] Importar 246 produtos MetaLife

### FASE 4: Export Intelligence (Semana 3)
- [ ] Renomear `TOTVSCheckCard` → `ProductAnalysisCard`
- [ ] Criar `ExportFitAnalysis` component
- [ ] Criar Edge Function `discover-importers`
- [ ] Integração Import Genius/Panjiva (Trade Data)
- [ ] HS Code matching engine
- [ ] Export Fit Score algorithm

### FASE 5: Remover TOTVS Hard-coded (Semana 2)
- [ ] Deletar `PRODUCT_SEGMENT_MATRIX.ts`
- [ ] Substituir todas referências "TOTVS" por "Product"
- [ ] Remover lógica "sem TOTVS = quente"
- [ ] Implementar lógica dinâmica por workspace type
- [ ] Remover Edge Functions TOTVS-específicas

### FASE 6: UI Refinements (Semana 4)
- [ ] Sidebar dinâmica por workspace type
- [ ] Dashboard específico por workspace
- [ ] Branding por tenant (logo, cores)
- [ ] Onboarding de novo tenant
- [ ] Admin panel (gerenciar tenants)

---

## 🚀 INSTRUÇÕES PARA O CURSOR (NOVO PROJETO)

**Quando você clonar o projeto e abrir no Cursor:**

1. Abra este arquivo (`INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md`)
2. Diga ao Cursor:

> "Analise este arquivo INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md. 
> Este projeto foi clonado de olv-intelligence-prospect-v2 (plataforma TOTVS). 
> Precisamos transformá-lo em OLV Trade Intelligence (SaaS Multi-Tenant para Export/Import).
> 
> Execute TODAS as tarefas do CHECKLIST DE TAREFAS em ordem.
> Comece pela FASE 1 (Database & Multi-Tenancy).
> 
> Primeiro tenant: MetaLife Pilates
> CNPJ: 06.334.616/0001-85
> Website: https://metalifepilates.com.br/
> 
> Siga EXATAMENTE as especificações deste documento.
> Não pule nenhuma etapa.
> Quando terminar cada fase, me avise para eu revisar antes de continuar."

---

## 📦 DELIVERABLES (O que teremos no final)

### Projeto Novo Terá:
```
✅ Multi-tenancy completo
✅ Workspace switcher (Domestic/Export/Import)
✅ Product catalog dinâmico (importado do site)
✅ Importer discovery (Trade Data + Apollo)
✅ Export Fit Scoring
✅ Proposta automática
✅ HS Code matching
✅ RLS (isolamento total de dados)
✅ Onboarding de novos tenants (self-service)
✅ Branding por tenant
✅ Pricing SaaS (Starter/Pro/Enterprise)
```

---

## 🎯 DIFERENÇAS ENTRE PROJETOS

| Aspecto | TOTVS (Atual) | Trade (Novo) |
|---------|---------------|--------------|
| **Clientes** | 1 (TOTVS) | N (Multi-tenant) |
| **Produtos** | Hard-coded | Dinâmico (banco) |
| **Mercado** | Brasil | Brasil + Internacional |
| **Qualificação** | "Sem TOTVS = quente" | Por workspace type |
| **Database** | Single-tenant | Multi-tenant + RLS |
| **URL** | totvs.olv.com.br | trade.olv.com.br |
| **Pricing** | Contrato fixo | SaaS mensal |

---

## ✅ PRÓXIMOS PASSOS (VOCÊ FAZ AGORA):

```bash
# 1. Clonar projeto
cd C:\Projects\
cp -r olv-intelligence-prospect-v2 olv-trade-intelligence

# 2. Abrir no Cursor
code olv-trade-intelligence

# 3. Abrir este arquivo no Cursor:
# INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md

# 4. Colar este prompt no chat do Cursor:
"Analise o arquivo INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md 
e execute todas as tarefas do CHECKLIST."
```

---

## 🎉 RESULTADO FINAL

Você terá **2 PRODUTOS SEPARADOS:**

1. **OLV Intelligence (TOTVS)** ← Continua intacto, zero risco
2. **OLV Trade Intelligence** ← Novo SaaS, escalável, multi-tenant

**Quer que eu salve este arquivo agora?** 📄🚀
