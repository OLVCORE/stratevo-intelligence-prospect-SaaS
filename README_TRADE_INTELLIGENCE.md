# 🌍 OLV TRADE INTELLIGENCE

**Multi-Tenant SaaS Platform for Export/Import Intelligence**

---

## 🎯 VISÃO GERAL

Plataforma SaaS que ajuda empresas a:
- 🇧🇷 **Prospectar** clientes no Brasil
- 🌍 **Exportar** (encontrar importadores no exterior)
- 🌎 **Importar** (encontrar fornecedores no exterior)

---

## 🏭 PRIMEIRO CLIENTE: MetaLife Pilates

**Empresa:** MetaLife Indústria e Comércio de Móveis S.A.  
**Líder da América Latina em Equipamentos de Pilates**

### Produtos:
- Reformer Infinity Series
- Reformer W23 Series
- Reformer Original
- Reformer Advanced
- 246+ produtos (acessórios, móveis)

### Mercados-Alvo:
- 🇺🇸 USA (Pilates Studios)
- 🇩🇪 Germany (Wellness Centers)
- 🇯🇵 Japan (Fitness Centers)
- 🇦🇺 Australia

### HS Codes:
- `9506.91.00` - Pilates Equipment
- `9506.99.00` - Fitness Accessories
- `9403.60.00` - Furniture

---

## 🏗️ ARQUITETURA

### Multi-Tenancy:
```
PLATFORM
  └─ TENANT (MetaLife)
       ├─ WORKSPACE: Domestic (Prospecção Brasil)
       ├─ WORKSPACE: Export (Encontrar importadores)
       └─ WORKSPACE: Import (Encontrar fornecedores)
```

### Database:
```
tenants (clientes da plataforma)
  └─ workspaces (operações)
       └─ companies (prospects)
            └─ decision_makers (decisores)
```

---

## ✨ FUNCIONALIDADES

### CORE (70% reaproveitado do TOTVS):
- ✅ Autenticação & Autorização
- ✅ Funil ICP (Quarentena → Aprovados → Pipeline)
- ✅ Enriquecimento (Receita Federal, Apollo, 360°)
- ✅ Decisores & Contatos (com Reveal System)
- ✅ Digital Intelligence
- ✅ Empresas Similares
- ✅ UI Components (Cards, Tables, Badges)

### NOVO (30% específico Trade):
- ✅ Multi-tenancy (múltiplos clientes independentes)
- ✅ Workspace Switcher (Domestic/Export/Import)
- ✅ Product Catalog Manager (importa do site)
- ✅ Importer Discovery (Trade Data + Apollo)
- ✅ Supplier Discovery (Alibaba, Global Sources)
- ✅ HS Code Matching
- ✅ Export Fit Scoring
- ✅ Incoterms Calculator
- ✅ Certification Checker
- ✅ AI-Generated Export Proposals

---

## 🚀 QUICK START

### 1. Clonar do projeto TOTVS:
```bash
cd C:\Projects\
xcopy /E /I olv-intelligence-prospect-v2 olv-trade-intelligence
cd olv-trade-intelligence
```

### 2. Configurar Supabase:
```bash
# Criar novo projeto em supabase.com
# Executar DATABASE_SETUP_TRADE_INTELLIGENCE.sql
```

### 3. Configurar ambiente:
```bash
# Copiar .env.local e atualizar:
# - VITE_SUPABASE_URL (novo projeto)
# - VITE_SUPABASE_ANON_KEY (novo projeto)
```

### 4. Inicializar com Cursor:
```bash
# Abrir INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md
# Copiar conteúdo completo
# Colar no Cursor Chat
# Aguardar execução automática
```

---

## 📊 WORKSPACE TYPES

### 1️⃣ DOMESTIC (Prospecção Brasil)
**Objetivo:** Vender produtos/serviços no mercado brasileiro

**Qualificação:**
- ✅ Empresa exportadora ativa = Lead quente
- ✅ Fit por setor/porte
- ✅ Decisores identificados

