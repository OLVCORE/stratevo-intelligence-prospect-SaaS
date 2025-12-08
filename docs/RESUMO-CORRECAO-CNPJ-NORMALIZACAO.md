# ✅ Correção Completa: Normalização de CNPJ em Todo o Fluxo

## 🎯 Problema Identificado

O sistema estava mostrando "CNPJ não encontrado" mesmo quando todos os CNPJs estavam presentes no Excel. O problema era:

1. **CNPJs vinham formatados do Excel**: `17.304.635/0001-85`
2. **Código tentava buscar com máscara**: APIs externas não encontravam porque esperavam `17304635000185`
3. **Mensagens confusas**: "CNPJ não encontrado" quando na verdade era "empresa não encontrada nas bases externas"

## ✅ Correções Implementadas

### 1. Função Central `normalizeCnpj` (`src/lib/format.ts`)

```typescript
export function normalizeCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const cleaned = String(cnpj).replace(/\D/g, '');
  if (cleaned.length !== 14) return null;
  return cleaned;
}
```

**Características:**
- Remove TODOS os caracteres não numéricos
- Valida que tem exatamente 14 dígitos
- Retorna `null` se inválido
- ✅ Usar em TODOS os lugares onde CNPJ é processado

### 2. Migration: Campo `cnpj_raw` (`supabase/migrations/20250209000001_add_cnpj_raw_to_tables.sql`)

Adiciona `cnpj_raw` em:
- `prospecting_candidates`
- `qualified_prospects`

**Permite:**
- Rastrear CNPJ original (com máscara) do Excel
- Manter `cnpj` normalizado (14 dígitos) para consultas/joins

### 3. BulkUploadDialog (`src/components/companies/BulkUploadDialog.tsx`)

**Correções:**
- ✅ Usa `normalizeCnpj()` centralizado
- ✅ Salva `cnpj_raw` (valor original do Excel)
- ✅ Salva `cnpj` (normalizado, 14 dígitos)
- ✅ Logs de diagnóstico para CNPJs inválidos

**Código:**
```typescript
const normalizedCnpj = normalizeCnpj(rawCnpj);
return {
  cnpj: normalizedCnpj, // ✅ Normalizado (14 dígitos)
  cnpj_raw: rawCnpj, // ✅ Original (com máscara)
  // ...
};
```

### 4. Normalizador Internacional (`src/services/internationalNormalizer.ts`)

**Correções:**
- ✅ Normaliza CNPJ internamente se receber com máscara
- ✅ Logs de diagnóstico quando empresa não é encontrada
- ✅ Mensagem clara: "Empresa não encontrada nas bases externas" (não "CNPJ não encontrado")

**Código:**
```typescript
const normalizedCnpj = input.cnpj ? normalizeCnpj(input.cnpj) : null;
if (normalizedCnpj) {
  console.log('[Normalizer] 🔍 Buscando empresa para CNPJ normalizado', normalizedCnpj);
} else {
  console.warn('[Normalizer] ⚠️ CNPJ inválido após normalização', { original: input.cnpj });
}
```

### 5. SQL `process_qualification_job` (`supabase/migrations/20250208000002_fix_process_qualification_job_real.sql`)

**Correções:**
- ✅ Normaliza CNPJ antes de inserir em `qualified_prospects`
- ✅ Valida que tem 14 dígitos
- ✅ Salva `cnpj_raw` e `cnpj` normalizado
- ✅ Nunca usa "Empresa sem nome" - deixa `null` se não tiver

**Código SQL:**
```sql
-- Normalizar CNPJ (remover caracteres não numéricos)
v_cnpj_normalized := REGEXP_REPLACE(v_candidate.cnpj, '[^0-9]', '', 'g');

-- Validar que tem 14 dígitos
IF LENGTH(v_cnpj_normalized) != 14 THEN
  -- Marcar como failed
  CONTINUE;
END IF;

-- Salvar raw e normalizado
INSERT INTO qualified_prospects (
  cnpj,        -- ✅ Normalizado (14 dígitos)
  cnpj_raw,    -- ✅ Original (com máscara)
  razao_social -- ✅ Nunca "Empresa sem nome" - null se não tiver
) VALUES (...);
```

### 6. Modal de Preview (`src/pages/QualifiedProspectsStock.tsx`)

**Correções:**
- ✅ Mostra "CNPJ de origem (Excel)" e "CNPJ normalizado usado na análise"
- ✅ Mensagens claras sobre dados faltantes:
  - "Razão social não informada no lote e não encontrada nas fontes externas"
  - "Empresa não localizada nas bases externas para este CNPJ"
