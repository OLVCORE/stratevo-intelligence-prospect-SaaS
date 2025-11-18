# 🚀 DEPLOY VIA CLI - Passo a Passo Simples

**Situação:** Não há botão de edição no Dashboard  
**Solução:** Usar CLI do Supabase para deploy

---

## 📋 PASSO A PASSO

### 1. Instalar Supabase CLI (se não tiver)

```powershell
# Opção 1: Via npm (recomendado)
npm install -g supabase

# Opção 2: Via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Login no Supabase

```powershell
supabase login
```

Isso vai abrir o navegador para você fazer login.

### 3. Navegar para o diretório do projeto

```powershell
cd C:\Projects\olv-intelligence-prospect-v2
```

### 4. Fazer deploy de `simple-totvs-check`

```powershell
supabase functions deploy simple-totvs-check --project-ref qtcwetabhhkhvomcrqgm
```

### 5. Fazer deploy de `discover-all-technologies`

```powershell
supabase functions deploy discover-all-technologies --project-ref qtcwetabhhkhvomcrqgm
```

### 6. Verificar se funcionou

```powershell
supabase functions list --project-ref qtcwetabhhkhvomcrqgm
```

Você deve ver ambas as funções listadas.

---

## 🔄 ALTERNATIVA: Editar Diretamente no Dashboard

Se o CLI não funcionar, tente:

### No Dashboard do Supabase:

1. **Acesse:** https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions/simple-totvs-check/code

2. **No editor de código:**
   - Clique dentro da área do código (dentro do editor)
   - O código deve ficar editável
   - Selecione TODO o código (Ctrl+A)
   - Delete tudo (Delete ou Backspace)
   - Cole o novo código do arquivo local

3. **Clique no botão "Deploy updates"** (canto inferior direito)

4. **Repita para** `discover-all-technologies`

---

## ✅ APÓS DEPLOY

1. Frontend: `Ctrl + Shift + R` (hard refresh)
2. Abra relatório Klabin
3. **Aba TOTVS → Clique "Reverificar"** (importante para nova análise!)
4. Verifique que evidência "Ibema vai implementar S/4 Hana" NÃO aparece

---

## 🚨 Se CLI não funcionar

**Opção alternativa - Upload manual:**

1. Abra o arquivo local: `supabase/functions/simple-totvs-check/index.ts`
2. Copie TODO o conteúdo
3. No Dashboard, clique dentro do editor
4. Selecione tudo (Ctrl+A) e delete
5. Cole o novo código (Ctrl+V)
6. Clique "Deploy updates"

