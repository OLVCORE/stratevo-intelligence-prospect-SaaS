/**
 * MOTOR DE QUALIFICAÇÃO AUTOMÁTICA DE ICP
 * 
 * Cruza empresas com ICPs configurados e determina:
 * - ICP Score (0-100)
 * - Temperatura (HOT/WARM/COLD)
 * - Decisão (APPROVE/QUARANTINE/NURTURING/DISCARD)
 * - Melhor ICP match
 */

import { supabase } from '@/integrations/supabase/client';

// ==================== INTERFACES ====================

export interface QualificationWeights {
  cnae: number;           // Peso do CNAE (default: 25)
  capital_social: number; // Peso do Capital Social (default: 20)
  porte: number;          // Peso do Porte/Funcionários (default: 20)
  localizacao: number;    // Peso da Localização (default: 15)
  situacao: number;       // Peso da Situação Cadastral (default: 10)
  setor: number;          // Peso do Setor/Nicho (default: 10)
}

export interface QualificationThresholds {
  hot_min: number;        // Score mínimo para HOT (default: 70)
  warm_min: number;       // Score mínimo para WARM (default: 40)
  auto_approve: boolean;  // Auto-aprovar HOT leads (default: true)
  auto_discard: boolean;  // Auto-descartar COLD leads (default: false)
}

export interface ICPProfile {
  id: string;
  name: string;
  tenant_id: string;
  is_main_icp: boolean;
  
  // Critérios de qualificação
  target_cnaes: string[];
  target_sectors: string[];
  target_niches: string[];
  target_states: string[];
  target_cities: string[];
  
  // Ranges
  capital_social_min?: number;
  capital_social_max?: number;
  funcionarios_min?: number;
  funcionarios_max?: number;
  faturamento_min?: number;
  faturamento_max?: number;
  
  // Exclusões
  excluded_cnaes?: string[];
  excluded_states?: string[];
  excluded_situations?: string[];
}

export interface CompanyToQualify {
  id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  
  // Dados para qualificação
  cnae_principal?: string;
  cnae_principal_descricao?: string;
  cnaes_secundarios?: string[];
  capital_social?: number;
  porte?: string;
  funcionarios?: number;
  faturamento_estimado?: number;
  
  // Localização
  uf?: string;
  cidade?: string;
  
  // Situação
  situacao_cadastral?: string;
  setor?: string;
  nicho?: string;
}

export interface ICPScoreBreakdown {
  cnae: number;
  capital_social: number;
  porte: number;
  localizacao: number;
  situacao: number;
  setor: number;
}

export interface ICPMatchResult {
  icp_id: string;
  icp_name: string;
  is_main_icp: boolean;
  score: number;
  temperatura: 'hot' | 'warm' | 'cold';
  breakdown: ICPScoreBreakdown;
  motivos: string[];
  match_details: {
    cnae_match: boolean;
    capital_in_range: boolean;
    porte_match: boolean;
    location_match: boolean;
    situacao_ok: boolean;
    setor_match: boolean;
  };
}

export interface QualificationResult {
  empresa_id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  
  // Scores por ICP
  icp_scores: ICPMatchResult[];
  
  // Melhor match
  best_icp_id: string | null;
  best_icp_name: string | null;
  best_icp_score: number;
  best_temperatura: 'hot' | 'warm' | 'cold' | 'out';
  
  // Decisão
  decision: 'approve' | 'quarantine' | 'nurturing' | 'discard';
  decision_reason: string;
  
  // Metadados
  qualified_at: string;
  processing_time_ms: number;
}

export interface QualificationBatchResult {
  total: number;
  processed: number;
  approved: number;
  quarantine: number;
  nurturing: number;
  discarded: number;
  errors: number;
  results: QualificationResult[];
  processing_time_ms: number;
}

// ==================== DEFAULTS ====================

export const DEFAULT_WEIGHTS: QualificationWeights = {
  cnae: 25,
  capital_social: 20,
  porte: 20,
  localizacao: 15,
  situacao: 10,
  setor: 10
};

export const DEFAULT_THRESHOLDS: QualificationThresholds = {
  hot_min: 70,
  warm_min: 40,
  auto_approve: true,
  auto_discard: false
};

// ==================== ENGINE CLASS ====================

