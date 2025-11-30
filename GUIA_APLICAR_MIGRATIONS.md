# 🚀 GUIA: Aplicar Migrations Principais no Supabase

## 📋 OBJETIVO

Aplicar as tabelas principais do projeto anterior no schema `public` do novo banco Supabase para que o código funcione imediatamente.

---

## ⚡ MÉTODO RÁPIDO (Recomendado)

### PASSO 1: Acessar SQL Editor

1. Acesse: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new**
2. Você verá o editor SQL do Supabase

---

### PASSO 2: Copiar e Executar Script

1. Abra o arquivo: **`APLICAR_MIGRATIONS_PRINCIPAIS.sql`**
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** ou pressione **Ctrl+Enter**
5. Aguarde a execução (pode levar 1-2 minutos)

---

### PASSO 3: Verificar Execução

Após executar, você deve ver:
- ✅ Mensagem de sucesso
- ✅ Nenhum erro vermelho
- ✅ Tabelas criadas no Table Editor

---

## ✅ TABELAS QUE SERÃO CRIADAS

O script cria **11 tabelas principais**:

1. ✅ `companies` - Empresas
2. ✅ `decision_makers` - Decisores
3. ✅ `icp_analysis_results` - Análises ICP
4. ✅ `sdr_deals` - Deals do pipeline
5. ✅ `sdr_pipeline_stages` - Estágios do pipeline
6. ✅ `sdr_deal_activities` - Atividades dos deals
7. ✅ `buying_signals` - Sinais de compra
8. ✅ `digital_maturity` - Maturidade digital
9. ✅ `search_history` - Histórico de buscas
10. ✅ `discarded_companies` - Empresas descartadas
11. ✅ `similar_companies` - Empresas similares

---

## 🔍 VERIFICAÇÃO

### Como verificar se funcionou:

1. Acesse: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/editor**
2. No **Table Editor**, você deve ver todas as tabelas listadas acima
3. Clique em uma tabela (ex: `companies`) para ver sua estrutura

---

## ⚠️ IMPORTANTE

### O que este script faz:

- ✅ Cria todas as tabelas principais
- ✅ Cria índices para performance
- ✅ Configura Row Level Security (RLS)
- ✅ Cria políticas de acesso
- ✅ Cria triggers e funções
- ✅ Insere dados padrão (estágios do pipeline)

### O que este script NÃO faz:

- ❌ Não migra dados do projeto anterior
- ❌ Não cria estrutura multi-tenant (isso vem depois)
- ❌ Não cria todas as 148 migrations (apenas as principais)

---

## 🎯 APÓS APLICAR

Após executar o script:

1. ✅ O código deve funcionar sem erros de "tabela não encontrada"
2. ✅ Você pode começar a usar a aplicação normalmente
3. ✅ Dados serão armazenados no schema `public` (compartilhado)

---

## 📝 PRÓXIMOS PASSOS (Opcional)

Depois que tudo estiver funcionando, você pode:

1. **Migrar para multi-tenancy:**
   - Adaptar código para usar schemas por tenant
   - Migrar dados existentes para schemas de tenants

2. **Aplicar migrations adicionais:**
   - Se precisar de outras tabelas específicas
   - Aplicar uma por uma conforme necessário

---

## 🔗 LINKS ÚTEIS

- **SQL Editor:** https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
- **Table Editor:** https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/editor
- **Script SQL:** `APLICAR_MIGRATIONS_PRINCIPAIS.sql`

---

**Criado em:** 2025-01-19  
**Status:** ✅ Pronto para executar