**Features:**
- Receita Federal enrichment
- Apollo decisores (Brasil)
- Product-market fit (produtos do tenant)

---

### 2️⃣ EXPORT (Vender para Fora)
**Objetivo:** Encontrar IMPORTADORES no exterior

**Qualificação:**
- 🔥 Já importa HS Code que você tem = HOT
- 🌡️ Importa HS similares = WARM
- ❄️ Mercado novo = COLD

**Features:**
- Trade Data (Import Genius, Panjiva)
- HS Code matching
- Importer discovery
- Export fit scoring
- Tariff calculator
- Incoterms pricing
- AI-generated proposals (multi-language)

**Exemplo:**
```
Importer: CoreBody Pilates Inc (USA)
HS Code: 9506.91.00
Annual Import: USD 2.3M
Suppliers: China (60%), Taiwan (25%), Brazil (15%)
Export Fit Score: 92/100 🔥
→ HOT LEAD para MetaLife!
```

---

### 3️⃣ IMPORT (Comprar de Fora)
**Objetivo:** Encontrar FORNECEDORES no exterior

**Qualificação:**
- 🔥 Já exporta para Brasil = HOT
- 🌡️ Exporta para LATAM = WARM
- ❄️ Novo exportador = COLD

**Features:**
- Supplier discovery (Alibaba, Global Sources)
- Verification system (ISO, CE, FDA)
- MOQ calculator
- Quality assurance
- Import fit scoring
- Logistics calculator

**Exemplo:**
```
Supplier: Shanghai Fitness Co. (China)
HS Code: 9506.91.00
Exports to: USA, EU, Japan
MOQ: 100 units
Certifications: ✅ ISO 9001, ✅ CE
→ HOT LEAD para MetaLife (matéria-prima)!
```

---

## 💰 MODELO DE NEGÓCIO

### Pricing (SaaS):
```
STARTER: R$ 997/mês
- 1 workspace
- 500 prospects/mês
- 100 créditos enrichment

PRO: R$ 2,997/mês
- 3 workspaces
- 2,000 prospects/mês
- 500 créditos enrichment
- Trade Data integration

ENTERPRISE: Custom
- Ilimitado
- White-label
- API access
```

---

## 🛠️ TECH STACK

### Frontend:
- React + TypeScript
- Tailwind CSS
- Shadcn/ui
- React Query
- Zustand (tenant state)

### Backend:
- Supabase (Database + Auth + Edge Functions)
- PostgreSQL (RLS para multi-tenancy)

### APIs:
- Apollo.io (Global B2B data)
- Import Genius (USA trade data)
- Panjiva (Global trade data)
- Lusha (Contact reveal)
- Hunter.io (Email finder)
- OpenAI (AI proposals, HS Code suggestions)

---

## 📋 ROADMAP

### ✅ FASE 1: MVP (Semanas 1-2)
- Multi-tenancy core
- Workspace switcher
- Product catalog (manual)
- Importer discovery (Apollo)

### ⏳ FASE 2: Trade Intelligence (Semanas 3-4)
- Import Genius integration
- HS Code matching
- Export fit scoring
- AI proposals

### ⏳ FASE 3: Import Sourcing (Semanas 5-6)
- Supplier discovery
- Verification system
- Logistics calculator

### ⏳ FASE 4: Scale (Semanas 7-8)
- White-label branding
- API pública
- Mobile app
- Integrações (Pipedrive, Bitrix)

---

## 👥 EQUIPE

**Desenvolvedor Principal:** Claude Sonnet 4.5 (Cursor AI)  
**Product Owner:** Marcos Oliveira (OLV Internacional)  
**Primeiro Cliente:** MetaLife Pilates

---

## 📞 CONTATO

**OLV Internacional**  
Email: marcos.oliveira@olvinternacional.com  
Website: https://olvinternacional.com

---

## 📄 LICENSE

Proprietary - © 2025 OLV Internacional. All rights reserved.

---

**🚀 Ready to transform international trade intelligence!**

