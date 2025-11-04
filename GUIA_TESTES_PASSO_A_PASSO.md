# 🧪 GUIA DE TESTES - PASSO A PASSO

**Data:** 2025-11-04  
**Status:** ✅ PRONTO PARA TESTES  
**Objetivo:** Validar 9 abas do Relatório TOTVS + Consumo de créditos  

---

## ✅ **O QUE ESTÁ 100% ATIVADO:**

```
╔════════════════════════════════════════════════════════════╗
║         FUNCIONALIDADES PRONTAS PARA TESTE                 ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📊 RELATÓRIO TOTVS (9 ABAS):                              ║
║  ✅ Aba 1: Executive Summary                               ║
║  ✅ Aba 2: TOTVS Verification (Serper)                     ║
║  ✅ Aba 3: Competitors (Serper + Validação rigorosa)       ║
║  ✅ Aba 4: Similar Companies (Serper + SEO)                ║
║  ✅ Aba 5: Client Discovery (Jina AI + Serper)             ║
║  ✅ Aba 6: Analysis 360° (Cálculo local)                   ║
║  ✅ Aba 7: Products (OpenAI GPT-4o-mini)                   ║
║  ✅ Aba 8: Keywords & SEO (Jina AI + Serper)               ║
║  ✅ Aba 9: Decisores (PhantomBuster + Hunter.io)           ║
║                                                            ║
║  🔧 EDGE FUNCTIONS DEPLOYADAS (10+):                       ║
║  ✅ simple-totvs-check (Abas 1-2)                          ║
║  ✅ search-competitors (Aba 3)                             ║
║  ✅ web-search + seo-competitors (Aba 4)                   ║
║  ✅ client-discovery-wave7 (Aba 5)                         ║
║  ✅ generate-product-gaps (Aba 7)                          ║
║  ✅ serper-search (Aba 8)                                  ║
║  ✅ hunter-email-* (Aba 9)                                 ║
║  ✅ phantom-linkedin-* (Aba 9)                             ║
║                                                            ║
║  🔑 SECRETS CONFIGURADOS:                                  ║
║  ✅ OPENAI_API_KEY (crítico - Aba 7)                       ║
║  ✅ SERPER_API_KEY (crítico - Abas 2-8)                    ║
║  ✅ JINA_API_KEY (Abas 5, 8)                               ║
║  ✅ HUNTER_API_KEY (Aba 9)                                 ║
║  ✅ PHANTOMBUSTER_API_KEY (Aba 9)                          ║
║  ✅ Todos com e sem VITE_                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🧪 **ROTEIRO DE TESTES (45-60 MINUTOS):**

### **PREPARAÇÃO:**
1. ✅ Escolher empresa teste: **CNS Calçados** (ou outra)
2. ✅ Acessar: Dashboard → Empresas → Selecionar empresa
3. ✅ Abrir Relatório TOTVS
4. ✅ Ter aberto: Painel Serper (para contar créditos)

---

## 📋 **TESTE 1: ABA 1 - EXECUTIVE SUMMARY**

### **✅ O QUE ESTÁ ATIVO:**
- Resumo executivo automático
- Score geral (0-100)
- Quick stats (Cliente TOTVS?, Concorrentes, etc.)

### **🧪 COMO TESTAR:**
1. Abrir Aba 1: "Executive Summary"
2. Clicar em "Verificar" (se tiver botão)
3. Aguardar 10-30s

### **✅ RESULTADO ESPERADO:**
```
Score Geral: 75/100
Status: GO (Não é cliente TOTVS)
Concorrentes: 3 detectados (SAP, Oracle, Microsoft)
Empresas Similares: 15 encontradas
Produtos Recomendados: 5
```

### **💰 CONSUMO:**
- Serper: ~5 créditos
- OpenAI: ~$0.002

---

## 📋 **TESTE 2: ABA 2 - TOTVS VERIFICATION**

### **✅ O QUE ESTÁ ATIVO:**
- Busca evidências TOTVS (Serper)
- Detecção de produtos TOTVS (Protheus, RM, etc.)
- Cache 24h (não reconsome)

### **🧪 COMO TESTAR:**
1. Abrir Aba 2: "TOTVS"
2. Ver evidências listadas
3. Conferir status (Cliente/Não Cliente)

### **✅ RESULTADO ESPERADO:**
```
Status: GO (Não é cliente TOTVS)
Evidências: 0-5 encontradas
Quintuple Match: 0
Triple Match: 0-2
Double Match: 0-3
```

### **💰 CONSUMO:**
- Serper: ~0 créditos (usa cache da Aba 1)

---

## 📋 **TESTE 3: ABA 3 - COMPETITORS**

### **✅ O QUE ESTÁ ATIVO:**
- Busca concorrentes (Serper)
- Validação ULTRA-RIGOROSA (Triple/Double Match)
- Cache 24h
- Logs detalhados de validação

### **🧪 COMO TESTAR:**
1. Abrir Aba 3: "Competitors"
2. Clicar em "Atualizar" (ou aguardar carregar)
3. Ver lista de concorrentes
4. Conferir console (validação detalhada)

### **✅ RESULTADO ESPERADO:**
```
Concorrentes detectados: 3-8
- SAP (Confiança: 95% - Triple Match)
- Oracle (Confiança: 75% - Double Match)
- Microsoft (Confiança: 75%)

