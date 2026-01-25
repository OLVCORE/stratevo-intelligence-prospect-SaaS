# 🔧 Troubleshooting: Enriquecimento Apollo e Erro 500

## ✅ Correções Aplicadas

### 1. **Modal de Progresso - Erro 500**
- ✅ Adicionado `DialogDescription` para resolver warning de acessibilidade
- ✅ Estrutura do componente corrigida (divs fechadas corretamente)
- ✅ Layout flexbox com overflow controlado

### 2. **Atualização de Dados Apollo**
- ✅ Edge Function agora atualiza `icp_analysis_results` corretamente
- ✅ Invalidação de queries corrigida (`approved-companies` em vez de apenas `icp-quarantine`)
- ✅ Refetch automático após enriquecimento

### 3. **Dados Salvos Corretamente**
- ✅ Decisores salvos em `decision_makers` table
- ✅ Dados da organização salvos em `companies.raw_data`
- ✅ Dados sincronizados em `icp_analysis_results.raw_analysis`

---

## 🚨 Se o Erro 500 Persistir

### **Solução 1: Limpar Cache do Vite**

```bash
# Parar o servidor (Ctrl+C)
# Limpar cache e node_modules
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

**No Windows PowerShell:**
```powershell
# Parar o servidor (Ctrl+C)
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm run dev
```

### **Solução 2: Reinstalar Dependências**

```bash
# Limpar tudo
rm -rf node_modules
rm -rf .vite
rm package-lock.json

# Reinstalar
npm install
npm run dev
```

**No Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

### **Solução 3: Verificar Erros no Console do Vite**

1. Abra o terminal onde o Vite está rodando
2. Procure por erros de compilação TypeScript/ESLint
3. Verifique se há erros de importação de módulos

### **Solução 4: Verificar Arquivo EnrichmentProgressModal.tsx**

Se o erro persistir, verifique se o arquivo está salvo corretamente:
- ✅ Deve ter exatamente 150 linhas
- ✅ Deve exportar `EnrichmentProgress` interface
- ✅ Deve exportar `EnrichmentProgressModal` function
- ✅ Deve importar `DialogDescription` de `@/components/ui/dialog`

---

## 🔍 Verificações Adicionais

### **1. Verificar se os Dados Estão Sendo Salvos**

Após executar o enriquecimento Apollo, verifique no console do navegador:

```javascript
// No console do navegador, após enriquecimento:
// Deve aparecer:
[ENRICH-APOLLO] ✅ X decisores salvos em decision_makers
[ENRICH-APOLLO] ✅ Dados atualizados em icp_analysis_results
```

### **2. Verificar Logs da Edge Function**

No Supabase Dashboard:
1. Vá para **Edge Functions** → **enrich-apollo-decisores**
2. Clique em **Logs**
3. Verifique se há erros durante a execução

### **3. Verificar Dados no Banco**

Execute no Supabase SQL Editor:

```sql
-- Verificar se decisores foram salvos
SELECT 
  dm.company_id,
  dm.name,
  dm.title,
  dm.linkedin_url,
  c.razao_social
FROM decision_makers dm
JOIN companies c ON c.id = dm.company_id
ORDER BY dm.created_at DESC
LIMIT 10;

-- Verificar se icp_analysis_results foi atualizado
SELECT 
  id,
  razao_social,
  decision_makers_count,
  linkedin_url,
  raw_analysis->>'apollo_enriched_at' as apollo_enriched_at,
  raw_analysis->'apollo_organization'->>'name' as apollo_org_name
FROM icp_analysis_results
WHERE status = 'aprovada'
  AND raw_analysis->>'apollo_enriched_at' IS NOT NULL
LIMIT 10;
```

---

## 📊 Fluxo de Dados Esperado

1. **Frontend** → Chama `enrichApolloMutation.mutateAsync(companyId)`
2. **Edge Function** → `enrich-apollo-decisores`:
   - Busca decisores no Apollo.io
   - Salva em `decision_makers` table
   - Atualiza `companies.raw_data`
   - Atualiza `icp_analysis_results.raw_analysis`
3. **Frontend** → Invalida queries e refetch:
   - `['approved-companies']`
   - `['icp-quarantine']`
   - `['companies']`
4. **UI** → Atualiza automaticamente com novos dados

---

## ⚠️ Problemas Conhecidos e Soluções

### **Problema: Dados não aparecem após enriquecimento**

**Solução:**
1. Verificar se `company_id` existe na empresa
2. Verificar logs da Edge Function
3. Forçar refresh manual: `refetch()` após enriquecimento

### **Problema: Erro 500 ao importar módulo**

**Solução:**
1. Limpar cache do Vite (ver Solução 1 acima)
2. Verificar se há erros de sintaxe no arquivo
3. Reiniciar o servidor de desenvolvimento

### **Problema: Modal não mostra progresso**

**Solução:**
1. Verificar se `enrichmentProgress` state está sendo atualizado
2. Verificar se `setEnrichmentModalOpen(true)` está sendo chamado
3. Verificar console para erros de renderização

---

## 🎯 Próximos Passos

1. ✅ Limpar cache do Vite
2. ✅ Reiniciar servidor de desenvolvimento
3. ✅ Testar enriquecimento Apollo em uma empresa
4. ✅ Verificar logs no console do navegador
5. ✅ Verificar dados no banco de dados

Se o problema persistir após essas etapas, verifique:
- Logs da Edge Function no Supabase Dashboard
- Erros no console do navegador
- Erros no terminal do Vite
