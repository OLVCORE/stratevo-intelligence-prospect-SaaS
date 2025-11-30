// src/services/tenantAnalysis360.ts
// Serviço para análise 360° do tenant (não apenas da empresa investigada)

import { supabase } from '@/integrations/supabase/client';
import { useTenantProducts, useTenantCompetitorConfig, useSectorConfig } from '@/hooks/useTenantConfig';

export interface Tenant360Analysis {
  // Perfil do Tenant
  tenantProfile: {
    name: string;
    sector_code: string;
    niche_code?: string;
    products_count: number;
    competitors_count: number;
    market_position?: string;
  };

  // Produtos do Tenant
  products: Array<{
    id: string;
    name: string;
    category: string;
    sector_fit: string[];
    priority: string;
    product_type: string;
  }>;

  // Competidores do Tenant
  competitors: {
    known: string[];
    keywords: string[];
    market_position?: string;
  };

  // Setor do Tenant
  sector: {
    code: string;
    name: string;
    config: any; // Configuração completa do setor
  };

  // Análise Comparativa
  comparativeAnalysis: {
    // Empresas investigadas que usam produtos do tenant
    companiesUsingProducts: number;
    
    // Empresas investigadas que são competidores
    companiesThatAreCompetitors: number;
    
    // Empresas investigadas similares ao tenant
    companiesSimilarToTenant: number;
    
    // Empresas investigadas que são clientes potenciais
    companiesPotentialClients: number;
  };

  // Insights
  insights: Array<{
    type: 'opportunity' | 'threat' | 'strength' | 'weakness';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  // Recomendações
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    action_items: string[];
  }>;
}

/**
 * Realiza análise 360° completa do tenant
 */
export async function analyzeTenant360(
  tenantId: string,
  investigatedCompanyId?: string
): Promise<Tenant360Analysis> {
  // 1. Buscar dados do tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    throw new Error('Tenant não encontrado');
  }

  // 2. Buscar produtos do tenant
  const { data: products } = await supabase
    .from('tenant_products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  // 3. Buscar configuração de competidores
  const { data: competitorConfig } = await supabase
    .from('tenant_competitor_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  // 4. Buscar configuração do setor
  const { data: sectorConfig } = await supabase
    .from('sector_configs')
    .select('*')
    .eq('sector_code', tenant.sector_code || 'servicos')
    .single();

  // 5. Se tem empresa investigada, fazer análise comparativa
  let comparativeAnalysis = {
    companiesUsingProducts: 0,
    companiesThatAreCompetitors: 0,
    companiesSimilarToTenant: 0,
    companiesPotentialClients: 0,
  };

  if (investigatedCompanyId) {
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', investigatedCompanyId)
      .single();

    if (company) {
      // Verificar se empresa usa produtos do tenant
      if (products && products.length > 0) {
        const productNames = products.map(p => p.name.toLowerCase());
        const companyData = company.raw_data || {};
        const companyText = JSON.stringify(companyData).toLowerCase();
        
        const usesProducts = productNames.some(name => 
          companyText.includes(name.toLowerCase())
        );
        
        if (usesProducts) {
          comparativeAnalysis.companiesUsingProducts = 1;
        }
      }

      // Verificar se empresa é competidor
      if (competitorConfig?.competitor_keywords) {
        const companyName = (company.company_name || '').toLowerCase();
        const isCompetitor = competitorConfig.competitor_keywords.some(keyword =>
          companyName.includes(keyword.toLowerCase())
        );
        
        if (isCompetitor) {
          comparativeAnalysis.companiesThatAreCompetitors = 1;
        }
      }

      // Verificar similaridade (mesmo setor/nicho)
      if (company.sector_code === tenant.sector_code) {
        comparativeAnalysis.companiesSimilarToTenant = 1;
      }

      // Verificar se é cliente potencial (fit score alto)
      if (company.icp_match_score && company.icp_match_score >= 60) {
        comparativeAnalysis.companiesPotentialClients = 1;
      }
    }
  }

  // 6. Gerar insights
  const insights = generateInsights(tenant, products || [], competitorConfig, comparativeAnalysis);

  // 7. Gerar recomendações
  const recommendations = generateRecommendations(tenant, products || [], sectorConfig, comparativeAnalysis);

  return {
    tenantProfile: {
      name: tenant.nome || tenant.name || 'Tenant',
      sector_code: tenant.sector_code || 'servicos',
      niche_code: tenant.niche_code,
      products_count: products?.length || 0,
      competitors_count: competitorConfig?.known_competitors?.length || 0,
      market_position: competitorConfig?.market_position,
    },
    products: (products || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category || 'Geral',
      sector_fit: p.sector_fit || [],
      priority: p.priority || 'medium',
      product_type: p.product_type || 'relevant',
    })),
    competitors: {
      known: competitorConfig?.known_competitors || [],
      keywords: competitorConfig?.competitor_keywords || [],
      market_position: competitorConfig?.market_position,
    },
    sector: {
      code: tenant.sector_code || 'servicos',
      name: sectorConfig?.sector_name || tenant.sector_code || 'Serviços',
      config: sectorConfig || {},
    },
    comparativeAnalysis,
    insights,
    recommendations,
  };
}