Console logs:
[VALIDAÇÃO] ✅ TRIPLE MATCH (SAP)
[VALIDAÇÃO] ✅ DOUBLE MATCH (Oracle)
```

### **💰 CONSUMO:**
- Serper: ~6-8 créditos (otimizado)
- Era: 200+ créditos (antes da otimização)

---

## 📋 **TESTE 4: ABA 4 - SIMILAR COMPANIES**

### **✅ O QUE ESTÁ ATIVO:**
- Busca empresas similares (Serper)
- Análise SEO (keywords compartilhadas)
- Overlap score (0-100%)

### **🧪 COMO TESTAR:**
1. Abrir Aba 4: "Similar Companies"
2. Ver lista de empresas
3. Conferir overlap score

### **✅ RESULTADO ESPERADO:**
```
Empresas Similares: 10-20
#1 Empresa XYZ (Overlap: 87%)
#2 ABC Ltda (Overlap: 76%)
...

Keywords compartilhadas exibidas
```

### **💰 CONSUMO:**
- Serper: ~3-5 créditos

---

## 📋 **TESTE 5: ABA 5 - CLIENT DISCOVERY**

### **✅ O QUE ESTÁ ATIVO:**
- Jina AI (scraping /clientes)
- Serper (press releases)
- Descoberta de clientes

### **🧪 COMO TESTAR:**
1. Abrir Aba 5: "Client Discovery"
2. Clicar em "Executar Wave7" (se tiver)
3. Aguardar 30-60s

### **✅ RESULTADO ESPERADO:**
```
Clientes descobertos: 10-20
- Cliente A (via scraping)
- Cliente B (via press release)
...

Estatísticas exibidas
```

### **💰 CONSUMO:**
- Jina AI: 1-2 requests
- Serper: ~3-4 créditos

---

## 📋 **TESTE 6: ABA 6 - ANALYSIS 360°**

### **✅ O QUE ESTÁ ATIVO:**
- Cálculos locais (sem API)
- SWOT automático
- Porter's Five Forces
- Insights estratégicos

### **🧪 COMO TESTAR:**
1. Abrir Aba 6: "Analysis 360°"
2. Ver análises geradas
3. Conferir scores

### **✅ RESULTADO ESPERADO:**
```
SWOT Analysis: ✅
Porter's Five Forces: ✅
Digital Presence Score: 75/100
Digital Maturity: 68/100
```

### **💰 CONSUMO:**
- 0 créditos (cálculo local)

---

## 📋 **TESTE 7: ABA 7 - PRODUCTS** ⚠️ CRÍTICO

### **✅ O QUE ESTÁ ATIVO:**
- OpenAI GPT-4o-mini (IA REAL)
- Recomendações personalizadas
- Stack TOTVS sugerido

### **🧪 COMO TESTAR:**
1. Abrir Aba 7: "Products"
2. Ver produtos recomendados
3. ⚠️ **IMPORTANTE:** Conferir se NÃO tem `Math.random()` nos valores!

### **✅ RESULTADO ESPERADO:**
```
Produtos Recomendados: 3-5
#1 TOTVS Protheus
   Fit Score: 92/100 (IA calculou - não random!)
   Reason: "Empresa porte médio + setor industrial"
   Value: R$ 300K-500K ARR

