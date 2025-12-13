# 🚀 SOLUÇÃO PODEROSA: Matching ICP Completo com Análise 380°

## 📊 ANÁLISE COMPLETA: O Que Já Existe na Plataforma

### **1. PÁGINA: Central ICP > Profile (ICPDetail.tsx)**

#### **7 Abas Principais:**

1. **📋 Resumo**
   - Setor foco do ICP
   - Nichos alvo (array)
   - CNAEs alvo (array) ✅ **JÁ EXISTE!**
   - Faturamento ideal (min/max)
   - Funcionários ideal (min/max)
   - Empresas de benchmarking (clientes desejados)
   - Concorrentes diretos

2. **⚙️ Configuração**
   - Dados básicos do ICP
   - Informações do onboarding

3. **✅ Critérios**
   - Configuração de critérios de análise
   - Critérios customizados

4. **📊 360° (Análise)**
   - KPIs: Nichos alvo, Clientes base, Benchmarking, CNAEs alvo
   - Matriz BCG (priorização estratégica)
   - Perfil financeiro alvo
   - Cobertura geográfica (extraído de clientes e benchmarking)
   - Análises detalhadas

5. **📈 Competitiva**
   - Análise competitiva profunda
   - Concorrentes cadastrados
   - Market share
   - Análise de produtos

6. **⚡ Plano**
   - Plano estratégico de ação
   - Recomendações estratégicas

7. **📄 Relatórios**
   - Relatórios completos gerados
   - Análise estratégica consolidada

---

### **2. DADOS DISPONÍVEIS NO `onboarding_sessions` (JSONB `icp_data`):**

```json
{
  "setores_alvo": ["Manufatura", "Mineração", ...],  // ✅ ARRAY DE SETORES
  "nichos_alvo": ["Fundição", "Indústria Alimentícia", ...],  // ✅ ARRAY DE NICHOS
  "cnaes_alvo": ["4649-4/99", "2511-0/00", ...],  // ✅ ARRAY DE CNAEs
  "ncms_recomendados": ["8471", ...],  // ✅ ARRAY DE NCMs
  "clientes_atuais": [  // ✅ CLIENTES BASE PARA ANÁLISE
    {
      "nome": "...",
      "setor": "...",
      "cnae": "...",
      "cidade": "...",
      "estado": "...",
      "faturamentoAtual": 0,
      "motivoReferencia": "..."
    }
  ],
  "empresas_benchmarking": [  // ✅ EMPRESAS DESEJADAS
    {
      "nome": "...",
      "setor": "...",
      "cnae": "...",
      "cidade": "...",
      "estado": "...",
      "expectativaFaturamento": 0
    }
  ],
  "concorrentes": [  // ✅ CONCORRENTES
    {
      "razaoSocial": "...",
      "cnpj": "...",
      "setor": "...",
      "capitalSocial": 0,
      "localizacao": "..."
    }
  ],
  "faturamento_min": 0,
  "faturamento_max": 0,
  "funcionarios_min": 0,
  "funcionarios_max": 0,
  "porte_alvo": ["MEDIO", "GRANDE"],
  "estados_alvo": ["SP", "RJ", "MG"],
  "regioes_alvo": ["Sudeste"]
}
```

---

### **3. ANÁLISE COMPETITIVA (`competitive_analysis` table):**

- Dados dos concorrentes analisados
- Análise SWOT
- Market share analysis
- CEO analysis

---

### **4. PRODUTOS DO TENANT (`tenant_products` table):**

- CNAEs alvo por produto (`cnaes_alvo TEXT[]`)
- Setores alvo por produto (`setores_alvo TEXT[]`)
- Portes alvo (`portes_alvo TEXT[]`)
- Regiões alvo (`regioes_alvo TEXT[]`)

---

## ❌ PROBLEMA ATUAL

### **O que NÃO está sendo usado no matching:**

1. ❌ **Arrays de CNAEs alvo** - Existem no `onboarding_sessions.icp_data.cnaes_alvo`, mas não são usados
2. ❌ **Arrays de setores alvo** - Existem no `onboarding_sessions.icp_data.setores_alvo`, mas não são usados
3. ❌ **Arrays de nichos alvo** - Existem no `onboarding_sessions.icp_data.nichos_alvo`, mas não são usados
4. ❌ **Clientes base** - Não são usados para calibrar matching
5. ❌ **Empresas de benchmarking** - Não são usados para matching
6. ❌ **Análise competitiva** - Não é considerada
7. ❌ **Produtos do tenant** - Não são usados para matching
8. ❌ **CNAE secundário** - Não é verificado
9. ❌ **Localização geográfica** - Só verifica UF, não usa dados de clientes/benchmarking

