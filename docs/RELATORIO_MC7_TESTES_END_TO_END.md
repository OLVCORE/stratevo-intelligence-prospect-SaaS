# 📋 RELATÓRIO MC7-TEST – PLANO DE TESTES END-TO-END

**Data:** 2025-01-27  
**Microciclo:** MC7-TEST - Testes Reais do Match & Fit (Company + ICP)  
**Status:** ✅ **PLANO COMPLETO**

---

## 🎯 OBJETIVO DO MC7-TEST

Definir **testes reais end-to-end** para validar MC5 (Dashboard UI Match & Fit no relatório de empresa) e MC6 (ICP Match & Fit Overview) na prática, gerando um documento claro e executável para validação com dados reais de tenant.

---

## 🗺️ MAPA DE ROTAS E FUNÇÕES

### Rotas da Interface Web

#### MC5 – Relatório da Empresa com Match & Fit

**Rota:** `/reports?companyId={companyId}`

**Componente Principal:** `src/components/reports/CompanyReport.tsx`

**Edge Function:** `generate-company-report`

**Como acessar:**
1. URL local: `http://localhost:5173/reports?companyId={companyId}`
2. Ou via navegação: Menu "Relatórios" → Aba "Empresa"

**Fluxo:**
```
ReportsPage (src/pages/ReportsPage.tsx)
  ↓
CompanyReport (src/components/reports/CompanyReport.tsx)
  ↓
Chama: supabase.functions.invoke('generate-company-report', { companyId })
  ↓
Edge Function: supabase/functions/generate-company-report/index.ts
  ↓
Retorna JSON com campo: report.matchFit
  ↓
CompanyReport renderiza: <MatchFitDashboard matchFit={report.matchFit} />
```

---

#### MC6 – Relatório de ICP com Match & Fit Overview

**Rota:** `/central-icp/reports/:icpId`

**Componente Principal:** `src/pages/CentralICP/ICPReports.tsx` + `src/components/reports/StrategicReportRenderer.tsx`

**Edge Function:** `generate-icp-report`

**Como acessar:**
1. URL local: `http://localhost:5173/central-icp/reports/{icpId}`
2. Ou via navegação: Menu "Central ICP" → "Relatórios" → Selecionar ICP

**Fluxo:**
```
ICPReports (src/pages/CentralICP/ICPReports.tsx)
  ↓
Chama: supabase.functions.invoke('generate-icp-report', { icp_metadata_id, tenant_id, report_type })
  ↓
Edge Function: supabase/functions/generate-icp-report/index.ts
  ↓
Persiste linha em icp_reports com report_data estruturado
  ↓
ICPReports carrega último icp_reports para o ICP atual
  ↓
Renderiza usando StrategicReportRenderer:
  - Overview (report_data.analysis / step5_ResumoRelatorio.resumoExecutivo)
  - Nichos e setores (step2_SetoresNichos)
  - Perfil do cliente ideal (step3_PerfilClienteIdeal)
```

---

### Edge Functions

#### `generate-company-report`

**Localização:** `supabase/functions/generate-company-report/index.ts`

**Endpoint:** `https://<PROJECT_ID>.supabase.co/functions/v1/generate-company-report`

**Payload:**
```json
{
  "companyId": "uuid-da-empresa"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "report": {
    "matchFit": {
      "scores": [...],
      "recommendations": [...],
      "executiveSummary": "...",
      "metadata": {...}
    },
    // ... outros campos do relatório
  }
}
```

---

#### `generate-icp-report`

**Localização:** `supabase/functions/generate-icp-report/index.ts`

**Endpoint:** `https://<PROJECT_ID>.supabase.co/functions/v1/generate-icp-report`

**Payload:**
```json
{
  "icp_metadata_id": "uuid-do-icp",
  "tenant_id": "uuid-do-tenant",
  "report_type": "completo" | "resumo"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "report": {
    "report_data": {
      "icpMatchFitOverview": {
        "enabled": true,
        "summary": "...",
        "score": 82,
        "portfolioCoverage": [...],
        "notes": [...]
      },
      // ... outros campos do relatório ICP
    }
  }
}
```

---

## 🧪 TESTES MC5 – COMPANY MATCH & FIT (RELATÓRIO DA EMPRESA)

### Cenário 1: Empresa com Fit Alto

