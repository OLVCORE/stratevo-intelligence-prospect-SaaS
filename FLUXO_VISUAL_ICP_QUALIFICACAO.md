# 🎯 FLUXO VISUAL: ICP & MOTOR DE QUALIFICAÇÃO

## 📊 **ARQUITETURA COMPLETA**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🏠 ONBOARDING                                │
│  Usuário completa 5 steps e define: Setor, Nicho, Porte,           │
│  Localização, Faturamento, Características Especiais                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    📋 ICP PROFILE (METADATA)                         │
│  ✅ icp_profiles_metadata                                            │
│     - nome, descricao, tipo                                          │
│     - setor_foco, nicho_foco                                         │
│     - setores_alvo, cnaes_alvo                                       │
│     - porte_alvo, estados_alvo, regioes_alvo                         │
│     - faturamento_min/max, funcionarios_min/max                      │
│     - caracteristicas_buscar                                         │
│     - icp_principal, ativo                                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ↓              ↓              ↓
    ┌───────────────────────────────────────────────────┐
    │   🖼️  VISUALIZAR ICP                              │
    │   /central-icp/view/:icpId                        │
    │                                                    │
    │   📊 Resumo Executivo:                            │
    │   - Setor e Nichos                                │
    │   - Localização                                   │
    │   - Porte e Faturamento                           │
    │   - Características Especiais                     │
    │                                                    │
    │   ⚙️  Como Funciona:                              │
    │   - 5 Dimensões de Pontuação                      │
    │   - Pesos de cada dimensão                        │
    │   - Tabela de classificação (A+ a D)              │
    └───────────────────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│              🚀 MOTOR DE QUALIFICAÇÃO (/search)                      │
│                                                                      │
│  1️⃣ UPLOAD CSV (1000 CNPJs)                                         │
│     - Arquivo CSV com coluna "CNPJ"                                 │
│     - Pode incluir outros campos (87 opcionais)                     │
│                                                                      │
│  2️⃣ SELECIONAR ICP(s)                                               │
│     ☑️ ICP Principal - Indústria                                    │
│     ☑️ ICP Secundário - Varejo                                      │
│     ☐ ICP Regional - Sul                                            │
│                                                                      │
│  3️⃣ ATIVAR QUALIFICAÇÃO AUTOMÁTICA                                  │
│     [✅] Qualificar automaticamente após enriquecimento             │
│                                                                      │
│  4️⃣ PROCESSAR                                                        │
│     → Edge Function: bulk-upload-companies                          │
│     → Cria job em: prospect_qualification_jobs                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│          ⚙️  PROCESSAMENTO (qualify-prospects-bulk)                 │
│                                                                      │
│  Para cada CNPJ:                                                    │
│                                                                      │
│  🔄 ENRIQUECIMENTO                                                   │
│     1. Receita Federal (BrasilAPI/ReceitaWS)                        │
│        - Razão Social, Nome Fantasia                                │
│        - CNAE, Setor, Porte                                         │
│        - Endereço, Cidade, Estado                                   │
│        - Capital Social, Situação                                   │
│        - Sócios, Contatos                                           │
│                                                                      │
│  🎯 CÁLCULO DE FIT SCORE (0-100%)                                   │
│                                                                      │
│     📊 1. Similaridade de Setor (30%)                               │
│        - Compara CNAE vs CNAEs Alvo                                 │
│        - Compara Setor vs Setores Alvo                              │
│                                                                      │
│     📍 2. Fit Geográfico (15%)                                      │
│        - Estado em Estados Alvo? → 100%                             │
│        - Região em Regiões Alvo? → 70%                              │
│        - Fora dos alvos? → 0%                                       │
│                                                                      │
│     📈 3. Fit de Porte (25%)                                        │
│        a) Faturamento (15%)                                         │
│           - Dentro da faixa? → 100%                                 │
│           - Próximo da faixa? → 50-70%                              │
│           - Fora da faixa? → 0%                                     │
│        b) Funcionários (10%)                                        │
│           - Mesma lógica                                            │
│                                                                      │
│     ✨ 4. Maturidade Digital (10%)                                  │
│        - Tem website? → +30                                         │
│        - Tem LinkedIn? → +30                                        │
│        - Tem redes sociais? → +40                                   │
│                                                                      │
│     🎯 5. Similaridade de Produtos (20%)                            │
│        - Compara produtos extraídos vs catálogo tenant              │
│        - Usa embeddings semânticos                                  │
│                                                                      │
│  🏆 CLASSIFICAÇÃO                                                    │
│     FIT Score ≥ 90%  → A+ (Aprovação automática)                    │
│     FIT Score 75-89% → A  (Aprovação automática)                    │
│     FIT Score 60-74% → B  (Revisão manual)                          │
│     FIT Score 40-59% → C  (Revisão manual)                          │
│     FIT Score < 40%  → D  (Descarte sugerido)                       │
│                                                                      │
│  💾 SALVAR                                                           │
│     → qualified_prospects                                           │
│        - Todos os dados enriquecidos                                │
│        - Scores detalhados (5 dimensões)                            │
│        - Grade final (A+ a D)                                       │
│        - fit_reasons (JSONB com justificativas)                     │
│        - pipeline_status = 'new'                                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│              📊 FUNIL DE CONVERSÃO (/dashboard)                      │
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │  IMPORTADAS │───→│ QUARENTENA  │───→│  APROVADAS  │            │
│  │     1000    │    │   ICP       │    │     400     │            │
│  │  Base: 100% │    │ Análise: 0% │    │ Conv: 40%   │            │
│  └─────────────┘    └─────────────┘    └─────────────┘            │
│                             │                   │                   │
│                             │                   ↓                   │
│                             │         ┌─────────────┐               │
│                             │         │  PIPELINE   │               │
│                             │         │   ATIVO     │               │
│                             │         │     200     │               │
│                             │         │ Taxa: 20%   │               │
│                             │         └─────────────┘               │
│                             │                                       │
│                             ↓                                       │
│                   ┌──────────────────┐                              │
│                   │   DESCARTADAS    │                              │
│                   │       600        │                              │
│                   └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **DECISÕES AUTOMÁTICAS**

