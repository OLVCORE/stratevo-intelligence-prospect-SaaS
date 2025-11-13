import { Building2, MapPin, Globe, Mail, Linkedin, Award, Target, ExternalLink, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface ExpandedCompanyCardProps {
  company: any;
}

// 🎯 CÁLCULO INTELIGENTE DO FIT SCORE
function calculateFitScore(company: any): { score: number; label: string; color: string } {
  let score = 0;
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const decisores = company.decision_makers || rawData.decision_makers || rawData.apollo_people || [];
  
  // ❌ NO-GO = 0% automático
  if (company.totvs_status === 'no-go') {
    return { score: 0, label: 'Cliente TOTVS - Não qualificado', color: 'text-red-400' };
  }
  
  // ✅ GO confirmado = +40 pontos
  if (company.totvs_status === 'go') {
    score += 40;
  }
  
  // ✅ Apollo enriquecido = +20 pontos
  if (apolloData.organization_id || apolloData.name) {
    score += 20;
  }
  
  // ✅ Descrição completa (Apollo/LinkedIn) = +15 pontos
  if (apolloData.short_description || apolloData.description || company.description) {
    score += 15;
  }
  
  // ✅ Decisores encontrados = +5 pontos por decisor (max 25)
  const decisoresCount = Math.min(decisores.length, 5);
  score += decisoresCount * 5;
  
  // ✅ LinkedIn enriquecido = +10 pontos
  if (company.linkedin_url || rawData.linkedin_url) {
    score += 10;
  }
  
  // ✅ Website válido = +5 pontos
  if (company.domain || company.website) {
    score += 5;
  }
  
  // ✅ CNPJ ativo = +5 pontos
  const receitaData = rawData.receita_federal || rawData.receita || {};
  if (receitaData.situacao === 'ATIVA' || company.cnpj_status === 'ATIVA') {
    score += 5;
  }
  
  // ✅ ICP Score alto (>70) = +10 pontos
  if (company.icp_score && company.icp_score >= 70) {
    score += 10;
  }
  
  // 📊 Determinar label e cor
  if (score >= 80) {
    return { score, label: 'Excelente fit para B2B', color: 'text-emerald-400' };
  } else if (score >= 60) {
    return { score, label: 'Bom fit para prospecção', color: 'text-green-400' };
  } else if (score >= 40) {
    return { score, label: 'Fit moderado', color: 'text-yellow-400' };
  } else {
    return { score, label: 'Fit baixo - Dados incompletos', color: 'text-orange-400' };
  }
}

export function ExpandedCompanyCard({ company }: ExpandedCompanyCardProps) {
  const navigate = useNavigate();
  
  // 🎯 EXTRAIR DADOS
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const apolloPeople = rawData.apollo_people || [];
  const receitaData = rawData.receita_federal || rawData.receita || {};
  const decisores = company.decision_makers || rawData.decision_makers || apolloPeople || [];
  const enrichmentSource = company.enrichment_source;
  
  // 🌍 DESCRIÇÃO (Apollo ou LinkedIn)
  const description = apolloData.short_description || apolloData.description || company.description || '';
  
  // 📊 CALCULAR FIT SCORE
  const fitScore = calculateFitScore(company);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-4 p-4 bg-slate-900/40 border-t border-slate-700/50">
      
      {/* ========== COLUNA ESQUERDA ========== */}
      <div className="space-y-3">
        
        {/* 1️⃣ INFORMAÇÕES GERAIS */}
        <div>
          <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
            Informações Gerais
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 min-w-[80px] text-xs">Nome:</span>
              <span className="text-white font-medium">{company.name || company.razao_social}</span>
            </div>
            {company.industry && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500 min-w-[80px] text-xs">Indústria:</span>
                <span className="text-slate-300">{company.industry}</span>
              </div>
            )}
            {company.source_name && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500 min-w-[80px] text-xs">Origem:</span>
                <span className="text-slate-300">{company.source_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2️⃣ LOCALIZAÇÃO */}
        <div>
          <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
            Localização
          </h4>
          <div className="text-sm text-slate-300 space-y-0.5">
            {(apolloData.city || receitaData.municipio || company.city) && (
              <div>{apolloData.city || receitaData.municipio || company.city}</div>
            )}
            {(apolloData.state || receitaData.uf || company.state) && (
              <div>{apolloData.state || receitaData.uf || company.state}</div>
            )}
            {(apolloData.country || receitaData.pais || company.country || 'Brazil') && (
              <div>{apolloData.country || receitaData.pais || company.country || 'Brazil'}</div>
            )}
          </div>
        </div>

        {/* 3️⃣ DESCRIÇÃO (Apollo/LinkedIn) */}
        <div>
          <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
            Descrição
          </h4>
          {description ? (
            <p className="text-sm text-slate-300 leading-relaxed">
              {description}
            </p>
          ) : (
            <div className="flex items-start gap-2 text-sm text-yellow-500/80 bg-yellow-500/5 p-3 rounded border border-yellow-500/20">
              <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="text-xs">
                Esta descrição pode ser enriquecida via Apollo/LinkedIn
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ========== COLUNA DIREITA ========== */}
      <div className="space-y-3">
        
        {/* 4️⃣ FIT SCORE */}
        <div>
          <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
            Fit Score
          </h4>
          <div className="space-y-2">
            <Progress 
              value={fitScore.score} 
              className={`h-3 ${
                fitScore.score >= 80 ? 'bg-emerald-500/20' : 
                fitScore.score >= 60 ? 'bg-green-500/20' : 
                fitScore.score >= 40 ? 'bg-yellow-500/20' : 
                'bg-red-500/20'
              }`}
            />
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                fitScore.score >= 80 ? 'bg-emerald-400' : 
                fitScore.score >= 60 ? 'bg-green-400' : 
                fitScore.score >= 40 ? 'bg-yellow-400' : 
                'bg-red-400'
              }`} />
              <span className={`text-sm font-medium ${fitScore.color}`}>
                {fitScore.label}
              </span>
            </div>
            {company.segmento && (
              <Badge variant="secondary" className="text-xs">
                {company.segmento}
              </Badge>
            )}
          </div>
        </div>

        {/* 5️⃣ LINKS EXTERNOS */}
        <div>
          <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
            Links Externos
          </h4>
          <div className="space-y-2">
            {company.domain && (
              <a 
                href={`https://${company.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>Website</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
            )}
            {company.linkedin_url && (
              <a 
                href={company.linkedin_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-blue-400" />
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
            )}
            {apolloData.organization_id && (
              <a 
                href={`https://app.apollo.io/#/companies/${apolloData.organization_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors"
              >
                <img src={apolloIcon} alt="Apollo" className="h-4 w-4" />
                <span>Apollo.io</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
            )}
          </div>
        </div>

        {/* 6️⃣ DECISORES */}
        {decisores.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
              Decisores ({decisores.length})
            </h4>
            <div className="space-y-2.5">
              {decisores.slice(0, 5).map((decisor: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-blue-500/20 text-xs">
                      {decisor.name?.charAt(0) || decisor.first_name?.charAt(0) || '?'}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {decisor.name || `${decisor.first_name || ''} ${decisor.last_name || ''}`.trim()}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{decisor.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    {decisor.linkedin_url && (
                      <a 
                        href={decisor.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Linkedin className="h-3 w-3" />
                        LinkedIn
                      </a>
                    )}
                    {decisor.email && (
                      <a 
                        href={`mailto:${decisor.email}`} 
                        className="text-xs text-slate-400 hover:underline flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {decisores.length > 5 && (
                <p className="text-xs text-center text-slate-500 pt-1">
                  + {decisores.length - 5} decisores adicionais
                </p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ========== RODAPÉ: BOTÕES DE AÇÃO ========== */}
      <div className="col-span-full flex items-center justify-end gap-2 pt-3 border-t border-slate-700/30 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => {
            // 🔥 CORRIGIR: usar company.id direto (não company_id)
            navigate(`/company/${company.id}`);
          }}
        >
          <Building2 className="h-3.5 w-3.5 mr-1.5" />
          Ver Detalhes Completos
        </Button>
        <Button
          size="sm"
          className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => {
            navigate(`/company/${company.id}/strategy`);
          }}
        >
          <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
          Criar Estratégia
        </Button>
      </div>

    </div>
  );
}
