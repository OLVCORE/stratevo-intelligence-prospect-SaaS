# 🚀 MIGRATION: Tabela website_scan_jobs

## Objetivo
Criar tabela para rastreamento de jobs de extração de produtos em etapas, permitindo processamento incremental e continuidade entre execuções.

## Como Aplicar

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/migrations/20250225000007_create_website_scan_jobs.sql`
4. Execute o script

### Opção 2: Via CLI
```bash
supabase migration up
```

## Verificação
Após aplicar, verifique se a tabela foi criada:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'website_scan_jobs'
ORDER BY ordinal_position;
```

**Resultado esperado:** 13 colunas devem aparecer.

## Impacto
- ✅ Permite processamento em etapas (lotes)
- ✅ Rastreamento de progresso de extração
- ✅ Continuidade entre execuções (não perde progresso)
- ✅ Suporte a varredura completa de websites grandes

## Próximos Passos
1. Aplicar esta migration
2. Testar nova Edge Function `scan-website-products-360`
3. Atualizar frontend para usar polling automático
