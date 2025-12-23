# 🌐 Como Adicionar Domínio Customizado no Vercel

## ✅ É possível fazer agora?

**SIM!** Você pode adicionar um domínio customizado a qualquer momento. Não é precoce - na verdade, é recomendado para:
- ✅ URLs mais profissionais
- ✅ Melhor SEO
- ✅ Facilidade de compartilhamento
- ✅ Branding consistente

---

## 📋 PASSO A PASSO COMPLETO

### 1️⃣ Acessar Configurações de Domínio no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **stratevo-intelligence-prospect-saa-s-git-mc1-5ae218-olv-core444**
3. Vá em **Settings** → **Domains**

### 2️⃣ Adicionar Domínio

1. Clique em **"Add Domain"** ou **"Add"**
2. Digite seu domínio (exemplos):
   - `stratevo.com.br`
   - `app.stratevo.com.br`
   - `stratevo.olvinternacional.com.br`
   - `app.olvinternacional.com.br`
3. Clique em **"Add"**

### 3️⃣ Configurar DNS no Registrador de Domínio

O Vercel mostrará os registros DNS necessários. Você precisa adicionar no seu registrador (ex: Registro.br, GoDaddy, etc.)

#### Para Domínio Apex (ex: `stratevo.com.br`):
```
Tipo: A
Nome: @ (ou deixe em branco)
Valor: 76.76.21.21
TTL: 3600 (ou automático)
```

#### Para Subdomínio (ex: `app.stratevo.com.br`):
```
Tipo: CNAME
Nome: app (ou o subdomínio desejado)
Valor: cname.vercel-dns.com
TTL: 3600 (ou automático)
```

### 4️⃣ Verificar Domínio

1. Após adicionar os registros DNS, aguarde 5-60 minutos (propagação DNS)
2. O Vercel verificará automaticamente
3. Status mudará de "Pending" para "Valid Configuration"

### 5️⃣ Configurar SSL (Automático)

✅ O Vercel configura SSL/HTTPS automaticamente via Let's Encrypt
✅ Não precisa fazer nada - é automático!

---

## 🎯 RECOMENDAÇÕES

### Opção 1: Subdomínio (Mais Fácil)
```
app.stratevo.com.br
app.olvinternacional.com.br
```

**Vantagens:**
- ✅ Configuração mais simples (apenas CNAME)
- ✅ Não interfere com domínio principal
- ✅ Ideal para aplicações SaaS

### Opção 2: Domínio Dedicado
```
stratevo.com.br
stratevo.app
```

**Vantagens:**
- ✅ URL mais curta e profissional
- ✅ Melhor para branding
- ✅ Mais fácil de lembrar

---

## ⚙️ CONFIGURAÇÕES ADICIONAIS (Opcional)

### Redirecionar www → domínio principal

Se adicionar ambos (`stratevo.com.br` e `www.stratevo.com.br`):

1. No Vercel, vá em **Settings** → **Domains**
2. Configure redirecionamento:
   - `www.stratevo.com.br` → `stratevo.com.br` (ou vice-versa)

### Atualizar Variáveis de Ambiente (Se necessário)

Se você usa URLs hardcoded no código, pode precisar atualizar:

```env
VITE_APP_URL=https://app.stratevo.com.br
VITE_AUTH_REDIRECT_URL=https://app.stratevo.com.br/auth/callback
```

---

## 🔍 VERIFICAÇÃO

Após configurar, verifique:

1. ✅ Domínio aparece como "Valid Configuration" no Vercel
2. ✅ Acesse `https://seu-dominio.com.br` e veja se carrega
3. ✅ SSL/HTTPS está ativo (cadeado verde no navegador)
4. ✅ Todas as rotas funcionam corretamente

---

## ⚠️ IMPORTANTE

### DNS Propagation
- Pode levar de 5 minutos a 48 horas
- Normalmente leva 15-30 minutos
- Use ferramentas como https://dnschecker.org para verificar

### SSL Certificate
- Vercel gera automaticamente via Let's Encrypt
- Renovação automática
- Não precisa configurar nada

### Custo
- ✅ **GRATUITO** no plano Hobby do Vercel
- ✅ Sem custos adicionais
- ✅ SSL incluído

---

## 📝 EXEMPLO PRÁTICO

### Se você tem o domínio `stratevo.com.br`:

1. **No Vercel:**
   - Adicione: `app.stratevo.com.br`
   - Vercel mostrará: `CNAME → cname.vercel-dns.com`

2. **No Registro.br (ou seu registrador):**
   - Tipo: CNAME
   - Nome: app
   - Valor: cname.vercel-dns.com
   - TTL: 3600

3. **Aguarde propagação:**
   - Verifique em: https://dnschecker.org
   - Digite: `app.stratevo.com.br`
   - Veja se aponta para Vercel

4. **Pronto!**
   - Acesse: `https://app.stratevo.com.br`
   - Funciona automaticamente!

---

## 🚀 PRÓXIMOS PASSOS APÓS CONFIGURAR

1. ✅ Atualizar links internos (se houver hardcoded)
2. ✅ Atualizar variáveis de ambiente (se necessário)
3. ✅ Testar todas as funcionalidades
4. ✅ Compartilhar nova URL com equipe

---

## 💡 DICA

**Recomendação:** Use um subdomínio como `app.stratevo.com.br` ao invés do domínio principal. Isso permite:
- Manter o site principal separado
- Facilita futuras mudanças
- Melhor organização

---

## ❓ PRECISA DE AJUDA?

Se tiver dúvidas sobre:
- Qual domínio usar
- Configuração DNS específica
- Problemas de propagação

Me avise que ajudo a configurar!