export class ICPQualificationEngine {
  private tenantId: string;
  private weights: QualificationWeights;
  private thresholds: QualificationThresholds;
  private icpProfiles: ICPProfile[] = [];
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.weights = { ...DEFAULT_WEIGHTS };
    this.thresholds = { ...DEFAULT_THRESHOLDS };
  }
  
  // ==================== INITIALIZATION ====================
  
  /**
   * Carrega configurações do tenant e ICPs
   */
  async initialize(): Promise<void> {
    console.log('[QualificationEngine] 🚀 Inicializando para tenant:', this.tenantId);
    
    // Carregar configurações de pesos do tenant
    await this.loadWeightsConfig();
    
    // Carregar ICPs ativos do tenant
    await this.loadICPProfiles();
    
    console.log('[QualificationEngine] ✅ Inicializado:', {
      icps: this.icpProfiles.length,
      weights: this.weights,
      thresholds: this.thresholds
    });
  }
  
  private async loadWeightsConfig(): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from('qualification_config')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .maybeSingle();
      
      if (!error && data) {
        this.weights = {
          cnae: data.weight_cnae ?? DEFAULT_WEIGHTS.cnae,
          capital_social: data.weight_capital_social ?? DEFAULT_WEIGHTS.capital_social,
          porte: data.weight_porte ?? DEFAULT_WEIGHTS.porte,
          localizacao: data.weight_localizacao ?? DEFAULT_WEIGHTS.localizacao,
          situacao: data.weight_situacao ?? DEFAULT_WEIGHTS.situacao,
          setor: data.weight_setor ?? DEFAULT_WEIGHTS.setor
        };
        
        this.thresholds = {
          hot_min: data.threshold_hot ?? DEFAULT_THRESHOLDS.hot_min,
          warm_min: data.threshold_warm ?? DEFAULT_THRESHOLDS.warm_min,
          auto_approve: data.auto_approve_hot ?? DEFAULT_THRESHOLDS.auto_approve,
          auto_discard: data.auto_discard_cold ?? DEFAULT_THRESHOLDS.auto_discard
        };
      }
    } catch (err) {
      console.warn('[QualificationEngine] ⚠️ Usando pesos padrão:', err);
    }
  }
  
  private async loadICPProfiles(): Promise<void> {
    try {
      // Buscar ICPs ativos do tenant
      const { data: icpData, error: icpError } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('status', 'active');
      
      if (icpError) throw icpError;
      
      // Buscar dados do onboarding para cada ICP
      const { data: sessionData, error: sessionError } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      const session = sessionData?.[0];
      
      // Mapear ICPs com dados completos
      this.icpProfiles = (icpData || []).map((icp: any) => ({
        id: icp.id,
        name: icp.nome || icp.name || 'ICP',
        tenant_id: icp.tenant_id,
        is_main_icp: icp.is_main_icp || false,
        
        // Critérios do ICP ou do onboarding
        target_cnaes: icp.target_cnaes || session?.step2_data?.cnaesAlvo || [],
        target_sectors: icp.target_sectors || session?.step2_data?.setoresAlvo || [],
        target_niches: icp.target_niches || session?.step2_data?.nichosAlvo || [],
        target_states: icp.target_states || session?.step3_data?.localizacaoAlvo?.estados || [],
        target_cities: icp.target_cities || session?.step3_data?.localizacaoAlvo?.cidades || [],
        
        // Ranges
        capital_social_min: icp.capital_social_min || session?.step3_data?.faturamentoAlvo?.minimo,
        capital_social_max: icp.capital_social_max || session?.step3_data?.faturamentoAlvo?.maximo,
        funcionarios_min: icp.funcionarios_min || session?.step3_data?.funcionariosAlvo?.minimo,
        funcionarios_max: icp.funcionarios_max || session?.step3_data?.funcionariosAlvo?.maximo,
        
        // Exclusões
        excluded_cnaes: icp.excluded_cnaes || [],
        excluded_states: icp.excluded_states || [],
        excluded_situations: icp.excluded_situations || ['BAIXADA', 'INAPTA', 'SUSPENSA', 'NULA']
      }));
      
      // Se não houver ICPs, criar um padrão baseado no onboarding
      if (this.icpProfiles.length === 0 && session) {
        this.icpProfiles = [{
          id: 'default',
          name: 'ICP Principal',
          tenant_id: this.tenantId,
          is_main_icp: true,
          target_cnaes: session?.step2_data?.cnaesAlvo || [],
          target_sectors: session?.step2_data?.setoresAlvo || [],
          target_niches: session?.step2_data?.nichosAlvo || [],
          target_states: session?.step3_data?.localizacaoAlvo?.estados || [],
          target_cities: session?.step3_data?.localizacaoAlvo?.cidades || [],
          capital_social_min: session?.step3_data?.faturamentoAlvo?.minimo,
          capital_social_max: session?.step3_data?.faturamentoAlvo?.maximo,
          funcionarios_min: session?.step3_data?.funcionariosAlvo?.minimo,
          funcionarios_max: session?.step3_data?.funcionariosAlvo?.maximo,
          excluded_cnaes: [],
          excluded_states: [],
          excluded_situations: ['BAIXADA', 'INAPTA', 'SUSPENSA', 'NULA']
        }];
      }
    } catch (err) {
      console.error('[QualificationEngine] ❌ Erro ao carregar ICPs:', err);
      this.icpProfiles = [];
    }
  }
  
  // ==================== QUALIFICATION LOGIC ====================
  
  /**
   * Qualifica uma única empresa contra todos os ICPs
   */
  qualifyCompany(company: CompanyToQualify): QualificationResult {
    const startTime = Date.now();
    
    // Calcular score para cada ICP
    const icpScores: ICPMatchResult[] = this.icpProfiles.map(icp => 
      this.calculateICPMatch(company, icp)
    );
    
    // Ordenar por score (maior primeiro)
    icpScores.sort((a, b) => b.score - a.score);
    
    // Determinar melhor match
    const bestMatch = icpScores[0];
    const hasBestMatch = bestMatch && bestMatch.score > 0;
    
    // Determinar decisão
    const { decision, reason } = this.determineDecision(bestMatch);
    
    return {
      empresa_id: company.id,
      cnpj: company.cnpj,
      razao_social: company.razao_social,
      nome_fantasia: company.nome_fantasia,
      
      icp_scores: icpScores,
      
      best_icp_id: hasBestMatch ? bestMatch.icp_id : null,
      best_icp_name: hasBestMatch ? bestMatch.icp_name : null,
      best_icp_score: hasBestMatch ? bestMatch.score : 0,
      best_temperatura: hasBestMatch ? bestMatch.temperatura : 'out',
      
      decision,
      decision_reason: reason,
      
      qualified_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    };
  }
  
  /**
   * Calcula match entre empresa e um ICP específico
   */
  private calculateICPMatch(company: CompanyToQualify, icp: ICPProfile): ICPMatchResult {
    const breakdown: ICPScoreBreakdown = {
      cnae: 0,
      capital_social: 0,
      porte: 0,
      localizacao: 0,
      situacao: 0,
      setor: 0
    };
    
    const motivos: string[] = [];
    const matchDetails = {
      cnae_match: false,
      capital_in_range: false,
      porte_match: false,
      location_match: false,
      situacao_ok: false,
      setor_match: false
    };
    
    // ========== 1. CNAE (até weight_cnae pontos) ==========
    if (company.cnae_principal) {
      const cnaeCode = company.cnae_principal.replace(/\D/g, '');
      
      // Verificar exclusão
      if (icp.excluded_cnaes?.some(exc => cnaeCode.startsWith(exc.replace(/\D/g, '')))) {
        breakdown.cnae = 0;
        motivos.push(`⛔ CNAE ${cnaeCode} está na lista de exclusão`);
      }
      // Match exato ou prefixo
      else if (icp.target_cnaes?.some(target => {
        const targetClean = target.replace(/\D/g, '');
        return cnaeCode === targetClean || cnaeCode.startsWith(targetClean.substring(0, 4));
      })) {
        breakdown.cnae = this.weights.cnae;
        matchDetails.cnae_match = true;
        motivos.push(`✅ CNAE ${cnaeCode} - Match com ICP (+${this.weights.cnae})`);
      }
      // CNAE relacionado (mesmo grupo - 2 primeiros dígitos)
      else if (icp.target_cnaes?.some(target => {
        const targetClean = target.replace(/\D/g, '');
        return cnaeCode.substring(0, 2) === targetClean.substring(0, 2);
      })) {
        breakdown.cnae = Math.round(this.weights.cnae * 0.5);
        motivos.push(`🔶 CNAE ${cnaeCode} - Grupo relacionado (+${breakdown.cnae})`);
      }
      // Sem match
      else {
        breakdown.cnae = Math.round(this.weights.cnae * 0.2);
        motivos.push(`⚪ CNAE ${cnaeCode} - Neutro (+${breakdown.cnae})`);
      }
    } else {
      motivos.push(`⚠️ CNAE não informado`);
    }
    
    // ========== 2. CAPITAL SOCIAL (até weight_capital_social pontos) ==========
    if (company.capital_social !== undefined && company.capital_social > 0) {
      const capital = company.capital_social;
      const min = icp.capital_social_min || 0;
      const max = icp.capital_social_max || Infinity;
      
      if (capital >= min && capital <= max) {
        breakdown.capital_social = this.weights.capital_social;
        matchDetails.capital_in_range = true;
        motivos.push(`✅ Capital R$ ${this.formatCurrency(capital)} - Dentro do range (+${this.weights.capital_social})`);
      } else if (capital >= min * 0.5 && capital <= max * 1.5) {
        breakdown.capital_social = Math.round(this.weights.capital_social * 0.5);
        motivos.push(`🔶 Capital R$ ${this.formatCurrency(capital)} - Próximo do range (+${breakdown.capital_social})`);
      } else {
        breakdown.capital_social = 0;
        motivos.push(`❌ Capital R$ ${this.formatCurrency(capital)} - Fora do range`);
      }
    } else {
      breakdown.capital_social = Math.round(this.weights.capital_social * 0.3);
      motivos.push(`⚠️ Capital não informado (+${breakdown.capital_social})`);
    }
    
    // ========== 3. PORTE/FUNCIONÁRIOS (até weight_porte pontos) ==========
    const funcionarios = company.funcionarios || this.estimateFuncionariosByPorte(company.porte);
    if (funcionarios > 0) {
      const min = icp.funcionarios_min || 0;
      const max = icp.funcionarios_max || Infinity;
      
      if (funcionarios >= min && funcionarios <= max) {
        breakdown.porte = this.weights.porte;
        matchDetails.porte_match = true;
        motivos.push(`✅ ${funcionarios} funcionários - Porte ideal (+${this.weights.porte})`);
      } else if (funcionarios >= min * 0.5 && funcionarios <= max * 2) {
        breakdown.porte = Math.round(this.weights.porte * 0.6);
        motivos.push(`🔶 ${funcionarios} funcionários - Porte aceitável (+${breakdown.porte})`);
      } else {
        breakdown.porte = Math.round(this.weights.porte * 0.2);
        motivos.push(`⚪ ${funcionarios} funcionários - Fora do range (+${breakdown.porte})`);
      }
    } else {
      breakdown.porte = Math.round(this.weights.porte * 0.3);
      motivos.push(`⚠️ Funcionários não informado (+${breakdown.porte})`);
    }
    
    // ========== 4. LOCALIZAÇÃO (até weight_localizacao pontos) ==========
    if (company.uf) {
      const ufUpper = company.uf.toUpperCase();
      
      // Verificar exclusão
      if (icp.excluded_states?.includes(ufUpper)) {
        breakdown.localizacao = 0;
        motivos.push(`⛔ Estado ${ufUpper} está excluído`);
      }
      // Match de estado
      else if (icp.target_states?.length === 0 || icp.target_states?.includes(ufUpper)) {
        breakdown.localizacao = this.weights.localizacao;
        matchDetails.location_match = true;
        motivos.push(`✅ Estado ${ufUpper} - Região alvo (+${this.weights.localizacao})`);
        
        // Bonus por cidade específica
        if (company.cidade && icp.target_cities?.includes(company.cidade.toUpperCase())) {
          breakdown.localizacao = Math.min(breakdown.localizacao * 1.2, this.weights.localizacao);
          motivos.push(`🎯 Cidade ${company.cidade} - Bônus aplicado`);
        }
      }
      // Estado não prioritário
      else {
        breakdown.localizacao = Math.round(this.weights.localizacao * 0.4);
        motivos.push(`⚪ Estado ${ufUpper} - Não prioritário (+${breakdown.localizacao})`);
      }
    } else {
      breakdown.localizacao = Math.round(this.weights.localizacao * 0.2);
      motivos.push(`⚠️ UF não informada (+${breakdown.localizacao})`);
    }
    
    // ========== 5. SITUAÇÃO CADASTRAL (até weight_situacao pontos) ==========
    if (company.situacao_cadastral) {
      const situacao = company.situacao_cadastral.toUpperCase();
      
      if (icp.excluded_situations?.some(exc => situacao.includes(exc))) {
        breakdown.situacao = 0;
        motivos.push(`⛔ Situação "${situacao}" - Empresa não ativa`);
      } else if (situacao.includes('ATIVA') || situacao.includes('REGULAR')) {
        breakdown.situacao = this.weights.situacao;
        matchDetails.situacao_ok = true;
        motivos.push(`✅ Situação ${situacao} (+${this.weights.situacao})`);
      } else {
        breakdown.situacao = Math.round(this.weights.situacao * 0.5);
        motivos.push(`🔶 Situação ${situacao} (+${breakdown.situacao})`);
      }
    } else {
      breakdown.situacao = Math.round(this.weights.situacao * 0.5);
      motivos.push(`⚠️ Situação não informada (+${breakdown.situacao})`);
    }
    
    // ========== 6. SETOR/NICHO (até weight_setor pontos) ==========
    if (company.setor) {
      const setorLower = company.setor.toLowerCase();
      
      if (icp.target_sectors?.some(s => setorLower.includes(s.toLowerCase()))) {
        breakdown.setor = this.weights.setor;
        matchDetails.setor_match = true;
        motivos.push(`✅ Setor "${company.setor}" - Match (+${this.weights.setor})`);
      } else {
        breakdown.setor = Math.round(this.weights.setor * 0.3);
        motivos.push(`⚪ Setor "${company.setor}" - Neutro (+${breakdown.setor})`);
      }
    } else if (company.nicho) {
      if (icp.target_niches?.some(n => company.nicho!.toLowerCase().includes(n.toLowerCase()))) {
        breakdown.setor = this.weights.setor;
        matchDetails.setor_match = true;
        motivos.push(`✅ Nicho "${company.nicho}" - Match (+${this.weights.setor})`);
      }
    } else {
      breakdown.setor = Math.round(this.weights.setor * 0.3);
      motivos.push(`⚠️ Setor não identificado (+${breakdown.setor})`);
    }
    
    // ========== CALCULAR SCORE TOTAL ==========
    const score = Math.round(
      breakdown.cnae +
      breakdown.capital_social +
      breakdown.porte +
      breakdown.localizacao +
      breakdown.situacao +
      breakdown.setor
    );
    
    // Determinar temperatura
    let temperatura: 'hot' | 'warm' | 'cold';
    if (score >= this.thresholds.hot_min) {
      temperatura = 'hot';
    } else if (score >= this.thresholds.warm_min) {
      temperatura = 'warm';
    } else {
      temperatura = 'cold';
    }
    
    return {
      icp_id: icp.id,
      icp_name: icp.name,
      is_main_icp: icp.is_main_icp,
      score,
      temperatura,
      breakdown,
      motivos,
      match_details: matchDetails
    };
  }
  
  /**
   * Determina a decisão final de qualificação
   */
  private determineDecision(bestMatch: ICPMatchResult | undefined): { decision: QualificationResult['decision']; reason: string } {
    if (!bestMatch || bestMatch.score === 0) {
      return {
        decision: 'discard',
        reason: 'Nenhum ICP compatível encontrado'
      };
    }
    
    if (bestMatch.temperatura === 'hot') {
      if (this.thresholds.auto_approve) {
        return {
          decision: 'approve',
          reason: `HOT LEAD! Score ${bestMatch.score}/100 no ICP "${bestMatch.icp_name}" - Auto-aprovado`
        };
      }
      return {
        decision: 'quarantine',
        reason: `HOT LEAD! Score ${bestMatch.score}/100 - Aguardando aprovação manual`
      };
    }
    
    if (bestMatch.temperatura === 'warm') {
      return {
        decision: 'quarantine',
        reason: `WARM LEAD - Score ${bestMatch.score}/100 no ICP "${bestMatch.icp_name}" - Análise manual necessária`
      };
    }
    
    // Cold
    if (this.thresholds.auto_discard) {
      return {
        decision: 'discard',
        reason: `COLD LEAD - Score ${bestMatch.score}/100 - Auto-descartado`
      };
    }
    
    return {
      decision: 'nurturing',
      reason: `COLD LEAD - Score ${bestMatch.score}/100 - Enviado para nurturing`
    };
  }
  
  // ==================== BATCH PROCESSING ====================
  
  /**
   * Qualifica múltiplas empresas em batch
   */
  async qualifyBatch(
    companies: CompanyToQualify[], 
    onProgress?: (current: number, total: number, result: QualificationResult) => void
  ): Promise<QualificationBatchResult> {
    const startTime = Date.now();
    const results: QualificationResult[] = [];
    let approved = 0, quarantine = 0, nurturing = 0, discarded = 0, errors = 0;
    
    for (let i = 0; i < companies.length; i++) {
      try {
        const result = this.qualifyCompany(companies[i]);
        results.push(result);
        
        // Contagem
        switch (result.decision) {
          case 'approve': approved++; break;
          case 'quarantine': quarantine++; break;
          case 'nurturing': nurturing++; break;
          case 'discard': discarded++; break;
        }
        
        // Callback de progresso
        onProgress?.(i + 1, companies.length, result);
        
      } catch (err) {
        console.error(`[QualificationEngine] ❌ Erro ao qualificar ${companies[i].cnpj}:`, err);
        errors++;
      }
    }
    
    return {
      total: companies.length,
      processed: results.length,
      approved,
      quarantine,
      nurturing,
      discarded,
      errors,
      results,
      processing_time_ms: Date.now() - startTime
    };
  }
  
  // ==================== SAVE RESULTS ====================
  
  /**
   * Salva resultados da qualificação no banco
   */
  async saveResults(results: QualificationResult[]): Promise<void> {
    const toQuarantine = results.filter(r => r.decision === 'quarantine' || r.decision === 'approve');
    const toNurturing = results.filter(r => r.decision === 'nurturing');
    const toDiscard = results.filter(r => r.decision === 'discard');
    
    // Salvar na quarentena (HOT + WARM)
    if (toQuarantine.length > 0) {
      const { error } = await (supabase as any)
        .from('leads_quarantine')
        .upsert(
          toQuarantine.map(r => ({
            tenant_id: this.tenantId,
            cnpj: r.cnpj,
            name: r.razao_social,
            nome_fantasia: r.nome_fantasia,
            validation_status: r.decision === 'approve' ? 'approved' : 'pending',
            icp_score: r.best_icp_score,
            icp_id: r.best_icp_id,
            icp_name: r.best_icp_name,
            temperatura: r.best_temperatura,
            qualification_data: {
              icp_scores: r.icp_scores,
              decision_reason: r.decision_reason,
              qualified_at: r.qualified_at
            },
            captured_at: new Date().toISOString()
          })),
          { onConflict: 'cnpj,tenant_id' }
        );
      
      if (error) {
        console.error('[QualificationEngine] ❌ Erro ao salvar quarentena:', error);
      }
    }
    
    // Salvar nurturing (COLD com potencial)
    if (toNurturing.length > 0) {
      const { error } = await (supabase as any)
        .from('leads_nurturing')
        .upsert(
          toNurturing.map(r => ({
            tenant_id: this.tenantId,
            cnpj: r.cnpj,
            razao_social: r.razao_social,
            icp_score: r.best_icp_score,
            qualification_data: {
              icp_scores: r.icp_scores,
              decision_reason: r.decision_reason
            },
            created_at: new Date().toISOString()
          })),
          { onConflict: 'cnpj,tenant_id' }
        );
      
      if (error) {
        console.warn('[QualificationEngine] ⚠️ Erro ao salvar nurturing:', error);
      }
    }
    
    // Salvar descartados (para auditoria)
    if (toDiscard.length > 0) {
      const { error } = await (supabase as any)
        .from('leads_discarded')
        .upsert(
          toDiscard.map(r => ({
            tenant_id: this.tenantId,
            cnpj: r.cnpj,
            razao_social: r.razao_social,
            discard_reason: r.decision_reason,
            icp_score: r.best_icp_score,
            discarded_at: new Date().toISOString()
          })),
          { onConflict: 'cnpj,tenant_id' }
        );
      
      if (error) {
        console.warn('[QualificationEngine] ⚠️ Erro ao salvar descartados:', error);
      }
    }
  }
  
  // ==================== UTILITIES ====================
  
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  private estimateFuncionariosByPorte(porte?: string): number {
    if (!porte) return 0;
    
    const porteUpper = porte.toUpperCase();
    
    if (porteUpper.includes('MEI') || porteUpper.includes('MICRO')) return 5;
    if (porteUpper.includes('PEQUENO') || porteUpper.includes('EPP')) return 30;
    if (porteUpper.includes('MÉDIO') || porteUpper.includes('MEDIO')) return 150;
    if (porteUpper.includes('GRANDE')) return 500;
    
    return 0;
  }
  
  // ==================== GETTERS ====================
  
  getWeights(): QualificationWeights {
    return { ...this.weights };
  }
  
  getThresholds(): QualificationThresholds {
    return { ...this.thresholds };
  }
  
  getICPProfiles(): ICPProfile[] {
    return [...this.icpProfiles];
  }
}

// ==================== HOOK HELPER ====================

export async function createQualificationEngine(tenantId: string): Promise<ICPQualificationEngine> {
  const engine = new ICPQualificationEngine(tenantId);
  await engine.initialize();
  return engine;
}