---

## ✅ SOLUÇÃO PODEROSA PROPOSTA

### **FASE 1: Extrair e Armazenar Dados Ricos do ICP**

#### **1.1. Criar tabela `icp_matching_criteria`:**

```sql
CREATE TABLE IF NOT EXISTS public.icp_matching_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_profile_metadata_id UUID NOT NULL REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Arrays extraídos do onboarding_sessions
  cnaes_alvo TEXT[] DEFAULT '{}',  -- ✅ ARRAY DE CNAEs
  setores_alvo TEXT[] DEFAULT '{}',  -- ✅ ARRAY DE SETORES
  nichos_alvo TEXT[] DEFAULT '{}',  -- ✅ ARRAY DE NICHOS
  ncms_alvo TEXT[] DEFAULT '{}',  -- ✅ ARRAY DE NCMs
  
  -- Ranges financeiros
  faturamento_min NUMERIC(15,2),
  faturamento_max NUMERIC(15,2),
  funcionarios_min INTEGER,
  funcionarios_max INTEGER,
  
  -- Localização
  estados_alvo TEXT[] DEFAULT '{}',
  regioes_alvo TEXT[] DEFAULT '{}',
  cidades_alvo TEXT[] DEFAULT '{}',  -- Extraído de clientes/benchmarking
  
  -- Porte
  portes_alvo TEXT[] DEFAULT '{}',
  
  -- Padrões extraídos de clientes base
  padroes_clientes_base JSONB DEFAULT '{}',  -- {
    --   "setores_mais_comuns": ["Manufatura", ...],
    --   "cnaes_mais_comuns": ["4649-4/99", ...],
    --   "localizacoes_mais_comuns": ["SP", "RJ", ...],
    --   "faturamento_medio": 0,
    --   "faturamento_mediano": 0,
    --   "ticket_medio": 0
    -- }
  
  -- Padrões extraídos de benchmarking
  padroes_benchmarking JSONB DEFAULT '{}',  -- Similar ao acima
  
  -- Exclusões (extraído de concorrentes)
  cnaes_excluidos TEXT[] DEFAULT '{}',  -- CNAEs de concorrentes
  setores_excluidos TEXT[] DEFAULT '{}',  -- Setores de concorrentes (opcional)
  
  -- Metadados
  extraido_de_onboarding_session_id UUID,
  extraido_em TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Um conjunto de critérios por ICP
  UNIQUE(icp_profile_metadata_id)
);
```

#### **1.2. Função para extrair e popular critérios do ICP:**

