# 📊 RELATÓRIO COMPLETO - MOTOR DE BUSCA AVANÇADA

## 📋 SUMÁRIO EXECUTIVO

O **Motor de Busca Avançada** é um módulo de prospecção B2B que permite buscar empresas com filtros específicos e enriquecer automaticamente seus dados usando múltiplas APIs externas. O sistema é multi-tenant, isolado e ativado via feature flag.

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Estrutura de Pastas**
```
/modules/prospeccao-avancada/
├── routes/
│   └── prospeccaoRoutes.js          # Rotas Express isoladas
├── controllers/
│   └── buscaController.js           # Lógica de negócio
├── services/
│   ├── enrichmentService.ts         # Orquestração de APIs
│   ├── receitaService.js            # ReceitaWS API
│   ├── apolloService.js             # Apollo API
│   ├── linkedinService.js           # PhantomBuster (LinkedIn)
│   └── hunterService.js            # Hunter.io API
├── components/
│   ├── BuscaEmpresasForm.tsx        # Formulário de busca
│   ├── ResultadoEmpresasTable.tsx   # Tabela de resultados
│   └── BotaoEnviarQualificacao.tsx # Botão de envio
├── pages/
│   └── ProspeccaoAvancadaPage.tsx   # Página principal
└── utils/
    ├── supabaseClient.js            # Cliente Supabase
    └── promptIA.js                  # Prompt de IA para B2B
```

### **Banco de Dados (Supabase)**
```
prospects_raw
├── id (BIGSERIAL)
├── tenant_id (UUID) → tenants(id)
├── razao_social (TEXT)
├── nome_fantasia (TEXT)
├── cnpj (TEXT)
├── endereco, cidade, uf, cep
├── site, linkedin
├── decisores (JSONB) → [{nome, cargo, linkedin, email}]
├── emails (TEXT[])
├── telefones (TEXT[])
├── faturamento_estimado, funcionarios_estimados
├── capital_social
├── segmento, porte, localizacao
└── status ('raw' | 'qualificado' | 'descartado')

prospects_qualificados
├── id (BIGSERIAL)
├── tenant_id (UUID) → tenants(id)
├── prospect_id (BIGINT) → prospects_raw(id)
└── status ('pendente' | 'qualificado' | 'rejeitado')
```

---

## 🔄 FLUXO COMPLETO DE FUNCIONAMENTO

### **1. FRONTEND - Formulário de Busca**

**Arquivo:** `src/modules/prospeccao-avancada/components/BuscaEmpresasForm.tsx`

**Campos Disponíveis:**
- **Segmento/Indústria**: Texto livre (ex: "Manufatura", "Tecnologia")
- **Porte da Empresa**: Dropdown (Micro, Pequena, Média, Grande)
- **Faturamento Mínimo/Máximo**: Números (R$)
- **Funcionários Mínimo/Máximo**: Números
- **Localização**: Texto (ex: "São Paulo, SP" ou deixar em branco para Brasil)

**Ação do Usuário:**
1. Preenche filtros desejados
2. Clica em "Buscar Empresas"
3. Sistema chama `handleBuscar(filtros)`

---

### **2. SERVIÇO DE ENRIQUECIMENTO**

**Arquivo:** `src/modules/prospeccao-avancada/services/enrichmentService.ts`

**Função Principal:** `buscarDadosEmpresas(filtros, tenantId)`

**Fluxo:**
```typescript
1. Valida tenant_id
2. Chama Edge Function: supabase.functions.invoke('prospeccao-avancada-buscar', {
     body: { filtros, tenant_id }
   })
3. Processa resposta: data.empresas
4. Filtra empresas sem fit (sem site/LinkedIn/decisores)
5. Retorna array de EmpresaEnriquecida[]
```

---

### **3. EDGE FUNCTION - Processamento Principal**

**Arquivo:** `supabase/functions/prospeccao-avancada-buscar/index.ts`

**Fluxo Detalhado:**

#### **ETAPA 1: Preparação**
```typescript
1. Recebe { filtros, tenant_id } do frontend
2. Valida tenant_id
3. Cria cliente Supabase (service_role)
4. Busca produtos do tenant: SELECT * FROM tenant_products WHERE tenant_id = ?
```