/**
 * Gera insights baseados na análise do tenant
 */
function generateInsights(
  tenant: any,
  products: any[],
  competitorConfig: any,
  comparativeAnalysis: any
): Tenant360Analysis['insights'] {
  const insights: Tenant360Analysis['insights'] = [];

  // Insight: Poucos produtos cadastrados
  if (products.length < 3) {
    insights.push({
      type: 'weakness',
      title: 'Catálogo de Produtos Limitado',
      description: `O tenant possui apenas ${products.length} produto(s) cadastrado(s). Considere expandir o catálogo para aumentar oportunidades.`,
      priority: 'medium',
    });
  }

  // Insight: Muitos produtos
  if (products.length > 10) {
    insights.push({
      type: 'strength',
      title: 'Catálogo Diversificado',
      description: `O tenant possui ${products.length} produtos cadastrados, oferecendo uma ampla gama de soluções.`,
      priority: 'low',
    });
  }

  // Insight: Competidores não configurados
  if (!competitorConfig || !competitorConfig.known_competitors || competitorConfig.known_competitors.length === 0) {
    insights.push({
      type: 'weakness',
      title: 'Competidores Não Identificados',
      description: 'Configure os competidores conhecidos para melhorar a análise competitiva.',
      priority: 'high',
    });
  }

  // Insight: Empresa investigada usa produtos do tenant
  if (comparativeAnalysis.companiesUsingProducts > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Cliente Existente Identificado',
      description: 'A empresa investigada já utiliza produtos do tenant. Oportunidade de expansão (upsell/cross-sell).',
      priority: 'high',
    });
  }

  // Insight: Empresa investigada é competidor
  if (comparativeAnalysis.companiesThatAreCompetitors > 0) {
    insights.push({
      type: 'threat',
      title: 'Competidor Identificado',
      description: 'A empresa investigada é um competidor direto. Analise estratégias competitivas.',
      priority: 'high',
    });
  }

  return insights;
}

/**
 * Gera recomendações baseadas na análise do tenant
 */
function generateRecommendations(
  tenant: any,
  products: any[],
  sectorConfig: any,
  comparativeAnalysis: any
): Tenant360Analysis['recommendations'] {
  const recommendations: Tenant360Analysis['recommendations'] = [];

  // Recomendação: Configurar produtos
  if (products.length === 0) {
    recommendations.push({
      category: 'Configuração',
      title: 'Cadastrar Produtos/Serviços',
      description: 'Cadastre os produtos e serviços oferecidos pelo tenant para habilitar análises de fit e recomendações.',
      action_items: [
        'Acesse Configurações > Produtos',
        'Cadastre pelo menos 3 produtos principais',
        'Configure setores/nichos de fit para cada produto',
      ],
    });
  }

  // Recomendação: Configurar competidores
  if (!comparativeAnalysis.companiesThatAreCompetitors && products.length > 0) {
    recommendations.push({
      category: 'Análise Competitiva',
      title: 'Configurar Competidores',
      description: 'Configure os competidores conhecidos para melhorar a análise competitiva e identificação de ameaças.',
      action_items: [
        'Acesse Configurações > Competidores',
        'Liste os principais competidores',
        'Configure keywords para identificação automática',
      ],
    });
  }

  // Recomendação: Expandir catálogo
  if (products.length > 0 && products.length < 5) {
    recommendations.push({
      category: 'Crescimento',
      title: 'Expandir Catálogo de Produtos',
      description: 'Considere adicionar mais produtos complementares para aumentar oportunidades de cross-sell.',
      action_items: [
        'Identifique produtos complementares',
        'Analise produtos de sucesso no setor',
        'Cadastre novos produtos com fit bem definido',
      ],
    });
  }

  return recommendations;
}

