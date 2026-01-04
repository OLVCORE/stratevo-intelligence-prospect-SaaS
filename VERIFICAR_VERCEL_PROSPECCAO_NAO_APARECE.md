# 🔍 Verificar Por Que Módulo Não Aparece no Vercel

## ✅ Variável Configurada Corretamente

Você já configurou:
- **Name:** `VITE_ENABLE_PROSPECCAO`
- **Value:** `true`
- **Environments:** All Environments

## 🔍 Possíveis Causas

### 1. **Deploy Necessário Após Adicionar Variável**

Após adicionar uma variável de ambiente no Vercel, você **DEVE** fazer um novo deploy:

**Opção A: Redeploy Manual**
1. Vá em **Deployments** no Vercel Dashboard
2. Clique nos **3 pontos** do último deploy
3. Selecione **Redeploy**
4. Aguarde o deploy completar

**Opção B: Commit Vazio (Trigger Automático)**
```bash
git commit --allow-empty -m "chore: Trigger redeploy para ativar VITE_ENABLE_PROSPECCAO"
git push
```

### 2. **Verificar se Variável Está em TODOS os Environments**

No Vercel Dashboard:
- **Settings** → **Environment Variables**
- Verifique se `VITE_ENABLE_PROSPECCAO` está marcada em:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

### 3. **Verificar Nome da Variável**

Certifique-se de que o nome está **exatamente** assim:
- ✅ `VITE_ENABLE_PROSPECCAO` (com `VITE_` no início)
- ❌ `ENABLE_PROSPECCAO` (sem `VITE_`)

### 4. **Verificar no Console do Navegador**

Após o deploy, abra o console do navegador (F12) e procure por:

```
[FLAGS] 🚩 Feature Flags Carregadas
ENABLE_PROSPECCAO: true
```

Se aparecer `ENABLE_PROSPECCAO: false`, a variável não foi lida corretamente.

### 5. **Limpar Cache do Navegador**

Às vezes o navegador pode estar usando uma versão antiga em cache:
- **Chrome/Edge:** Ctrl+Shift+R (hard refresh)
- **Firefox:** Ctrl+F5
- Ou abra em **Modo Anônimo**

## 🎯 Checklist de Verificação

- [ ] Variável `VITE_ENABLE_PROSPECCAO=true` configurada no Vercel
- [ ] Variável configurada em **todos** os environments (Production, Preview, Development)
- [ ] Novo deploy realizado após adicionar a variável
- [ ] Console do navegador mostra `ENABLE_PROSPECCAO: true`
- [ ] Cache do navegador limpo (hard refresh)
- [ ] Item "1.0 Motor de Busca Avançada" aparece no menu lateral
- [ ] Rota `/prospeccao-avancada` está acessível

## 🚨 Se Ainda Não Funcionar

1. **Verificar Logs do Build no Vercel:**
   - Vá em **Deployments** → Clique no deploy mais recente
   - Veja os **Build Logs**
   - Procure por erros relacionados a variáveis de ambiente

2. **Verificar se o Código Foi Deployado:**
   - Confirme que o commit com o módulo foi deployado
   - Verifique se o arquivo `src/modules/prospeccao-avancada/` existe no deploy

3. **Testar Localmente:**
   - Crie um arquivo `.env.local` com `VITE_ENABLE_PROSPECCAO=true`
   - Execute `npm run dev`
   - Verifique se o módulo aparece localmente

## 📝 Nota Importante

Variáveis de ambiente no Vercel são injetadas **durante o build**, não em runtime. Por isso, é necessário fazer um novo deploy após adicionar/modificar variáveis.

