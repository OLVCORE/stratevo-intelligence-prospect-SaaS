# 📝 COMO EDITAR CÓDIGO NO DASHBOARD DO SUPABASE

**Situação:** Você está vendo o código no Dashboard, mas não encontra botão de edição  
**Solução:** Editar diretamente no editor de código

---

## 🎯 INSTRUÇÕES PASSO A PASSO

### No Dashboard do Supabase:

1. **Você está em:** 
   ```
   https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions/simple-totvs-check/code
   ```

2. **No editor de código:**
   - **Clique dentro da área do código** (qualquer lugar dentro do editor onde o código está)
   - O editor deve ficar **editável** (cursor piscando)
   - Se não ficar editável, tente clicar várias vezes ou dar duplo clique

3. **Substituir TODO o código:**
   - Selecione TUDO: `Ctrl + A`
   - Delete tudo: `Delete` ou `Backspace`
   - Abra o arquivo local: `supabase/functions/simple-totvs-check/index.ts`
   - Copie TODO o conteúdo: `Ctrl + A` → `Ctrl + C`
   - Volte para o Dashboard
   - Cole no editor: `Ctrl + V`

4. **Deployar:**
   - Procure pelo botão **"Deploy updates"** no canto inferior direito (verde)
   - OU procure por **"Update"** ou **"Save"** no topo
   - Clique nele

5. **Aguarde ~30 segundos** até aparecer mensagem de sucesso

---

## 🔄 ALTERNATIVA: Usar "Replace" ou "Upload"

Se o editor não ficar editável, tente:

### Opção 1: Botão "Replace" ou "Upload File"
- Procure no topo do editor por botões como:
  - "Replace"
  - "Upload"
  - "Replace file"
  - Ícone de upload (seta para cima)

### Opção 2: Menu de contexto (clique direito)
- Clique com botão direito no arquivo `index.ts` na lista de arquivos à esquerda
- Procure por opções como:
  - "Replace"
  - "Edit"
  - "Upload new version"

---

## 🚀 APÓS EDITAR `simple-totvs-check`

Repita o processo para `discover-all-technologies`:

1. Acesse:
   ```
   https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions/discover-all-technologies/code
   ```

2. Se não existir, clique **"Deploy a new function"**:
   - Name: `discover-all-technologies`
   - Cole o código de: `supabase/functions/discover-all-technologies/index.ts`

3. Deploy

---

## ✅ TESTAR

1. Frontend: `Ctrl + Shift + R` (hard refresh)
2. Abra relatório Klabin
3. **Aba TOTVS → Clique "Reverificar"** (importante!)
4. Verifique: evidência "Ibema vai implementar S/4 Hana" NÃO deve aparecer

---

## 🆘 SE NADA FUNCIONAR

**Opção Final:** Usar Supabase CLI via Scoop (Windows):

```powershell
# Instalar Scoop (se não tiver)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Login
supabase login

# Deploy
cd C:\Projects\olv-intelligence-prospect-v2
supabase functions deploy simple-totvs-check --project-ref qtcwetabhhkhvomcrqgm
supabase functions deploy discover-all-technologies --project-ref qtcwetabhhkhvomcrqgm
```

