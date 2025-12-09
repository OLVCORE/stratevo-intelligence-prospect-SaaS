# 🚨 Aplicar Migration Manualmente - URGENTE

**Problema:** O `supabase db push` falhou em uma migration anterior, impedindo que a migration crítica seja aplicada.

**Solução:** Aplicar a migration `20250208000001_fix_process_qualification_job_ambiguous.sql` **MANUALMENTE** no Supabase Dashboard.

## 📋 Passos para Aplicar

### 1. Acessar Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione o projeto **STRATEVO One**
3. Clique em **SQL Editor** (no menu lateral)

### 2. Copiar e Colar a Migration

1. Abra o arquivo: `supabase/migrations/20250208000001_fix_process_qualification_job_ambiguous.sql`
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Verificar Sucesso

Você deve ver a mensagem:
```
Success. No rows returned
```

Isso significa que a função foi criada/atualizada com sucesso.

## ✅ Depois de Aplicar

1. **Teste no STRATEVO One:**
   - Vá em **Motor de Qualificação**
   - Selecione um job pendente
   - Clique em **Rodar Qualificação**
   - **NÃO** deve aparecer erro 42702

2. **Verificar no Console:**
   - Não deve aparecer: `column reference "processed_count" is ambiguous`
   - O job deve processar corretamente

## 🔧 Sobre o Erro do `db push`

O erro na migration `20250108_create_sdr_pipeline_stages.sql` é um problema separado (chave duplicada). 

**Solução temporária:** Aplicar a migration crítica manualmente (como descrito acima).

**Solução definitiva:** Corrigir a migration `20250108_create_sdr_pipeline_stages.sql` para usar `ON CONFLICT DO NOTHING` ou verificar se já existe antes de inserir.

---

**⚠️ IMPORTANTE:** A migration `20250208000001_fix_process_qualification_job_ambiguous.sql` **DEVE** ser aplicada para resolver o erro 42702!