#### **ETAPA 2: Mapeamento de Segmento para CNAE**
```typescript
Função: mapearSegmentoParaCNAEs(segmento)

"Manufatura" → CNAEs ['25', '26', '27', '28', '30', '31', '32', '33']
"Tecnologia" → CNAEs ['62', '63']
"Construção" → CNAEs ['41', '42', '43']
"Varejo" → CNAE ['47']
"Logística" → CNAE ['49']
"Saúde" → CNAEs ['86', '87']
"Educação" → CNAE ['85']
"Agronegócio" → CNAEs ['01', '02', '03']
```

#### **ETAPA 3: Busca no EmpresaQui (FONTE PRIMÁRIA)**

**Função:** `buscarViaEmpresaQui(filtros)`

**Estratégia de Busca:**

**3.1. Busca por CNAE + Localização (Mais Preciso)**
```typescript
Para cada CNAE mapeado:
  GET https://api.empresaqui.com.br/v1/empresas/busca?
    cnae={cnae}
    cidade={cidade}
    uf={uf}
    situacao=ATIVA
    limit=20
```

**3.2. Busca por Localização Apenas (Fallback)**
```typescript
Se resultados < 30:
  GET https://api.empresaqui.com.br/v1/empresas/busca?
    cidade={cidade}
    uf={uf}
    situacao=ATIVA
    limit=30
```

**3.3. Busca por Porte (Se Especificado)**
```typescript
Se filtros.porte:
  Mapear: micro→ME, pequena→EPP, media→MEDIA, grande→GRANDE
  GET https://api.empresaqui.com.br/v1/empresas/busca?
    porte={porteEQ}
    cidade={cidade}
    uf={uf}
    situacao=ATIVA
    limit=20
```

**Dados Retornados pelo EmpresaQui:**
```json
{
  "cnpj": "12.345.678/0001-90",
  "razao_social": "EMPRESA EXEMPLO LTDA",
  "nome_fantasia": "Empresa Exemplo",
  "municipio": "São Paulo",
  "uf": "SP",
  "website": "https://exemplo.com.br",
  "telefones": ["(11) 1234-5678"],
  "emails": ["contato@exemplo.com.br"],
  "porte": "MEDIA",
  "capital_social": "1000000.00",
  "funcionarios_presumido": 50,
  "faturamento_presumido": 5000000
}
```

#### **ETAPA 4: Processamento e Enriquecimento**

**Para cada empresa do EmpresaQui:**

**4.1. Buscar Dados Cadastrais (ReceitaWS/BrasilAPI)**
```typescript
Função: buscarDadosCadastrais(cnpj)

Tentativa 1: BrasilAPI (gratuita, oficial)
  GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}

Tentativa 2: ReceitaWS (fallback)
  GET https://www.receitaws.com.br/v1/cnpj/{cnpj}

Dados Retornados:
- Razão social completa
- Nome fantasia
- Endereço completo (logradouro, número, complemento, bairro, CEP)
- Cidade, UF
- Capital social
- QSA (Quadro de Sócios e Administradores)
- Situação cadastral
```

**4.2. Buscar Decisores (Apollo API)**
```typescript
Função: buscarDecisoresApollo(companyName, domain)

POST https://api.apollo.io/v1/mixed_people/search
Body: {
  q_organization_name: "EMPRESA EXEMPLO LTDA",
  q_organization_domains: "exemplo.com.br",
  person_titles: ["CEO", "Diretor", "Gerente", "Presidente", "CFO", "CTO"],
  page: 1,
  per_page: 10
}

Dados Retornados:
[
  {
    nome: "João Silva",
    cargo: "CEO",
    linkedin: "https://linkedin.com/in/joaosilva",
    email: "joao@exemplo.com.br"
  }
]
```

**4.3. Buscar E-mails (Hunter.io)**
```typescript
Função: buscarEmailsHunter(domain)

GET https://api.hunter.io/v2/domain-search?
  domain=exemplo.com.br
  limit=10
  api_key={HUNTER_API_KEY}

Dados Retornados:
[
  "contato@exemplo.com.br",
  "vendas@exemplo.com.br",
  "joao@exemplo.com.br"
]
```