**Objetivo:** Validar que o Match & Fit funciona corretamente quando há alto alinhamento entre empresa, ICP e portfólio.

#### Pré-condições

1. **Tenant configurado:**
   - Tenant com portfólio de produtos cadastrado (`tenant_products`)
   - ICP principal configurado com setores-alvo, CNAEs, porte, etc.
   - Onboarding completo com dados do ICP

2. **Empresa monitorada:**
   - Empresa cadastrada no sistema (`companies` table)
   - Empresa com dados completos:
     - Setor/CNAE alinhado com ICP
     - Porte alinhado com ICP
     - Região alinhada com ICP
   - Empresa com dados de enriquecimento (Apollo, Receita Federal, etc.)

#### Passos de Teste

1. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acessar rota do relatório:**
   - Abrir navegador: `http://localhost:5173/reports?companyId={companyId}`
   - Substituir `{companyId}` pelo UUID de uma empresa real do tenant

3. **Abrir DevTools:**
   - Pressionar `F12` ou `Ctrl+Shift+I`
   - Aba "Network" (Rede)
   - Filtrar por "generate-company-report"

4. **Gerar relatório:**
   - Se o relatório já existir, clicar em "Atualizar" ou "Regenerar"
   - Se não existir, o sistema gerará automaticamente
   - Aguardar conclusão (pode levar 30-60 segundos)

5. **Inspecionar requisição:**
   - Na aba Network, localizar requisição `generate-company-report`
   - Clicar na requisição → Aba "Response" ou "Preview"
   - Verificar estrutura JSON retornada

6. **Validar campo `matchFit` no JSON:**
   ```json
   {
     "report": {
       "matchFit": {
         "scores": [
           {
             "referenceType": "product",
             "referenceName": "Nome do Produto",
             "score": 85,
             "factors": ["Setor alinhado", "Porte adequado", ...]
           },
           {
             "referenceType": "icp",
             "referenceName": "ICP Principal",
             "score": 75,
             "factors": [...]
           }
         ],
         "recommendations": [
           {
             "title": "Recomendação: Nome do Produto",
             "description": "...",
             "priority": "high",
             "impact": "high",
             "risksOfNotActing": [...],
             "nextAction": "..."
           }
         ],
         "executiveSummary": "Análise de Match & Fit identificou...",
         "metadata": {
           "bestFitScore": 85,
           "bestFitType": "product",
           "dataCompleteness": "complete"
         }
       }
     }
   }
   ```

7. **Validar UI (Dashboard MC5):**
   - Verificar se o componente `MatchFitDashboard` está renderizado
   - Verificar se o radar SVG (`ScoreRadar`) está exibindo scores
   - Verificar se a lista de recomendações (`RecommendationList`) está exibindo cards
   - Verificar se o resumo executivo está presente
   - Verificar logs no console:
     - `MC5:UI: dashboard render`
     - `MC5:UI: radar render`
     - `MC5:UI: list render`

#### Resultados Esperados

✅ **JSON:**
- `matchFit.scores` com pelo menos 2 scores (1 produto + 1 ICP)
- `matchFit.scores[0].score >= 70` (fit alto)
- `matchFit.recommendations.length >= 1`
- `matchFit.executiveSummary` não vazio
- `matchFit.metadata.bestFitScore >= 70`

✅ **UI:**
- Dashboard Match & Fit visível na página
- Radar SVG exibindo polígono coerente
- Lista de recomendações com cards completos
- Resumo executivo exibido
- Logs MC5 presentes no console

✅ **Logs no Console:**
```
MC5:UI: dashboard render { hasMatchFit: true, scoresCount: 3, recommendationsCount: 2 }
MC5:UI: radar render { scoresCount: 3 }
MC5:UI: list render { recommendationsCount: 2 }
```

---

### Cenário 2: Empresa com Fit Baixo / Parcial

**Objetivo:** Validar que o Match & Fit lida corretamente com empresas com baixo alinhamento.

#### Pré-condições

1. **Tenant configurado:**
   - Mesmo tenant do Cenário 1

2. **Empresa com fit baixo:**
   - Empresa cadastrada com características diferentes do ICP:
     - Setor diferente do ICP
     - Porte fora do range do ICP
     - Região diferente do ICP
   - Ou empresa com dados incompletos

#### Passos de Teste

