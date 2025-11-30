# 🚨 CORREÇÕES URGENTES - RESUMO EXECUTIVO

## ✅ AÇÕES IMEDIATAS NECESSÁRIAS

### 1. EXECUTAR SCRIPT SQL (URGENTE)
```sql
-- Execute no Supabase SQL Editor:
-- VERIFICAR_E_CORRIGIR_ICPS_ONBOARDING.sql
```
**Por quê:** Corrige ICPs criados durante onboarding que não aparecem em "Meus ICPs"

### 2. SUBSTITUIR PROMPT DA IA (JÁ FEITO PARCIALMENTE)
O prompt em `supabase/functions/analyze-onboarding-icp/index.ts` foi atualizado com a primeira parte do prompt expandido. 

**PRÓXIMO PASSO:** Completar a substituição do formato de resposta JSON para incluir:
- `analise_macroeconomica`
- `analise_estatistica_clientes`
- `analise_cnaes_ncms`
- `analise_comercio_exterior`
- `previsoes`

### 3. VERIFICAR PERSISTÊNCIA DE DADOS
Os `useEffect` já estão implementados em todos os steps. Verificar se `reloadSessionFromDatabase()` está sendo chamado:
- ✅ Ao voltar para etapa anterior (`handleBack`)
- ✅ Ao clicar em step na progress bar (`handleStepClick`)
- ✅ Ao avançar para próxima etapa (`handleNext`)

### 4. BOTÃO FINALIZAR
✅ Já implementado no Step6 com label "Finalizar Onboarding"

## 📋 CONCEITO TENANT vs ASSINANTE

**TENANT = Empresa Cadastrada**
- Exemplo: OLV Internacional é um Tenant
- Cada Tenant tem seu próprio schema no banco
- Cada Tenant pode ter múltiplos ICPs (dependendo do plano)

**ASSINANTE = Quem Compra a Plataforma**
- Pode ter múltiplas empresas (múltiplos Tenants)
- O plano define limites de empresas e ICPs

**PLANOS:**
- FREE: 1 empresa, 1 ICP
- STARTER: 1 empresa, 3 ICPs
- GROWTH: 3 empresas, 5 ICPs/empresa
- ENTERPRISE: Ilimitado

## 🔍 PRÓXIMOS PASSOS

1. ✅ Executar `VERIFICAR_E_CORRIGIR_ICPS_ONBOARDING.sql`
2. ⏳ Completar substituição do prompt expandido
3. ✅ Verificar persistência de dados (já implementado)
4. ✅ Botão finalizar (já implementado)

