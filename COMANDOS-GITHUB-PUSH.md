# 🚀 COMANDOS PARA GITHUB - OLV Intelligence Prospect v2

## ✅ REPOSITÓRIO: https://github.com/OLVCORE/olv-intelligence-prospect-v2

---

## 📝 PASSO 1: Preparar Commit

```powershell
cd c:\Projects\olv-intelligence-prospect-v2

# Verificar que .env.local NÃO vai subir
git status

# Você deve ver:
# - MUITOS arquivos novos
# - .env.local NÃO deve aparecer (está no .gitignore)
```

**⚠️ SE `.env.local` APARECER:**
```powershell
# Remover do staging
git reset .env.local

# Confirmar que .gitignore tem:
# .env*.local
# .env
```

---

## 📝 PASSO 2: Add & Commit

```powershell
# Adicionar TODOS os arquivos (exceto .env.local)
git add .

# Commit com mensagem clara
git commit -m "feat: OLV Intelligence v2.11 - 11 ciclos completos + multi-tenancy foundation

- 11 ciclos funcionais (Prospecção, SDR, Analytics, Alertas, etc.)
- Multi-tenancy com RLS e policies
- 160+ arquivos TypeScript
- 42 rotas API
- Pipeline CI/CD completo
- Zero mocks em 8.000+ linhas
- Documentação completa (65+ guias)"

# Tag de versão
git tag v2.11.0-foundation
```

---

## 📝 PASSO 3: Conectar ao GitHub

```powershell
# Adicionar remote (repositório já existe)
git remote add origin https://github.com/OLVCORE/olv-intelligence-prospect-v2.git

# Verificar remote
git remote -v
```

**Deve mostrar:**
```
origin  https://github.com/OLVCORE/olv-intelligence-prospect-v2.git (fetch)
origin  https://github.com/OLVCORE/olv-intelligence-prospect-v2.git (push)
```

---

## 📝 PASSO 4: Push para GitHub

```powershell
# Push principal
git push -u origin main

# Push tags
git push --tags
```

---

## ⚠️ SE DER ERRO "failed to push"

Pode ser que precise renomear branch:

```powershell
# Renomear para main (se estiver em master)
git branch -M main

# Push novamente
git push -u origin main --force-with-lease
```

---

## ✅ VALIDAÇÃO PÓS-PUSH

### 1. Acessar GitHub:
```
https://github.com/OLVCORE/olv-intelligence-prospect-v2
```

### 2. Verificar:
- [ ] Código apareceu no repositório
- [ ] README.md renderizado na página inicial
- [ ] **`.env.local` NÃO está visível** (protegido!)
- [ ] Tag `v2.11.0-foundation` aparece em "Releases"

### 3. Confirmar Segurança:
```
# No GitHub, buscar por "SERVICE_ROLE"
# NÃO deve encontrar chaves, apenas process.env.SERVICE_ROLE_KEY
```

---

## 🔒 GARANTIAS DE SEGURANÇA

### ✅ Protegido pelo .gitignore:
- `.env.local`
- `.env`
- `.env*.local`
- `node_modules`
- `.vercel`

### ✅ Sem Chaves Hardcoded:
- Apenas `process.env.XXX` no código
- Service Role Key nunca exposta

### ✅ .env.example (Público):
- Apenas NOMES de variáveis
- SEM valores reais
- Guia para desenvolvedores

---

## 🎯 APÓS PUSH NO GITHUB

**Me avise:** "Fiz push no GitHub!"

**Eu vou:**
1. ✅ Verificar que tudo está correto
2. ✅ Te guiar no deploy Vercel
3. ✅ Validar configuração de ENV no Vercel

---

## 📞 SUPORTE

Se algum comando falhar:
1. Me mostre a mensagem de erro COMPLETA
2. Me diga qual passo falhou
3. Eu te dou o fix imediato

---

**EXECUTE OS COMANDOS E ME AVISE! 🚀**

