# MC9-V2.4 — UNIVERSAL REPORT FIX (STRATEVO ONE)

🚨 Instruções obrigatórias para o Cursor:

- Projeto-alvo: **STRATEVO / Central ICP** (mesmo monorepo atual; NÃO criar projetos novos).

- **NÃO** remover, sobrescrever ou alterar qualquer funcionalidade fora dos arquivos explicitamente citados.

- **NÃO** criar placeholders, textos "em breve", "mock", "demo" ou similares.

- **NÃO** reintroduzir conteúdo fixo da UNI LUVAS em runtime. Nenhum relatório pode ser hard-coded.

- O objetivo é **apenas**:

  1. Fazer o front consumir SEMPRE o **novo relatório universal** salvo no banco.

  2. Tratar relatórios antigos apenas como "legado" com aviso.

  3. Eliminar o uso prático do Frankenstein antigo.

---

## 1. Diagnóstico que você deve assumir

Baseado nos logs e prints:

- A Edge Function `generate-icp-report` já está salvando o relatório novo.

- A tabela de relatórios possui, em essência, campos como:

  - `full_report_markdown`

  - `executive_summary_markdown`

  - `report_data` (JSON)

  - e possivelmente algum campo legado (`legacy_full_report`, `legacy_summary` ou equivalente).

- O componente `ICPReports.tsx` ainda:

  - usa lógica de `isOldReport` ou similar;

  - prioriza conteúdo legado (UNI LUVAS Frankenstein) quando `fullReportMarkdown` está vazio ou mal lido;

  - renderiza esse texto antigo na tela.

Você deve **corrigir o fluxo de dados** para que:

1. O front SEMPRE leia primeiro os **campos novos**.

2. Só caia no modo "relatório antigo" quando realmente não existir conteúdo novo.

3. Nenhum trecho de texto da UNI LUVAS fique hard-coded no código do front.

---

## 2. Ajustar a Edge Function (garantir persistência correta)

### Arquivo-alvo (exemplo, ajuste para o nome real):

- `supabase/functions/generate-icp-report/index.ts`

  ou caminho equivalente onde a Edge Function está.

### Objetivo

- Garantir que o resultado da LLM seja salvo em:

  - `full_report_markdown` (coluna nova)

  - `executive_summary_markdown` (coluna nova)

  - E, se ainda usado, em `report_data.fullReportMarkdown` e `report_data.executiveSummaryMarkdown`.

### Ações

1. **Localize** o trecho onde o resultado da LLM é montado, algo como:

   ```ts
   const artifacts = {
     executiveSummaryMarkdown,
     fullReportMarkdown,
     // ...
   };
   ```

2. **Garanta** que o `upsert`/`insert` em `icp_reports` esteja assim (ajuste para os nomes reais de tabela/colunas):

   ```ts
   const { data, error } = await supabaseAdmin
     .from('icp_reports')
     .upsert({
       id: reportId,
       icp_id: icpId,
       tenant_id: tenantId,
       report_type: reportType, // 'completo' ou 'resumo'
       status: 'completed',
       full_report_markdown: fullReportMarkdown ?? null,
       executive_summary_markdown: executiveSummaryMarkdown ?? null,
       report_data: {
         ...existingReportData, // se houver
         fullReportMarkdown: fullReportMarkdown ?? existingReportData?.fullReportMarkdown ?? null,
         executiveSummaryMarkdown: executiveSummaryMarkdown ?? existingReportData?.executiveSummaryMarkdown ?? null,
       },
     })
     .select()
     .single();
   ```

3. **Adicione logs claros** (apenas para debug, sem quebrar nada):

   ```ts
   console.log('[GENERATE-ICP-REPORT] FINAL_ARTIFACTS', {
     hasFullReport: !!fullReportMarkdown,
     fullReportLength: fullReportMarkdown?.length ?? 0,
     hasExecSummary: !!executiveSummaryMarkdown,
     execSummaryLength: executiveSummaryMarkdown?.length ?? 0,
   });
   ```

4. **NÃO** salve nenhum texto de exemplo fixo (UNI LUVAS) como fallback.

---

## 3. Corrigir o front: `ICPReports.tsx`

### Arquivo-alvo

* `src/pages/CentralICP/ICPReports.tsx`

  (ou caminho equivalente — use o arquivo que aparece nos logs).

### 3.1. Normalizar leitura de dados

1. **Localize** o trecho que seleciona os relatórios:

   ```ts
   const completeReport = reports.find( ... );
   const summaryReport = reports.find( ... );
   ```

2. Logo após isso, **crie variáveis normalizadas**:

   ```ts
   const completeReportData = completeReport?.report_data || {};
   const summaryReportData = summaryReport?.report_data || {};
   
   const fullReportMarkdown =
     completeReport?.full_report_markdown ||
     completeReportData.fullReportMarkdown ||
     '';
   
   const executiveSummaryMarkdown =
     summaryReport?.executive_summary_markdown ||
     summaryReportData.executiveSummaryMarkdown ||
     '';
   
   const hasFullReport = !!fullReportMarkdown && fullReportMarkdown.trim().length > 0;
   const hasExecutiveSummary = !!executiveSummaryMarkdown && executiveSummaryMarkdown.trim().length > 0;
   
   // Campos legados, se existirem:
   const legacyFullReport = (completeReportData.legacyFullReport || completeReport?.legacy_full_report || '') as string;
   const legacyExecutiveSummary = (summaryReportData.legacyExecutiveSummary || summaryReport?.legacy_executive_summary || '') as string;
   ```

3. **Atualize qualquer lógica** de `hasReportData`, `hasFullReport`, `hasExecutiveSummary` para usar **essas variáveis**.

