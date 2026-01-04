# 🚀 Como Ativar o Motor de Busca Avançada

## ✅ Passo 1: Criar/Editar arquivo `.env.local`

Crie um arquivo chamado `.env.local` na **raiz do projeto** (mesmo nível do `package.json`):

```bash
# Windows PowerShell
New-Item -Path .env.local -ItemType File -Force

# Ou crie manualmente no VS Code/Cursor
```

## ✅ Passo 2: Adicionar a variável

Adicione esta linha no arquivo `.env.local`:

```env
VITE_ENABLE_PROSPECCAO=true
```

**IMPORTANTE:**
- ✅ Use `true` (minúsculo) ou `1`
- ✅ Sem espaços antes ou depois do `=`
- ✅ Sem aspas
- ✅ O arquivo deve estar na **raiz do projeto**

## ✅ Passo 3: Reiniciar o servidor

**OBRIGATÓRIO:** Após criar/editar o `.env.local`, você DEVE:

1. **Parar o servidor** (Ctrl+C no terminal)
2. **Iniciar novamente:**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

## ✅ Passo 4: Verificar no Console

Abra o **Console do Navegador** (F12) e procure por:

```
[FLAGS] 🚩 Feature Flags Carregadas
ENABLE_PROSPECCAO: true
```

Se aparecer `ENABLE_PROSPECCAO: false`, a variável não foi lida corretamente.

## 🔍 Troubleshooting

### ❌ Item não aparece no menu

**Verifique:**

1. ✅ Arquivo `.env.local` existe na raiz do projeto?
2. ✅ Contém `VITE_ENABLE_PROSPECCAO=true` (sem espaços)?
3. ✅ Servidor foi **reiniciado** após criar/editar o arquivo?
4. ✅ Console mostra `ENABLE_PROSPECCAO: true`?

### ❌ Console mostra `ENABLE_PROSPECCAO: false`

**Soluções:**

1. Verifique se o arquivo está na raiz (mesmo nível do `package.json`)
2. Verifique se não há espaços: `VITE_ENABLE_PROSPECCAO=true` (correto)
3. Verifique se não está em `.env` (deve ser `.env.local`)
4. Reinicie o servidor completamente (Ctrl+C e iniciar novamente)

### ✅ Exemplo de `.env.local` completo

```env
# Feature Flags
VITE_ENABLE_PROSPECCAO=true

# Outras variáveis (se necessário)
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

## 📝 Nota Importante

- O arquivo `.env.local` **NÃO** deve ser commitado no Git (já está no `.gitignore`)
- Cada desenvolvedor precisa criar seu próprio `.env.local`
- Em produção, as variáveis devem ser configuradas no Vercel/plataforma de deploy