1. **Acessar rota do relatório:**
   - `http://localhost:5173/reports?companyId={companyIdBaixoFit}`

2. **Gerar relatório:**
   - Aguardar conclusão

3. **Validar campo `matchFit` no JSON:**
   ```json
   {
     "report": {
       "matchFit": {
         "scores": [
           {
             "referenceType": "product",
             "score": 35,  // Score baixo
             "factors": ["Setor parcialmente alinhado", ...]
           }
         ],
         "recommendations": [
           {
             "title": "...",
             "priority": "low" | "medium",  // Prioridade menor
             "description": "Fit identificado, mas com limitações..."
           }
         ],
         "metadata": {
           "bestFitScore": 35,  // Score baixo
           "dataCompleteness": "partial"  // Dados parciais
         }
       }
     }
   }
   ```

4. **Validar UI:**
   - Dashboard ainda renderiza (não quebra)
   - Radar pode mostrar scores baixos (polígono pequeno)
   - Recomendações podem ter prioridade "low" ou "medium"
   - Aviso de dados parciais pode aparecer

#### Resultados Esperados

✅ **JSON:**
- `matchFit.scores` presente (mesmo que com scores baixos)
- `matchFit.scores[0].score < 50` (fit baixo)
- `matchFit.recommendations` pode estar vazio ou com prioridade baixa
- `matchFit.metadata.dataCompleteness` pode ser "partial" ou "insufficient"

✅ **UI:**
- Dashboard renderiza sem erros
- Radar exibe scores baixos corretamente
- Sistema não quebra com dados parciais

---

### Cenário 3: Empresa sem Dados Suficientes

**Objetivo:** Validar que o sistema lida graciosamente com empresas sem dados suficientes para Match & Fit.

#### Pré-condições

1. **Empresa com dados mínimos:**
   - Empresa cadastrada apenas com CNPJ
   - Sem dados de enriquecimento
   - Sem dados de setor/porte/região

#### Passos de Teste

1. **Acessar rota do relatório:**
   - `http://localhost:5173/reports?companyId={companyIdSemDados}`

2. **Gerar relatório:**
   - Aguardar conclusão

3. **Validar campo `matchFit` no JSON:**
   ```json
   {
     "report": {
       "matchFit": {
         "scores": [],  // Array vazio
         "recommendations": [],  // Array vazio
         "executiveSummary": "Dados insuficientes para análise de Match & Fit...",
         "metadata": {
           "dataCompleteness": "insufficient",
           "missingData": ["setor", "porte", "região"]
         }
       }
     }
   }
   ```
   
   **OU:**
   
   ```json
   {
     "report": {
       // matchFit ausente ou null
     }
   }
   ```

4. **Validar UI:**
   - Se `matchFit` for `null` ou ausente:
     - Dashboard não renderiza (ou renderiza mensagem "Match & Fit em processamento...")
   - Se `matchFit` existir mas com scores vazios:
     - Dashboard renderiza mas sem radar
     - Mensagem apropriada exibida

#### Resultados Esperados

✅ **JSON:**
- `matchFit` pode estar ausente, `null`, ou com `scores: []`
- Se presente, `matchFit.metadata.dataCompleteness === "insufficient"`
- Relatório da empresa ainda é gerado normalmente

✅ **UI:**
- Página não quebra
- Dashboard lida graciosamente com dados ausentes
- Mensagem apropriada exibida ao usuário

---

## 🧪 TESTES MC6 – ICP MATCH & FIT OVERVIEW

### Cenário 1: ICP Completo + Portfólio Completo

**Objetivo:** Validar que o `icpMatchFitOverview` é gerado corretamente quando há ICP e portfólio completos.

#### Pré-condições

1. **Tenant configurado:**
   - ICP principal configurado com:
     - Setores-alvo definidos (`step3_PerfilClienteIdeal.setoresAlvo`)
     - CNAEs-alvo definidos
     - Porte-alvo definido
     - Regiões-alvo definidas
   - Portfólio com múltiplos produtos ativos:
     - Produtos com `setores_alvo` alinhados com ICP
     - Produtos com `cnaes_alvo` alinhados com ICP
     - Produtos com `portes_alvo` alinhados com ICP

#### Passos de Teste

1. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acessar rota de relatórios ICP:**
   - Abrir navegador: `http://localhost:5173/central-icp/reports/{icpId}`
   - Substituir `{icpId}` pelo UUID do ICP principal do tenant

