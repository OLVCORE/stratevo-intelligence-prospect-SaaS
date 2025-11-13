import { Building2, MapPin, Globe, Mail, Linkedin, Award, Target, ExternalLink, TrendingUp, Phone, Briefcase, DollarSign, Users, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { useEffect, useRef, useState } from 'react';

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
  const [mapLoaded, setMapLoaded] = useState(false);
  
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
    rawData.company_details?.description || 
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
  
  // 🗺️ GEOCODING DINÂMICO (Nominatim - OpenStreetMap)
  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current || typeof window === 'undefined') return;
      
      // @ts-ignore
      if (!window.L) return;
      
      // @ts-ignore
      const L = window.L;
      
      // ✅ LIMPAR MAPA EXISTENTE
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = undefined;
        mapRef.current.innerHTML = '';
      }
      
      let lat = -23.5505; // São Paulo (fallback)
      let lng = -46.6333;
      
      // 🔍 TENTAR GEOCODING POR ENDEREÇO COMPLETO
      if (cep || (logradouro && cidade && uf)) {
        const endereco = cep 
          ? `${cep}, Brazil`
          : `${logradouro} ${numero}, ${cidade}, ${uf}, Brazil`;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`,
            {
              headers: {
                'User-Agent': 'STRATEVO-Intelligence/1.0'
              }
            }
          );
          const data = await response.json();
          
          if (data && data[0]) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (error) {
          console.warn('[MAP] Geocoding falhou, usando coordenadas padrão', error);
        }
      }
      
      // 🗺️ CRIAR MAPA
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        attributionControl: true
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);
      
      // 📍 MARKER
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })
      }).addTo(map);
      
      setMapLoaded(true);
      
      // ✅ CLEANUP
      return () => {
        if (map) map.remove();
      };
    };
    
    loadMap();
  }, [cep, logradouro, cidade, uf]);

  return (
    <div className="p-4 bg-slate-900/40 border-t border-slate-700/50">
      
      {/* 🎨 LAYOUT 3 COLUNAS (WORLD-CLASS) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.5fr,1.5fr] gap-4">
        
        {/* ========== COLUNA 1: INFORMAÇÕES GERAIS (40%) ========== */}
        <div>
          <h4 className="text-xs font-semibold mb-3 text-slate-400 uppercase tracking-wider">
            Informações Gerais
          </h4>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 text-xs block mb-0.5">Nome:</span>
              <p className="text-white font-semibold text-sm leading-tight">
                {company.name || company.razao_social}
              </p>
            </div>
            
            {company.industry && (
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Indústria:</span>
                <p className="text-slate-300 text-sm">{company.industry}</p>
              </div>
            )}
            
            {company.source_name && (
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Origem:</span>
                <Badge variant="outline" className="text-xs">
                  {company.source_name}
                </Badge>
              </div>
            )}
            
            {company.cnpj && (
              <div className="pt-2 border-t border-slate-700/30">
                <span className="text-slate-500 text-xs block mb-0.5">CNPJ:</span>
                <p className="text-blue-400 font-mono text-xs">{company.cnpj}</p>
              </div>
            )}
            
            {receitaData.porte && (
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Porte:</span>
                <Badge variant="secondary" className="text-xs">
                  {receitaData.porte}
                </Badge>
              </div>
            )}
            
            {(apolloData.estimated_num_employees || receitaData.qsa_count) && (
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Funcionários:</span>
                <p className="text-slate-300 text-sm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  {apolloData.estimated_num_employees || receitaData.qsa_count}
                </p>
              </div>
            )}
            
            {receitaData.capital_social && (
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Capital Social:</span>
                <p className="text-emerald-400 font-mono text-sm">
                  R$ {Number(receitaData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            
            {receitaData.cnae_fiscal && (
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">CNAE:</span>
                <p className="text-slate-300 font-mono text-xs">{receitaData.cnae_fiscal}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* ========== COLUNA 2: MAPA + LOCALIZAÇÃO (30%) ========== */}
        <div>
          <h4 className="text-xs font-semibold mb-3 text-slate-400 uppercase tracking-wider">
            Localização
          </h4>
          
          {/* 🗺️ MAPA DINÂMICO LEAFLET (150x150px) */}
          <div 
            ref={mapRef} 
            className="w-full h-[150px] rounded-lg border border-slate-700/50 mb-3 overflow-hidden"
            style={{ minHeight: '150px' }}
          />
          
          <div className="space-y-1.5 text-sm">
            {(logradouro || bairro) && (
              <div className="text-slate-300 text-xs leading-relaxed">
                {logradouro && <div>{logradouro}{numero && `, ${numero}`}</div>}
                {bairro && <div className="text-slate-400">{bairro}</div>}
              </div>
            )}
            
            {cidade && (
              <p className="text-white font-medium text-sm">{cidade}</p>
            )}
            
            {uf && (
              <p className="text-slate-300 text-sm">{uf}</p>
            )}
            
            {pais && (
              <p className="text-slate-300 text-sm">{pais}</p>
            )}
            
            {cep && (
              <p className="text-slate-400 font-mono text-xs mt-2">CEP: {cep}</p>
            )}
            
            {telefone && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/30">
                <Phone className="h-3.5 w-3.5 text-blue-400" />
                <a href={`tel:${telefone}`} className="text-blue-400 text-xs hover:underline">
                  {telefone}
                </a>
              </div>
            )}
            
            {email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                <a href={`mailto:${email}`} className="text-blue-400 text-xs hover:underline truncate">
                  {email}
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* ========== COLUNA 3: FIT SCORE + LINKS + DECISORES (30%) ========== */}
        <div className="space-y-4">
          
          {/* 📊 FIT SCORE */}
          <div>
            <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
              Fit Score
            </h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-white">{fitScore.score}</span>
            </div>
            <Progress 
              value={fitScore.score} 
              className="h-2.5 mb-2"
            />
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${
                fitScore.score >= 80 ? 'bg-emerald-400' : 
                fitScore.score >= 60 ? 'bg-green-400' : 
                fitScore.score >= 40 ? 'bg-yellow-400' : 
                'bg-red-400'
              }`} />
              <span className={`text-xs font-medium ${fitScore.color}`}>
                {fitScore.label}
              </span>
            </div>
            {company.segmento && (
              <Badge variant="secondary" className="text-xs mt-2">
                {company.segmento}
              </Badge>
            )}
          </div>
          
          {/* 🔗 LINKS EXTERNOS */}
          <div>
            <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
              Links Externos
            </h4>
            <div className="space-y-1.5">
              {company.domain && (
                <a 
                  href={`https://${company.domain}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-blue-400 transition-colors p-1.5 rounded hover:bg-slate-800/40"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Website</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {company.linkedin_url && (
                <a 
                  href={company.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-blue-400 transition-colors p-1.5 rounded hover:bg-slate-800/40"
                >
                  <Linkedin className="h-3.5 w-3.5 text-blue-400" />
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {apolloData.organization_id && (
                <a 
                  href={`https://app.apollo.io/#/companies/${apolloData.organization_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-blue-400 transition-colors p-1.5 rounded hover:bg-slate-800/40"
                >
                  <img src={apolloIcon} alt="Apollo" className="h-3.5 w-3.5" />
                  <span>Apollo.io</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
            </div>
          </div>
          
          {/* 👥 DECISORES */}
          {decisores.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
                Decisores ({decisores.length})
              </h4>
              <div className="space-y-2.5">
                {decisores.slice(0, 3).map((decisor: any, idx: number) => {
                  const fullName = decisor.name || `${decisor.first_name || ''} ${decisor.last_name || ''}`.trim();
                  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {decisor.photo_url ? (
                          <img src={decisor.photo_url} alt={fullName} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          initials || '?'
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs leading-tight truncate">
                          {fullName}
                        </p>
                        <p className="text-slate-400 text-[10px] leading-tight truncate mb-1">
                          {decisor.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {decisor.linkedin_url && (
                            <a 
                              href={decisor.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 text-[10px] hover:underline"
                            >
                              LinkedIn
                            </a>
                          )}
                          {decisor.email && (
                            <a 
                              href={`mailto:${decisor.email}`} 
                              className="text-slate-400 text-[10px] hover:underline"
                            >
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {decisores.length > 3 && (
                  <p className="text-[10px] text-center text-slate-500 pt-1">
                    + {decisores.length - 3} decisores adicionais
                  </p>
                )}
              </div>
            </div>
          )}
          
        </div>
        
      </div>
      
      {/* ========== DESCRIÇÃO (RODAPÉ - LARGURA TOTAL) ========== */}
      {description && (
        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <h4 className="text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">
            Descrição
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}
      
      {!description && (
        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <div className="flex items-start gap-2 text-xs text-yellow-500/80 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/20">
            <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              💡 Esta descrição pode ser enriquecida via Apollo/LinkedIn
            </span>
          </div>
        </div>
      )}
      
      {/* ========== BOTÕES DE AÇÃO ========== */}
      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-700/30">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => navigate(`/company/${company.id}`)}
        >
          <Building2 className="h-3.5 w-3.5 mr-1.5" />
          Ver Detalhes Completos
        </Button>
        <Button
          size="sm"
          className="text-xs bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate(`/company/${company.id}/strategy`)}
        >
          <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
          Criar Estratégia
        </Button>
      </div>

    </div>
  );
}
