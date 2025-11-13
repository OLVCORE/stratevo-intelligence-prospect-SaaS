import { Building2, MapPin, Globe, Mail, Linkedin, Target, ExternalLink, TrendingUp, Phone, Briefcase, DollarSign, Users, Shield, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { useEffect, useRef } from 'react';

interface ExpandedCompanyCardProps {
  company: any;
}

// 🎯 CÁLCULO INTELIGENTE DO FIT SCORE
function calculateFitScore(company: any): { score: number; label: string; color: string } {
  let score = 0;
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const decisores = company.decision_makers || rawData.decision_makers || rawData.apollo_people || [];
  
  if (company.totvs_status === 'no-go') {
    return { score: 0, label: 'Cliente TOTVS - Não qualificado', color: 'text-red-400' };
  }
  
  if (company.totvs_status === 'go') score += 40;
  if (apolloData.organization_id || apolloData.name) score += 20;
  if (apolloData.short_description || apolloData.description || company.description) score += 15;
  
  const decisoresCount = Math.min(decisores.length, 5);
  score += decisoresCount * 5;
  
  if (company.linkedin_url || rawData.linkedin_url) score += 10;
  if (company.domain || company.website) score += 5;
  
  const receitaData = rawData.receita_federal || rawData.receita || {};
  if (receitaData.situacao === 'ATIVA' || company.cnpj_status === 'ATIVA') score += 5;
  if (company.icp_score && company.icp_score >= 70) score += 10;
  
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
  const mapRef = useRef<HTMLDivElement>(null);
  
  // 🎯 EXTRAIR DADOS
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const apolloPeople = rawData.apollo_people || [];
  const receitaData = rawData.receita_federal || rawData.receita || {};
  const decisores = company.decision_makers || rawData.decision_makers || apolloPeople || [];
  
  // 🌍 DESCRIÇÃO (múltiplas fontes + ABA DECISORES)
  const description = 
    apolloData.short_description || 
    apolloData.description || 
    company.description || 
    rawData.description ||
    rawData.company_details?.description || // ✅ ABA DECISORES
    '';
  
  // 📊 CALCULAR FIT SCORE
  const fitScore = calculateFitScore(company);
  
  // 📍 ENDEREÇO COMPLETO
  const logradouro = receitaData.logradouro || apolloData.street_address || '';
  const numero = receitaData.numero || '';
  const complemento = receitaData.complemento || '';
  const bairro = receitaData.bairro || '';
  const cidade = apolloData.city || receitaData.municipio || company.city || '';
  const uf = apolloData.state || receitaData.uf || company.state || '';
  const cep = receitaData.cep || apolloData.postal_code || '';
  const pais = apolloData.country || receitaData.pais || company.country || 'Brazil';
  
  // 📞 CONTATOS
  const telefone = rawData.telefone1 || rawData.telefone || apolloData.phone || '';
  const email = rawData.email || apolloData.email || '';
  
  // 🗺️ MAPA LEAFLET (OSM)
  const lat = apolloData.latitude || rawData.latitude || -23.5505;
  const lng = apolloData.longitude || rawData.longitude || -46.6333;
  
  useEffect(() => {
    if (mapRef.current && typeof window !== 'undefined') {
      // @ts-ignore - Leaflet carregado via CDN
      if (window.L) {
        // @ts-ignore
        const L = window.L;
        
        // ✅ LIMPAR MAPA EXISTENTE ANTES DE CRIAR NOVO
        if (mapRef.current._leaflet_id) {
          mapRef.current._leaflet_id = undefined;
          mapRef.current.innerHTML = '';
        }
        
        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 13,
          zoomControl: false,
          scrollWheelZoom: false,
          dragging: false
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);
        
        L.marker([lat, lng]).addTo(map);
        
        // ✅ CLEANUP ao desmontar
        return () => {
          if (map) {
            map.remove();
          }
        };
      }
    }
  }, [lat, lng]);

  return (
    <div className="p-3 bg-slate-900/40 border-t border-slate-700/50">
      
      {/* 🎨 MOSAICO 4 COLUNAS (COMPACTO) */}
      <div className="grid grid-cols-4 gap-3 text-[10px]">
        
        {/* ========== COLUNA 1: INFORMAÇÕES GERAIS ========== */}
        <div className="space-y-1">
          <h4 className="text-[9px] font-semibold mb-1.5 text-slate-400 uppercase tracking-wider">
            Informações Gerais
          </h4>
          
          <div className="space-y-0.5">
            <div>
              <span className="text-slate-500 text-[9px]">Nome:</span>
              <p className="text-white font-medium text-[10px] leading-tight">{company.name || company.razao_social}</p>
            </div>
            
            {company.cnpj && (
              <div>
                <span className="text-slate-500 text-[9px]">CNPJ:</span>
                <p className="text-blue-400 font-mono text-[9px]">{company.cnpj}</p>
              </div>
            )}
            
            {company.industry && (
              <div>
                <span className="text-slate-500 text-[9px]">Indústria:</span>
                <p className="text-slate-300 text-[10px]">{company.industry}</p>
              </div>
            )}
            
            {receitaData.porte && (
              <div>
                <span className="text-slate-500 text-[9px]">Porte:</span>
                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
                  {receitaData.porte}
                </Badge>
              </div>
            )}
            
            {(apolloData.estimated_num_employees || receitaData.qsa_count) && (
              <div>
                <span className="text-slate-500 text-[9px]">Funcionários:</span>
                <p className="text-slate-300 text-[9px]">
                  {apolloData.estimated_num_employees || receitaData.qsa_count}
                </p>
              </div>
            )}
            
            {receitaData.capital_social && (
              <div>
                <span className="text-slate-500 text-[9px]">Capital:</span>
                <p className="text-emerald-400 font-mono text-[9px]">
                  R$ {Number(receitaData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            
            {receitaData.cnae_fiscal && (
              <div>
                <span className="text-slate-500 text-[9px]">CNAE:</span>
                <p className="text-slate-300 font-mono text-[9px]">{receitaData.cnae_fiscal}</p>
              </div>
            )}
            
            {company.source_name && (
              <div>
                <span className="text-slate-500 text-[9px]">Origem:</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                  {company.source_name}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {/* ========== COLUNA 2: LOCALIZAÇÃO + MAPA ========== */}
        <div className="space-y-1">
          <h4 className="text-[9px] font-semibold mb-1.5 text-slate-400 uppercase tracking-wider">
            Localização
          </h4>
          
          {/* 🗺️ MINI MAPA LEAFLET (COLADO NO TOPO) */}
          <div 
            ref={mapRef} 
            className="w-full h-[100px] rounded border border-slate-700/50 mb-1.5"
            style={{ minHeight: '100px' }}
          />
          
          <div className="space-y-0.5">
            {logradouro && (
              <div className="flex items-start gap-1">
                <Home className="h-2.5 w-2.5 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300 text-[9px] leading-tight">
                  {logradouro}{numero && `, ${numero}`}
                </p>
              </div>
            )}
            
            {complemento && (
              <p className="text-slate-400 text-[9px] pl-3.5">{complemento}</p>
            )}
            
            {bairro && (
              <p className="text-slate-300 text-[9px]">Bairro: {bairro}</p>
            )}
            
            {cidade && (
              <p className="text-white text-[10px] font-medium">{cidade} - {uf}</p>
            )}
            
            {cep && (
              <p className="text-slate-400 font-mono text-[9px]">CEP: {cep}</p>
            )}
            
            {pais && (
              <p className="text-slate-300 text-[9px]">{pais}</p>
            )}
            
            {telefone && (
              <div className="flex items-center gap-1 pt-1">
                <Phone className="h-2.5 w-2.5 text-blue-400" />
                <a href={`tel:${telefone}`} className="text-blue-400 text-[9px] hover:underline">
                  {telefone}
                </a>
              </div>
            )}
            
            {email && (
              <div className="flex items-center gap-1">
                <Mail className="h-2.5 w-2.5 text-blue-400" />
                <a href={`mailto:${email}`} className="text-blue-400 text-[9px] hover:underline truncate">
                  {email}
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* ========== COLUNA 3: FIT SCORE + LINKS ========== */}
        <div className="space-y-2">
          <div>
            <h4 className="text-[9px] font-semibold mb-1 text-slate-400 uppercase tracking-wider">
              Fit Score
            </h4>
            <Progress 
              value={fitScore.score} 
              className="h-2 mb-1"
            />
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${
                fitScore.score >= 80 ? 'bg-emerald-400' : 
                fitScore.score >= 60 ? 'bg-green-400' : 
                fitScore.score >= 40 ? 'bg-yellow-400' : 
                'bg-red-400'
              }`} />
              <span className={`text-[9px] ${fitScore.color}`}>
                {fitScore.label}
              </span>
            </div>
            {company.segmento && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 mt-1">
                {company.segmento}
              </Badge>
            )}
          </div>
          
          <div>
            <h4 className="text-[9px] font-semibold mb-1 text-slate-400 uppercase tracking-wider">
              Links Externos
            </h4>
            <div className="space-y-1">
              {company.domain && (
                <a 
                  href={`https://${company.domain}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-slate-300 hover:text-blue-400"
                >
                  <Globe className="h-2.5 w-2.5" />
                  <span className="truncate">Website</span>
                  <ExternalLink className="h-2 w-2 ml-auto" />
                </a>
              )}
              {company.linkedin_url && (
                <a 
                  href={company.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-slate-300 hover:text-blue-400"
                >
                  <Linkedin className="h-2.5 w-2.5 text-blue-400" />
                  <span className="truncate">LinkedIn</span>
                  <ExternalLink className="h-2 w-2 ml-auto" />
                </a>
              )}
              {apolloData.organization_id && (
                <a 
                  href={`https://app.apollo.io/#/companies/${apolloData.organization_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-slate-300 hover:text-blue-400"
                >
                  <img src={apolloIcon} alt="Apollo" className="h-2.5 w-2.5" />
                  <span className="truncate">Apollo.io</span>
                  <ExternalLink className="h-2 w-2 ml-auto" />
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* ========== COLUNA 4: DECISORES C-LEVEL ========== */}
        <div className="space-y-1">
          <h4 className="text-[9px] font-semibold mb-1.5 text-slate-400 uppercase tracking-wider">
            Decisores ({decisores.length})
          </h4>
          
          <div className="space-y-1.5">
            {decisores.slice(0, 5).map((decisor: any, idx: number) => {
              const fullName = decisor.name || `${decisor.first_name || ''} ${decisor.last_name || ''}`.trim();
              const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              
              return (
                <div key={idx} className="flex items-start gap-1">
                  <Avatar className="h-5 w-5 bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[8px] font-semibold flex items-center justify-center flex-shrink-0">
                    {decisor.photo_url ? (
                      <img src={decisor.photo_url} alt={fullName} className="h-full w-full object-cover" />
                    ) : (
                      initials || '?'
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-[9px] leading-tight truncate">
                      {fullName}
                    </p>
                    <p className="text-slate-400 text-[8px] leading-tight truncate">{decisor.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {decisor.linkedin_url && (
                        <a 
                          href={decisor.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 text-[8px] hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                      {decisor.email && (
                        <a 
                          href={`mailto:${decisor.email}`} 
                          className="text-slate-400 text-[8px] hover:underline"
                        >
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {decisores.length > 5 && (
              <p className="text-[8px] text-center text-slate-500 pt-0.5">
                + {decisores.length - 5} decisores
              </p>
            )}
          </div>
        </div>
        
      </div>
      
      {/* ========== DESCRIÇÃO (RODAPÉ - FLEXÍVEL) ========== */}
      {description && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <h4 className="text-[9px] font-semibold mb-1.5 text-slate-400 uppercase tracking-wider">
            Descrição
          </h4>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}
      
      {/* ========== BOTÕES DE AÇÃO ========== */}
      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-700/30">
        <Button
          size="sm"
          variant="outline"
          className="text-[10px] h-7 px-3"
          onClick={() => navigate(`/company/${company.id}`)}
        >
          <Building2 className="h-3 w-3 mr-1" />
          Ver Detalhes Completos
        </Button>
        <Button
          size="sm"
          variant="default"
          className="text-[10px] h-7 px-3 bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate(`/company/${company.id}/strategy`)}
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Criar Estratégia
        </Button>
      </div>

    </div>
  );
}
