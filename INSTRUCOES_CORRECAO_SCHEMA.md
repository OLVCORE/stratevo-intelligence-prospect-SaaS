# 🔧 CORREÇÃO DEFINITIVA DO SCHEMA `stc_verification_history`

## 🚨 PROBLEMA IDENTIFICADO

O schema da tabela `stc_verification_history` no Supabase está **DESATUALIZADO** ou **INCOMPLETO**.

**Erro recorrente:**
```
PGRST204: Could not find the 'XXX' column of 'stc_verification_history' in the schema cache
```

**Colunas que faltam:**
- ❌ `confidence`
- ❌ `double_matches`
- ❌ `triple_matches`
- ❌ `single_matches`
- ❌ `queries_executed`
- ❌ `sources_consulted`
- ❌ `evidences`
- ❌ `status` (em alguns casos!)

---

## ✅ SOLUÇÃO (3 PASSOS)

### **PASSO 1: EXECUTAR SQL NO SUPABASE**

1. **Abrir Supabase Dashboard:** https://supabase.com/dashboard
2. **Ir para:** Project → SQL Editor
3. **New Query**
4. **Copiar TODO o conteúdo de:** `EXECUTAR_NO_SUPABASE_SQL_EDITOR.sql`
5. **Colar no SQL Editor**
6. **Clicar em RUN** (botão verde)
7. **Aguardar até ver:** `✅ MIGRATION CONCLUÍDA COM SUCESSO!`

**O QUE O SCRIPT FAZ:**
1. ✅ Faz backup de TODOS os dados existentes
2. ✅ Recria a tabela com TODAS as colunas necessárias
3. ✅ Restaura os dados do backup
4. ✅ Cria índices para performance
5. ✅ Configura RLS (Row Level Security)
6. ✅ Força reload do schema cache do PostgREST

---

### **PASSO 2: FAZER DEPLOY DO CÓDIGO**

```bash
git add -A
git commit -m "fix: restore all columns in stc_verification_history INSERT"
git push
```

**Aguardar deploy no Vercel:** https://vercel.com/olvcore (~2-3 minutos)

---

### **PASSO 3: TESTAR**

1. **Force Refresh:** `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. **Ir para:** Empresas em Quarentena
3. **Selecionar 2 empresas**
4. **F12 → Console**
5. **Ações em Massa → Processar TOTVS em Lote**
6. **Aguardar ~70 segundos**
7. **VER NO CONSOLE:**
   ```
   [BATCH] ✅ Relatório salvo: {id: xxx, hasFullReport: true}
   ✅ SEM ERROS PGRST204!
   ```
8. **Clicar em "Relatórios"**
9. **VER 2 RELATÓRIOS** com dados completos!

---

## 📊 ESTRUTURA FINAL DA TABELA

Após executar o script, a tabela terá:

```sql
stc_verification_history (
    id UUID PRIMARY KEY,
    company_id UUID,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    status TEXT NOT NULL,              -- ✅ go / no-go / revisar
    confidence TEXT,                    -- ✅ high / medium / low
    triple_matches INTEGER,             -- ✅ Empresa + TOTVS + Produto
    double_matches INTEGER,             -- ✅ Empresa + TOTVS
    single_matches INTEGER,             -- ✅ Apenas Empresa ou TOTVS
    total_score INTEGER,                -- ✅ Score total da verificação
    evidences JSONB,                    -- ✅ Array de evidências
    full_report JSONB,                  -- ✅ Relatório completo (detection + decisors + digital)
    sources_consulted INTEGER,          -- ✅ Número de fontes consultadas
    queries_executed INTEGER,           -- ✅ Queries executadas no Serper
    verification_duration_ms INTEGER,   -- ✅ Tempo de execução
    verified_by UUID,                   -- ✅ Usuário que executou
    created_at TIMESTAMP,               -- ✅ Data de criação
    updated_at TIMESTAMP                -- ✅ Data de atualização
)
```

---

## 🔍 VALIDAÇÃO PÓS-EXECUÇÃO

Execute no SQL Editor para verificar:

```sql
-- Ver estrutura completa
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stc_verification_history'
ORDER BY ordinal_position;

-- Contar registros
SELECT COUNT(*) FROM stc_verification_history;

-- Ver registros recentes
SELECT 
    company_name,
    status,
    confidence,
    triple_matches,
    created_at
FROM stc_verification_history
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🆘 SE DER ERRO NO PASSO 1

**Erro:** `relation "stc_verification_history" does not exist`

**Solução:** A tabela nunca foi criada. Execute:
```sql
-- Apenas criar (sem drop/backup)
CREATE TABLE stc_verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    status TEXT NOT NULL,
    confidence TEXT DEFAULT 'medium',
    triple_matches INTEGER DEFAULT 0,
    double_matches INTEGER DEFAULT 0,
    single_matches INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    evidences JSONB DEFAULT '[]'::jsonb,
    full_report JSONB DEFAULT '{}'::jsonb,
    sources_consulted INTEGER DEFAULT 0,
    queries_executed INTEGER DEFAULT 0,
    verification_duration_ms INTEGER,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices e RLS
CREATE INDEX idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX idx_stc_history_created ON stc_verification_history(created_at DESC);

ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT TO authenticated WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
```

---

## 📞 SUPORTE

Se após executar **TODOS OS 3 PASSOS** ainda houver erro:

1. **Tirar screenshot do erro no console**
2. **Copiar o erro completo** (PGRST204 ou outro)
3. **Me enviar junto com:**
   - Output do SQL Editor (passo 1)
   - Link do deploy Vercel
   - Timestamp da execução

---

## ✅ CHECKLIST FINAL

- [ ] Executei o SQL no Supabase SQL Editor
- [ ] Vi a mensagem "✅ MIGRATION CONCLUÍDA COM SUCESSO!"
- [ ] Fiz deploy do código no Vercel
- [ ] Aguardei deploy ficar "Ready"
- [ ] Force refresh no navegador (Ctrl+Shift+R)
- [ ] Testei batch processing com 2 empresas
- [ ] Vi "[BATCH] ✅ Relatório salvo" no console
- [ ] Cliquei em "Relatórios" e vi os 2 relatórios
- [ ] Abri um relatório e vi dados completos
- [ ] **SEM ERROS PGRST204!** 🎉

---

**CRIADO EM:** 07/11/2025  
**VERSÃO:** 1.0  
**STATUS:** ✅ PRONTO PARA EXECUÇÃO