**4.4. Montar Objeto EmpresaEnriquecida**
```typescript
{
  razao_social: "EMPRESA EXEMPLO LTDA" (do EmpresaQui ou ReceitaWS)
  nome_fantasia: "Empresa Exemplo" (do EmpresaQui ou ReceitaWS)
  cnpj: "12.345.678/0001-90" (do EmpresaQui - garantido!)
  endereco: "Rua Exemplo, 123" (do ReceitaWS)
  cidade: "São Paulo" (do EmpresaQui ou ReceitaWS)
  uf: "SP" (do EmpresaQui ou ReceitaWS)
  cep: "01234-567" (do ReceitaWS)
  site: "https://exemplo.com.br" (do EmpresaQui)
  linkedin: undefined (será preenchido pelo Apollo se encontrar)
  decisores: [
    {
      nome: "João Silva",
      cargo: "CEO",
      linkedin: "https://linkedin.com/in/joaosilva",
      email: "joao@exemplo.com.br"
    }
  ] (do Apollo)
  emails: ["contato@exemplo.com.br", "vendas@exemplo.com.br"] (do Hunter ou EmpresaQui)
  telefones: ["(11) 1234-5678"] (do EmpresaQui)
  faturamento_estimado: 5000000 (do EmpresaQui)
  funcionarios_estimados: 50 (do EmpresaQui)
  capital_social: 1000000 (do EmpresaQui ou ReceitaWS)
  segmento: "Manufatura" (do filtro)
  porte: "Média" (do filtro ou EmpresaQui)
  localizacao: "São Paulo, SP" (do filtro)
}
```

#### **ETAPA 5: Filtragem**

**Função:** Filtra empresas sem fit mínimo

**Critérios de Aceitação:**
```typescript
Aceitar se:
  - Tem CNPJ válido (14 dígitos) E nome válido (≥3 caracteres)
  OU
  - Tem nome válido (≥3 caracteres) E site válido

Rejeitar se:
  - Não tem CNPJ válido E não tem (nome + site)
  - Nome é genérico ("empresa", "lista", "melhores", etc.)
```

#### **ETAPA 6: Retorno**

```typescript
Response: {
  sucesso: true,
  empresas: EmpresaEnriquecida[],
  total: number
}
```

---

### **4. SALVAMENTO NO BANCO**

**Arquivo:** `src/modules/prospeccao-avancada/services/enrichmentService.ts`

**Função:** `salvarEmpresasBrutas(empresas, tenantId)`

**Fluxo:**
```typescript
1. Mapeia empresas para formato do banco
2. INSERT INTO prospects_raw (tenant_id, razao_social, cnpj, ...)
3. Busca IDs das empresas salvas
4. Atualiza estado do frontend com IDs
```

---

### **5. EXIBIÇÃO NO FRONTEND**

**Arquivo:** `src/modules/prospeccao-avancada/components/ResultadoEmpresasTable.tsx`

**Colunas Exibidas:**
- Razão Social
- CNPJ
- Localização (Cidade, UF)
- Contatos (quantidade de decisores, e-mails, telefones)
- Informações (site, LinkedIn, faturamento, funcionários)

**Funcionalidades:**
- Seleção múltipla (checkbox)
- Botão "Selecionar Todos"
- Botão "Enviar para Motor de Qualificação"

---

### **6. ENVIO PARA QUALIFICAÇÃO**

**Arquivo:** `src/modules/prospeccao-avancada/pages/ProspeccaoAvancadaPage.tsx`

**Função:** `handleEnviarQualificacao(indices)`

**Fluxo:**
```typescript
1. Mapeia índices selecionados para IDs reais (prospects_raw.id)
2. INSERT INTO prospects_qualificados (tenant_id, prospect_id, status='pendente')
3. Exibe toast de sucesso
4. Limpa seleção
```

---

## 🔌 INTEGRAÇÕES COM APIs EXTERNAS

### **1. EmpresaQui.com.br**

**Propósito:** Fonte primária de empresas (CNPJ garantido)

**Endpoint:**
```
GET https://api.empresaqui.com.br/v1/empresas/busca?
  cnae={cnae}
  cidade={cidade}
  uf={uf}
  porte={porte}
  situacao=ATIVA
  limit={limit}
```

**Autenticação:**
```
Authorization: Bearer {EMPRESAQUI_API_KEY}
```

**Dados Retornados:**
- CNPJ (garantido)
- Razão social
- Nome fantasia
- Endereço completo
- Site, telefones, e-mails
- Porte, capital social
- Faturamento e funcionários estimados

**Limitações:**
- Requer API key configurada
- Rate limit conforme plano

---

### **2. ReceitaWS / BrasilAPI**

**Propósito:** Dados cadastrais oficiais da Receita Federal

