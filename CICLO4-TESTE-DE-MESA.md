# 🧪 CICLO 4 - Teste de Mesa

## Objetivo
Validar módulo Decisores on-demand com provedores opcionais (Apollo/Hunter/Phantom).

---

## 📋 Pré-requisitos

1. **CICLO 1, 2 e 3 completos**
2. **SQL executado** (`lib/supabase/migrations/003_ciclo4_decisores_sdr.sql`)
3. **Pelo menos 1 empresa com domínio** cadastrada
4. **Servidor rodando:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testes

### 1. Empty State (Sem Decisores)

**Setup:** Empresa sem decisores coletados

**Passos:**
1. Acesse `/companies/[id]`
2. Clique na tab **"Decisores"**

**Resultado Esperado:**
- ✅ Mensagem: "Sem decisores coletados ainda"
- ✅ Cards mostrando status de configuração:
  - Apollo.io: ✅ Configurado / ⚙️ Configure APOLLO_API_KEY
  - Hunter.io: ✅ Configurado / ⚙️ Configure HUNTER_API_KEY
  - PhantomBuster: ✅ Configurado / ⚙️ Configure PHANTOM_BUSTER_API_KEY
- ✅ CTA: "Após configurar, clique em Atualizar Decisores"
- ✅ SEM dados mockados ou placeholder

---

### 2. Atualizar Decisores (COM Apollo)

**Setup:** `APOLLO_API_KEY` configurada no `.env.local`

**Passos:**
1. Na tab "Decisores"
2. Clique **"Atualizar Decisores"**
3. Aguarde (pode demorar 5-10 segundos)

**Resultado Esperado:**
- ✅ Alert: "+N novo(s), M atualizado(s)"
- ✅ Alert mostra telemetria:
  ```
  Provedores:
  Apollo: 250 ms
  Hunter: 180 ms
  Phantom: -
  ```
- ✅ Tabela populada com decisores

**Validação no Banco:**
```sql
SELECT 
  full_name, 
  title, 
  department, 
  seniority, 
  source, 
  confidence
FROM people 
WHERE company_id = '[uuid]';
```

**Verificar:**
- ✅ Decisores inseridos
- ✅ `source` = `'apollo'`
- ✅ `confidence` entre 60-100
- ✅ `title`, `department`, `seniority` preenchidos

---

### 3. Validar Contatos

**SQL:**
```sql
SELECT 
  p.full_name,
  pc.type,
  pc.value,
  pc.verified,
  pc.source
FROM people p
JOIN person_contacts pc ON pc.person_id = p.id
WHERE p.company_id = '[uuid]';
```

**Verificar:**
- ✅ E-mails salvos (`type = 'email'`)
- ✅ LinkedIn URLs salvos (`type = 'linkedin'`)
- ✅ Phones salvos (`type = 'phone'`)
- ✅ `source` = `'apollo'` ou `'hunter'`
- ✅ `verified` = `true` se Hunter validou

---

### 4. Atualizar Decisores (SEM Apollo)

**Setup:** Remova `APOLLO_API_KEY` do `.env.local` temporariamente

**Passos:**
1. Reinicie o servidor
2. Clique "Atualizar Decisores"

**Resultado Esperado:**
- ✅ Alert: "+0 novo(s), 0 atualizado(s)"
- ✅ Telemetria:
  ```
  Provedores:
  Apollo: -
  Hunter: -
  Phantom: -
  ```
- ✅ **SEM ERRO** (degradação graciosa)
- ✅ Empty-state guiado mostra: "Configure APOLLO_API_KEY"

---

### 5. UPSERT Idempotente (Sem Duplicação)

**Passos:**
1. Com decisores já coletados
2. Clique "Atualizar Decisores" novamente
3. Repita 2-3 vezes

**Resultado Esperado:**
- ✅ Alerta: "+0 novo(s), N atualizado(s)"
- ✅ SEM duplicação de pessoas
- ✅ `updated_at` atualizado
- ✅ `created_at` mantém valor original

**Validação:**
```sql
SELECT full_name, COUNT(*) 
FROM people 
WHERE company_id = '[uuid]'
GROUP BY full_name
HAVING COUNT(*) > 1;
-- Resultado: 0 linhas (sem duplicatas)
```

---

### 6. Contatos Não Duplicam

**SQL:**
```sql
SELECT person_id, type, value, COUNT(*)
FROM person_contacts
GROUP BY person_id, type, value
HAVING COUNT(*) > 1;
-- Resultado: 0 linhas (sem duplicatas)
```

**Verificar:**
- ✅ Mesmo e-mail não aparece 2x para mesma pessoa
- ✅ Mesmo LinkedIn não aparece 2x

---

### 7. Criar Lead

**Passos:**
1. Na tabela de decisores
2. Clique **"Criar Lead"** em uma linha
3. Confirme o alert

**Resultado Esperado:**
- ✅ Alert: "Lead criado com sucesso!"
- ✅ Lead inserido no banco

