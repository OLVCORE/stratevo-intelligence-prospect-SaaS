# 🔐 ROLES HIERÁRQUICOS - RELATÓRIOS ICP

## 📋 O QUE CADA ROLE PODE VER

### 🎯 **ADMIN** / **VIEWER**
- **Vê TUDO**: Todas as seções do relatório, incluindo:
  - [SDR]
  - [CLOSER]
  - [GERENTE]
  - [DIRETOR_CEO]
- **Motivo**: Acesso completo para gestão e auditoria

---

### 📞 **SDR** (Sales Development Representative)
- **Vê APENAS**:
  - Seções gerais do relatório (Snapshot, Tese Comercial, etc.)
  - **Seções marcadas com `[SDR]`**
- **NÃO vê**:
  - [CLOSER]
  - [GERENTE]
  - [DIRETOR_CEO]
- **Foco**: Prospecção, listas, gatilhos de abordagem, scripts

---

### 💼 **VENDEDOR** / **SALES** (Closer)
- **Vê APENAS**:
  - Seções gerais do relatório
  - **Seções marcadas com `[CLOSER]`**
- **NÃO vê**:
  - [SDR]
  - [GERENTE]
  - [DIRETOR_CEO]
- **Foco**: Argumentos de fechamento, objeções, ROI, oportunidades quentes

---

### 👔 **GERENCIA** / **GESTOR** (Gerente Comercial)
- **Vê APENAS**:
  - Seções gerais do relatório
  - **Seções marcadas com `[GERENTE]`**
- **NÃO vê**:
  - [SDR]
  - [CLOSER]
  - [DIRETOR_CEO]
- **Foco**: Diretrizes de pipeline, metas, indicadores, supervisão comercial

---

### 🏢 **DIRECAO** (Diretor/CEO)
- **Vê APENAS**:
  - Seções gerais do relatório
  - **Seções marcadas com `[DIRETOR_CEO]`**
- **NÃO vê**:
  - [SDR]
  - [CLOSER]
  - [GERENTE]
- **Foco**: Tese estratégica, direcionamento de longo prazo, riscos, alocação de recursos
- **Role no banco**: `'direcao'`

---

### 👨‍💻 **DEVELOPER** (Sem role específico)
- **Vê TUDO**: Comportamento padrão quando não há role atribuído
- **Motivo**: Facilita desenvolvimento e debug

---

## 🔧 COMO FUNCIONA

### 1. **Mapeamento Role → Marcador**
```typescript
'sdr' → [SDR]
'vendedor' ou 'sales' → [CLOSER]
'gerencia' ou 'gestor' → [GERENTE]
'direcao' ou 'diretor' ou 'ceo' → [DIRETOR_CEO]
'admin' ou 'viewer' → TODOS os marcadores
```

### 2. **Filtro no Markdown**
O `StrategicReportRenderer` filtra o conteúdo antes de renderizar:
- Remove seções `## [SDR]` se o usuário não for SDR
- Remove seções `## [CLOSER]` se o usuário não for Vendedor/Sales
- E assim por diante...

### 3. **Seções Gerais**
Todas as seções **SEM** marcador de role são sempre visíveis:
- `## Snapshot Estratégico`
- `## Tese Comercial`
- `## ICP Recomendado`
- etc.

---

## 📝 COMO CRIAR ROLES NO BANCO

### 🔍 PASSO 1: Obter o UUID do usuário

Primeiro, você precisa descobrir o UUID do usuário. Execute:

```sql
-- Buscar UUID do usuário pelo email
SELECT id, email, created_at
FROM auth.users
WHERE email = 'email-do-usuario@exemplo.com';
```

Ou se você já está logado e quer seu próprio UUID:

```sql
-- Seu próprio UUID (quando autenticado)
SELECT auth.uid() as meu_user_id;
```

### ✅ PASSO 2: Atribuir role ao usuário

Depois de obter o UUID, substitua `'UUID-AQUI'` pelo UUID real:

```sql
-- Exemplo: Atribuir role SDR
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-AQUI', 'sdr')
ON CONFLICT (user_id, role) DO NOTHING;

-- Exemplo: Atribuir role Vendedor
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-AQUI', 'vendedor')
ON CONFLICT (user_id, role) DO NOTHING;

-- Exemplo: Atribuir role Gerente
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-AQUI', 'gerencia')
ON CONFLICT (user_id, role) DO NOTHING;

-- Exemplo: Atribuir role Direção/CEO
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-AQUI', 'direcao')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 🔍 Verificar roles de um usuário:
```sql
SELECT ur.role, p.email, p.full_name
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.user_id = 'UUID-AQUI';
```

### 📋 TODOS OS ROLES DISPONÍVEIS:
- `'admin'` - Administrador (vê tudo)
- `'sdr'` - Sales Development Representative
- `'vendedor'` ou `'sales'` - Vendedor/Closer
- `'gerencia'` ou `'gestor'` - Gerente Comercial
- `'direcao'` - Diretor/CEO
- `'viewer'` - Visualizador (vê tudo, somente leitura)

---

## ✅ IMPLEMENTAÇÃO ATUAL

### Arquivos Modificados:
1. **`src/components/reports/StrategicReportRenderer.tsx`**
   - Adicionada função `filterMarkdownByRole()`
   - Adicionada função `mapRoleToMarkdownMarker()`
   - Integrado com `useUserRole()` hook

2. **`src/hooks/useUserRole.ts`**
   - Expandido tipos de role para incluir hierárquicos
   - Adicionados helpers: `isSDR`, `isVendedor`, `isGerente`, `isDirecao`

### Comportamento:
- ✅ Admin/Viewer veem tudo
- ✅ Developer (sem role) vê tudo (fallback)
- ✅ Cada role hierárquico vê apenas suas seções
- ✅ Seções gerais (sem marcador) são sempre visíveis

---

## 🧪 TESTE

Para testar, atribua um role específico ao seu usuário e recarregue a página. O relatório deve mostrar apenas as seções permitidas para aquele role.

