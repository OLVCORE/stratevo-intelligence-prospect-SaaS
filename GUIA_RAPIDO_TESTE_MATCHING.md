# 🎯 Guia Rápido: Testar Matching Sniper

## ⚠️ Problema Identificado

No SQL Editor do Supabase, `auth.uid()` não está disponível. Use as queries abaixo com IDs reais.

---

## 📋 Passo 1: Descobrir seus IDs

Execute no **Supabase SQL Editor**:

```sql
-- 1. Listar tenants
SELECT id, name, slug FROM public.tenants ORDER BY created_at DESC LIMIT 5;

-- 2. Listar ICPs do seu tenant (substitua TENANT_ID)
SELECT id, nome, icp_principal FROM public.icp_profiles_metadata 
WHERE tenant_id = 'TENANT_ID_AQUI'::UUID 
ORDER BY icp_principal DESC, created_at DESC;
```

**Anote os UUIDs retornados!**

---

## 📋 Passo 2: Extrair Inteligência do ICP

Execute no **Supabase SQL Editor** (substitua os UUIDs):

```sql
-- Extrair inteligência
SELECT public.extract_icp_intelligence_complete(
  'ICP_ID_AQUI'::UUID,
  'TENANT_ID_AQUI'::UUID
) as intelligence_id;

-- Verificar resultado
SELECT 
  setores_alvo,
  cnaes_alvo,
  nichos_alvo,
  versao_extracao,
  updated_at
FROM public.icp_intelligence_consolidated
WHERE icp_profile_metadata_id = 'ICP_ID_AQUI'::UUID;
```

**✅ Se retornar dados, a extração funcionou!**

---

## 📋 Passo 3: Gerar Supply Chain Mapping

### Opção A: Via Script TypeScript (Recomendado)

1. Crie arquivo `.env.local` na raiz:
```bash
VITE_SUPABASE_URL=https://vkdvezuivlovzqxmnohk.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
TENANT_ID=seu_tenant_id_aqui
ICP_ID=seu_icp_id_aqui
```

2. Execute:
```bash
npx tsx scripts/test-supply-chain-mapping.ts
```

### Opção B: Via Frontend (React)

No console do navegador (na página da aplicação):

```javascript
const response = await fetch('https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/generate-cnae-supply-chain-mapping', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    tenant_id: 'SEU_TENANT_ID',
    icp_id: 'SEU_ICP_ID' // opcional
  })
});

const result = await response.json();
console.log('Supply Chain:', result);
```

### Opção C: Via Postman/Insomnia

- **URL**: `https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/generate-cnae-supply-chain-mapping`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer SUA_ANON_KEY`
- **Body**:
```json
{
  "tenant_id": "seu-tenant-id",
  "icp_id": "seu-icp-id"
}
```

**✅ Verificar no banco:**
```sql
SELECT * FROM public.tenant_cnae_supply_chain
WHERE tenant_id = 'TENANT_ID_AQUI'::UUID;
```

---

## 📋 Passo 4: Testar Qualificação Sniper

1. **Faça upload de empresas** via `BulkUploadDialog` na aplicação
2. **Execute a qualificação** na página `QualificationEnginePage`
3. **Verifique os resultados**:

```sql
-- Verificar prospects qualificados
SELECT 
  cnpj,
  razao_social,
  fit_score,
  grade,
  cnae_match_principal,
  setor_match,
  methodology_explanation,
  match_reasons,
  match_breakdown
FROM public.qualified_prospects
WHERE tenant_id = 'TENANT_ID_AQUI'::UUID
  AND pipeline_status = 'new'
ORDER BY fit_score DESC
LIMIT 10;
```

**✅ Se `match_breakdown` e `methodology_explanation` estiverem preenchidos, funcionou!**

---

## 🔍 Troubleshooting

### ❌ "Usuário não possui tenant associado"
- **Causa**: `auth.uid()` não funciona no SQL Editor
- **Solução**: Use as queries com IDs reais (não use `extract_icp_intelligence_auto()`)

### ❌ "CNAE do tenant não encontrado"
- **Causa**: Onboarding não foi completado ou função `extract_tenant_cnae_from_onboarding` não existe
- **Solução**: 
  1. Verifique se completou o onboarding
  2. Execute: `SELECT * FROM public.extract_tenant_cnae_from_onboarding('TENANT_ID'::UUID);`

### ❌ "Supply Chain não gerado"
- **Causa**: Edge Function não foi chamada ou falhou
- **Solução**: 
  1. Verifique logs da Edge Function no Supabase Dashboard
  2. Verifique se `OPENAI_API_KEY` está configurada
  3. Tente novamente via script ou frontend

### ❌ "match_breakdown vazio"
- **Causa**: Função `process_qualification_job_sniper` não está preenchendo
- **Solução**: 
  1. Verifique se a função existe: `SELECT proname FROM pg_proc WHERE proname = 'process_qualification_job_sniper';`
  2. Verifique logs de erro no console do navegador

---

## ✅ Checklist Final

- [ ] Inteligência do ICP extraída (`icp_intelligence_consolidated` tem dados)
- [ ] Supply Chain gerado (`tenant_cnae_supply_chain` tem dados)
- [ ] Qualificação sniper executada
- [ ] `match_breakdown` preenchido nos prospects
- [ ] `methodology_explanation` preenchido nos prospects
- [ ] Prospects aparecem em `QualifiedProspectsStock` com `pipeline_status = 'new'`

---

## 🚀 Próximos Passos

Depois que tudo estiver funcionando:
1. Criar componentes de visualização (`QualificationMatchTooltip`, `QualificationMethodologyCard`)
2. Integrar tooltips na tabela `QualifiedProspectsStock`
3. Adicionar dashboard de analytics de matching