4. **Remova/ajuste** qualquer variável `isOldReport` que esteja recebendo TEXTO e não um boolean.

   Em vez disso, faça:

   ```ts
   const isOldReport = !hasFullReport && !!legacyFullReport;
   const isOldSummary = !hasExecutiveSummary && !!legacyExecutiveSummary;
   ```

### 3.2. Lógica de renderização do Relatório Completo

1. Localize o trecho dos logs:

   ```ts
   console.log('[ICPReports] 📄 Renderizando Relatório Completo:', { ... });
   console.log('[ICPReports] 📝 Conteúdo do relatório:', { ... });
   ```

2. Atualize esse log para refletir as novas variáveis:

   ```ts
   console.log('[ICPReports] 📄 Renderizando Relatório Completo:', {
     hasReportData: !!completeReport,
     hasFullReport,
     hasLegacyFullReport: !!legacyFullReport,
     fullReportLength: fullReportMarkdown.length,
   });
   
   console.log('[ICPReports] 📝 Conteúdo do relatório:', {
     preview: fullReportMarkdown.substring(0, 200),
     legacyPreview: legacyFullReport.substring(0, 200),
   });
   ```

3. **Renderização**:

   * Quando **`hasFullReport === true`**:

     * Renderize **apenas** o conteúdo do `fullReportMarkdown` parseado (da forma como a tela já faz hoje — accordions, seções, etc.).

     * **NÃO** use nenhum texto legado aqui.

   * Quando **`hasFullReport === false` e `isOldReport === true`**:

     * Mostre apenas um banner de aviso e um texto curto, por exemplo:

       ```tsx
       <Alert variant="warning">
         <AlertTitle>Relatório antigo detectado</AlertTitle>
         <AlertDescription>
           Este relatório foi gerado na versão anterior do STRATEVO One.
           Para gerar o novo modelo universal, clique em <strong>"Regenerar"</strong> na aba "Gerar Relatórios".
         </AlertDescription>
       </Alert>
       ```

     * **NÃO** renderizar o texto gigante da UNI LUVAS. Ele deve ser tratado apenas como legado ou removido totalmente.

4. **Elimine qualquer fallback textual** que injete diretamente aquele bloco monstruoso (Visão Geral da Empresa, Top 5 Oportunidades etc.) no JSX.

   * Se houver constantes/arquivos do tipo `demoReportUniLuvas`, `FAKE_REPORT_UNI_LUVAS`, etc.,

     remova seu uso da tela de produção e deixe, no máximo, em arquivos de testes/storybook — NUNCA na tela real.

### 3.3. Lógica de renderização do Resumo

Repita a mesma linha de raciocínio:

1. Use `executiveSummaryMarkdown` como fonte principal.

2. Use `legacyExecutiveSummary` **apenas** para detectar relatório antigo e exibir o banner.

3. **Não** injete texto estático da UNI LUVAS no JSX.

---

## 4. Eliminar Frankenstein da UNI LUVAS do runtime

1. Faça uma busca global no projeto por:

   * `"UNI LUVAS CONFECCAO DE LUVAS LTDA"`

   * `"UNI LUVAS"`

   * trechos grandes do relatório (ex.: `"EPIs premium de alta performance"`).

2. Para cada ocorrência:

   * Se estiver em:

     * testes (`*.test.tsx`, `*.spec.ts`, `*.stories.tsx`);

     * documentação interna;

     * comentários;

       → OK manter.

   * Se estiver em:

     * componentes React;

     * serviços de runtime;

     * seeds que rodam em produção;

       → REMOVER do fluxo de produção.

   Substitua por:

   * nada (se for texto de fallback), ou

   * conteúdo genérico neutro apenas em testes/doc.

3. Confirme que nenhuma rota ou componente carrega esse texto ao abrir a tela de relatórios sem acessar o banco.

---

## 5. Comportamento universal (SaaS)

Garanta estas regras no código:

1. Nenhum componente depende de:

   * nome de empresa específico,

   * setor específico,

   * CNAE específico.

2. Todo o conteúdo utilizado na tela vem de:

   * `full_report_markdown` / `executive_summary_markdown`; ou

   * `report_data.fullReportMarkdown` / `report_data.executiveSummaryMarkdown`.

3. Qualquer empresa, de qualquer setor, deve seguir **exatamente o mesmo fluxo**.

---

## 6. Checklist pós-patch (auto-verificação do Cursor)

Ao terminar, o Cursor deve:

1. Rodar lint/build (ou o equivalente configurado) e garantir **zero erros**.

2. Confirmar que:

   * `ICPReports.tsx`:

     * usa `fullReportMarkdown` e `executiveSummaryMarkdown` como fontes principais;

     * só marca `isOldReport` quando **não** houver conteúdo novo;

     * não tem texto hard-coded de UNI LUVAS.

3. Confirmar que:

   * a Edge Function salva corretamente os campos novos.

4. Mostrar no diff que:

   * qualquer bloco gigante de texto da UNI LUVAS foi removido do runtime.

**NÃO** criar arquivos, páginas ou componentes novos além do necessário para este patch.

---

## Como testar depois de aplicar

Quando o Cursor terminar:

1. Atualize a página dos relatórios ICP.

2. Clique em **"Gerar Relatórios" → "Regenerar"** (completo e resumo).

3. Veja no console do navegador:

   - `fullReportLength` **> 0**

   - `preview` mostrando o início do novo relatório, não mais o Frankenstein.

4. Na UI:

   - O **Relatório Completo** e o **Resumo** devem aparecer com o **modelo novo universal**, sem nenhum texto fixo de UNI LUVAS.

   - Se algum ICP antigo não tiver versão nova, deve aparecer apenas o banner "Relatório antigo detectado".

Se depois disso ainda aparecer lixo antigo, a gente parte pra um ataque cirúrgico em cima do diff que ele gerou.

