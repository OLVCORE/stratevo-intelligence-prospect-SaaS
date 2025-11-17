# 🚀 DEPLOY URGENTE: Correção Validação Crítica (Ibema/Klabin)

**Data:** 17/11/2025  
**Objetivo:** Deployar correção que rejeita falsos positivos (Ibema em evidências de Klabin)

---

## ⚡ SITUAÇÃO

**Problema:**
- Evidência "Ibema vai implementar S/4 Hana" aparece para Klabin (falso positivo)
- Código corrigido localmente ✅
- Frontend ainda mostra dados antigos ❌
- **Motivo:** Edge Functions não foram deployadas no Supabase

**Solução:**
- Fazer deploy das Edge Functions atualizadas
- Frontend automaticamente usará versão corrigida

---

## 🎯 EDGE FUNCTIONS QUE PRECISAM SER DEPLOYADAS

### 1. `simple-totvs-check`
**Localização:** `supabase/functions/simple-totvs-check/index.ts`

**O que foi corrigido:**
- ✅ Validação de título que rejeita outra empresa do mesmo setor
- ✅ Lista de empresas do mesmo setor (Ibema, Suzano, Klabin, etc.)
- ✅ Rejeita "Ibema vai implementar S/4 Hana" quando investigando Klabin

### 2. `discover-all-technologies`
**Localização:** `supabase/functions/discover-all-technologies/index.ts`

**O que foi corrigido:**
- ✅ Mesma validação de título aplicada
- ✅ Rejeita competidores incorretos do mesmo setor

---

## 📋 OPÇÃO A: DEPLOY VIA DASHBOARD (RECOMENDADO - 15 MINUTOS)

### PASSO 1: Abrir Dashboard Supabase

```
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
```

### PASSO 2: Deploy `simple-totvs-check`

1. **Clique em "Deploy a new function"** ou encontre `simple-totvs-check` existente
2. Se já existe: **Clique no nome da função → "Edit" → "Update"**
3. Se não existe: **Clique "Deploy a new function"**

4. **Configure:**
   - **Name:** `simple-totvs-check`
   - **Region:** Choose automatic

5. **Cole o código:**
   - Abra: `supabase/functions/simple-totvs-check/index.ts`
   - Copie TODO o conteúdo do arquivo
   - Cole no editor do Dashboard

6. **Verifique variáveis de ambiente:**
   - No Dashboard → Settings → Edge Functions → Environment Variables
   - Certifique-se de que existem:
     - `OPENAI_API_KEY`
     - `SERPER_API_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

7. **Clique "DEPLOY"** ou "UPDATE"

8. **Aguarde 30-60 segundos** até status mostrar "Active"

---

### PASSO 3: Deploy `discover-all-technologies`

1. **Repita o processo acima** para `discover-all-technologies`
2. **Name:** `discover-all-technologies`
3. **Cole o código de:** `supabase/functions/discover-all-technologies/index.ts`

---

## 📋 OPÇÃO B: DEPLOY VIA CLI (SE TIVER SUPABASE CLI INSTALADO)

### Verificar se CLI está instalado:

```powershell
supabase --version
```

### Se NÃO estiver instalado, instalar:

```powershell
# Via npm
npm install -g supabase

# OU via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Login no Supabase:

```powershell
supabase login
```

### Deploy das funções:

```powershell
# Navegar para diretório do projeto
cd C:\Projects\olv-intelligence-prospect-v2

# Deploy simple-totvs-check
supabase functions deploy simple-totvs-check --project-ref qtcwetabhhkhvomcrqgm

# Deploy discover-all-technologies
supabase functions deploy discover-all-technologies --project-ref qtcwetabhhkhvomcrqgm
```

---

## ✅ APÓS DEPLOY - TESTE OBRIGATÓRIO

### 1. Limpar Cache do Frontend:

```
Ctrl + Shift + R (Hard Refresh)
```

### 2. Limpar Cache do Supabase:

**No Dashboard:**
- Edge Functions → Logs → Limpar logs antigos
- Ou simplesmente aguardar 1-2 minutos para propagação

### 3. Testar com Klabin:

1. **Abrir relatório de Klabin S.A.**
2. **Aba TOTVS** → Clicar "Verificar" ou "Reverificar"
3. **Aguardar análise completa (20-30s)**
4. **Verificar resultados:**
   - ❌ **NÃO deve aparecer:** "Ibema vai implementar S/4 Hana"
   - ✅ **Deve aparecer:** Apenas evidências que mencionam Klabin diretamente

### 4. Testar na Aba Competidores:

1. **Aba Competitors** → Processar análise
2. **Verificar que não aparecem** evidências de Ibema para Klabin

---

## 🔍 VERIFICAÇÃO DE SUCESSO

### Logs das Edge Functions:

**No Dashboard:**
```
Edge Functions → simple-totvs-check → Logs
```

**Procure por:**
```
[SIMPLE-TOTVS] ❌ Rejeitado: Título menciona outra empresa do mesmo setor sem mencionar a investigada
[SIMPLE-TOTVS] 🏢 Empresa investigada: Klabin
[SIMPLE-TOTVS] 🏢 Empresa mencionada no título: Ibema
```

**Se aparecer esse log = ✅ FUNCIONANDO!**

---

## 🚨 TROUBLESHOOTING

### Problema: Deploy falha

**Solução:**
- Verificar se todas as variáveis de ambiente estão configuradas
- Verificar se código não tem erros de sintaxe
- Verificar logs de erro no Dashboard

### Problema: Frontend ainda mostra dados antigos

**Solução:**
1. **Hard Refresh:** `Ctrl + Shift + R`
2. **Limpar cache do navegador:** `Ctrl + Shift + Delete`
3. **Aguardar 2-3 minutos** para propagação completa
4. **Verificar se Edge Function foi realmente atualizada:**
   - Dashboard → Functions → Ver data de último deploy

### Problema: Evidências antigas ainda aparecem

**Solução:**
- As evidências já salvas no banco continuam aparecendo
- **É necessário RE-PROCESSAR a análise** (clicar "Reverificar")
- O sistema usa cache do banco (evita reprocessar tudo)
- Para forçar nova análise, clicar "Atualizar" ou "Reverificar"

---

## 📊 CHECKLIST DE DEPLOY

- [ ] Deploy `simple-totvs-check` concluído
- [ ] Deploy `discover-all-technologies` concluído
- [ ] Edge Functions mostram status "Active" no Dashboard
- [ ] Variáveis de ambiente verificadas
- [ ] Frontend feito Hard Refresh (`Ctrl + Shift + R`)
- [ ] Teste realizado com Klabin
- [ ] Evidência "Ibema vai implementar S/4 Hana" foi rejeitada
- [ ] Logs mostram mensagem de rejeição correta

---

## 🎯 TEMPO ESTIMADO

- **Via Dashboard:** 15 minutos (5 min cada função + verificação)
- **Via CLI:** 5 minutos (se CLI já estiver configurado)

---

## 💡 IMPORTANTE

**Após deploy, é necessário RE-PROCESSAR as análises para ver o efeito:**

1. As evidências antigas (já salvas) continuam no banco
2. Novas análises usam a versão corrigida das Edge Functions
3. Para ver correção, clique "Reverificar" ou "Atualizar" na aba TOTVS/Competitors

---

**🚀 RECOMENDAÇÃO: Use Dashboard (Opção A) - Mais confiável e visual**

