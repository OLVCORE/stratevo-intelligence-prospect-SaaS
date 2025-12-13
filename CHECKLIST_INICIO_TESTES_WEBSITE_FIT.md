# ✅ CHECKLIST: Iniciar Testes - Website Fit Score

## 🚀 AÇÕES NECESSÁRIAS ANTES DOS TESTES

### 1. ✅ APLICAR MIGRATION NO BANCO DE DADOS

**Arquivo:** `supabase/migrations/20250221000001_prospect_extracted_products.sql`

**Como aplicar:**
```bash
# Via Supabase CLI (recomendado)
supabase db push

# OU via SQL Editor no Supabase Dashboard
# Copiar e colar o conteúdo do arquivo SQL
```

**O que faz:**
- Cria tabela `prospect_extracted_products`
- Adiciona colunas em `qualified_prospects`:
  - `website_encontrado`
  - `website_fit_score`
  - `website_products_match`
  - `linkedin_url`

**Verificar:**
```sql
-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qualified_prospects' 
  AND column_name IN ('website_encontrado', 'website_fit_score', 'website_products_match', 'linkedin_url');

-- Verificar se a tabela foi criada
SELECT * FROM information_schema.tables 
WHERE table_name = 'prospect_extracted_products';
```

---

### 2. ✅ DEPLOY DAS EDGE FUNCTIONS

**Edge Functions a fazer deploy:**
1. `supabase/functions/find-prospect-website/`
2. `supabase/functions/scan-prospect-website/`

**Como fazer deploy:**
```bash
# Via Supabase CLI
supabase functions deploy find-prospect-website
supabase functions deploy scan-prospect-website

# OU via Dashboard Supabase
# Functions → Deploy → Upload pasta
```

**Verificar variáveis de ambiente:**
- ✅ `SERPER_API_KEY` configurada
- ✅ `OPENAI_API_KEY` configurada
- ✅ `SUPABASE_SERVICE_ROLE_KEY` configurada

---

### 3. ✅ VERIFICAR CÓDIGO BACKEND

**Arquivos modificados (já estão prontos):**
- ✅ `supabase/functions/qualify-prospects-bulk/index.ts` (já modificado)
- ✅ `src/services/icpQualificationEngine.ts` (já modificado)

**Verificar:**
- ✅ Código compilando sem erros
- ✅ Imports corretos
- ✅ Lógica de busca de website integrada

---

### 4. ✅ TESTAR FLUXO COMPLETO

#### **Teste 1: Upload de Planilha SEM Website**
1. Ir para `/leads/qualification-engine`
2. Upload de planilha CSV com CNPJs (sem coluna website)
3. Executar qualificação
4. **Verificar:**
   - ✅ Website foi buscado automaticamente via SERPER
   - ✅ Website salvo em `qualified_prospects.website_encontrado`
   - ✅ Website Fit Score calculado
   - ✅ LinkedIn encontrado (se disponível)

#### **Teste 2: Upload de Planilha COM Website**
1. Ir para `/leads/qualification-engine`
2. Upload de planilha CSV com CNPJs + website
3. Executar qualificação
4. **Verificar:**
   - ✅ Website da planilha foi usado (não buscou novamente)
   - ✅ Website escaneado e produtos extraídos
   - ✅ Website Fit Score calculado
   - ✅ Produtos compatíveis identificados

#### **Teste 3: Verificar Dados no Estoque Qualificado**
1. Ir para `/leads/qualified-stock`
2. **Verificar:**
   - ✅ Coluna Website aparece (mesmo que vazia)
   - ✅ Website Fit Score aparece (mesmo que 0)
   - ✅ Dados estão corretos

#### **Teste 4: Verificar Migração para Base de Empresas**
1. Selecionar empresas no Estoque Qualificado
2. Clicar em "Enviar para Base de Empresas"
3. Ir para `/companies`
4. **Verificar:**
   - ✅ Website aparece na coluna
   - ✅ Website foi copiado corretamente

---

### 5. ✅ VERIFICAR LOGS E ERROS

**Onde verificar:**
- Supabase Dashboard → Logs → Edge Functions
- Console do navegador (F12)
- Network tab (verificar chamadas das Edge Functions)

**O que procurar:**
- ✅ Chamadas para `find-prospect-website` funcionando
- ✅ Chamadas para `scan-prospect-website` funcionando
- ✅ Sem erros 500 ou 404
- ✅ Dados sendo salvos no banco

---

### 6. ✅ TESTAR CASOS ESPECIAIS

#### **Caso 1: Empresa sem Website**
- ✅ Sistema não quebra
- ✅ Website Fit Score = 0
- ✅ Continua qualificação normalmente

#### **Caso 2: Website inválido**
- ✅ Sistema não quebra
- ✅ Website Fit Score = 0
- ✅ Continua qualificação normalmente

#### **Caso 3: SERPER API falhando**
- ✅ Sistema não quebra
- ✅ Continua sem website
- ✅ Continua qualificação normalmente

---

## 📋 CHECKLIST RÁPIDO

### Antes de Testar:
- [ ] Migration aplicada no banco
- [ ] Edge Functions deployadas
- [ ] Variáveis de ambiente configuradas
- [ ] Código compilando sem erros

### Durante os Testes:
- [ ] Teste 1: Planilha sem website → Website buscado automaticamente
- [ ] Teste 2: Planilha com website → Website usado e escaneado
- [ ] Teste 3: Estoque Qualificado → Dados aparecem corretamente
- [ ] Teste 4: Base de Empresas → Website migrado corretamente
- [ ] Verificar logs → Sem erros críticos

### Após os Testes:
- [ ] Dados salvos no banco corretamente
- [ ] Website Fit Score calculado corretamente
- [ ] Produtos compatíveis identificados
- [ ] LinkedIn encontrado (quando disponível)

---

## 🐛 TROUBLESHOOTING

### Problema: Website não está sendo buscado
**Solução:**
1. Verificar se `SERPER_API_KEY` está configurada
2. Verificar logs da Edge Function `find-prospect-website`
3. Verificar se a Edge Function foi deployada corretamente

### Problema: Website Fit Score sempre 0
**Solução:**
1. Verificar se produtos do tenant existem na tabela `tenant_products`
2. Verificar se produtos foram extraídos do website
3. Verificar logs da Edge Function `scan-prospect-website`

### Problema: Dados não aparecem no Estoque Qualificado
**Solução:**
1. Verificar se migration foi aplicada (colunas existem)
2. Verificar se dados foram salvos em `qualified_prospects`
3. Verificar query do frontend (está buscando as colunas corretas?)

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTES

1. ✅ Adicionar colunas visuais no frontend (se testes passarem)
2. ✅ Criar componentes visuais (badges, links)
3. ✅ Adicionar filtros por Website Fit Score
4. ✅ Adicionar tooltips explicativos

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **NÃO modificar** código durante os testes (apenas se encontrar bugs críticos)
- ⚠️ **Fazer backup** do banco antes de aplicar migration (se possível)
- ⚠️ **Testar em ambiente de desenvolvimento** primeiro (não em produção)
- ⚠️ **Documentar** qualquer problema encontrado

