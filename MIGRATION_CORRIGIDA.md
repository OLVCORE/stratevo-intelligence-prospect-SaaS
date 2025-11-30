# ✅ MIGRATION CORRIGIDA

## 🔧 CORREÇÕES APLICADAS

### Problema Original:
PostgreSQL não permite adicionar múltiplas colunas em uma única declaração `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

### Solução:
Separar cada `ADD COLUMN` em uma declaração individual.

---

## ✅ MUDANÇAS APLICADAS

### 1. Tabela `companies` - Corrigido
```sql
-- ANTES (ERRADO):
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS
  sector_code VARCHAR(50),
  sector_name VARCHAR(100),
  ...

-- DEPOIS (CORRETO):
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sector_code VARCHAR(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sector_name VARCHAR(100);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS niche_code VARCHAR(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS niche_name VARCHAR(100);
```

### 2. Constraints CHECK - Corrigido
```sql
-- Constraints CHECK agora são adicionadas separadamente após criar colunas
DO $$ 
BEGIN
  IF NOT EXISTS (...) THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_icp_match_score_check 
      CHECK (icp_match_score >= 0 AND icp_match_score <= 100);
  END IF;
  ...
END $$;
```

### 3. Tabela `tenants` - Corrigido
```sql
-- Cada coluna em uma declaração separada
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS icp_sectors TEXT[] DEFAULT '{}';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS icp_niches TEXT[] DEFAULT '{}';
...
```

### 4. Trigger - Corrigido
```sql
-- DECLARE movido para o topo da função (não pode estar dentro de BEGIN)
CREATE OR REPLACE FUNCTION public.auto_classify_company()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cnae_principal TEXT;
BEGIN
  ...
END;
$$;
```

---

## ✅ STATUS

**Migration corrigida e pronta para executar!**

Execute no Supabase SQL Editor:
`supabase/migrations/20250119000001_add_sector_niche_classification.sql`

---

**Última atualização:** 2025-01-19

