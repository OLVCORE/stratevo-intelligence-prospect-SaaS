# 🧪 CICLO 6 - Teste de Mesa

## Objetivo
Validar Maturidade Score (6 pilares) e FIT TOTVS (6 áreas) com explicabilidade total.

---

## 📋 Pré-requisitos

1. **CICLOS 1-5 completos**
2. **SQL executado** (`lib/supabase/migrations/005_ciclo6_maturidade_fit.sql`)
3. **Empresa com sinais coletados:**
   - Tech signals (Ciclo 3)
   - Digital signals (Ciclo 3)
   - Decisores (Ciclo 4)
4. **Servidor rodando:**
   ```bash
   npm run dev
   npm install  # Para instalar recharts
   ```

---

## 🧪 Testes

### 1. Empty State (Sem Avaliação)

**Caso:** Empresa sem scores calculados

**Passos:**
1. Acesse `/companies/[id]`
2. Clique na tab **"Maturidade & Fit"**

**Resultado Esperado:**
- ✅ Seção Radar: "Sem avaliação de maturidade ainda"
- ✅ CTA: "Colete dados primeiro... depois clique Atualizar Maturidade"
- ✅ Seção FIT: "Sem avaliação de FIT TOTVS ainda"
- ✅ SEM gráfico mockado ou dados placeholder

---

### 2. Calcular Maturidade (COM Sinais)

**Setup:** Empresa com:
- Tech signals (Next.js, Google Analytics, Cloudflare)
- Digital signals (homepage recente)
- Decisores C-level
- Mensagens enviadas (SDR)

**Passos:**
1. Na tab "Maturidade & Fit"
2. Clique **"Atualizar Maturidade"**
3. Aguarde

**Resultado Esperado:**
- ✅ Alert: "Maturidade calculada! N recomendações geradas"
- ✅ Radar aparece com 6 eixos:
  - Infra, Dados, Processos, Sistemas, Pessoas, Cultura
- ✅ Cada eixo com score 0-100

**Validação no Banco:**
```sql
SELECT pillar, score, evidence
FROM maturity_scores
WHERE company_id = '[uuid]'
ORDER BY created_at DESC
LIMIT 6;
```

**Verificar:**
- ✅ 6 registros (1 por pilar)
- ✅ Mesmo `run_id` para todos
- ✅ `evidence` preenchido com sinais
- ✅ Scores calculados baseados em regras

---

### 3. Tooltip do Radar (Explicabilidade)

**Passos:**
1. Com radar visível
2. Passe mouse sobre um eixo (ex: "Infra")

**Resultado Esperado:**
- ✅ Tooltip mostra:
  ```
  Infra: 50/100
  
  Evidências:
  • CDN detectado (Cloudflare) (+20)
  • Cloud provider detectado (+30)
  ```
- ✅ Cada evidência com weight explícito
- ✅ Soma dos weights = score do pilar

---

### 4. Recomendações por Pilar

**Passos:**
1. Scroll abaixo do radar
2. Veja seção "Recomendações"

**Resultado Esperado:**
- ✅ Lista de recomendações
- ✅ Cada recomendação com:
  - Título (ex: "Implementar CDN")
  - Rationale (por-quê)
  - Priority badge (alta/média/baixa)
  - Pilar + Fonte

**SQL:**
```sql
SELECT 
  pillar,
  recommendation,
  rationale,
  priority,
  source
FROM maturity_recos
WHERE company_id = '[uuid]'
ORDER BY created_at DESC;
```

**Verificar:**
- ✅ Recomendações criadas
- ✅ Rationale preenchido (explicação)
- ✅ Priority correto

---

### 5. Calcular FIT TOTVS

**Passos:**
1. Na mesma tab
2. Scroll para "FIT TOTVS por Área"
3. Clique **"Atualizar FIT TOTVS"**

**Resultado Esperado:**
- ✅ Alert: "FIT TOTVS calculado para 6 áreas!"
- ✅ Grid com 6 cards:
  - Financeiro, RH, Indústria, Agro, Distribuição, Serviços
- ✅ Cada card com:
  - FIT% (0-100)
  - Cor: verde (≥70), amarelo (40-69), vermelho (<40)
  - Sinais detectados
  - Próximos passos

**SQL:**
```sql
SELECT area, fit, signals, next_steps
FROM fit_totvs
WHERE company_id = '[uuid]'
ORDER BY created_at DESC
LIMIT 6;
```

**Verificar:**
- ✅ 6 registros (1 por área)
- ✅ Mesmo `run_id`
- ✅ `signals` com evidências
- ✅ `next_steps` preenchido

---

### 6. FIT Alto (Financeiro)

