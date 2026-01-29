# 🗺️ GUIA DE NAVEGAÇÃO: TESTE MC-5 (PASSO A PASSO VISUAL)

## 📍 LOCALIZAÇÃO NA PLATAFORMA

### **PASSO 1: Acessar a página correta**

1. **Abra a plataforma STRATEVO One**
2. **Na sidebar esquerda**, procure por:
   ```
   📊 2.2 Estoque Qualificado
   ```
   (Deve estar na seção de "Qualificação" ou "Prospects")

3. **Clique em "2.2 Estoque Qualificado"**

---

## 🎯 ONDE ESTÁ O BOTÃO DE ESCANEAR?

### **PASSO 2: Encontrar o botão "Receita Federal" ou "Escanear Website"**

Na página "2.2 Estoque Qualificado", você verá uma **tabela** com empresas qualificadas.

**Procure por uma das seguintes opções:**

#### **OPÇÃO A: Botão na linha da tabela**
- Cada linha da tabela tem uma coluna **"Ações"** (última coluna à direita)
- Nessa coluna, procure por:
  - 🔍 **"Receita Federal"** (botão/ícone)
  - 🌐 **"Escanear Website"** (botão/ícone)
  - 📄 **"Enriquecer"** (botão/ícone)

#### **OPÇÃO B: Botão no topo da página**
- No topo da página, acima da tabela
- Pode estar em um menu dropdown ou como botão individual
- Procure por: **"Enriquecer Selecionados"** ou **"Escanear Websites"**

#### **OPÇÃO C: Menu de ações em massa**
- Pode haver um checkbox para selecionar múltiplas empresas
- Depois, um botão **"Ações em Massa"** ou **"Enriquecer Selecionados"**

---

## 🧪 TESTE PASSO A PASSO (CASO 5 - MAIS SIMPLES)

### **TESTE RÁPIDO: Verificar se o matching funciona**

#### **1. Acesse a página:**
```
Sidebar → 📊 2.2 Estoque Qualificado
```

#### **2. Encontre uma empresa na tabela que:**
- ✅ Tenha um **website** preenchido (coluna "Website" ou "Website Encontrado")
- ✅ Esteja com status **"new"** (novo, não promovido)

#### **3. Clique no botão de ação dessa empresa:**
- Procure na coluna **"Ações"** (última coluna)
- Clique em **"Receita Federal"** ou **"Escanear Website"** ou **"Enriquecer"**

#### **4. Aguarde o processamento:**
- Uma notificação/modal deve aparecer
- Aguarde alguns segundos (pode levar 10-30 segundos)

#### **5. Verifique o resultado:**

**OPÇÃO A: Ver no console do navegador**
1. Pressione **F12** (ou clique com botão direito → "Inspecionar")
2. Vá na aba **"Console"**
3. Procure por logs que começam com:
   ```
   [MC-5 MATCHING]
   ```
4. Você verá mensagens como:
   ```
   [MC-5 MATCHING] ✅ Produtos compatíveis encontrados: 3
   [MC-5 MATCHING] ✅ Website Fit Score: 15/20 pontos
   ```

**OPÇÃO B: Ver na tabela (se os campos aparecem)**
- Após o processamento, verifique se a coluna **"Grade"** ou **"Fit Score"** foi atualizada
- Verifique se a coluna **"Website Fit Score"** (se existir) foi preenchida

**OPÇÃO C: Ver no Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Vá em **"Table Editor"**
3. Selecione a tabela **`qualified_prospects`**
4. Busque o prospect que você escaneou (por CNPJ ou razão social)
5. Verifique os campos:
   - `website_fit_score` (deve ter um número 0-20)
   - `website_products_match` (deve ter um array JSON)
   - `enrichment_data` → `matching_metadata` (deve ter um objeto com `computed_at`)

---

## 🧪 TESTE PASSO A PASSO (CASO 4 - IDEMPOTÊNCIA)

### **TESTE: Verificar se não recalcula quando já foi feito**

#### **1. Execute o teste anterior (Caso 5) primeiro**
- Escaneie um prospect
- Aguarde terminar

#### **2. IMEDIATAMENTE, escaneie o MESMO prospect novamente:**
- Clique novamente em **"Receita Federal"** ou **"Escanear Website"** na MESMA empresa

#### **3. Verifique no console:**
- Deve aparecer:
  ```
  [MC-5 MATCHING] ⏭️ SKIPPED - already_computed (há X horas)
  ```

#### **4. Verifique a resposta:**
- A resposta deve ser muito rápida (não processa novamente)
- Deve retornar os mesmos dados anteriores

---

## 🧪 TESTE PASSO A PASSO (CASO 1 - TENANT SEM PRODUTOS)

### **TESTE: Verificar quando tenant não tem produtos**

#### **1. Remover produtos do tenant (temporariamente):**
- Acesse: **Sidebar → ⚙️ Configurações** ou **Sidebar → 📦 Produtos**
- Ou acesse diretamente no Supabase:
  - Tabela `tenant_products`
  - Delete temporariamente todos os produtos do seu tenant

#### **2. Volte para "2.2 Estoque Qualificado"**

#### **3. Tente escanear um prospect:**
- Clique em **"Receita Federal"** ou **"Escanear Website"**