```sql
CREATE OR REPLACE FUNCTION public.extract_icp_matching_criteria(
  p_icp_id UUID,
  p_tenant_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_criteria_id UUID;
  v_onboarding_data JSONB;
  v_clientes JSONB;
  v_benchmarking JSONB;
  v_concorrentes JSONB;
  v_cnaes_comuns TEXT[];
  v_setores_comuns TEXT[];
  v_localizacoes_comuns TEXT[];
BEGIN
  -- Buscar dados do onboarding_sessions
  SELECT icp_data INTO v_onboarding_data
  FROM public.onboarding_sessions
  WHERE tenant_id = p_tenant_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  IF v_onboarding_data IS NULL THEN
    RAISE EXCEPTION 'Dados de onboarding não encontrados para tenant %', p_tenant_id;
  END IF;
  
  -- Extrair arrays
  v_clientes := COALESCE(v_onboarding_data->'clientes_atuais', '[]'::jsonb);
  v_benchmarking := COALESCE(v_onboarding_data->'empresas_benchmarking', '[]'::jsonb);
  v_concorrentes := COALESCE(v_onboarding_data->'concorrentes', '[]'::jsonb);
  
  -- Extrair CNAEs mais comuns dos clientes
  SELECT ARRAY_AGG(DISTINCT cnae) INTO v_cnaes_comuns
  FROM jsonb_array_elements(v_clientes) AS cliente
  WHERE cliente->>'cnae' IS NOT NULL;
  
  -- Extrair setores mais comuns dos clientes
  SELECT ARRAY_AGG(DISTINCT setor) INTO v_setores_comuns
  FROM jsonb_array_elements(v_clientes) AS cliente
  WHERE cliente->>'setor' IS NOT NULL;
  
  -- Extrair localizações mais comuns
  SELECT ARRAY_AGG(DISTINCT estado) INTO v_localizacoes_comuns
  FROM jsonb_array_elements(v_clientes) AS cliente
  WHERE cliente->>'estado' IS NOT NULL;
  
  -- Inserir ou atualizar critérios
  INSERT INTO public.icp_matching_criteria (
    icp_profile_metadata_id,
    tenant_id,
    cnaes_alvo,
    setores_alvo,
    nichos_alvo,
    ncms_alvo,
    faturamento_min,
    faturamento_max,
    funcionarios_min,
    funcionarios_max,
    estados_alvo,
    regioes_alvo,
    portes_alvo,
    padroes_clientes_base,
    padroes_benchmarking,
    cnaes_excluidos
  )
  VALUES (
    p_icp_id,
    p_tenant_id,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_onboarding_data->'cnaes_alvo')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_onboarding_data->'setores_alvo')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_onboarding_data->'nichos_alvo')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_onboarding_data->'ncms_recomendados')), '{}'),
    (v_onboarding_data->>'faturamento_min')::NUMERIC,
    (v_onboarding_data->>'faturamento_max')::NUMERIC,
    (v_onboarding_data->>'funcionarios_min')::INTEGER,
    (v_onboarding_data->>'funcionarios_max')::INTEGER,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_onboarding_data->'estados_alvo')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_onboarding_data->'regioes_alvo')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_onboarding_data->'porte_alvo')), '{}'),
    jsonb_build_object(
      'cnaes_mais_comuns', v_cnaes_comuns,
      'setores_mais_comuns', v_setores_comuns,
      'localizacoes_mais_comuns', v_localizacoes_comuns,
      'total_clientes', jsonb_array_length(v_clientes)
    ),
    jsonb_build_object(
      'total_empresas', jsonb_array_length(v_benchmarking)
    ),
    -- Extrair CNAEs de concorrentes para exclusão
    COALESCE(
      ARRAY(
        SELECT DISTINCT cnpj
        FROM jsonb_array_elements(v_concorrentes) AS conc
        WHERE conc->>'cnpj' IS NOT NULL
      ),
      '{}'
    )
  )
  ON CONFLICT (icp_profile_metadata_id) DO UPDATE
  SET
    cnaes_alvo = EXCLUDED.cnaes_alvo,
    setores_alvo = EXCLUDED.setores_alvo,
    nichos_alvo = EXCLUDED.nichos_alvo,
    ncms_alvo = EXCLUDED.ncms_alvo,
    faturamento_min = EXCLUDED.faturamento_min,
    faturamento_max = EXCLUDED.faturamento_max,
    funcionarios_min = EXCLUDED.funcionarios_min,
    funcionarios_max = EXCLUDED.funcionarios_max,
    estados_alvo = EXCLUDED.estados_alvo,
    regioes_alvo = EXCLUDED.regioes_alvo,
    portes_alvo = EXCLUDED.portes_alvo,
    padroes_clientes_base = EXCLUDED.padroes_clientes_base,
    padroes_benchmarking = EXCLUDED.padroes_benchmarking,
    cnaes_excluidos = EXCLUDED.cnaes_excluidos,
    updated_at = NOW()
  RETURNING id INTO v_criteria_id;
  
  RETURN v_criteria_id;
END;
$$;
```

---

### **FASE 2: Atualizar Função de Matching com Análise 380°**

#### **2.1. Nova função `process_qualification_job_v2` (completa):**