**Endpoints:**
```
BrasilAPI (prioridade):
GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}

ReceitaWS (fallback):
GET https://www.receitaws.com.br/v1/cnpj/{cnpj}
```

**Dados Retornados:**
- Razão social completa
- Nome fantasia
- Endereço completo (logradouro, número, complemento, bairro, CEP)
- Cidade, UF
- Capital social
- QSA (Quadro de Sócios)
- Situação cadastral

**Limitações:**
- BrasilAPI: Gratuita, mas pode ter rate limit
- ReceitaWS: Pode ter rate limit em planos gratuitos

---

### **3. Apollo.io**

**Propósito:** Buscar decisores (CEO, Diretores, Gerentes)

**Endpoint:**
```
POST https://api.apollo.io/v1/mixed_people/search
Headers: {
  'X-Api-Key': {APOLLO_API_KEY},
  'Content-Type': 'application/json'
}
Body: {
  q_organization_name: "EMPRESA EXEMPLO LTDA",
  q_organization_domains: "exemplo.com.br",
  person_titles: ["CEO", "Diretor", "Gerente", "Presidente", "CFO", "CTO"],
  page: 1,
  per_page: 10
}
```

**Dados Retornados:**
```json
{
  "people": [
    {
      "first_name": "João",
      "last_name": "Silva",
      "title": "CEO",
      "linkedin_url": "https://linkedin.com/in/joaosilva",
      "email": "joao@exemplo.com.br"
    }
  ]
}
```

**Limitações:**
- Requer API key
- Rate limit conforme plano
- Pode não encontrar decisores para empresas pequenas

---

### **4. Hunter.io**

**Propósito:** Buscar e-mails corporativos do domínio

**Endpoint:**
```
GET https://api.hunter.io/v2/domain-search?
  domain=exemplo.com.br
  limit=10
  api_key={HUNTER_API_KEY}
```

**Dados Retornados:**
```json
{
  "data": {
    "emails": [
      {
        "value": "contato@exemplo.com.br",
        "type": "generic",
        "confidence": 90
      }
    ]
  }
}
```

**Limitações:**
- Requer API key
- Rate limit conforme plano
- Pode não encontrar e-mails para domínios pequenos

---

## 🗺️ MAPEAMENTO DE SEGMENTO PARA CNAE

### **Tabela de Mapeamento**

| Segmento | CNAEs Correspondentes | Descrição |
|----------|----------------------|-----------|
| **Manufatura** | 25, 26, 27, 28, 30, 31, 32, 33 | Fabricação de produtos |
| **Tecnologia** | 62, 63 | Programação, consultoria em TI |
| **Construção** | 41, 42, 43 | Construção civil |
| **Varejo** | 47 | Comércio varejista |
| **Logística** | 49 | Transporte e armazenagem |
| **Saúde** | 86, 87 | Atividades de saúde |
| **Educação** | 85 | Educação |
| **Agronegócio** | 01, 02, 03 | Agricultura, pecuária |

### **Lógica de Mapeamento**

```typescript
function mapearSegmentoParaCNAEs(segmento: string): string[] {
  const segmentoLower = segmento.toLowerCase().trim();
  
  if (segmentoLower.includes('manufatura') || segmentoLower.includes('indústria')) {
    return ['25', '26', '27', '28', '30', '31', '32', '33'];
  }
  
  if (segmentoLower.includes('tecnologia') || segmentoLower.includes('ti') || segmentoLower.includes('software')) {
    return ['62', '63'];
  }
  
  // ... outros mapeamentos
}
```

---

## 🔐 SEGURANÇA E MULTI-TENANCY

### **Row Level Security (RLS)**

**Políticas Implementadas:**

```sql
-- prospects_raw
CREATE POLICY "Users can view prospects from their tenant"
  ON prospects_raw FOR SELECT
  USING (tenant_id = ANY(SELECT public.get_user_tenant_ids()));

CREATE POLICY "Users can insert prospects for their tenant"
  ON prospects_raw FOR INSERT
  WITH CHECK (tenant_id = ANY(SELECT public.get_user_tenant_ids()));

-- prospects_qualificados
CREATE POLICY "Users can view qualified prospects from their tenant"
  ON prospects_qualificados FOR SELECT
  USING (tenant_id = ANY(SELECT public.get_user_tenant_ids()));
```

