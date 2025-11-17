# ⚡ QUICK DEPLOY - Correção Ibema/Klabin

**O que aconteceu:**
- ✅ Código corrigido localmente
- ❌ Frontend ainda mostra dados antigos porque Edge Functions no Supabase estão desatualizadas

**Solução:**
Fazer deploy das Edge Functions atualizadas no Supabase

---

## 🎯 PASSO A PASSO RÁPIDO (10 MINUTOS)

### 1. Abrir Dashboard Supabase

```
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
```

### 2. Deploy `simple-totvs-check`

1. Procure por `simple-totvs-check` na lista de funções
2. Clique no nome → "Edit" ou "Update"
3. Abra o arquivo local: `supabase/functions/simple-totvs-check/index.ts`
4. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
5. Cole no editor do Dashboard (Ctrl+V)
6. Clique "DEPLOY" ou "UPDATE"
7. Aguarde ~30 segundos

### 3. Deploy `discover-all-technologies`

1. Procure por `discover-all-technologies` (ou crie se não existir)
2. Repita passos 3-7 acima usando arquivo: `supabase/functions/discover-all-technologies/index.ts`

### 4. Testar

1. Frontend: `Ctrl + Shift + R` (hard refresh)
2. Abra relatório Klabin
3. Aba TOTVS → Clique "Reverificar" (importante!)
4. Aguarde nova análise
5. Verificar: evidência "Ibema vai implementar S/4 Hana" NÃO deve aparecer

---

## ⚠️ IMPORTANTE

**Você precisa RE-PROCESSAR a análise para ver a correção!**

- Evidências antigas (já salvas) continuam no banco
- Clique "Reverificar" ou "Atualizar" para gerar nova análise com código corrigido
- Só assim verá os falsos positivos sendo rejeitados

---

## 🔍 Verificar se funcionou

**Logs no Dashboard:**
```
Edge Functions → simple-totvs-check → Logs
```

Procure por:
```
❌ Rejeitado: Título menciona outra empresa do mesmo setor
🏢 Empresa mencionada no título: Ibema
```

Se aparecer = ✅ **FUNCIONANDO!**

---

**Guia completo:** Ver `DEPLOY_VALIDATION_CRITICAL_FIX.md`