3. **Abrir DevTools:**
   - Pressionar `F12`
   - Aba "Network"
   - Filtrar por "generate-icp-report"

4. **Gerar relatório:**
   - Na página, clicar em "Gerar Relatório Completo" ou "Gerar Resumo"
   - Aguardar conclusão (pode levar 60-120 segundos)

5. **Inspecionar requisição:**
   - Na aba Network, localizar requisição `generate-icp-report`
   - Clicar na requisição → Aba "Response" ou "Preview"
   - Verificar estrutura JSON retornada

6. **Validar campo `icpMatchFitOverview` no JSON:**
   ```json
   {
     "success": true,
     "report": {
       "report_data": {
         "icpMatchFitOverview": {
           "enabled": true,
           "summary": "Análise de Match & Fit identificou 5 alinhamentos entre o ICP e o portfólio do tenant, com score médio de 82%.",
           "score": 82,
           "portfolioCoverage": ["Indústria", "Manufatura", "Serviços"],
           "notes": [
             "Alto alinhamento entre ICP e portfólio indica boa estratégia de produto.",
             "Produto \"ERP Industrial Modular\" apresenta alto fit com o ICP.",
             "Portfólio cobre 3 de 2 setores-alvo do ICP."
           ]
         },
         // ... outros campos do relatório ICP
       }
     }
   }
   ```

7. **Validar logs no console:**
   - Verificar logs MC6 (se aplicável):
     ```
     [GENERATE-ICP-REPORT] MC6: Iniciando Match & Fit para ICP
     [MC6] Iniciando análise ICP x Portfólio para tenant: {tenantId}
     [GENERATE-ICP-REPORT] MC6: Match & Fit concluído { enabled: true, score: 82 }
     ```

8. **Validar UI:**
   - Seção "Visão Geral – Match & Fit do ICP" exibindo o texto de `analysis` ou `resumoExecutivo`
   - Blocos de nichos, setores e dores populados sem placeholders
   - StrategicReportRenderer renderizando o conteúdo de `analysis` corretamente

#### Resultados Esperados

✅ **JSON:**
- `report_data.analysis` preenchido com overview textual
- `report_data.onboarding_data.step2_SetoresNichos.nichosAlvo` e `setoresAlvo` com listas coerentes
- `report_data.onboarding_data.step3_PerfilClienteIdeal.doresPrioritarias` e `gatilhosCompra` preenchidos
- `report_data.onboarding_data.step5_ResumoRelatorio.resumoExecutivo` presente (se disponível)

✅ **Logs:**
- Logs MC6 presentes no Supabase (se aplicável)
- Nenhum erro relacionado ao Match & Fit

✅ **Relatório ICP:**
- Relatório ICP gerado normalmente
- Campo `report_data` presente e estruturado corretamente

---

### Cenário 2: ICP Presente + Portfólio Vazio

**Objetivo:** Validar que o sistema lida corretamente quando o tenant não tem portfólio cadastrado.

#### Pré-condições

1. **Tenant configurado:**
   - ICP principal configurado (mesmo do Cenário 1)
   - **Portfólio vazio:** Nenhum produto cadastrado em `tenant_products` OU todos os produtos com `ativo = false`

#### Passos de Teste

1. **Acessar rota de relatórios ICP:**
   - `http://localhost:5173/central-icp/reports/{icpId}`

2. **Gerar relatório:**
   - Clicar em "Gerar Relatório Completo"
   - Aguardar conclusão

3. **Validar campo `report_data` no JSON:**
   ```json
   {
     "report": {
       "report_data": {
         "analysis": "Análise do ICP com informações limitadas...",
         "onboarding_data": {
           "step2_SetoresNichos": {
             "nichosAlvo": [],
             "setoresAlvo": []
           },
           "step3_PerfilClienteIdeal": {
             "doresPrioritarias": [],
             "gatilhosCompra": []
           }
         }
       }
     }
   }
   ```
   
   **OU** se o relatório não foi gerado devido a falta de dados:
   - Nenhuma linha em `icp_reports` para este ICP
   - Ou `report_data.analysis` existe, mas com conteúdo condizente com baixa informação

4. **Validar logs:**
   - Verificar que não há erros
   - Logs MC6 indicam que portfólio está vazio