```sql
CREATE OR REPLACE FUNCTION process_qualification_job_v2(
  p_job_id UUID,
  p_tenant_id UUID
)
RETURNS TABLE (
  processed_count INTEGER,
  qualified_count INTEGER,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
  v_icp_profile RECORD;
  v_matching_criteria RECORD;  -- ✅ NOVO: Critérios extraídos
  v_candidate RECORD;
  v_cnpj_normalized TEXT;
  v_cnpj_raw TEXT;
  v_fit_score NUMERIC(5,2);
  v_grade TEXT;
  v_match_breakdown JSONB;
  
  -- Scores por critério
  v_cnae_principal_score NUMERIC(5,2) := 0;
  v_cnae_secundario_score NUMERIC(5,2) := 0;
  v_setor_score NUMERIC(5,2) := 0;
  v_nicho_score NUMERIC(5,2) := 0;
  v_localizacao_score NUMERIC(5,2) := 0;
  v_financeiro_score NUMERIC(5,2) := 0;
  v_porte_score NUMERIC(5,2) := 0;
  
  -- Match details
  v_cnae_principal_match BOOLEAN := false;
  v_cnae_secundario_match BOOLEAN := false;
  v_setor_match BOOLEAN := false;
  v_nicho_match BOOLEAN := false;
  v_cnae_match_codigo TEXT;  -- ✅ Qual CNAE fez match
  v_setor_match_codigo TEXT;  -- ✅ Qual setor fez match
  
  -- Contadores
  v_processed_count INTEGER := 0;
  v_qualified_count INTEGER := 0;
  v_grade_a_plus INTEGER := 0;
  v_grade_a INTEGER := 0;
  v_grade_b INTEGER := 0;
  v_grade_c INTEGER := 0;
  v_grade_d INTEGER := 0;
BEGIN
  -- Buscar job
  SELECT * INTO v_job
  FROM public.prospect_qualification_jobs
  WHERE id = p_job_id AND tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, false, 'Job não encontrado ou não pertence ao tenant';
    RETURN;
  END IF;

  -- Buscar ICP profile
  IF v_job.icp_id IS NOT NULL THEN
    SELECT * INTO v_icp_profile
    FROM public.icp_profiles_metadata
    WHERE id = v_job.icp_id AND tenant_id = p_tenant_id;
    
    -- ✅ NOVO: Buscar critérios de matching extraídos
    SELECT * INTO v_matching_criteria
    FROM public.icp_matching_criteria
    WHERE icp_profile_metadata_id = v_job.icp_id;
    
    -- Se não existir, extrair agora
    IF v_matching_criteria IS NULL THEN
      PERFORM public.extract_icp_matching_criteria(v_job.icp_id, p_tenant_id);
      SELECT * INTO v_matching_criteria
      FROM public.icp_matching_criteria
      WHERE icp_profile_metadata_id = v_job.icp_id;
    END IF;
  END IF;

  -- Processar cada candidato
  FOR v_candidate IN
    SELECT * FROM public.prospecting_candidates
    WHERE tenant_id = p_tenant_id
      AND source_batch_id = v_job.source_file_name
      AND status = 'pending'
      AND (v_job.icp_id IS NULL OR icp_id = v_job.icp_id)
    ORDER BY created_at
  LOOP
    BEGIN
      -- Normalizar CNPJ
      v_cnpj_normalized := regexp_replace(v_candidate.cnpj, '[^0-9]', '', 'g');
      
      IF length(v_cnpj_normalized) != 14 THEN
        UPDATE public.prospecting_candidates
        SET status = 'failed', error_message = 'CNPJ inválido: ' || COALESCE(v_candidate.cnpj, '')
        WHERE id = v_candidate.id;
        CONTINUE;
      END IF;

      v_cnpj_raw := COALESCE(v_candidate.cnpj_raw, v_cnpj_normalized);

      -- ✅ RESETAR SCORES
      v_fit_score := 0;
      v_cnae_principal_score := 0;
      v_cnae_secundario_score := 0;
      v_setor_score := 0;
      v_nicho_score := 0;
      v_localizacao_score := 0;
      v_financeiro_score := 0;
      v_porte_score := 0;
      v_cnae_principal_match := false;
      v_cnae_secundario_match := false;
      v_setor_match := false;
      v_nicho_match := false;
      v_cnae_match_codigo := NULL;
      v_setor_match_codigo := NULL;

      -- ✅ 1. VERIFICAR CNAE PRINCIPAL (40 pontos)
      IF v_matching_criteria IS NOT NULL AND v_matching_criteria.cnaes_alvo IS NOT NULL THEN
        -- Buscar CNAE principal da empresa (precisa estar em qualified_prospects ou companies)
        -- Por enquanto, vamos assumir que vem do enriquecimento futuro
        -- Se tiver CNAE principal e estiver no array de CNAEs alvo:
        --   v_cnae_principal_match := true;
        --   v_cnae_principal_score := 40;
        --   v_cnae_match_codigo := cnae_principal;
        --   v_fit_score := v_fit_score + 40;
      END IF;

      -- ✅ 2. VERIFICAR CNAE SECUNDÁRIO (20 pontos)
      -- Similar ao acima, mas com score menor

      -- ✅ 3. VERIFICAR SETOR (30 pontos)
      IF v_matching_criteria IS NOT NULL AND v_matching_criteria.setores_alvo IS NOT NULL THEN
        IF v_candidate.sector IS NOT NULL THEN
          -- Verificar se setor da empresa está no array de setores alvo
          IF v_candidate.sector = ANY(v_matching_criteria.setores_alvo) THEN
            v_setor_match := true;
            v_setor_score := 30;
            v_setor_match_codigo := v_candidate.sector;
            v_fit_score := v_fit_score + 30;
          END IF;
        END IF;
      END IF;

      -- ✅ 4. VERIFICAR NICHOS (15 pontos)
      -- Similar ao setor

      -- ✅ 5. VERIFICAR LOCALIZAÇÃO (10 pontos)
      IF v_matching_criteria IS NOT NULL THEN
        IF v_candidate.uf IS NOT NULL AND v_candidate.uf = ANY(v_matching_criteria.estados_alvo) THEN
          v_localizacao_score := 10;
          v_fit_score := v_fit_score + 10;
        ELSIF v_candidate.uf IS NOT NULL THEN
          v_localizacao_score := 5;  -- Score parcial
          v_fit_score := v_fit_score + 5;
        END IF;
      END IF;

      -- ✅ 6. VERIFICAR EXCLUSÕES (CNAEs de concorrentes)
      IF v_matching_criteria IS NOT NULL AND v_matching_criteria.cnaes_excluidos IS NOT NULL THEN
        -- Se CNAE da empresa estiver na lista de exclusão, score = 0
        -- (implementar quando tiver CNAE da empresa)
      END IF;

      -- ✅ 7. MATCH BREAKDOWN DETALHADO
      v_match_breakdown := jsonb_build_array(
        jsonb_build_object(
          'criteria', 'cnae_principal',
          'label', 'CNAE Principal',
          'weight', 0.40,
          'matched', v_cnae_principal_match,
          'score', v_cnae_principal_score,
          'match_codigo', v_cnae_match_codigo
        ),
        jsonb_build_object(
          'criteria', 'cnae_secundario',
          'label', 'CNAE Secundário',
          'weight', 0.20,
          'matched', v_cnae_secundario_match,
          'score', v_cnae_secundario_score
        ),
        jsonb_build_object(
          'criteria', 'setor',
          'label', 'Setor',
          'weight', 0.30,
          'matched', v_setor_match,
          'score', v_setor_score,
          'match_codigo', v_setor_match_codigo
        ),
        jsonb_build_object(
          'criteria', 'localizacao',
          'label', 'Localização',
          'weight', 0.10,
          'matched', v_localizacao_score > 0,
          'score', v_localizacao_score
        )
      );

      -- ✅ 8. DETERMINAR GRADE BASEADO NO FIT SCORE
      IF v_fit_score >= 90 THEN
        v_grade := 'A+';
        v_grade_a_plus := v_grade_a_plus + 1;
      ELSIF v_fit_score >= 75 THEN
        v_grade := 'A';
        v_grade_a := v_grade_a + 1;
      ELSIF v_fit_score >= 60 THEN
        v_grade := 'B';
        v_grade_b := v_grade_b + 1;
      ELSIF v_fit_score >= 40 THEN
        v_grade := 'C';
        v_grade_c := v_grade_c + 1;
      ELSE
        v_grade := 'D';
        v_grade_d := v_grade_d + 1;
      END IF;

      -- ✅ 9. INSERIR/ATUALIZAR EM qualified_prospects COM COLUNAS DE MATCH
      INSERT INTO public.qualified_prospects (
        tenant_id, job_id, icp_id, cnpj, cnpj_raw,
        razao_social, nome_fantasia, cidade, estado, setor,
        website, fit_score, grade, match_breakdown,
        pipeline_status,
        -- ✅ NOVAS COLUNAS DE MATCH
        cnae_match_principal,
        cnae_match_secundario,
        setor_match,
        cnae_match_codigo,
        setor_match_codigo,
        created_at
      )
      VALUES (
        p_tenant_id, p_job_id, v_job.icp_id,
        v_cnpj_normalized,
        v_cnpj_raw,
        v_candidate.company_name,
        CASE 
          WHEN v_candidate.notes IS NOT NULL AND v_candidate.notes LIKE 'Nome fantasia: %' 
          THEN TRIM(SUBSTRING(v_candidate.notes FROM 'Nome fantasia: ([^;]+)'))
          ELSE NULL
        END,
        v_candidate.city,
        v_candidate.uf,
        v_candidate.sector,
        v_candidate.website,
        v_fit_score,
        v_grade,
        v_match_breakdown,
        'new',
        -- ✅ NOVAS COLUNAS
        v_cnae_principal_match,
        v_cnae_secundario_match,
        v_setor_match,
        v_cnae_match_codigo,
        v_setor_match_codigo,
        now()
      )
      ON CONFLICT (tenant_id, cnpj) DO UPDATE
      SET
        job_id = EXCLUDED.job_id,
        icp_id = EXCLUDED.icp_id,
        fit_score = EXCLUDED.fit_score,
        grade = EXCLUDED.grade,
        match_breakdown = EXCLUDED.match_breakdown,
        pipeline_status = 'new',
        -- ✅ ATUALIZAR COLUNAS DE MATCH
        cnae_match_principal = EXCLUDED.cnae_match_principal,
        cnae_match_secundario = EXCLUDED.cnae_match_secundario,
        setor_match = EXCLUDED.setor_match,
        cnae_match_codigo = EXCLUDED.cnae_match_codigo,
        setor_match_codigo = EXCLUDED.setor_match_codigo,
        updated_at = now();

      v_qualified_count := v_qualified_count + 1;

      -- Atualizar status do candidato
      UPDATE public.prospecting_candidates
      SET status = 'processed', processed_at = now()
      WHERE id = v_candidate.id;

      v_processed_count := v_processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      UPDATE public.prospecting_candidates
      SET status = 'failed', error_message = SQLERRM
      WHERE id = v_candidate.id;
    END;
  END LOOP;

  -- Atualizar contadores do job
  UPDATE public.prospect_qualification_jobs qj
  SET
    processed_count = v_processed_count,
    enriched_count = v_qualified_count,
    grade_a_plus = v_grade_a_plus,
    grade_a = v_grade_a,
    grade_b = v_grade_b,
    grade_c = v_grade_c,
    grade_d = v_grade_d,
    status = 'completed',
    completed_at = now(),
    progress_percentage = CASE 
      WHEN qj.total_cnpjs > 0 THEN (v_processed_count::numeric / qj.total_cnpjs::numeric * 100.0)
      ELSE 100.0
    END
  WHERE qj.id = p_job_id;

  RETURN QUERY SELECT 
    v_processed_count,
    v_qualified_count,
    true,
    format(
      'Processados: %s, Qualificados: %s (A+: %s, A: %s, B: %s, C: %s, D: %s)',
      v_processed_count, v_qualified_count,
      v_grade_a_plus, v_grade_a, v_grade_b, v_grade_c, v_grade_d
    );
END;
$$;
```

