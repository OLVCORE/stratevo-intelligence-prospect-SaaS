-- ==========================================
-- STRATEVO One - Fix RPC Purchase Intent + companies missing columns
-- Data: 2025-12-13
-- ==========================================

begin;

-- 1) Garantir coluna(s) esperadas em companies (evita PGRST204)
-- Ajuste tipos se sua tabela já usa outros padrões, mas NÃO remova nada existente.
alter table if exists public.companies
  add column if not exists website_encontrado text,
  add column if not exists website_original text,
  add column if not exists website_fonte text,
  add column if not exists website_encontrado_em timestamptz;

-- 2) Corrigir / criar função RPC que o frontend está chamando:
-- frontend chama: calculate_purchase_intent_for_prospect(p_qualified_prospect_id)
-- mas o banco sugere existir: calculate_purchase_intent_score(...)
-- Vamos criar um WRAPPER com o nome esperado, chamando a função real.

-- 2.1) Se a função real existir com esse nome, wrapper resolve imediatamente.
-- Se NÃO existir, você terá erro aqui e deve criar a função real (abaixo tem plano B).
create or replace function public.calculate_purchase_intent_for_prospect(
  p_qualified_prospect_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prospect record;
  v_score integer;
  v_result jsonb;
begin
  -- Buscar dados do prospect
  select 
    id,
    tenant_id,
    cnpj,
    purchase_intent_score
  into v_prospect
  from public.qualified_prospects
  where id = p_qualified_prospect_id;
  
  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Prospect não encontrado',
      'score', null
    );
  end if;
  
  -- Tentar chamar a função real calculate_purchase_intent_score
  -- Ela espera: p_tenant_id, p_cnpj, p_company_id
  begin
    v_score := public.calculate_purchase_intent_score(
      v_prospect.tenant_id,
      v_prospect.cnpj,
      null::uuid
    );
    
    -- Atualizar prospect
    update public.qualified_prospects
    set purchase_intent_score = v_score
    where id = p_qualified_prospect_id;
    
    -- Retornar resultado padronizado
    v_result := jsonb_build_object(
      'success', true,
      'prospect_id', p_qualified_prospect_id,
      'purchase_intent_score', v_score,
      'previous_score', v_prospect.purchase_intent_score
    );
    
    return v_result;
  exception
    when undefined_function then
      -- Plano B: função real não existe, retorna payload padronizado sem quebrar
      return jsonb_build_object(
        'success', false,
        'reason', 'calculate_purchase_intent_score not found',
        'score', null,
        'prospect_id', p_qualified_prospect_id
      );
    when others then
      -- Outros erros: retorna erro controlado
      return jsonb_build_object(
        'success', false,
        'error', sqlerrm,
        'score', null,
        'prospect_id', p_qualified_prospect_id
      );
  end;
end;
$$;

-- 2.2) Permissões (Supabase/PostgREST)
grant execute on function public.calculate_purchase_intent_for_prospect(uuid) to anon, authenticated;

comment on function public.calculate_purchase_intent_for_prospect is 
'Wrapper RPC para calcular Purchase Intent Score. Chama calculate_purchase_intent_score internamente.';

-- 3) Forçar refresh do schema cache do PostgREST (evita "schema cache" antigo)
-- Em Supabase normalmente funciona com NOTIFY pgrst, 'reload schema'
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when others then
    -- se o canal não existir no seu stack, não quebra migration
    null;
end $$;

commit;


