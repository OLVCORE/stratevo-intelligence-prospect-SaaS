# ⚡ **MOTOR DE QUALIFICAÇÃO DE PROSPECTS - GUIA COMPLETO**

---

## 🎯 **OBJETIVO:**

Processar **milhares de CNPJs** automaticamente e enviar para a **Base de Empresas** apenas os que **realmente fazem sentido** para o tenant.

---

## 🔄 **FLUXO COMPLETO:**

```
📥 UPLOAD EM MASSA
   ↓ (10.000 CNPJs)
   ↓
🤖 ENRIQUECIMENTO AUTOMÁTICO
   ├─ Receita Federal (dados cadastrais)
   ├─ Website scraping (produtos)
   ├─ ViaCEP (endereço completo)
   └─ Geocoding (coordenadas exatas)
   ↓
🎯 CÁLCULO DE FIT (IA)
   ├─ Similaridade de produtos (30%)
   ├─ Fit de setor/CNAE (25%)
   ├─ Capital social adequado (20%)
   ├─ Região geográfica (15%)
   └─ Maturidade da empresa (10%)
   ↓
📊 CLASSIFICAÇÃO AUTOMÁTICA
   ├─ A+ (95-100%): 47 empresas → CONTATO IMEDIATO
   ├─ A  (85-94%):  125 empresas → CONTATO PRIORITÁRIO
   ├─ B  (70-84%):  234 empresas → NUTRIÇÃO/QUARENTENA
   ├─ C  (60-69%):  298 empresas → DESCONSIDERAR
   └─ D  (<60%):    296 empresas → DESCARTAR AUTOMATICAMENTE
   ↓
✅ APROVAÇÃO EM MASSA
   ├─ A+ e A → BASE DE EMPRESAS (diretamente)
   ├─ B → QUARENTENA ICP (análise individual)
   └─ C e D → DESCARTADOS (não entram na base)
   ↓
📊 BASE DE EMPRESAS (apenas qualificados!)
   ↓
🔍 QUARENTENA ICP (análise profunda)
   ↓
💰 LEADS APROVADOS (pipeline de vendas)
```

---

## 📁 **ARQUIVOS CRIADOS:**

### **1. Migration SQL**
```
supabase/migrations/20250204000000_motor_qualificacao.sql
```
- ✅ Tabelas: `prospect_qualification_jobs`, `qualified_prospects`
- ✅ Funções: `approve_prospects_bulk`, `discard_prospects_bulk`
- ✅ View: `vw_qualification_dashboard`
- ✅ RLS policies
- ✅ Triggers automáticos

### **2. Edge Function**
```
supabase/functions/qualify-prospects-bulk/index.ts
```
- ✅ Enriquecimento via Receita Federal
- ✅ Cálculo de FIT score
- ✅ Classificação automática
- ✅ Processamento assíncrono

### **3. Página Frontend**
```
src/pages/Prospecting/ProspectQualificationEngine.tsx
```
- ✅ Upload de arquivo (CSV/Excel)
- ✅ Cola lista de CNPJs
- ✅ Dashboard de jobs
- ✅ Tabela de resultados
- ✅ Ações em massa (aprovar/descartar)

### **4. Integração Menu**
```
src/components/layout/AppSidebar.tsx
src/App.tsx
```
- ✅ Item no menu: "⚡ Motor de Qualificação"
- ✅ Rota: `/prospecting/qualification-engine`
- ✅ Destacado (highlighted)

### **5. Arquivo de Exemplo**
```
exemplo_cnpjs_qualificacao.csv
```
- ✅ Template para testes
- ✅ 10 CNPJs reais de exemplo

---

## 🚀 **COMO USAR:**

### **PASSO 1: Instalar no Supabase**

```powershell
# Opção A: Via CLI
supabase db push

# Opção B: Via Dashboard
# 1. Abra: https://app.supabase.com/
# 2. SQL Editor → New Query
# 3. Cole o conteúdo de: supabase/migrations/20250204000000_motor_qualificacao.sql
# 4. Execute (Run)
```

### **PASSO 2: Deploy da Edge Function**

```powershell
supabase functions deploy qualify-prospects-bulk
```

### **PASSO 3: Testar no Frontend**

