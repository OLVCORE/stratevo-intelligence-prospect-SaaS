# 🧪 CICLO 2 - Teste de Mesa

## Objetivo
Validar Lista de Empresas com paginação, filtros, ordenação e ação "Tornar Ativa".

---

## 📋 Pré-requisitos

1. **CICLO 1 completo e funcionando**
2. **Servidor rodando:**
   ```bash
   npm run dev
   ```
3. **Pelo menos 1 empresa cadastrada** (via SearchHub do Ciclo 1)

---

## 🧪 Testes

### 1. Listagem Vazia (Empty State)

**Caso:** Banco sem empresas

**Passos:**
1. Limpe todas as empresas do banco (SQL):
   ```sql
   DELETE FROM companies;
   ```
2. Acesse http://localhost:3000/companies
3. Observe a tabela

**Resultado Esperado:**
- ✅ Mensagem: "Nenhuma empresa cadastrada ainda"
- ✅ CTA: "Use o SearchHub na página inicial para buscar e carregar dados reais"
- ✅ SEM dados mockados ou placeholder
- ✅ SEM spinner infinito

---

### 2. Listagem com Dados

**Passos:**
1. Vá para http://localhost:3000
2. Use SearchHub para buscar:
   - CNPJ: `18.627.195/0001-60`
   - CNPJ: `07.526.557/0001-00` (Mercado Livre)
   - CNPJ: `60.746.948/0001-12` (Nubank)
3. Volte para http://localhost:3000/companies

**Resultado Esperado:**
- ✅ Tabela mostra 3 empresas
- ✅ Colunas visíveis:
  - Empresa (nome ou trade_name)
  - CNPJ (formato: 14 dígitos)
  - Domínio (ex: `nubank.com.br`)
  - Capital (formato BRL: `R$ 500.000,00`)
  - Status (badge colorido: verde para ATIVA)
  - **Fonte** (badge azul: `receitaws`, `mixed`, etc.)
  - Atualizado (data/hora formatada)
  - Ações (botão "Tornar Ativa")

---

### 3. Ordenação por Capital (Desc)

**Passos:**
1. Na página `/companies`
2. Selecione no dropdown "Ordenar por": **Capital**
3. Ordem: **Desc**
4. Clique "Filtrar"

**Resultado Esperado:**
- ✅ Empresas ordenadas do MAIOR para MENOR capital social
- ✅ Nubank (maior capital) aparece primeiro
- ✅ URL atualizada com `sort=capital_social&order=desc`

---

### 4. Filtro por Status

**Passos:**
1. Adicione uma empresa BAIXADA (se não tiver):
   ```sql
   UPDATE companies SET status = 'BAIXADA' WHERE cnpj = '18627195000160';
   ```
2. Selecione filtro "Status": **ATIVA**
3. Clique "Filtrar"

**Resultado Esperado:**
- ✅ Apenas empresas com `status = 'ATIVA'` aparecem
- ✅ Empresa BAIXADA não aparece

**Limpar filtro:**
- Selecione "Status (todos)" → mostra todas novamente

---

### 5. Busca por Texto (q)

**Passos:**
1. No campo "Buscar por nome/CNPJ/domínio"
2. Digite: `nubank`
3. Clique "Filtrar"

**Resultado Esperado:**
- ✅ Apenas Nubank aparece
- ✅ Busca case-insensitive
- ✅ Funciona para: `name`, `trade_name`, `cnpj`, `domain`

**Teste variações:**
- `186271` (parte do CNPJ) → ✅ Encontra
- `com.br` (parte do domínio) → ✅ Encontra
- `xyzabc` (não existe) → ✅ Empty state

---

### 6. Paginação

**Setup:** Adicione 25+ empresas (use loop no SearchHub ou SQL insert)

**Passos:**
1. Defina "pageSize": **10/página**
2. Observe a paginação
3. Clique "Próxima"
4. Clique "Anterior"

**Resultado Esperado:**
- ✅ Mostra 10 empresas por página
- ✅ Contador: "Página 1 de 3 (25 empresas)"
- ✅ Botão "Anterior" desabilitado na página 1
- ✅ Botão "Próxima" desabilitado na última página
- ✅ Navegar entre páginas funciona
- ✅ Total de empresas correto

---

### 7. Ação "Tornar Ativa"

**Passos:**
1. Na listagem, clique em **"Tornar Ativa"** de uma empresa
2. Observe o alert
3. Observe o header

**Resultado Esperado:**
- ✅ Alert: "Empresa definida como ativa"
- ✅ Header atualizado com nome + CNPJ da empresa
- ✅ Company Context global atualizado
- ✅ `localStorage` atualizado
- ✅ Persistência: recarregar página (F5) mantém contexto

