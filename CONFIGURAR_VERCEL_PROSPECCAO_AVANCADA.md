# 🚀 Configurar Motor de Busca Avançada no Vercel

## ❌ Problema

O módulo de Prospecção Avançada não aparece no deploy do Vercel porque a **feature flag** `VITE_ENABLE_PROSPECCAO` não está configurada.

## ✅ Solução: Adicionar Variável de Ambiente no Vercel

### Passo 1: Acessar Configurações do Projeto

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto: **stratevo-intelligence-prospect-SaaS**
3. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar a Variável

1. Clique em **Add New**
2. Configure:
   - **Name:** `VITE_ENABLE_PROSPECCAO`
   - **Value:** `true`
   - **Environments:** Marque todas as opções:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

3. Clique em **Save**

### Passo 3: Fazer Novo Deploy

Após adicionar a variável, você precisa fazer um novo deploy:

**Opção 1: Deploy Automático (Recomendado)**
- Faça um commit vazio ou pequena alteração:
  ```bash
  git commit --allow-empty -m "chore: Ativar módulo de prospecção avançada no Vercel"
  git push
  ```

**Opção 2: Redeploy Manual**
- No Vercel Dashboard, vá em **Deployments**
- Clique nos **3 pontos** do último deploy
- Selecione **Redeploy**

### Passo 4: Verificar

Após o deploy:

1. Acesse a aplicação no Vercel
2. Abra o **Console do Navegador** (F12)
3. Procure por:
   ```
   [FLAGS] 🚩 Feature Flags Carregadas
   ENABLE_PROSPECCAO: true
   ```
4. Verifique se o item **"1.0 Motor de Busca Avançada"** aparece no menu lateral
5. Acesse `/prospeccao-avancada` diretamente

## 🔍 Troubleshooting

### ❌ Variável não aparece após deploy

**Verifique:**
1. ✅ A variável foi adicionada em **todas** as environments (Production, Preview, Development)?
2. ✅ O valor está como `true` (sem aspas, sem espaços)?
3. ✅ Foi feito um **novo deploy** após adicionar a variável?
4. ✅ O nome da variável está correto: `VITE_ENABLE_PROSPECCAO` (com `VITE_` no início)?

### ❌ Console mostra `ENABLE_PROSPECCAO: false`

**Causas possíveis:**
- Variável não foi configurada no Vercel
- Variável foi configurada apenas em um environment (ex: só Production)
- Deploy foi feito antes de adicionar a variável
- Nome da variável está incorreto (faltando `VITE_`)

**Solução:**
1. Verifique as Environment Variables no Vercel
2. Certifique-se de que está em **todos** os environments
3. Faça um novo deploy

### ✅ Verificar Variáveis Configuradas

No Vercel Dashboard:
- **Settings** → **Environment Variables**
- Você deve ver: `VITE_ENABLE_PROSPECCAO = true`

## 📝 Nota Importante

- Variáveis que começam com `VITE_` são expostas ao frontend
- Esta variável é uma **feature flag** e não contém dados sensíveis
- É seguro expor `VITE_ENABLE_PROSPECCAO=true` publicamente

## 🎯 Checklist Final

- [ ] Variável `VITE_ENABLE_PROSPECCAO=true` adicionada no Vercel
- [ ] Variável configurada em **todos** os environments
- [ ] Novo deploy realizado após adicionar a variável
- [ ] Console do navegador mostra `ENABLE_PROSPECCAO: true`
- [ ] Item "1.0 Motor de Busca Avançada" aparece no menu
- [ ] Rota `/prospeccao-avancada` está acessível