- ✅ Remove "Empresa sem nome" - mostra "Razão social não informada"

**UI:**
```tsx
{previewProspect.cnpj_raw ? (
  <>
    <p>CNPJ de origem (Excel):</p>
    <p>{previewProspect.cnpj_raw}</p>
    <p>CNPJ normalizado usado na análise:</p>
    <p>{previewProspect.cnpj}</p>
  </>
) : (
  <p>CNPJ normalizado: {previewProspect.cnpj}</p>
)}
```

### 7. Handler `handlePromoteToCompanies` (`src/pages/QualifiedProspectsStock.tsx`)

**Correções:**
- ✅ Logs de diagnóstico ao chamar normalizador
- ✅ Diferencia entre "CNPJ inválido" e "empresa não encontrada nas bases externas"

## 📋 Checklist de Validação

### Testes a Realizar:

1. **Importar CSV com CNPJs formatados**:
   - [ ] Verificar que `cnpj_raw` salva valor original (ex: "17.304.635/0001-85")
   - [ ] Verificar que `cnpj` salva normalizado (ex: "17304635000185")
   - [ ] Verificar logs: `[BulkUpload][fallback] ✅ Empresas válidas após normalização`

2. **Motor de Qualificação**:
   - [ ] Verificar que `process_qualification_job` normaliza CNPJ antes de inserir
   - [ ] Verificar que `qualified_prospects` tem `cnpj_raw` e `cnpj` preenchidos
   - [ ] Verificar que não há "Empresa sem nome" no banco

3. **Modal de Preview**:
   - [ ] Abrir preview de empresa qualificada
   - [ ] Verificar que mostra "CNPJ de origem" e "CNPJ normalizado"
   - [ ] Verificar mensagens claras sobre dados faltantes

4. **Normalizador Internacional**:
   - [ ] Verificar logs: `[Normalizer] 🔍 Buscando empresa para CNPJ normalizado`
   - [ ] Se não encontrar, verificar log: `[Normalizer] ⚠️ Empresa não encontrada nas bases externas`

## 🔍 Como Validar se Funcionou

### Console Logs Esperados:

```
[BulkUpload][fallback] ✅ Empresas válidas após normalização
[BulkUpload][fallback] ⚠️ CNPJ inválido após normalização { raw, normalized }
[Normalizer] 🔍 Buscando empresa para CNPJ normalizado 17304635000185
[Normalizer] ⚠️ Empresa não encontrada nas bases externas para CNPJ normalizado
[Qualified → Companies] 🔍 Chamando normalizador internacional { cnpj, cnpj_length, cnpj_raw }
```

### Banco de Dados:

```sql
-- Verificar que cnpj_raw e cnpj estão preenchidos
SELECT 
  cnpj_raw,
  cnpj,
  LENGTH(cnpj) as cnpj_length,
  company_name
FROM prospecting_candidates
WHERE tenant_id = '...'
LIMIT 10;

-- Verificar que não há "Empresa sem nome"
SELECT COUNT(*) 
FROM prospecting_candidates 
WHERE company_name = 'Empresa sem nome';
-- Deve retornar 0

-- Verificar que todos os CNPJs têm 14 dígitos
SELECT COUNT(*) 
FROM prospecting_candidates 
WHERE LENGTH(REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')) != 14;
-- Deve retornar 0
```

### UI:

- Modal de preview mostra:
  - "CNPJ de origem (Excel): 17.304.635/0001-85"
  - "CNPJ normalizado usado na análise: 17304635000185"
  - Mensagens claras sobre dados faltantes (não "CNPJ não encontrado")

## 🚨 Próximos Passos

1. **Aplicar Migrations**:
   - `20250209000001_add_cnpj_raw_to_tables.sql`
   - `20250208000002_fix_process_qualification_job_real.sql` (atualizado)

2. **Testar Fluxo Completo**:
   - Importar CSV com CNPJs formatados
   - Verificar que `cnpj_raw` e `cnpj` estão corretos
   - Verificar que motor de qualificação normaliza antes de processar
   - Verificar que modal mostra CNPJ de origem e normalizado

3. **Buscar e Corrigir Outras Mensagens**:
   - Buscar por "CNPJ não encontrado" no código
   - Substituir por mensagens mais claras
   - Buscar por "Empresa sem nome" e remover placeholders