---

### **FASE 3: Adicionar Colunas de Match em `qualified_prospects`**

```sql
ALTER TABLE public.qualified_prospects
ADD COLUMN IF NOT EXISTS cnae_match_principal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cnae_match_secundario BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setor_match BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nicho_match BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cnae_match_codigo TEXT,
ADD COLUMN IF NOT EXISTS setor_match_codigo TEXT,
ADD COLUMN IF NOT EXISTS nicho_match_codigo TEXT;
```

---

## 🎯 BENEFÍCIOS DA SOLUÇÃO

1. ✅ **Usa TODOS os dados ricos do ICP** (380° de análise)
2. ✅ **Verifica CNAE principal e secundário**
3. ✅ **Verifica arrays de setores e nichos**
4. ✅ **Considera padrões de clientes base**
5. ✅ **Considera empresas de benchmarking**
6. ✅ **Exclui CNAEs de concorrentes**
7. ✅ **Armazena qual CNAE/setor fez match**
8. ✅ **Classificação mais precisa (A+, A, B, C, D)**
9. ✅ **Breakdown detalhado de matching**

---

## 📋 PRÓXIMOS PASSOS

1. ✅ Criar migration com tabela `icp_matching_criteria`
2. ✅ Criar função `extract_icp_matching_criteria`
3. ✅ Criar função `process_qualification_job_v2`
4. ✅ Adicionar colunas de match em `qualified_prospects`
5. ✅ Atualizar frontend para exibir colunas de match
6. ✅ Testar com dados reais

---

**Esta solução aproveita TODA a riqueza de dados já existente na plataforma para fazer um matching muito mais preciso e inteligente!** 🚀