### **Grade A+ (FIT ≥ 90%)**
```
Prospect CNPJ: 12.345.678/0001-90
Razão: INDÚSTRIA EXEMPLO LTDA
Setor: Manufatura ✅ (30/30 pontos)
Estado: SP ✅ (15/15 pontos)
Faturamento: R$ 25M ✅ (15/15 pontos)
Funcionários: 150 ✅ (10/10 pontos)
Digital: Website + LinkedIn ✅ (8/10 pontos)
Produtos: 85% similaridade ✅ (17/20 pontos)

FIT SCORE: 95/100 → A+
DECISÃO: ✅ APROVAÇÃO AUTOMÁTICA
DESTINO: → companies (Base Ativa)
```

### **Grade D (FIT < 40%)**
```
Prospect CNPJ: 98.765.432/0001-10
Razão: COMÉRCIO VAREJISTA MEI
Setor: Varejo ❌ (5/30 pontos)
Estado: RJ ❌ (0/15 pontos)
Faturamento: R$ 500K ❌ (0/15 pontos)
Funcionários: 3 ❌ (0/10 pontos)
Digital: Sem presença ❌ (0/10 pontos)
Produtos: 10% similaridade ❌ (2/20 pontos)

FIT SCORE: 7/100 → D
DECISÃO: ❌ DESCARTE SUGERIDO
DESTINO: → qualified_prospects (pipeline_status='discarded')
```

---

## 📊 **EXEMPLO REAL: 1000 CNPJs**

