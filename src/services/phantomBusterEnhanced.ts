// 🚀 PHANTOMBUSTER ENHANCED - INTEGRAÇÃO COMPLETA
// Features: Lead Generation, LinkedIn Scraping, Engagement Automation, Data Extraction

import { supabase } from '@/integrations/supabase/client';

export interface PhantomBusterAgent {
  id: string;
  name: string;
  type: 'linkedin-profile' | 'linkedin-company' | 'linkedin-search' | 'google-maps' | 'email-finder';
  description: string;
}

export interface LinkedInProfileData {
  profileUrl: string;
  fullName: string;
  headline?: string;
  location?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  connections?: number;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    current: boolean;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
  }>;
  skills?: string[];
  summary?: string;
}

export interface LinkedInCompanyEnhanced {
  companyUrl: string;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  headquarters?: string;
  founded?: string;
  followers?: number;
  employees?: number;
  specialties?: string[];
  recentPosts?: Array<{
    text: string;
    date: string;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
  }>;
  employees_list?: Array<{
    name: string;
    position: string;
    profileUrl: string;
  }>;
  competitorMentions?: string[];
  productMentions?: string[];
}

export interface GoogleMapsLead {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * 🎯 AGENTES PHANTOMBUSTER DISPONÍVEIS
 */
export const PHANTOM_AGENTS = {
  // LinkedIn
  LINKEDIN_PROFILE_SCRAPER: {
    id: 'linkedin-profile-scraper',
    name: 'LinkedIn Profile Scraper',
    type: 'linkedin-profile' as const,
    description: 'Extrai dados completos de perfis LinkedIn (nome, email, telefone, experiência)'
  },
  LINKEDIN_COMPANY_SCRAPER: {
    id: 'linkedin-company-scraper',
    name: 'LinkedIn Company Scraper',
    type: 'linkedin-company' as const,
    description: 'Extrai dados de empresas (funcionários, posts, engagement)'
  },
  LINKEDIN_SEARCH: {
    id: 'linkedin-search',
    name: 'LinkedIn People Search',
    type: 'linkedin-search' as const,
    description: 'Busca decisores por cargo (CEO, CFO, CIO) e empresa'
  },
  
  // Google Maps
  GOOGLE_MAPS_EXTRACTOR: {
    id: 'google-maps-extractor',
    name: 'Google Maps Lead Extractor',
    type: 'google-maps' as const,
    description: 'Extrai leads de Google Maps por região/categoria'
  },
  
  // Email Finder
  EMAIL_FINDER: {
    id: 'email-finder',
    name: 'Email Finder',
    type: 'email-finder' as const,
    description: 'Encontra emails de decisores via padrões comuns'
  }
};

/**
 * 🔍 EXTRAI PERFIS LINKEDIN DE DECISORES (CEO, CFO, CIO)
 */
export async function extractLinkedInDecisors(
  companyName: string,
  linkedinCompanyUrl?: string
): Promise<LinkedInProfileData[]> {
  console.log('[PhantomBuster] 🔍 Buscando decisores:', companyName);

  try {
    // Chamar Edge Function que usa PhantomBuster
    const { data, error } = await supabase.functions.invoke('phantom-linkedin-decisors', {
      body: {
        companyName,
        linkedinCompanyUrl,
        positions: ['CEO', 'CFO', 'CIO', 'CTO', 'COO', 'Diretor', 'VP']
      }
    });

    if (error) {
      console.error('[PhantomBuster] Erro:', error);
      return [];
    }

    console.log('[PhantomBuster] ✅ Decisores encontrados:', data?.decisors?.length || 0);
    return data?.decisors || [];

  } catch (error) {
    console.error('[PhantomBuster] Erro ao buscar decisores:', error);
    return [];
  }
}

/**
 * 🏢 EXTRAI DADOS COMPLETOS DA EMPRESA NO LINKEDIN
 */
export async function extractLinkedInCompanyData(
  linkedinCompanyUrl: string
): Promise<LinkedInCompanyEnhanced | null> {
  console.log('[PhantomBuster] 🏢 Scraping empresa:', linkedinCompanyUrl);

  try {
    const { data, error } = await supabase.functions.invoke('phantom-linkedin-company', {
      body: {
        linkedinCompanyUrl,
        includeEmployees: true,
        includePosts: true,
        maxPosts: 20
      }
    });

    if (error) {
      console.error('[PhantomBuster] Erro:', error);
      return null;
    }

    console.log('[PhantomBuster] ✅ Dados da empresa extraídos');
    return data as LinkedInCompanyEnhanced;

  } catch (error) {
    console.error('[PhantomBuster] Erro ao extrair empresa:', error);
    return null;
  }
}

/**
 * 📍 EXTRAI LEADS DO GOOGLE MAPS POR REGIÃO/CATEGORIA
 */
export async function extractGoogleMapsLeads(
  query: string,
  location: string,
  maxResults: number = 50
): Promise<GoogleMapsLead[]> {
  console.log('[PhantomBuster] 📍 Buscando no Google Maps:', query, location);

  try {
    const { data, error } = await supabase.functions.invoke('phantom-google-maps', {
      body: {
        query,
        location,
        maxResults
      }
    });

    if (error) {
      console.error('[PhantomBuster] Erro:', error);
      return [];
    }

    console.log('[PhantomBuster] ✅ Leads encontrados:', data?.leads?.length || 0);
    return data?.leads || [];

  } catch (error) {
    console.error('[PhantomBuster] Erro ao buscar leads:', error);
    return [];
  }
}

/**
 * 📧 ENCONTRA EMAILS DE DECISORES
 */
export async function findDecisorsEmails(
  companyDomain: string,
  decisors: Array<{ name: string; position: string }>
): Promise<Array<{ name: string; email?: string; confidence: number }>> {
  console.log('[PhantomBuster] 📧 Buscando emails:', decisors.length, 'decisores');

  try {
    const { data, error } = await supabase.functions.invoke('phantom-email-finder', {
      body: {
        companyDomain,
        decisors
      }
    });

    if (error) {
      console.error('[PhantomBuster] Erro:', error);
      return decisors.map(d => ({ ...d, confidence: 0 }));
    }

    console.log('[PhantomBuster] ✅ Emails encontrados:', data?.emails?.length || 0);
    return data?.emails || [];

  } catch (error) {
    console.error('[PhantomBuster] Erro ao buscar emails:', error);
    return decisors.map(d => ({ ...d, confidence: 0 }));
  }
}

/**
 * 🔥 ANÁLISE COMPLETA LINKEDIN + DECISORES + EMAILS
 */
// Apollo-based decisor extraction (hybrid Apollo + Phantom)
export async function performFullLinkedInAnalysis(
  companyName: string,
  linkedinCompanyUrl?: string,
  companyDomain?: string,
  companyId?: string // 🔥 NOVO: company_id para salvar no banco
): Promise<{
  companyData: LinkedInCompanyEnhanced | null;
  decisors: any[];
  decisorsWithEmails: any[];
  insights: string[];
}> {
  console.log('[Apollo+Phantom] 🔥 Extração híbrida:', companyName, '| companyId:', companyId);

  const insights: string[] = [];
  
  // 1) Call Apollo backend
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('[Apollo+Phantom] 🚀 Chamando Apollo backend (enrich-apollo-public)...');
  
  const apolloRes = await fetch(`${SUPABASE_URL}/functions/v1/enrich-apollo-public`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      company_id: companyId, // 🔥 CRITICAL: passar company_id para salvar no banco!
      company_name: companyName,
      domain: companyDomain,
      modes: ['people', 'company'], // 🏢 BUSCAR dados de PEOPLE + ORGANIZATION
      positions: ['CEO','CFO','CIO','CTO','COO','Diretor','Gerente','VP','Head','Presidente','Sócio','Coordenador']
    })
  });
  
  console.log('[Apollo+Phantom] 📡 Response status:', apolloRes.status, apolloRes.statusText);
  
  if (!apolloRes.ok) {
    const errorText = await apolloRes.text();
    console.error('[Apollo+Phantom] ❌ Erro response:', errorText);
    throw new Error(`Apollo API error: ${apolloRes.status}`);
  }
  
  const apolloData = await apolloRes.json();
  console.log('[Apollo+Phantom] 📦 Response body:', apolloData);
  
  const decisores = apolloData?.decisores || [];
  console.log('[Apollo+Phantom] 🔍 Decisores extraídos do response:', decisores.length);
  
  console.log('[Apollo+Phantom] 📊 Apollo retornou:', decisores.length, 'decisores');
  console.log('[Apollo+Phantom] 📧 Dados completos:', apolloData);
  
  insights.push(`✅ ${decisores.length} decisores encontrados via Apollo.io`);
  insights.push(`📧 ${decisores.filter((d:any) => d.email && d.email !== 'email_not_unlocked@domain.com').length} emails validados`);
  insights.push(`🎯 ${decisores.filter((d:any) => d.buying_power === 'decision-maker').length} decision-makers`);
  
  console.log('[Apollo+Phantom] ✅ Extração completa, retornando', decisores.length, 'decisores');
  
  return {
    companyData: null,
    decisors: decisores,
    decisorsWithEmails: decisores,
    insights
  };
}