**Validação:**
```sql
SELECT 
  l.id,
  l.stage,
  l.company_id,
  l.person_id,
  c.name as company_name,
  p.full_name as person_name
FROM leads l
JOIN companies c ON c.id = l.company_id
LEFT JOIN people p ON p.id = l.person_id
ORDER BY l.created_at DESC
LIMIT 10;
```

**Verificar:**
- ✅ Lead criado
- ✅ `stage` = `'new'`
- ✅ `company_id` correto
- ✅ `person_id` correto
- ✅ `created_at` = agora

---

### 8. Empresa Sem Domínio

**Setup:** Empresa sem `domain` e sem `website`

**Passos:**
1. Acesse empresa sem domínio
2. Tab "Decisores"
3. Clique "Atualizar Decisores"

**Resultado Esperado:**
- ✅ Alert: "Erro: Empresa sem domínio/website definido"
- ✅ Status HTTP: 404
- ✅ Response:
  ```json
  {
    "ok": false,
    "code": "NO_DOMAIN",
    "message": "Empresa sem domínio/website definido"
  }
  ```

---

### 9. Telemetria em provider_logs

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
WHERE company_id = '[uuid]'
AND operation = 'decision-makers'
ORDER BY created_at DESC
LIMIT 10;
```

**Verificar:**
- ✅ Registro criado
- ✅ `provider` = `'decision-makers'`
- ✅ `operation` = `'decision-makers'`
- ✅ `status` = `'ok'` ou `'error'`
- ✅ `meta` contém:
  ```json
  {
    "apollo": 250,
    "hunter": 180,
    "phantom": "-"
  }
  ```

---

### 10. Hunter Valida E-mails

**Setup:** `HUNTER_API_KEY` configurada + Apollo retornou decisores

**Passos:**
1. Atualizar Decisores (Apollo + Hunter)
2. Verificar contatos

**SQL:**
```sql
SELECT 
  p.full_name,
  pc.value as email,
  pc.verified,
  pc.source
FROM people p
JOIN person_contacts pc ON pc.person_id = p.id
WHERE pc.type = 'email'
AND p.company_id = '[uuid]';
```

**Verificar:**
- ✅ E-mails com `source = 'hunter'`
- ✅ `verified = true` se Hunter validou
- ✅ E-mails com `source = 'apollo'` se Apollo já trouxe
- ✅ Hunter não duplica e-mails do Apollo

---

## ✅ Definition of Done (DoD)

Marque todos antes de considerar o Ciclo 4 completo:

- [ ] SQL executado (4 tabelas criadas)
- [ ] Apollo.io implementado (opcional)
- [ ] Hunter.io implementado (opcional)
- [ ] PhantomBuster implementado (opcional)
- [ ] GET `/api/company/[id]/decision-makers` funcionando
- [ ] POST `/api/company/[id]/decision-makers/refresh` funcionando
- [ ] POST `/api/leads` funcionando
- [ ] UPSERT idempotente (pessoas não duplicam)
- [ ] Contatos não duplicam
- [ ] Telemetria em provider_logs
- [ ] UI DecisionMakers renderizando
- [ ] Empty-state guiado com status de configuração
- [ ] Tab "Decisores" na página empresa
- [ ] Ação "Criar Lead" funcionando
- [ ] Build TypeScript sem erros
- [ ] Linter sem erros

---

## 🐛 Troubleshooting

### ❌ Alert: "Erro: Empresa sem domínio/website definido"
**Solução:** Empresa precisa ter `domain` ou `website`. Use SearchHub (Ciclo 1) para buscar por CNPJ e obter website.

### ❌ Alert: "+0 novo(s), 0 atualizado(s)" (mas esperava resultados)
**Possíveis causas:**
1. Apollo não retornou resultados para aquele domínio
2. Apollo API key inválida
3. Domínio sem decisores públicos

**Verificar:**
```sql
SELECT * FROM provider_logs 
WHERE operation = 'decision-makers' 
ORDER BY created_at DESC LIMIT 1;
```

Se `status = 'error'`, veja o `meta.message`.

### ❌ E-mails não marcados como verificados
**Causa:** Hunter.io não configurado ou não validou
**Solução:** Configure `HUNTER_API_KEY` e atualize novamente

### ❌ "Criar Lead" não funciona
**Verificar:**
1. Console do browser para erros
2. Tabela `leads` existe no banco
3. Foreign keys corretas (company_id, person_id)

### ❌ Empty-state não mostra status correto
**Causa:** ENV vars não são expostas no client
**Solução:** Use health check ou telemetria de provider_logs para validar configuração

---

## 📊 Checklist de Validação

Execute após implementar:

```bash
# 1. Build TypeScript
npm run type-check

# 2. Linter
npm run lint

# 3. Build de produção
npm run build

# 4. Verificar ENV
npm run verify-env
```

---

**✅ CICLO 4 COMPLETO!**

Todos os testes passando → Aguardando **Ciclo 5 - SDR OLV**