**Setup:** Empresa com:
- ERP detectado (SAP/TOTVS)
- Decisor CFO identificado
- Termos "fiscal/contábil" no site

**Resultado Esperado no Card Financeiro:**
- ✅ FIT: 70-90% (verde)
- ✅ Sinais:
  ```
  • ERP já implementado (+40)
  • Termos financeiros no site (+20)
  • Decisor financeiro identificado (+30)
  ```
- ✅ Próximos passos: "Demo TOTVS Backoffice para otimização..."

---

### 7. FIT Baixo (Agro)

**Setup:** Empresa sem:
- Sistemas agro
- Termos agro no site
- CNAE agro

**Resultado Esperado no Card Agro:**
- ✅ FIT: 0-10% (vermelho)
- ✅ Sinais: (vazio ou poucos)
- ✅ Próximos passos: "Agendar discovery agro e apresentar TOTVS Agro"

---

### 8. Histórico (Múltiplos Runs)

**Passos:**
1. Calcule maturidade + FIT
2. Aguarde 1 minuto
3. Atualize tech signals (adicione mais tecnologias)
4. Recalcule maturidade + FIT

**SQL:**
```sql
SELECT run_id, pillar, score, created_at
FROM maturity_scores
WHERE company_id = '[uuid]'
ORDER BY created_at DESC;
```

**Verificar:**
- ✅ Múltiplos run_ids
- ✅ Scores podem ter mudado
- ✅ Histórico preservado

---

### 9. Empresa Sem Sinais (Empty State Real)

**Setup:** Empresa recém-criada (só CNPJ, sem enrichment)

**Passos:**
1. Acesse `/companies/[id]`
2. Tab "Maturidade & Fit"
3. Clique "Atualizar Maturidade"

**Resultado Esperado:**
- ✅ Cálculo completa (não erro)
- ✅ Todos os pilares com score 0-20 (baixo)
- ✅ Muitas recomendações (prioridade alta)
- ✅ Explicação clara: "Sem X detectado. X melhora Y."
- ✅ FIT baixo em todas as áreas

---

### 10. Telemetria

**SQL:**
```sql
SELECT 
  provider,
  operation,
  status,
  latency_ms,
  meta,
  created_at
FROM provider_logs
WHERE operation IN ('maturity', 'fit-totvs')
ORDER BY created_at DESC
LIMIT 10;
```

**Verificar:**
- ✅ Logs de cálculo
- ✅ `latency_ms` > 0 (tempo de processamento)
- ✅ `meta` com run_id e resumo de scores
- ✅ `status` = 'ok'

---

## ✅ Definition of Done (DoD)

Marque todos antes de considerar o Ciclo 6 completo:

- [ ] SQL executado (3 tabelas)
- [ ] Maturity rules implementadas (6 pilares)
- [ ] FIT TOTVS rules implementadas (6 áreas)
- [ ] POST /api/company/[id]/maturity/refresh funcionando
- [ ] GET /api/company/[id]/maturity funcionando
- [ ] POST /api/company/[id]/fit-totvs/refresh funcionando
- [ ] GET /api/company/[id]/fit-totvs funcionando
- [ ] Recharts instalado
- [ ] Radar renderizando (6 eixos)
- [ ] Tooltip com evidências funcionando
- [ ] Cards FIT renderizando (6 áreas)
- [ ] Próximos passos visíveis
- [ ] Tab "Maturidade & Fit" funcionando
- [ ] Empty states sem mocks
- [ ] Explicabilidade total (evidências + rationale)
- [ ] Build TypeScript sem erros
- [ ] Linter sem erros

---

## 🐛 Troubleshooting

### ❌ Radar não aparece
**Solução:** 
1. Execute: `npm install recharts`
2. Reinicie: `npm run dev`

### ❌ Todos os scores em 0
**Causa:** Empresa sem sinais coletados
**Solução:** 
1. Colete dados primeiro (tabs Digital, Tech, Decisores)
2. Recalcule maturidade

### ❌ "Erro ao calcular maturidade"
**Verificar:**
1. Console do servidor para stack trace
2. Tabelas existem no banco (maturity_scores, etc.)
3. Foreign keys corretas

### ❌ Tooltip não mostra evidências
**Causa:** Evidence array vazio
**Solução:** Verifique que regras estão detectando sinais corretamente

### ❌ FIT sempre baixo
**Causa:** Regras muito restritivas ou sinais insuficientes
**Solução:** Colete mais dados (Digital, Tech, Decisores)

---

**✅ CICLO 6 COMPLETO!**

Todos os testes passando → **Maturidade + FIT TOTVS funcionando!** 🚀