/**
 * 🎯 ANÁLISE DE CONCORRÊNCIA NO LINKEDIN (Posts que mencionam concorrentes)
 */
export async function analyzeCompetitorMentions(
  companyData: LinkedInCompanyEnhanced
): Promise<{
  competitorMentions: Record<string, number>;
  insights: string[];
}> {
  const mentions: Record<string, number> = {};
  const insights: string[] = [];

  if (!companyData.recentPosts) {
    return { competitorMentions: {}, insights: [] };
  }

  // Lista de concorrentes para procurar
  const competitors = [
    'SAP', 'Oracle', 'Microsoft', 'Dynamics', 'NetSuite',
    'Salesforce', 'HubSpot', 'Pipedrive',
    'Power BI', 'Tableau', 'Qlik'
  ];

  // Contar menções nos posts
  companyData.recentPosts.forEach(post => {
    const textLower = post.text.toLowerCase();
    competitors.forEach(comp => {
      if (textLower.includes(comp.toLowerCase())) {
        mentions[comp] = (mentions[comp] || 0) + 1;
      }
    });
  });

  // Gerar insights
  Object.entries(mentions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([comp, count]) => {
      insights.push(`🎯 ${comp} mencionado ${count}x nos últimos posts`);
    });

  return { competitorMentions: mentions, insights };
}