Stack TOTVS:
- Core: Protheus, Fluig
- Complementar: CRM, BI
```

### **💰 CONSUMO:**
- OpenAI GPT-4o-mini: ~$0.0015 USD

### **🚨 VALIDAÇÃO CRÍTICA:**
```
❌ SE VER: fit_score: 87 (sempre igual) → AINDA TEM MOCK!
✅ SE VER: fit_score: 92 (varia por empresa) → IA FUNCIONANDO!
```

---

## 📋 **TESTE 8: ABA 8 - KEYWORDS & SEO** ⚠️ NOVO

### **✅ O QUE ESTÁ ATIVO:**
- Jina AI (extração de keywords)
- Serper (empresas similares)
- Overlap score
- Inteligência Competitiva Dupla

### **🧪 COMO TESTAR:**
1. Abrir Aba 8: "Keywords & SEO"
2. Clicar em "Análise SEO Completa"
3. Aguardar 20-40s

### **✅ RESULTADO ESPERADO:**
```
Keywords Extraídas: 50
Empresas Similares: 10-15

INTELIGÊNCIA COMPETITIVA DUPLA:
💰 Oportunidades Venda TOTVS: 8 empresas
🤝 Oportunidades Parceria: 5 empresas
Revenue Estimado: R$ 2.000-4.000K ARR

#1 Empresa XYZ (Overlap: 87%)
   Tecnologias: [SAP] [Oracle]
   Oportunidade: VENDA TOTVS (migração)
   💰 R$ 300K ARR
```

### **💰 CONSUMO:**
- Jina AI: 1 request (~$0.02)
- Serper: ~2-3 créditos

---

## 📋 **TESTE 9: ABA 9 - DECISORES** ⚠️ NOVO

### **✅ O QUE ESTÁ ATIVO:**
- PhantomBuster (LinkedIn scraping)
- Hunter.io (email verification)
- Análise completa

### **🧪 COMO TESTAR:**
1. Abrir Aba 9: "Decisores & Contatos"
2. Clicar em "Extrair Decisores"
3. Aguardar 30-60s

### **✅ RESULTADO ESPERADO:**
```
Decisores Identificados: 5
Emails Verificados: 4/5 (80%)

#1 João Silva (CEO)
   Email: joao.silva@empresa.com.br
   ✅ Verificado (95% confiança)
   Fonte: PhantomBuster + Hunter.io

#2 Maria Santos (CFO)
   Email: maria.santos@empresa.com.br
   ✅ Corrigido por Hunter (90%)
```

### **💰 CONSUMO:**
- PhantomBuster: 1 execução
- Hunter.io: 5 verificações + 2 buscas (~7 requests)

---

## 💰 **CONSUMO TOTAL ESPERADO:**

```
╔════════════════════════════════════════════════════════════╗
║         META: <15 CRÉDITOS POR EMPRESA                     ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Aba 1: Executive        ~5 créditos Serper                ║
║  Aba 2: TOTVS            ~0 (cache)                        ║
║  Aba 3: Competitors      ~6-8 créditos Serper              ║
║  Aba 4: Similar          ~3-5 créditos Serper              ║
║  Aba 5: Client Discovery ~3-4 créditos Serper + 1 Jina     ║
║  Aba 6: Analysis 360°    ~0 (local)                        ║
║  Aba 7: Products         ~$0.0015 OpenAI                   ║
║  Aba 8: Keywords SEO     ~2-3 créditos Serper + 1 Jina     ║
║  Aba 9: Decisores        ~1 Phantom + 7 Hunter             ║
║                                                            ║
║  TOTAL SERPER: ~19-25 créditos                             ║
║  TOTAL JINA: 2 requests                                    ║
║  TOTAL OPENAI: $0.0015                                     ║
║  TOTAL PHANTOM: 1 execução                                 ║
║  TOTAL HUNTER: 7 requests                                  ║
║                                                            ║
║  ⚠️ ACIMA DA META (25 vs. 15)                              ║
║  💡 MAS: Cache 24h reduz para 0 no 2º uso!                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎯 **ROTEIRO DE TESTE (PASSO A PASSO):**

### **TESTE RÁPIDO (15 minutos):**
```
1. ✅ Abrir empresa (CNS Calçados)
2. ✅ Abrir Relatório TOTVS
3. ✅ Clicar em "Atualizar Análise" (Aba 2)
4. ✅ Aguardar 30s
5. ✅ Navegar pelas 9 abas
6. ✅ Conferir se dados aparecem
7. ✅ Ver console (erros?)
8. ✅ Conferir Serper Dashboard (créditos consumidos)
```