#### Resultados Esperados

✅ **JSON:**
- `report_data.analysis` existe, mas com conteúdo condizente com baixa informação
- Listas de nichos/setores podem estar vazias, porém:
  - A UI não quebra
  - Não são exibidas mensagens genéricas de placeholder; no máximo, ausência silenciosa dos blocos

✅ **Relatório ICP:**
- Relatório ICP gerado normalmente (ou não gerado se dados insuficientes)
- Campo `report_data` presente (se relatório foi gerado)

---

### Cenário 3: Erro Interno Simulado

**Objetivo:** Validar que o sistema não quebra o relatório ICP quando há erro interno no Match & Fit.

#### Pré-condições

1. **Tenant com dados inconsistentes:**
   - ICP configurado mas sem `step3_PerfilClienteIdeal` no onboarding
   - Ou ICP sem setores-alvo definidos

#### Passos de Teste

1. **Acessar rota de relatórios ICP:**
   - `http://localhost:5173/central-icp/reports/{icpId}`

2. **Gerar relatório:**
   - Clicar em "Gerar Relatório Completo"
   - Aguardar conclusão

3. **Validar comportamento em caso de erro:**
   - Se a edge function falhar:
     - Nenhuma linha inconsistente é gravada em `icp_reports`
     - A UI de MC6 exibe fallback controlado (mensagem real de erro/log já existente no sistema), sem texto de placeholder
     - MC5 continua funcionando normalmente
   
   - Se o relatório for gerado mas com dados inconsistentes:
     ```json
     {
       "report": {
         "report_data": {
           "analysis": "Análise parcial devido a dados incompletos...",
           "onboarding_data": {
             "step2_SetoresNichos": null,
             "step3_PerfilClienteIdeal": null
           }
         }
       }
     }
     ```

4. **Validar logs:**
   - Verificar logs de erro (se houver):
     ```
     [GENERATE-ICP-REPORT] MC6: Erro ao calcular Match & Fit: ...
     [MC6] Erro ao processar Match & Fit: ...
     ```

#### Resultados Esperados

✅ **JSON:**
- Se erro ocorrer antes da geração: nenhuma linha em `icp_reports`
- Se erro ocorrer durante a geração: `report_data` pode estar parcial ou vazio
- Relatório ICP não quebra o sistema

✅ **Logs:**
- Erros registrados mas não propagados
- Relatório ICP não é interrompido (ou não é gerado, mas sistema continua funcional)

✅ **UI:**
- A UI de MC6 exibe fallback controlado (mensagem real de erro/log já existente no sistema), sem texto de placeholder
- MC5 continua funcionando normalmente

---

## 🔧 TESTES DIRETOS VIA EDGE FUNCTIONS (SEM UI)

### Setup Inicial

**Ferramentas necessárias:**
- REST Client (Insomnia, Postman, ou similar)
- Ou `curl` via terminal
- Credenciais do Supabase:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

**Obter credenciais:**
1. Acessar: `https://app.supabase.com/project/{PROJECT_ID}/settings/api`
2. Copiar:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` ou `service_role` → `SUPABASE_KEY`

---

### Teste 1: `generate-company-report` (MC5)

#### Requisição

**Método:** `POST`

**URL:** `https://{PROJECT_ID}.supabase.co/functions/v1/generate-company-report`

**Headers:**
```
Authorization: Bearer {SUPABASE_KEY}
Content-Type: application/json
```

**Body:**
```json
{
  "companyId": "uuid-da-empresa-real"
}
```

#### Exemplo com curl (Windows PowerShell)

```powershell
$SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
$SUPABASE_KEY = "YOUR_ANON_OR_SERVICE_ROLE_KEY"
$COMPANY_ID = "uuid-da-empresa"

$body = @{
    companyId = $COMPANY_ID
} | ConvertTo-Json

Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-company-report" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $SUPABASE_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

#### Validação da Resposta

1. **Verificar status HTTP:**
   - `200 OK` → Sucesso
   - `400 Bad Request` → Verificar payload
   - `500 Internal Server Error` → Verificar logs do Supabase

2. **Verificar estrutura JSON:**
   ```json
   {
     "success": true,
     "report": {
       "matchFit": {
         "scores": [...],
         "recommendations": [...],
         "executiveSummary": "...",
         "metadata": {...}
       }
     }
   }
   ```

3. **Validar campo `matchFit`:**
   - ✅ `matchFit` presente
   - ✅ `matchFit.scores` é array (pode estar vazio)
   - ✅ `matchFit.recommendations` é array (pode estar vazio)
   - ✅ `matchFit.executiveSummary` é string
   - ✅ `matchFit.metadata` é objeto

4. **Validar logs no Supabase:**
   - Acessar: `https://app.supabase.com/project/{PROJECT_ID}/logs/edge-functions`
   - Filtrar por `generate-company-report`
   - Verificar logs:
     ```
     [generate-company-report] MC4-EDGE: Match & Fit calculado
     ```