```
INPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSV com 1000 CNPJs
ICP Selecionado: "Indústria de Médio Porte - SP/MG"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROCESSAMENTO:
┌─────────────────────────────────────────────┐
│ ⚙️  Enriquecendo via Receita Federal...     │
│ ✅ 950 CNPJs válidos enriquecidos           │
│ ❌ 50 CNPJs inativos/cancelados             │
│                                             │
│ 🎯 Calculando FIT Score...                  │
│ ✅ 950 prospects pontuados                  │
│                                             │
│ 🏆 Classificando...                         │
│ A+: 80 prospects (8.4%)                     │
│ A:  120 prospects (12.6%)                   │
│ B:  250 prospects (26.3%)                   │
│ C:  350 prospects (36.8%)                   │
│ D:  150 prospects (15.8%)                   │
└─────────────────────────────────────────────┘

OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ APROVADOS AUTOMATICAMENTE (A+, A): 200
   → Movidos para: companies (Base Ativa)
   
🔍 REVISÃO MANUAL (B, C): 600
   → Enviados para: Quarentena ICP
   
❌ DESCARTE SUGERIDO (D): 150
   → Marcados como: discarded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESULTADO FINAL:
- Você economizou 80% do tempo (800 decisões automatizadas)
- Precisa revisar apenas 600 prospects (vs 1000)
- Taxa de aprovação projetada: 20-40% (200-400 no funil)
```

---

## 🎨 **INTERFACE VISUAL**

### **1. Página de Visualização do ICP**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar   🎯 ICP Principal - Indústria     [Principal] [Ativo]│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✨ Resumo do Perfil de Cliente Ideal                    │ │
│ │                                                         │ │
│ │ 🏢 SETOR E NICHOS                                       │ │
│ │ Setor Principal: Manufatura                            │ │
│ │ Nicho Foco: Indústria de Médio Porte                   │ │
│ │ Setores Alvo: [Manufatura] [Metalurgia] [Plásticos]   │ │
│ │                                                         │ │
│ │ 📍 LOCALIZAÇÃO                                          │ │
│ │ Estados: SP, MG, PR, SC, RS                            │ │
│ │ Regiões: Sudeste, Sul                                  │ │
│ │                                                         │ │
│ │ 📊 PORTE E FATURAMENTO                                  │ │
│ │ Porte: [Média Empresa]                                 │ │
│ │ Faturamento: R$ 10M - R$ 100M                          │ │
│ │ Funcionários: 50 - 500                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚙️  Como o Motor de Qualificação Funciona              │ │
│ │                                                         │ │
│ │ 🏢 1. Similaridade de Setor (30%)                       │ │
│ │    Compara o setor e CNAE da empresa...                │ │
│ │                                                         │ │
│ │ 📍 2. Fit Geográfico (15%)                              │ │
│ │    Verifica se a empresa está nos estados/regiões...   │ │
│ │                                                         │ │
│ │ [... demais dimensões ...]                             │ │
│ │                                                         │ │
│ │ 🏆 Classificação Final:                                 │ │
│ │ A+ (≥90%)  → Aprovação Automática ✅                    │ │
│ │ A  (75-89%) → Aprovação Automática ✅                   │ │
│ │ B  (60-74%) → Revisão Manual 🔍                         │ │
│ │ C  (40-59%) → Revisão Manual 🔍                         │ │
│ │ D  (<40%)   → Descarte Sugerido ❌                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **2. Funil de Conversão**
```
┌────────────────────────────────────────────────────────────┐
│ 🚀 Central de Comando                                      │
│                                                            │
│ 🔄 Funil de Conversão                    Conversão: 40%   │
│                                                            │
│ ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐            │
│ │  📊  │ ─→ │  🔶  │ ─→ │  🟢  │ ─→ │  🔵  │            │
│ │ 1000 │    │  600 │    │  400 │    │  200 │            │
│ │Import│    │Quaren│    │Aprov │    │Pipel │            │
│ │100%  │    │Taxa:0│    │Conv:4│    │Taxa:2│            │
│ └──────┘    └──────┘    └──────┘    └──────┘            │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ **CHECKLIST DE USO**

### **Para o Usuário:**

- [ ] 1. Completei o onboarding e criei meu ICP
- [ ] 2. Acessei `/central-icp/view/:icpId` e entendi meu ICP
- [ ] 3. Preparei CSV com CNPJs para qualificar
- [ ] 4. Fiz upload no Motor de Qualificação
- [ ] 5. Selecionei ICP(s) para pontuar
- [ ] 6. Ativei "Qualificação Automática"
- [ ] 7. Aguardei processamento
- [ ] 8. Revisei prospects em Quarentena (B e C)
- [ ] 9. Aprovei os que fazem sentido
- [ ] 10. Acompanhei funil na Central de Comando

**Pronto! Sistema funcionando! 🎉**

