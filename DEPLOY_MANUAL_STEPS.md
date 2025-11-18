# 🚀 DEPLOY MANUAL - Passo a Passo Detalhado

**Problema:** Dashboard do Supabase reverte o código  
**Solução:** Usar CLI do Supabase para deploy direto

---

## 📋 OPÇÃO 1: Script Automático (RECOMENDADO)

### Passo 1: Executar Script PowerShell

```powershell
# No PowerShell, navegue para o diretório do projeto
cd C:\Projects\olv-intelligence-prospect-v2

# Execute o script
.\deploy-edge-functions.ps1
```

O script vai:
1. ✅ Verificar se CLI está instalado
2. ✅ Pedir para fazer login (se necessário)
3. ✅ Fazer deploy de `simple-totvs-check`
4. ✅ Fazer deploy de `discover-all-technologies`

---

## 📋 OPÇÃO 2: Deploy Manual via CLI

### Passo 1: Login no Supabase

```powershell
supabase login
```

Isso vai abrir o navegador. Faça login e autorize.

### Passo 2: Navegar para o projeto

```powershell
cd C:\Projects\olv-intelligence-prospect-v2
```

### Passo 3: Deploy `simple-totvs-check`

```powershell
supabase functions deploy simple-totvs-check --project-ref qtcwetabhhkhvomcrqgm
```

### Passo 4: Deploy `discover-all-technologies`

```powershell
supabase functions deploy discover-all-technologies --project-ref qtcwetabhhkhvomcrqgm
```

---

## 📋 OPÇÃO 3: Deploy via Dashboard (ALTERNATIVA)

Se o CLI não funcionar, tente esta abordagem no Dashboard:

### Passo 1: Deletar e Recriar a Função

1. **No Dashboard:**
   - Vá para: Edge Functions → `simple-totvs-check`
   - Clique em **"Delete"** ou **"Remove"** (se disponível)
   - Confirme a deleção

2. **Criar Nova Função:**
   - Clique **"Deploy a new function"**
   - Name: `simple-totvs-check`
   - Cole TODO o código de: `supabase/functions/simple-totvs-check/index.ts`
   - Clique **"Deploy"**

### Passo 2: Repetir para `discover-all-technologies`

---

## ✅ VERIFICAÇÃO

Após deploy, verifique:

### 1. Verificar se deploy foi bem-sucedido

```powershell
supabase functions list --project-ref qtcwetabhhkhvomcrqgm
```

Você deve ver ambas as funções listadas.

### 2. Verificar logs

No Dashboard:
- Edge Functions → `simple-totvs-check` → Logs
- Procure por: `❌ Rejeitado: Título menciona outra empresa do mesmo setor`

### 3. Testar no Frontend

1. Frontend: `Ctrl + Shift + R` (hard refresh)
2. Abra relatório Klabin
3. **Aba TOTVS → Clique "Reverificar"** (importante!)
4. Verifique que evidência "Ibema vai implementar S/4 Hana" **NÃO aparece**

---

## 🚨 TROUBLESHOOTING

### Erro: "Not authenticated"

**Solução:**
```powershell
supabase login
```

### Erro: "Function not found"

**Solução:**
- Verifique se o nome da função está correto
- Verifique se está no diretório correto: `supabase/functions/simple-totvs-check/`

### Erro: "Permission denied"

**Solução:**
- Verifique se você tem permissão no projeto Supabase
- Verifique se o `project-ref` está correto: `qtcwetabhhkhvomcrqgm`

### Dashboard ainda mostra código antigo

**Solução:**
- Aguarde 1-2 minutos após deploy
- Faça hard refresh no Dashboard: `Ctrl + Shift + R`
- Verifique a data/hora do último deploy no Dashboard

---

## 🎯 RECOMENDAÇÃO

**Use a OPÇÃO 1 (Script Automático)** - É mais rápida e confiável!