---

### Teste 2: `generate-icp-report` (MC6)

#### Requisição

**Método:** `POST`

**URL:** `https://{PROJECT_ID}.supabase.co/functions/v1/generate-icp-report`

**Headers:**
```
Authorization: Bearer {SUPABASE_KEY}
Content-Type: application/json
```

**Body:**
```json
{
  "icp_metadata_id": "uuid-do-icp",
  "tenant_id": "uuid-do-tenant",
  "report_type": "completo"
}
```

#### Exemplo com curl (Windows PowerShell)

```powershell
$SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
$SUPABASE_KEY = "YOUR_ANON_OR_SERVICE_ROLE_KEY"
$ICP_ID = "uuid-do-icp"
$TENANT_ID = "uuid-do-tenant"

$body = @{
    icp_metadata_id = $ICP_ID
    tenant_id = $TENANT_ID
    report_type = "completo"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-icp-report" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $SUPABASE_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

#### Validação da Resposta

1. **Verificar status HTTP:**
   - `200 OK` → Sucesso
   - `400 Bad Request` → Verificar payload
   - `404 Not Found` → ICP não encontrado
   - `500 Internal Server Error` → Verificar logs

2. **Verificar estrutura JSON:**
   ```json
   {
     "success": true,
     "report": {
       "id": "uuid",
       "report_type": "full",
       "generated_at": "2025-01-27T...",
       "report_data": {
         "analysis": "...",
         "onboarding_data": {
           "step2_SetoresNichos": {
             "nichosAlvo": [...],
             "setoresAlvo": [...]
           },
           "step3_PerfilClienteIdeal": {
             "doresPrioritarias": [...],
             "gatilhosCompra": [...]
           },
           "step5_ResumoRelatorio": {
             "resumoExecutivo": "...",
             "recomendacoesChave": [...]
           }
         },
         "recommendations": "..."
       }
     }
   }
   ```

3. **Validar campo `report_data`:**
   - ✅ `report_data` presente
   - ✅ `report_data.analysis` é string (pode estar vazia se dados insuficientes)
   - ✅ `report_data.onboarding_data` é objeto (pode ter campos opcionais)
   - ✅ `report_data.onboarding_data.step2_SetoresNichos` pode estar presente
   - ✅ `report_data.onboarding_data.step3_PerfilClienteIdeal` pode estar presente

4. **Validar logs no Supabase:**
   - Filtrar por `generate-icp-report`
   - Verificar logs (se aplicável):
     ```
     [GENERATE-ICP-REPORT] MC6: Iniciando Match & Fit para ICP
     [MC6] Iniciando análise ICP x Portfólio para tenant: {tenantId}
     [GENERATE-ICP-REPORT] MC6: Match & Fit concluído { enabled: true, score: 82 }
     ```
   - Verificar que a linha foi persistida em `icp_reports`:
     ```sql
     SELECT id, report_type, generated_at 
     FROM icp_reports 
     WHERE icp_profile_metadata_id = '{icpId}' 
       AND tenant_id = '{tenantId}'
     ORDER BY generated_at DESC 
     LIMIT 1;
     ```

---

## 📊 MATRIZ DE RESULTADOS ESPERADOS

### MC5 – Company Match & Fit

| Cenário | `matchFit` Presente? | `scores.length` | `recommendations.length` | `metadata.bestFitScore` | UI Renderiza? |
|---------|---------------------|------------------|-------------------------|------------------------|---------------|
| Fit Alto | ✅ Sim | >= 2 | >= 1 | >= 70 | ✅ Sim (completo) |
| Fit Baixo | ✅ Sim | >= 1 | >= 0 | < 50 | ✅ Sim (parcial) |
| Sem Dados | ⚠️ Pode estar ausente | 0 | 0 | N/A | ✅ Sim (mensagem) |

---

### MC6 – ICP Match & Fit Overview

| Cenário | `icpMatchFitOverview.enabled` | `score` Presente? | `portfolioCoverage` Presente? | `notes` Presente? | Relatório ICP Quebra? |
|---------|------------------------------|-------------------|------------------------------|-------------------|----------------------|
| ICP + Portfólio Completo | ✅ `true` | ✅ Sim (0-100) | ✅ Sim (array) | ✅ Sim (array) | ❌ Não |
| ICP + Portfólio Vazio | ❌ `false` | ❌ Não | ❌ Não | ❌ Não | ❌ Não |
| Erro Interno | ❌ `false` | ❌ Não | ❌ Não | ❌ Não | ❌ Não |

---

## 🔍 INTERPRETAÇÃO DE LOGS

### Logs MC5 (Company Match & Fit)

**Logs esperados no console do navegador:**
```
MC5:UI: dashboard render { hasMatchFit: true, scoresCount: 3, recommendationsCount: 2 }
MC5:UI: radar render { scoresCount: 3 }
MC5:UI: list render { recommendationsCount: 2 }
```

**Logs esperados no Supabase (Edge Function):**
```
[generate-company-report] MC4-EDGE: Match & Fit calculado {
  scoresCount: 3,
  recommendationsCount: 2,
  bestScore: 85
}
```

**Interpretação:**
- `hasMatchFit: true` → Match & Fit foi gerado com sucesso
- `scoresCount: 3` → 3 scores calculados (produtos + ICP)
- `recommendationsCount: 2` → 2 recomendações geradas
- `bestScore: 85` → Melhor fit é 85%

---

### Logs MC6 (ICP Match & Fit Overview)

**Logs esperados no Supabase (Edge Function):**
```
[GENERATE-ICP-REPORT] MC6: Iniciando Match & Fit para ICP
[MC6] Iniciando análise ICP x Portfólio para tenant: {tenantId}
[GENERATE-ICP-REPORT] MC6: Match & Fit concluído { enabled: true, score: 82 }
```

**OU em caso de erro:**
```
[GENERATE-ICP-REPORT] MC6: Erro ao calcular Match & Fit: {erro}
[MC6] Erro ao processar Match & Fit: {erro}
```

**Interpretação:**
- `enabled: true` → Análise gerada com sucesso
- `score: 82` → Score global de 82%
- Se `enabled: false` → Análise não foi gerada (verificar `summary`)

---

## ✅ CHECKLIST DE VALIDAÇÃO

### MC5 – Company Match & Fit

- [ ] Cenário 1 (Fit Alto) executado e validado
- [ ] Cenário 2 (Fit Baixo) executado e validado
- [ ] Cenário 3 (Sem Dados) executado e validado
- [ ] JSON `matchFit` presente e válido
- [ ] UI renderiza corretamente
- [ ] Logs MC5 presentes no console
- [ ] Nenhum erro de runtime

---

### MC6 – ICP Match & Fit Overview

- [ ] Cenário 1 (ICP + Portfólio Completo) executado e validado
- [ ] Cenário 2 (ICP + Portfólio Vazio) executado e validado
- [ ] Cenário 3 (Erro Interno) executado e validado
- [ ] JSON `icpMatchFitOverview` presente e válido
- [ ] Relatório ICP não quebra em nenhum cenário
- [ ] Logs MC6 presentes no Supabase
- [ ] Nenhum erro propagado

---

### Testes via Edge Functions

- [ ] `generate-company-report` testado via REST client
- [ ] `generate-icp-report` testado via REST client
- [ ] Respostas JSON validadas
- [ ] Logs verificados no Supabase

---

## 🎯 CONCLUSÃO

Este documento fornece um **plano completo de testes end-to-end** para validar MC5 e MC6 na prática, com dados reais de tenant.

**Próximos passos:**
1. Executar os cenários de teste descritos
2. Registrar resultados reais
3. Documentar qualquer comportamento inesperado
4. Validar que todos os cenários passam antes de considerar MC5 e MC6 prontos para produção

---

**Status:** ✅ **PLANO COMPLETO E PRONTO PARA EXECUÇÃO**