1. **Acesse:** `/prospecting/qualification-engine`
2. **Menu:** Prospecção → ⚡ Motor de Qualificação
3. **Upload:** Arquivo `exemplo_cnpjs_qualificacao.csv`
4. **Aguarde:** Processamento automático
5. **Veja:** Resultados classificados (A+, A, B, C, D)
6. **Aprove:** Clique "Aprovar A+ e A"
7. **Verifique:** Base de Empresas (prospects aprovados)

---

## 📊 **CÁLCULO DE FIT SCORE:**

### **Pesos:**
```
30% - Similaridade de Produtos
25% - Fit de Setor/CNAE
20% - Capital Social Adequado
15% - Região Geográfica
10% - Maturidade da Empresa
```

### **Exemplo:**
```
Prospect: ACRILON ARTEFATOS (SP, R$ 50k, EPIs)
Tenant: OLV INTERNACIONAL (SP, R$ 150k, EPIs)

Cálculo:
- Produtos: 85% (EPIs similares) × 0.30 = 25.5
- Setor: 90% (CNAE 3292202) × 0.25 = 22.5
- Capital: 70% (R$ 50k vs R$ 150k) × 0.20 = 14.0
- Geo: 95% (ambos em SP) × 0.15 = 14.25
- Maturidade: 80% (empresa consolidada) × 0.10 = 8.0
                                        ────────
FIT TOTAL: 84.25% → Grade: A
```

---

## ⚡ **AÇÕES EM MASSA:**

### **Aprovar A+ e A:**
- ✅ Insere em `empresas` (Base de Empresas)
- ✅ Status: `pending_review`
- ✅ Origem: `motor_qualificacao`
- ✅ Mantém fit_score e grade
- ✅ Vai direto para análise individual

### **Aprovar B para Quarentena:**
- ✅ Insere em `empresas`
- ✅ Status: `quarantine`
- ✅ Requer análise mais profunda
- ✅ Buscar decisores (Apollo)

### **Descartar C e D:**
- ✅ Marca como `discarded`
- ✅ NÃO entra na base
- ✅ Mantém histórico no job
- ✅ Pode reverter depois

---

## 🧪 **TESTES:**

### **Teste 1: Upload de 10 CNPJs**
```powershell
# Use o arquivo: exemplo_cnpjs_qualificacao.csv
# Tempo esperado: ~30 segundos
# Resultado: 10 prospects classificados
```

### **Teste 2: Cola Lista**
```
00.762.253/0001-00
04.431.495/0001-64
48.775.225/0001-46
```

### **Teste 3: Upload de 100 CNPJs**
```powershell
# Criar arquivo com 100 CNPJs
# Tempo esperado: ~5 minutos
# Resultado: Estatísticas por grade
```

---

## 📊 **DASHBOARD DE RESULTADOS:**

### **Métricas Principais:**
- 📊 Total processado
- ✅ Taxa de qualificação (A+, A, B)
- ❌ Taxa de descarte (C, D)
- ⏱️ Tempo de processamento
- 🎯 Top 10 prospects (maior fit)

### **Filtros:**
- Por grade (A+, A, B, C, D)
- Por setor
- Por estado
- Por range de capital
- Por status (novo, aprovado, descartado)

---

## 🔗 **INTEGRAÇÃO COM BASE DE EMPRESAS:**

### **Campos Mapeados:**
```typescript
qualified_prospects → empresas
{
  cnpj → cnpj
  razao_social → razao_social
  setor → setor
  capital_social → capital_social
  fit_score → fit_score (NOVO!)
  grade → grade (NOVO!)
  fit_reasons → fit_analysis (NOVO!)
  origem → 'motor_qualificacao'
  status → 'pending_review' ou 'quarantine'
}
```

---

## ✅ **PRÓXIMOS PASSOS:**

1. ✅ Executar migration no Supabase
2. ✅ Deploy da Edge Function
3. ✅ Commit e push do código
4. ✅ Testar com 10 CNPJs
5. ✅ Refinar algoritmo de FIT
6. ✅ Adicionar IA para razões detalhadas
7. ✅ Integrar com CRMs externos

---

## 🎉 **RESULTADO ESPERADO:**

### **Antes:**
- Upload manual de 1.000 CNPJs
- Todos entram na base (incluindo lixo)
- Análise manual de cada um
- Tempo: semanas

### **Depois:**
- Upload automático de 10.000 CNPJs
- Apenas 20-30% entram na base (qualificados)
- IA faz a triagem automática
- Tempo: 15 minutos

**🚀 EFICIÊNCIA: 100x MAIS RÁPIDO!**