### **TESTE COMPLETO (45 minutos):**
```
1. ✅ Aba 1: Ver Executive Summary
2. ✅ Aba 2: Ver evidências TOTVS
3. ✅ Aba 3: Clicar "Atualizar Concorrentes"
   → Aguardar 20s
   → Conferir validação rigorosa
4. ✅ Aba 4: Ver empresas similares
5. ✅ Aba 5: Clicar "Executar Wave7"
   → Aguardar 30-60s
   → Ver clientes descobertos
6. ✅ Aba 6: Ver análise 360°
7. ✅ Aba 7: Ver produtos recomendados
   → ⚠️ VALIDAR: Não tem Math.random()!
8. ✅ Aba 8: Clicar "Análise SEO Completa"
   → Aguardar 30s
   → Ver keywords + empresas similares
   → Ver Inteligência Dupla (Venda vs. Parceria)
9. ✅ Aba 9: Clicar "Extrair Decisores"
   → Aguardar 30-60s
   → Ver decisores + emails verificados
```

---

## ✅ **CHECKLIST DE VALIDAÇÃO:**

### **Para cada aba, conferir:**
- [ ] Aba carrega sem erro
- [ ] Dados aparecem (não N/A)
- [ ] Números fazem sentido
- [ ] Não tem `Math.random()` visível
- [ ] Console sem erros críticos
- [ ] Loading states funcionam
- [ ] Botões respondem

---

## 🚨 **POSSÍVEIS PROBLEMAS E SOLUÇÕES:**

### **1. Aba 7 (Products) retorna valores aleatórios:**
```
❌ PROBLEMA: OpenAI não está sendo chamado
✅ SOLUÇÃO: Verificar OPENAI_API_KEY no Supabase
```

### **2. Aba 8 (Keywords) não carrega:**
```
❌ PROBLEMA: Jina AI ou Serper erro
✅ SOLUÇÃO: Verificar JINA_API_KEY e SERPER_API_KEY
```

### **3. Aba 9 (Decisores) retorna vazio:**
```
❌ PROBLEMA: PhantomBuster ou Hunter.io não configurados
✅ SOLUÇÃO: Verificar todos os 6 secrets relacionados
```

### **4. Consumo >25 créditos:**
```
⚠️ PROBLEMA: Cache não está funcionando
✅ SOLUÇÃO: Verificar se force_refresh=true está desativado
```

---

## 📊 **ONDE CONFERIR CONSUMO:**

### **Serper (créditos):**
```
Dashboard: https://serper.dev/dashboard
Ver: Credits used today
```

### **OpenAI (custo):**
```
Dashboard: https://platform.openai.com/usage
Ver: API usage (último dia)
```

### **Jina AI (requests):**
```
Dashboard: https://jina.ai/account
Ver: Usage (requests/mês)
```

### **PhantomBuster (execuções):**
```
Dashboard: https://phantombuster.com/agents
Ver: Executions today
```

### **Hunter.io (requests):**
```
Dashboard: https://hunter.io/api-keys
Ver: Monthly usage
```

---

## 🎯 **ORDEM DE TESTE SUGERIDA:**

```
1️⃣ Aba 2 (TOTVS) - Mais simples
2️⃣ Aba 3 (Competitors) - Validação rigorosa
3️⃣ Aba 1 (Executive) - Resumo
4️⃣ Aba 6 (Analysis 360°) - Sem API
5️⃣ Aba 4 (Similar) - SEO básico
6️⃣ Aba 7 (Products) - VALIDAR IA! ← CRÍTICO
7️⃣ Aba 8 (Keywords SEO) - Completo novo
8️⃣ Aba 5 (Client Discovery) - Wave7
9️⃣ Aba 9 (Decisores) - Phantom + Hunter
```

---

## 📝 **ANOTAR DURANTE OS TESTES:**

```
EMPRESA TESTADA: _______________
DATA/HORA: _______________

ABA 1: [ ] OK  [ ] Erro: __________
ABA 2: [ ] OK  [ ] Erro: __________
ABA 3: [ ] OK  [ ] Erro: __________
ABA 4: [ ] OK  [ ] Erro: __________
ABA 5: [ ] OK  [ ] Erro: __________
ABA 6: [ ] OK  [ ] Erro: __________
ABA 7: [ ] OK  [ ] Erro: __________ ← CRÍTICO (IA)
ABA 8: [ ] OK  [ ] Erro: __________
ABA 9: [ ] OK  [ ] Erro: __________

CONSUMO TOTAL:
- Serper: _____ créditos
- OpenAI: $_____ USD
- Jina AI: _____ requests
- PhantomBuster: _____ execuções
- Hunter.io: _____ requests

PROBLEMAS ENCONTRADOS:
1. _______________
2. _______________
3. _______________
```

---

## ✅ **SISTEMA PRONTO PARA TESTE!**

**Quando quiser começar, me avise e vou acompanhar passo a passo!** 🚀

**Ou se encontrar erro, mande o log que eu corrijo na hora!** 😊