**Função Auxiliar:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  -- Buscar em tenant_users (relação muitos-para-muitos)
  RETURN QUERY
  SELECT DISTINCT tu.tenant_id
  FROM public.tenant_users tu
  WHERE tu.user_id = auth.uid()
    AND (tu.status = 'active' OR tu.status IS NULL);

  -- Fallback para users (compatibilidade)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT DISTINCT u.tenant_id
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.tenant_id IS NOT NULL;
  END IF;
END;
$func$;
```

---

## 🚀 FEATURE FLAG

### **Ativação**

**Arquivo:** `.env.local`
```bash
VITE_ENABLE_PROSPECCAO=true
```

**Verificação:**
```typescript
// src/lib/flags.ts
export const ENABLE_PROSPECCAO = import.meta.env.VITE_ENABLE_PROSPECCAO === 'true';
```

**Uso:**
- Rotas condicionais em `App.tsx`
- Menu lateral em `AppSidebar.tsx`
- Componentes renderizados apenas se flag ativa

---

## 📊 FLUXO DE DADOS COMPLETO

```
┌─────────────────┐
│   FRONTEND      │
│  (React/TSX)    │
└────────┬────────┘
         │
         │ 1. Usuário preenche filtros
         │ 2. Clica "Buscar Empresas"
         │
         ▼
┌─────────────────┐
│ enrichmentService│
│   (TypeScript)   │
└────────┬────────┘
         │
         │ 3. Chama Edge Function
         │ supabase.functions.invoke('prospeccao-avancada-buscar')
         │
         ▼
┌─────────────────────────┐
│   EDGE FUNCTION         │
│ prospeccao-avancada-buscar│
└────────┬────────────────┘
         │
         │ 4. Busca produtos do tenant
         │ SELECT * FROM tenant_products WHERE tenant_id = ?
         │
         │ 5. Mapeia segmento → CNAEs
         │ "Manufatura" → [25, 26, 27, ...]
         │
         │ 6. Busca no EmpresaQui
         │ GET /empresas/busca?cnae=25&cidade=São Paulo&uf=SP
         │
         │ 7. Para cada empresa encontrada:
         │    ├─ ReceitaWS/BrasilAPI → dados cadastrais
         │    ├─ Apollo → decisores
         │    └─ Hunter → e-mails
         │
         │ 8. Filtra empresas sem fit
         │
         │ 9. Retorna empresas enriquecidas
         │
         ▼
┌─────────────────┐
│ enrichmentService│
└────────┬────────┘
         │
         │ 10. Salva no Supabase
         │ INSERT INTO prospects_raw
         │
         ▼
