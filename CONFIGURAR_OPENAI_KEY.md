# 🔑 CONFIGURAR OPENAI API KEY

## ✅ **SUA CHAVE:**

```
VITE_OPENAI_API_KEY=sk-proj-[SUA_CHAVE_AQUI]
```

---

## 🚀 **COMO ADICIONAR:**

### **1. Criar arquivo `.env.local`**

Na raiz do projeto (`C:\Projects\olv-intelligence-prospect-v2`), crie o arquivo `.env.local` com este conteúdo:

```env
# STRATEVO INTELLIGENCE - ENVIRONMENT VARIABLES

# SUPABASE (STRATEVO PROJECT)
VITE_SUPABASE_URL=https://qtcwetabhhkhvomcrqgm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y3dldGFiaGhraHZvbWNycWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0MjYyODAsImV4cCI6MjA0NTAwMjI4MH0.pTEYLVx5hbVuLDFKfVh0_H-WKJkp5oBkwKbJ28CHG4o

# OPENAI (PARA PLAUD + OUTRAS IAs)
VITE_OPENAI_API_KEY=sk-proj-[SUA_CHAVE_AQUI]

# OUTRAS APIs (já existentes)
VITE_APOLLO_API_KEY=TiwPX9bmdP0GuHijED57GQ
VITE_SERPER_API_KEY=e3f0cea1f488828c6025c5894f16fae93f4da6db
HUNTER_API_KEY=02e8e5e7d9c20945f0243eeaab724f3f1fa72dab
LUSHA_API_KEY=f72937c7-cd70-4e01-931e-5ec3a5017e21
```

---

## 🔄 **2. Reiniciar Servidor**

No terminal PowerShell:

```powershell
# Parar servidor (Ctrl+C)
# Depois reiniciar:
cd C:\Projects\olv-intelligence-prospect-v2
npm run dev
```

---

## ✅ **3. Testar!**

Após reiniciar:

1. Acesse: http://localhost:5173
2. Vá para SDR Pipeline
3. Abra um deal
4. Clique na aba "Calls"
5. Clique "Importar Call"
6. Cole transcrição
7. 🎉 **Deve funcionar!**

---

**Está pronto!** Basta criar o `.env.local` e reiniciar! 🚀

