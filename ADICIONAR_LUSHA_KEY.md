# ✅ ADICIONAR LUSHA API KEY

## 📋 INSTRUÇÕES:

### 1️⃣ NO `.env.local` (LOCAL):
Adicione a seguinte linha:

```bash
LUSHA_API_KEY=f72937c7-cd70-4e01-931e-5ec3a5017e21
```

### 2️⃣ NO VERCEL (ENVIRONMENT VARIABLES):
- Vá em: **Project Settings → Environment Variables**
- Adicione:
  - **Key:** `LUSHA_API_KEY`
  - **Value:** `f72937c7-cd70-4e01-931e-5ec3a5017e21`
  - **Environments:** Production, Preview, Development

### 3️⃣ NO SUPABASE (EDGE FUNCTION SECRETS):
Execute no terminal:

```bash
supabase secrets set LUSHA_API_KEY=f72937c7-cd70-4e01-931e-5ec3a5017e21
```

Ou no Dashboard:
- Vá em: **Project Settings → Edge Functions → Manage secrets**
- Adicione:
  - **Name:** `LUSHA_API_KEY`
  - **Value:** `f72937c7-cd70-4e01-931e-5ec3a5017e21`

---

## ✅ APÓS ADICIONAR:
1. Reinicie o servidor local (`npm run dev`)
2. Faça redeploy no Vercel
3. As Edge Functions já terão acesso automático ao secret

