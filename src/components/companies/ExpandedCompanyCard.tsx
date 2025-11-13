import { Building2, MapPin, Globe, Mail, Linkedin, Award, Target, ExternalLink, TrendingUp, Phone, Briefcase, DollarSign, Users, Shield } from 'lucide-react';
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
  
  // 🌍 DESCRIÇÃO (Apollo ou LinkedIn ou CompanyDetailPage)
  const description = apolloData.short_description || apolloData.description || company.description || rawData.description || '';
  
  // 📊 CALCULAR FIT SCORE
  const fitScore = calculateFitScore(company);
  
  // 📞 CONTATOS
  const telefones = rawData.telefones || rawData.telefone1 ? [rawData.telefone1, rawData.telefone2].filter(Boolean) : [];
  const emails = rawData.emails || rawData.email ? [rawData.email].filter(Boolean) : [];
  
  // 🗺️ COORDENADAS PARA MAPA (se existir)
  const lat = apolloData.latitude || rawData.latitude;
  const lng = apolloData.longitude || rawData.longitude;
  const city = apolloData.city || receitaData.municipio || company.city || '';
  const state = apolloData.state || receitaData.uf || company.state || '';
  const country = apolloData.country || receitaData.pais || company.country || 'Brazil';

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

        {/* 2️⃣ LOCALIZAÇÃO + MINI MAPA */}
        <div className="flex gap-3">
          <div className="flex-1">
            <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
              Localização
            </h4>
            <div className="text-sm text-slate-300 space-y-0.5">
              {city && <div>{city}</div>}
              {state && <div>{state}</div>}
              {country && <div>{country}</div>}
              
              {/* 📞 TELEFONES */}
              {telefones.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <Phone className="h-3 w-3 text-blue-400" />
                  <span className="text-slate-400">{telefones[0]}</span>
                </div>
              )}
              
              {/* 📧 EMAILS */}
              {emails.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Mail className="h-3 w-3 text-blue-400" />
                  <a href={`mailto:${emails[0]}`} className="text-blue-400 hover:underline">
                    {emails[0]}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* 🗺️ MINI MAPA (5cm x 5cm ≈ 120px x 120px) */}
          {lat && lng && (
            <div className="w-[120px] h-[120px] flex-shrink-0 rounded border border-slate-700/50 overflow-hidden">
              <iframe
                title="Company Location"
                width="120"
                height="120"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=13`}
                allowFullScreen
              />
            </div>
          )}
          
          {/* 🗺️ MAPA ALTERNATIVO (se não tiver coordenadas, usar endereço) */}
          {!lat && !lng && city && state && (
            <div className="w-[120px] h-[120px] flex-shrink-0 rounded border border-slate-700/50 overflow-hidden bg-slate-800/40 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-slate-600" />
            </div>
          )}
        </div>

        {/* 3️⃣ ATIVIDADE ECONÔMICA + CNPJ */}
        <div>
          <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
            Atividade Econômica
          </h4>
          <div className="space-y-1.5 text-sm">
            {company.cnpj && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500 min-w-[80px] text-xs">CNPJ:</span>
                <span className="text-blue-400 font-mono text-xs">{company.cnpj}</span>
              </div>
            )}
            {receitaData.cnae_fiscal && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500 min-w-[80px] text-xs">CNAE:</span>
                <span className="text-slate-300 text-xs">{receitaData.cnae_fiscal}</span>
              </div>
            )}
            {(receitaData.porte || apolloData.estimated_num_employees) && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500 min-w-[80px] text-xs">Porte:</span>
                <Badge variant="secondary" className="text-xs">
                  {receitaData.porte || `${apolloData.estimated_num_employees} funcionários`}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* 4️⃣ DESCRIÇÃO (Apollo/LinkedIn) */}
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
        
        {/* 5️⃣ FIT SCORE */}
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

        {/* 6️⃣ LINKS EXTERNOS */}
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

        {/* 7️⃣ DECISORES C-LEVEL (Top 3-5) */}
        {decisores.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
              Decisores ({decisores.length})
            </h4>
            <div className="space-y-2.5">
              {decisores.slice(0, 5).map((decisor: any, idx: number) => {
                const fullName = decisor.name || `${decisor.first_name || ''} ${decisor.last_name || ''}`.trim();
                const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold flex items-center justify-center">
                        {decisor.photo_url ? (
                          <img src={decisor.photo_url} alt={fullName} className="h-full w-full object-cover" />
                        ) : (
                          initials || '?'
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {fullName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{decisor.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-10">
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
                );
              })}
              {decisores.length > 5 && (
                <p className="text-xs text-center text-slate-500 pt-1">
                  + {decisores.length - 5} decisores adicionais
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* 8️⃣ INFORMAÇÕES FINANCEIRAS */}
        {(receitaData.capital_social || apolloData.estimated_annual_revenue) && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
              Informações Financeiras
            </h4>
            <div className="space-y-1.5 text-sm">
              {receitaData.capital_social && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 min-w-[100px] text-xs">Capital Social:</span>
                  <span className="text-emerald-400 font-mono text-xs">
                    R$ {Number(receitaData.capital_social).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {apolloData.estimated_annual_revenue && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 min-w-[100px] text-xs">Receita Estimada:</span>
                  <span className="text-emerald-400 text-xs">{apolloData.estimated_annual_revenue}</span>
                </div>
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
