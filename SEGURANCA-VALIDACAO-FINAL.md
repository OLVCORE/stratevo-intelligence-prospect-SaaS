# 🔒 VALIDAÇÃO FINAL DE SEGURANÇA - PRÉ-PUSH GITHUB

## ✅ CHECKLIST DE SEGURANÇA (CRÍTICO!)

---

## 🛡️ 1. GITIGNORE ATIVO

### Verificar Proteções:

```bash
cat .gitignore | grep -E "env|local"
```

**Deve mostrar:**
```
.env*.local  ← PROTEGE .env.local
.env         ← PROTEGE .env
```

✅ **CONFIRMADO:** Linha 26-27 do .gitignore

---

## 🔍 2. VALIDAR QUE .env.local NÃO VAI SUBIR

```powershell
# Ver o que vai ser commitado
git status

# .env.local NÃO DEVE APARECER na lista!
```

**Se aparecer `.env.local`:**
```powershell
# PARE! Remover do staging:
git reset .env.local

# Verificar .gitignore:
notepad .gitignore
# Confirmar que tem .env*.local
```

---

## 🔍 3. BUSCAR CHAVES HARDCODED (Nenhuma Deve Existir)

```powershell
# Buscar por padrões suspeitos no código (excluindo node_modules)
findstr /S /I /M "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" app\*.ts lib\*.ts components\*.tsx

# Buscar por SERVICE_ROLE_KEY hardcoded
findstr /S /I /M "SERVICE_ROLE_KEY.*=.*ey" app\*.ts lib\*.ts

# Buscar por API_KEY hardcoded
findstr /S /I /M "API_KEY.*=.*['\"]" app\*.ts lib\*.ts
```

**Resultado Esperado:**
```
NENHUM arquivo encontrado
```

**Se encontrar algo:** ❌ **NÃO FAÇA PUSH!** Me avise imediatamente!

---

## 🔍 4. VALIDAR process.env (Deve Usar Variáveis)

```powershell
# Todos devem usar process.env.XXX
findstr /S "process.env" app\api\*.ts | findstr /I "SERVICE_ROLE"
```

**Deve mostrar:**
```
lib\supabase\server.ts: process.env.SUPABASE_SERVICE_ROLE_KEY
```

✅ **CORRETO:** Apenas lê de variável de ambiente

---

## 🔍 5. VERIFICAR .env.example (Público)

```bash
cat .env.example
```

**Deve ter:**
- ✅ NOMES de variáveis (SUPABASE_SERVICE_ROLE_KEY=)
- ❌ NENHUM valor real preenchido
- ✅ Comentários explicativos

---

## 🔍 6. ARQUIVOS QUE DEVEM ESTAR NO .gitignore

```
✅ .env.local          ← Suas chaves reais
✅ .env                ← Qualquer .env
✅ .env*.local         ← Todos os .env locais
✅ node_modules        ← Dependências
✅ .next               ← Build do Next.js
✅ .vercel             ← Config local Vercel
```

---

## ✅ LISTA DE VERIFICAÇÃO FINAL

Antes de `git push`, confirme:

- [ ] ✅ `.env.local` está no `.gitignore`
- [ ] ✅ `git status` NÃO mostra `.env.local`
- [ ] ✅ Nenhuma chave hardcoded encontrada
- [ ] ✅ Apenas `process.env.XXX` no código
- [ ] ✅ `.env.example` sem valores reais
- [ ] ✅ Service Role Key apenas em `lib/supabase/server.ts`
- [ ] ✅ `node_modules` não vai subir

---

## 🚨 SE ALGO FALHAR

### ❌ .env.local aparece em git status:
```powershell
git reset .env.local
git rm --cached .env.local  # Se já foi adicionado antes
```

### ❌ Encontrou chave hardcoded:
1. **NÃO FAÇA PUSH!**
2. Remova a chave do código
3. Use `process.env.XXX`
4. Me avise para validar

### ❌ Service Role Key no browser:
1. **NÃO FAÇA PUSH!**
2. Remova de arquivos client (`app/*`, `components/*`)
3. Use apenas em `/api/**` ou `lib/supabase/server.ts`

---

## ✅ COMANDO FINAL DE SEGURANÇA

```powershell
# Verificar tudo antes de push
git status | findstr /I "env.local"

# Resultado esperado: NADA (vazio)
```

**Se retornar vazio:** ✅ **SEGURO PARA PUSH!**

---

## 🎯 PRONTO PARA PUSH?

**Execute o checklist acima.**

**Tudo ✅?** → **Pode fazer push no GitHub!**

**Algum ❌?** → **Me avise antes de fazer push!**

---

## 📞 PRÓXIMO PASSO

Após validar tudo:

1. **Abra:** `COMANDOS-GITHUB-PUSH.md`
2. **Execute** os comandos
3. **Me avise:** "Fiz push no GitHub!"
4. **Eu valido** e te guio no Vercel

---

**SEGURANÇA EM PRIMEIRO LUGAR! 🔒**