#### **4. Verifique no console:**
- Deve aparecer:
  ```
  [MC-5 MATCHING] ⏭️ SKIPPED - tenant_products vazio
  ```

#### **5. Verifique a resposta:**
- Deve retornar:
  ```json
  {
    "skipped": true,
    "reason": "tenant_products_empty",
    "message": "Tenant não possui produtos cadastrados..."
  }
  ```

---

## 🗺️ MAPA MENTAL COMPLETO

```
STRATEVO One
│
├── 📊 Dashboard
│
├── 👥 Leads
│   └── ✅ Leads Aprovados (NÃO mexer aqui - apenas verificar que funciona)
│
├── 📊 Qualificação
│   └── ✅ 2.2 Estoque Qualificado ← AQUI É ONDE VOCÊ TESTA
│       │
│       ├── Tabela de Prospects
│       │   ├── Coluna: Empresa
│       │   ├── Coluna: CNPJ
│       │   ├── Coluna: Website (ou Website Encontrado)
│       │   ├── Coluna: Grade / Fit Score
│       │   └── Coluna: Ações ← BOTÃO AQUI
│       │       └── 🔍 "Receita Federal" / "Escanear Website"
│       │
│       └── Botões de Ação em Massa (se houver)
│           └── "Enriquecer Selecionados"
│
├── 🏢 Base de Empresas
│   └── (NÃO mexer aqui - apenas verificar promoção funciona)
│
└── ⚙️ Configurações
    └── 📦 Produtos (para testar Caso 1 - remover produtos)
```

---

## 📸 ONDE PROCURAR O BOTÃO (VISUAL)

### **CENÁRIO 1: Botão na linha da tabela**

```
┌─────────────────────────────────────────────────────────────┐
│ 2.2 Estoque Qualificado                                     │
├──────────┬──────────┬──────────┬──────────┬──────────┬───────┤
│ Empresa  │ CNPJ     │ Website  │ Grade    │ ...     │ Ações │
├──────────┼──────────┼──────────┼──────────┼──────────┼───────┤
│ Empresa  │ 12.345   │ www...   │ A        │ ...     │ [🔍]  │ ← CLIQUE AQUI
│ ABC      │          │          │          │         │       │
└──────────┴──────────┴──────────┴──────────┴──────────┴───────┘
```

### **CENÁRIO 2: Botão no topo**

```
┌─────────────────────────────────────────────────────────────┐
│ 2.2 Estoque Qualificado                                     │
│                                                             │
│ [🔍 Escanear Website] [📄 Enriquecer Selecionados]         │ ← CLIQUE AQUI
│                                                             │
├──────────┬──────────┬──────────┬──────────┬──────────┬───────┤
│ Empresa  │ CNPJ     │ Website  │ Grade    │ ...     │ Ações │
└──────────┴──────────┴──────────┴──────────┴──────────┴───────┘
```

### **CENÁRIO 3: Menu dropdown**

```
┌─────────────────────────────────────────────────────────────┐
│ 2.2 Estoque Qualificado                                     │
│                                                             │
│ [☑ Selecionar Todos] [▼ Ações]                             │
│                              │                              │
│                              ├─ Escanear Website            │ ← CLIQUE AQUI
│                              ├─ Enriquecer                  │
│                              └─ Receita Federal             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 SE NÃO ENCONTRAR O BOTÃO

### **Alternativa 1: Verificar se a funcionalidade está ativa**
- Verifique se você está logado como um tenant que tem permissão
- Verifique se a página está carregando completamente

### **Alternativa 2: Testar via API diretamente**
Se não encontrar o botão na UI, você pode testar diretamente via API:

1. Abra o **Console do navegador** (F12)
2. Vá na aba **"Network"** (Rede)
3. Clique em qualquer botão relacionado a enriquecimento
4. Procure por uma requisição para:
   - `scan-prospect-website`
   - `enrich`
   - `qualify`
5. Veja a resposta da requisição

### **Alternativa 3: Testar via Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Vá em **"Edge Functions"**
3. Encontre `scan-prospect-website`
4. Clique em **"Invoke"** ou **"Test"**
5. Cole o payload:
   ```json
   {
     "tenant_id": "seu-tenant-id",
     "qualified_prospect_id": "id-do-prospect",
     "website_url": "https://exemplo.com.br"
   }
   ```

---

## ✅ CHECKLIST RÁPIDO

Antes de testar, confirme:

- [ ] Estou na página **"2.2 Estoque Qualificado"**?
- [ ] Vejo uma tabela com empresas/prospects?
- [ ] Encontrei um botão **"Receita Federal"**, **"Escanear Website"** ou **"Enriquecer"**?
- [ ] Tenho o **Console do navegador aberto** (F12)?
- [ ] Selecionei um prospect que tem **website preenchido**?

Se todas as respostas forem **SIM**, você está pronto para testar! 🚀

---

## 🆘 AINDA NÃO ENCONTROU?

**Me diga:**
1. O que você vê na página "2.2 Estoque Qualificado"?
2. Quais colunas aparecem na tabela?
3. O que aparece na coluna "Ações"?
4. Há algum botão no topo da página?

Com essas informações, posso te guiar exatamente onde clicar! 🎯
