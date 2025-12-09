# 🔧 Instruções para Aplicar Migration: Corrigir process_qualification_job

**Data:** 08/12/2025  
**Problema:** Erro `42702 - column reference "processed_count" is ambiguous`

## ⚠️ IMPORTANTE

A migration `20250208000001_fix_process_qualification_job_ambiguous.sql` já foi criada, mas **PRECISA SER APLICADA NO BANCO DE DADOS** para resolver o erro.

## 📋 Passos para Aplicar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione o projeto STRATEVO One
3. Vá em **SQL Editor**
4. Abra o arquivo: `supabase/migrations/20250208000001_fix_process_qualification_job_ambiguous.sql`
5. Copie TODO o conteúdo do arquivo
6. Cole no SQL Editor do Supabase
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Verifique se aparece mensagem de sucesso

### Opção 2: Via Supabase CLI

```bash
# No diretório do projeto
cd C:\Projects\stratevo-intelligence-prospect

# Aplicar migration
supabase db push
```

## ✅ Verificação

Após aplicar a migration, teste:

1. No STRATEVO One, vá em **Motor de Qualificação**
2. Selecione um job pendente
3. Clique em **Rodar Qualificação**
4. **NÃO** deve aparecer erro `42702` no console
5. O job deve processar e atualizar as métricas

## 🔍 O que a Migration Corrige

1. **Ambiguidade de `processed_count`:**
   - Variável local: `v_processed`
   - Coluna da tabela: `qj.processed_count` (qualificada com alias)

2. **Uso correto de `icp_id`:**
   - A função lê `icp_id` do job
   - Usa `icp_id` para filtrar candidatos em `prospecting_candidates`
   - Usa `icp_id` para buscar critérios de qualificação

3. **Qualificação de todas as colunas:**
   - Todos os UPDATEs usam alias `qj`
   - Todas as referências a colunas são qualificadas

## 📝 Notas Técnicas

- A função mantém a mesma assinatura (compatibilidade preservada)
- A lógica de negócio não foi alterada
- Apenas correções de ambiguidade e uso correto de `icp_id`

## 🐛 Se o Erro Persistir

1. Verifique se a migration foi aplicada:
   ```sql
   -- No Supabase SQL Editor
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'process_qualification_job';
   ```

2. Verifique se a função tem o alias `qj` nos UPDATEs:
   - Procure por `UPDATE public.prospect_qualification_jobs qj`
   - Procure por `qj.processed_count`

3. Se necessário, execute a migration novamente (é idempotente)