┌─────────────────┐
│   FRONTEND      │
│  Exibe tabela   │
│  com resultados │
└─────────────────┘
```

---

## 🎯 CASOS DE USO

### **Caso 1: Busca por Segmento e Localização**

**Input:**
```json
{
  "segmento": "Manufatura",
  "localizacao": "São Paulo, SP",
  "porte": "media",
  "faturamentoMin": 15000000,
  "faturamentoMax": 50000000,
  "funcionariosMin": 35
}
```

**Processamento:**
1. Mapeia "Manufatura" → CNAEs [25, 26, 27, 28, 30, 31, 32, 33]
2. Busca no EmpresaQui: `cnae=25&cidade=São Paulo&uf=SP&situacao=ATIVA`
3. Para cada empresa:
   - Busca dados cadastrais (ReceitaWS)
   - Busca decisores (Apollo)
   - Busca e-mails (Hunter)
4. Filtra por faturamento/funcionários (se aplicável)
5. Retorna empresas enriquecidas

**Output:**
```json
{
  "sucesso": true,
  "empresas": [
    {
      "razao_social": "METALÚRGICA ABC LTDA",
      "cnpj": "12.345.678/0001-90",
      "cidade": "São Paulo",
      "uf": "SP",
      "site": "https://metalurgicaabc.com.br",
      "decisores": [
        {
          "nome": "João Silva",
          "cargo": "CEO",
          "linkedin": "https://linkedin.com/in/joaosilva",
          "email": "joao@metalurgicaabc.com.br"
        }
      ],
      "emails": ["contato@metalurgicaabc.com.br"],
      "faturamento_estimado": 25000000,
      "funcionarios_estimados": 120
    }
  ],
  "total": 15
}
```

---

### **Caso 2: Busca Apenas por Localização**

**Input:**
```json
{
  "localizacao": "Campinas, SP"
}
```

**Processamento:**
1. Não há segmento → não mapeia CNAE
2. Busca no EmpresaQui: `cidade=Campinas&uf=SP&situacao=ATIVA`
3. Enriquece cada empresa encontrada
4. Retorna empresas enriquecidas

---

### **Caso 3: Busca por Porte**

**Input:**
```json
{
  "porte": "grande",
  "localizacao": "Rio de Janeiro, RJ"
}
```

**Processamento:**
1. Mapeia "grande" → "GRANDE"
2. Busca no EmpresaQui: `porte=GRANDE&cidade=Rio de Janeiro&uf=RJ&situacao=ATIVA`
3. Enriquece cada empresa
4. Retorna empresas enriquecidas

---

## ⚙️ CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE

### **Supabase Dashboard → Settings → Edge Functions → Secrets**

**Variáveis Obrigatórias:**
```
EMPRESAQUI_API_KEY=seu_token_aqui
```

**Variáveis Opcionais (para enriquecimento):**
```
APOLLO_API_KEY=seu_token_aqui
HUNTER_API_KEY=seu_token_aqui
SERPER_API_KEY=seu_token_aqui (não usado mais, mas pode ser útil no futuro)
```

**Variáveis Automáticas (já configuradas):**
```
SUPABASE_URL=auto
SUPABASE_SERVICE_ROLE_KEY=auto
```

---

## 🔍 FILTROS E VALIDAÇÕES

### **Filtros Aplicados**

1. **Filtro de Fit Mínimo:**
   - Aceita se: (CNPJ válido) OU (nome + site)
   - Rejeita se: não tem dados mínimos

2. **Filtro de Porte (se especificado):**
   - Mapeia: micro→ME, pequena→EPP, media→MEDIA, grande→GRANDE
   - Busca no EmpresaQui com filtro de porte

3. **Filtro de Localização:**
   - Se especificado: busca apenas na cidade/UF
   - Se não especificado: busca em todo Brasil

4. **Filtro de Situação:**
   - Apenas empresas ATIVAS (situacao=ATIVA)

---

## 📈 MÉTRICAS E PERFORMANCE

### **Tempos Estimados**

- **Busca no EmpresaQui:** 1-3 segundos
- **Enriquecimento por empresa:**
  - ReceitaWS: 0.5-1 segundo
  - Apollo: 1-2 segundos
  - Hunter: 0.5-1 segundo
- **Total por empresa:** ~2-4 segundos
- **Total para 20 empresas:** ~40-80 segundos (paralelo)

### **Otimizações**

- Buscas em paralelo (Promise.all)
- Cache de dados já buscados (seenCNPJs, seenDomains)
- Limite de empresas processadas (30 do EmpresaQui)
- Timeout nas APIs externas

---

## 🐛 TRATAMENTO DE ERROS

### **Cenários de Erro**

1. **EMPRESAQUI_API_KEY não configurada:**
   - Retorna array vazio
   - Log: `⚠️ EMPRESAQUI_API_KEY não configurada`

2. **API externa falha:**
   - Continua processamento
   - Log: `⚠️ ReceitaWS falhou` ou `⚠️ Apollo falhou`
   - Empresa é retornada com dados parciais

3. **CNPJ inválido:**
   - Empresa é rejeitada no filtro
   - Log: `⚠️ Empresa filtrada (sem CNPJ válido)`

4. **Nenhuma empresa encontrada:**
   - Retorna array vazio
   - Frontend exibe: "Nenhuma empresa encontrada"

---

## 🎨 INTERFACE DO USUÁRIO

### **Componentes Principais**

1. **BuscaEmpresasForm.tsx**
   - Formulário com todos os filtros
   - Validação de campos
   - Loading state durante busca

2. **ResultadoEmpresasTable.tsx**
   - Tabela responsiva
   - Seleção múltipla
   - Botões de ação

3. **BotaoEnviarQualificacao.tsx**
   - Envia empresas selecionadas
   - Feedback visual

### **Estados da Interface**

- **Idle:** Formulário pronto para busca
- **Loading:** Buscando empresas (spinner)
- **Success:** Tabela com resultados
- **Empty:** Mensagem "Nenhuma empresa encontrada"
- **Error:** Toast com mensagem de erro

---

## 🔄 INTEGRAÇÃO COM OUTROS MÓDULOS

### **Motor de Qualificação**

**Fluxo:**
1. Usuário seleciona empresas na tabela
2. Clica "Enviar para Motor de Qualificação"
3. Empresas são salvas em `prospects_qualificados`
4. Motor de Qualificação processa empresas pendentes

### **Base de Empresas**

**Fluxo:**
1. Empresas salvas em `prospects_raw` podem ser visualizadas
2. Podem ser enriquecidas posteriormente
3. Podem ser movidas para `companies` (tabela principal)

---

## 📝 LOGS E DEBUG

### **Logs da Edge Function**

**Níveis:**
- `🚀` Início de operação
- `📦` Produtos do tenant
- `🔍` Busca iniciada
- `✅` Sucesso
- `⚠️` Aviso
- `❌` Erro

**Exemplo de Log:**
```
[ProspeccaoAvancada] 📥 Request recebido: { filtros: {...}, tenant_id: "..." }
[ProspeccaoAvancada] 🚀 Iniciando busca com filtros: {...}
[ProspeccaoAvancada] 📦 Produtos do tenant para busca: 20
[ProspeccaoAvancada] 🔍 EmpresaQui busca por CNAE: 25 São Paulo
[ProspeccaoAvancada] ✅ CNAE 25 retornou: 15 empresas
[ProspeccaoAvancada] ✅ EmpresaQui total consolidado: 15 empresas únicas com CNPJ
[ProspeccaoAvancada] 📊 Empresas processadas (antes do filtro): 15
[ProspeccaoAvancada] ✅ Total final (após filtro): 15
[ProspeccaoAvancada] 📤 Retornando resposta: { sucesso: true, total: 15, ... }
```

---

## 🚨 LIMITAÇÕES E CONSIDERAÇÕES

### **Limitações Atuais**

1. **EmpresaQui é obrigatória:**
   - Sem API key, não retorna resultados
   - Solução: Configurar `EMPRESAQUI_API_KEY`

2. **Rate Limits:**
   - EmpresaQui: Conforme plano
   - Apollo: Conforme plano
   - Hunter: Conforme plano
   - ReceitaWS: Pode ter limite em planos gratuitos

3. **Dados Parciais:**
   - Nem todas as empresas têm site
   - Nem todas têm decisores no Apollo
   - Nem todas têm e-mails no Hunter

4. **Performance:**
   - Processamento pode demorar para muitas empresas
   - Solução: Limitar a 30 empresas por busca

### **Melhorias Futuras**

1. Cache de empresas já buscadas
2. Processamento assíncrono (background jobs)
3. Retry automático em caso de falha de API
4. Dashboard de métricas de busca
5. Exportação de resultados (CSV, Excel)

---

## 📚 REFERÊNCIAS

### **Documentação das APIs**

- **EmpresaQui:** https://www.empresaqui.com.br/docs
- **Apollo:** https://apolloio.github.io/apollo-api-docs/
- **Hunter:** https://hunter.io/api-documentation
- **BrasilAPI:** https://brasilapi.com.br/docs
- **ReceitaWS:** https://www.receitaws.com.br/api

### **Arquivos do Projeto**

- Edge Function: `supabase/functions/prospeccao-avancada-buscar/index.ts`
- Serviço Frontend: `src/modules/prospeccao-avancada/services/enrichmentService.ts`
- Componentes: `src/modules/prospeccao-avancada/components/`
- Migração DB: `supabase/migrations/20250225000009_create_prospeccao_avancada_tables.sql`

---

## ✅ CHECKLIST DE FUNCIONALIDADES

- [x] Formulário de busca com filtros
- [x] Busca no EmpresaQui por CNAE/localização
- [x] Enriquecimento com ReceitaWS/BrasilAPI
- [x] Busca de decisores no Apollo
- [x] Busca de e-mails no Hunter
- [x] Filtragem de empresas sem fit
- [x] Salvamento no Supabase (prospects_raw)
- [x] Exibição em tabela
- [x] Seleção múltipla
- [x] Envio para qualificação (prospects_qualificados)
- [x] RLS (Row Level Security)
- [x] Feature flag (ENABLE_PROSPECCAO)
- [x] Rotas isoladas (/prospeccao-avancada)
- [x] Multi-tenancy
- [x] Logs detalhados

---

**Documento gerado em:** 2026-01-03  
**Versão:** 1.0  
**Autor:** Sistema de Documentação Automática