**Validação no código:**
```javascript
// Deve chamar:
useCompany.getState().setCompany({
  id: '...',
  name: '...',
  cnpj: '...',
  website: '...'
});
```

---

### 8. Telemetria Visível (Coluna Fonte)

**Passos:**
1. Busque empresa via CNPJ (Ciclo 1)
2. Vá para `/companies`
3. Observe coluna "Fonte"

**Resultado Esperado:**
- ✅ Badge azul com fonte do dado
- ✅ Valores possíveis:
  - `receitaws` (se só buscou CNPJ)
  - `mixed` (se buscou CNPJ + encontrou website)
  - `cse` ou `serper` (se buscou só website)
- ✅ Badge formatado com estilo

**No banco:**
```sql
SELECT name, source FROM companies;
```
- ✅ Campo `source` preenchido corretamente

---

### 9. Navegação entre Páginas

**Passos:**
1. No header, clique em **"Dashboard"**
2. Observe URL: `/`
3. No header, clique em **"Empresas"**
4. Observe URL: `/companies`

**Resultado Esperado:**
- ✅ Navegação funciona
- ✅ Company Context persiste
- ✅ Header sempre visível (sticky top)

---

### 10. Responsividade e UX

**Passos:**
1. Redimensione a janela do browser
2. Teste em mobile (DevTools)
3. Observe comportamento dos filtros

**Resultado Esperado:**
- ✅ Tabela com scroll horizontal em telas pequenas
- ✅ Filtros empilham (flex-wrap)
- ✅ Botões não quebram layout
- ✅ Texto trunca se necessário

---

## 🔍 Validações Técnicas

### A) Performance da Query

**SQL direto no Supabase:**
```sql
EXPLAIN ANALYZE 
SELECT id, name, trade_name, cnpj, domain, capital_social, status, updated_at, source
FROM companies
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;
```

**Verificar:**
- ✅ Usa índice em `updated_at` (se criado)
- ✅ Usa índice em `cnpj` para filtros
- ✅ Query rápida (< 50ms para 1000 empresas)

### B) API Response

**Request:**
```bash
curl "http://localhost:3000/api/companies/list?page=1&pageSize=20&sort=updated_at&order=desc"
```

**Response esperado:**
```json
{
  "ok": true,
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "total": 3
}
```

**Validar:**
- ✅ Status HTTP: 200
- ✅ `items` é array
- ✅ `total` correto
- ✅ Sem campo `count` ou `data` extra

### C) Capital Social Correto

**SQL:**
```sql
SELECT name, capital_social, raw->'receitaws'->'json'->>'capital_social' as raw_capital
FROM companies
WHERE capital_social IS NOT NULL;
```

**Verificar:**
- ✅ `capital_social` = valor correto em reais
- ✅ SEM multiplicação por 1000
- ✅ Tipo NUMERIC(16,2)

---

## ✅ Definition of Done (DoD)

Marque todos antes de considerar o Ciclo 2 completo:

- [ ] GET `/api/companies/list` funcionando
- [ ] Paginação (page, pageSize) funcional
- [ ] Ordenação (sort, order) funcional
- [ ] Filtros (q, status) funcionais
- [ ] Tabela `CompaniesTable` renderizando
- [ ] Empty state com CTA claro
- [ ] Coluna "Fonte" visível com badge
- [ ] Capital formatado em BRL (correto)
- [ ] Ação "Tornar Ativa" atualiza Context
- [ ] Header com navegação Dashboard/Empresas
- [ ] Persistência do Context após "Tornar Ativa"
- [ ] Sem mocks ou dados placeholder
- [ ] Build TypeScript sem erros
- [ ] Linter sem erros
- [ ] Performance aceitável (query < 100ms)

---

## 🐛 Troubleshooting

### ❌ Listagem vazia (mas há empresas no banco)
**Solução:** Verifique console do browser para erros na API

### ❌ "Tornar Ativa" não atualiza header
**Solução:** Verifique se `useCompany.setCompany()` está sendo chamado corretamente

### ❌ Capital com valor errado (x1000)
**Solução:** Confirme tipo NUMERIC(16,2) no banco e parse correto

### ❌ Filtros não aplicam
**Solução:** Clique em "Filtrar" após alterar os selects

### ❌ Paginação quebrada
**Solução:** Verifique `total` retornado pela API (`count: 'exact'` no Supabase)

### ❌ Badge "Fonte" não aparece
**Solução:** Verifique se campo `source` está sendo retornado pela API

---

**✅ CICLO 2 COMPLETO!**

Todos os testes passando → Aguardando **Ciclo 3 - Enriquecimento Digital**

