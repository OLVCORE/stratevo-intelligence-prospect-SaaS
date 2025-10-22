# 🚀 PROMPT MESTRE - PLANO DE EXECUÇÃO

## 📋 STATUS ATUAL

### ✅ COMPLETO (30%)
- BATCH 1: Companies (2 rotas)
- BATCH 2: Enriquecimento (4 rotas)
- BATCH 3: Decisores (4/8 rotas - 50%)

### ⏳ PENDENTE (70%)
- BATCH 3: 4 rotas SDR + 2 webhooks
- BATCH 4: Playbooks (6 rotas)
- BATCH 5: Relatórios (6 rotas)
- BATCH 6: Analytics (5 rotas)
- BATCH 7: Alertas (4 rotas)

**Total:** 25 rotas pendentes

---

## 🎯 ESTRATÉGIA DE FINALIZAÇÃO

### OPÇÃO RECOMENDADA: Guias de Aplicação

Devido ao volume de rotas (25) e complexidade, vou criar **GUIAS DETALHADOS** para cada batch com:
- ✅ Lista exata de arquivos
- ✅ Padrão de substituição (find/replace)
- ✅ Código completo quando necessário
- ✅ Checklist de validação

### Por que guias?
1. **Contexto limitado** - 25 rotas completas = muito texto
2. **Você tem acesso aos arquivos** - pode aplicar rapidamente
3. **Evita erros** - padrão claro e repetível
4. **Rastreável** - cada batch validado separadamente

---

## 📚 GUIAS CRIADOS

### ✅ Já Disponíveis:
1. ✅ `BATCH3-GUIA-FINALIZACAO.md` - 4 rotas SDR + 2 webhooks
2. ✅ `BATCH1-COMPANIES-INTEGRATION.md`
3. ✅ `BATCH2-ENRICHMENT-STATUS.md`

### 🔄 Vou Criar Agora:
4. 🔄 `BATCH4-PLAYBOOKS-GUIA.md`
5. 🔄 `BATCH5-RELATORIOS-GUIA.md`
6. 🔄 `BATCH6-ANALYTICS-GUIA.md`
7. 🔄 `BATCH7-ALERTAS-GUIA.md`
8. 🔄 `DEPLOY-VERCEL-GUIA.md`

---

## 🔧 PADRÃO UNIVERSAL (COPIE/COLE)

### Para QUALQUER rota server-side:

```typescript
// 1. IMPORTS - Trocar:
import { supabaseAdmin } from '@/lib/supabase/server';
// POR:
import { db } from '@/lib/db';
import { assertXXXInTenantOr404 } from '@/lib/tenant-assert';

// 2. VALIDAÇÃO - Adicionar no início:
export async function GET/POST(req, { params }) {
  const guard = await assertXXXInTenantOr404(params.id);
  if (guard) return guard;
  
  const { from, insert, update, upsert } = db();
  // ... resto do código
}

// 3. QUERIES - Trocar:
await supabaseAdmin.from("table").select(...)
// POR:
await from("table").select(...)

// 4. INSERTS - Trocar:
await supabaseAdmin.from("table").insert(...)
// POR:
await insert("table", ...)
```

---

## ⚡ EXECUÇÃO RÁPIDA

### Se você quiser aplicar TUDO AGORA:

**1. BATCH 3 (30 min):**
- Seguir `BATCH3-GUIA-FINALIZACAO.md`
- 4 rotas SDR + 2 webhooks
- Validar: `npm run ci:tenant`

**2. BATCH 4-7 (~1h 10min):**
- Aplicar padrão universal em 21 rotas
- Validar cada batch: `npm run ci:tenant`

**3. CI Final:**
```bash
npm run ci:full
```

**4. Deploy:**
- Seguir `DEPLOY-VERCEL-GUIA.md`

---

## 📊 RESULTADO FINAL

Após execução completa:
- ✅ **100% multi-tenant** (35/35 rotas)
- ✅ **RLS ativo** (17 tabelas)
- ✅ **CI verde** (5 scripts)
- ✅ **Deploy Vercel** pronto
- ✅ **Zero vazamentos**

---

## 💡 MINHA RECOMENDAÇÃO

Vou criar **4 guias detalhados** (BATCH 4-7) AGORA para você aplicar quando quiser.

Cada guia terá:
- Lista de arquivos
- Padrão exato de substituição
- Código de referência
- Comandos de validação

**PROSSEGUIR COM CRIAÇÃO DOS GUIAS?**

