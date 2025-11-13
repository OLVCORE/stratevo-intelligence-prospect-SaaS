import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Linkedin,
  Target,
  ExternalLink,
  TrendingUp,
  Phone,
  Users,
  Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { useEffect, useRef } from 'react';

interface ExpandedCompanyCardProps {
  company: any;
}

function calculateFitScore(company: any): { score: number; label: string; color: string } {
  let score = 0;
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const decisores = company.decision_makers || rawData.decision_makers || rawData.apollo_people || [];
  
  if (company.totvs_status === 'no-go') {
    return { score: 0, label: 'Cliente TOTVS - Não qualificado', color: 'bg-red-500' };
  }
  
  if (company.totvs_status === 'go') score += 40;
  if (apolloData.organization_id || apolloData.name) score += 20;
  if (apolloData.short_description || apolloData.description || company.description) score += 15;
  score += Math.min(decisores.length, 5) * 5;
  if (company.linkedin_url || rawData.linkedin_url) score += 10;
  if (company.domain || company.website) score += 5;
  
  const receitaData = rawData.receita_federal || rawData.receita || {};
  if (receitaData.situacao === 'ATIVA' || company.cnpj_status === 'ATIVA') score += 5;
  if (company.icp_score && company.icp_score >= 70) score += 10;
  
  let color = 'bg-orange-500';
  let label = 'Fit baixo - Dados incompletos';
  
  if (score >= 80) {
    color = 'bg-green-500';
    label = 'Excelente fit para B2B';
  } else if (score >= 60) {
    color = 'bg-yellow-500';
    label = 'Bom fit para prospecção';
  } else if (score >= 40) {
    color = 'bg-yellow-500';
    label = 'Fit moderado';
  }
  
  return { score, label, color };
}

export function ExpandedCompanyCard({ company }: ExpandedCompanyCardProps) {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const receitaData = rawData.receita_federal || rawData.receita || {};
  const decisores = company.decision_makers || rawData.decision_makers || rawData.apollo_people || [];
  
  const description = apolloData.short_description || apolloData.description || company.description || rawData.description || rawData.company_details?.description || '';
  const fitScore = calculateFitScore(company);
  
  const logradouro = receitaData.logradouro || apolloData.street_address || '';
  const numero = receitaData.numero || '';
  const bairro = receitaData.bairro || '';
  const cidade = apolloData.city || receitaData.municipio || company.city || '';
  const uf = apolloData.state || receitaData.uf || company.state || '';
  const cep = receitaData.cep || apolloData.postal_code || '';
  const pais = apolloData.country || receitaData.pais || company.country || 'Brazil';
  const telefone = rawData.telefone1 || rawData.telefone || apolloData.phone || '';
  const email = rawData.email || apolloData.email || '';
  
  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current || typeof window === 'undefined') return;
      // @ts-ignore
      if (!window.L) return;
      // @ts-ignore
      const L = window.L;
      
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = undefined;
        mapRef.current.innerHTML = '';
      }
      
      let lat = -23.5505, lng = -46.6333;
      
      if (cep || (logradouro && cidade && uf)) {
        const endereco = cep ? `${cep}, Brazil` : `${logradouro} ${numero}, ${cidade}, ${uf}, Brazil`;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`, 
            { headers: { 'User-Agent': 'STRATEVO-Intelligence/1.0' } });
          const data = await response.json();
          if (data && data[0]) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (error) {
          console.warn('[MAP] Geocoding falhou', error);
        }
      }
      
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);
      
      L.marker([lat, lng]).addTo(map);
      
      return () => { if (map) map.remove(); };
    };
    
    loadMap();
  }, [cep, logradouro, cidade, uf]);

  return (
    <div className="bg-muted/30 p-0">
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          
          {/* ========== COLUNA ESQUERDA ========== */}
          <div className="space-y-4">
            
            {/* INFORMAÇÕES GERAIS */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informações Gerais
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{company.name || company.razao_social}</span>
                </div>
                {company.cnpj && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span className="font-mono text-xs">{company.cnpj}</span>
                  </div>
                )}
                {company.industry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Indústria:</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                )}
                {(apolloData.estimated_num_employees || receitaData.qsa_count) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funcionários:</span>
                    <Badge variant="secondary">
                      {apolloData.estimated_num_employees || receitaData.qsa_count}
                    </Badge>
                  </div>
                )}
                {company.source_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origem:</span>
                    <Badge variant="outline">{company.source_name}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* LOCALIZAÇÃO */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </h4>
              <div className="space-y-2 text-sm">
                {cidade && <p className="text-muted-foreground">{cidade}</p>}
                {uf && <p className="text-muted-foreground">{uf}</p>}
                {pais && <p className="font-medium">{pais}</p>}
              </div>
            </div>

            {/* DESCRIÇÃO */}
            {description && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            )}
            
            {!description && (
              <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 dark:text-yellow-500 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>💡 Esta descrição pode ser enriquecida via Apollo/LinkedIn</span>
              </div>
            )}
            
          </div>

          {/* ========== COLUNA DIREITA ========== */}
          <div className="space-y-4">
            
            {/* FIT SCORE */}
            {fitScore.score > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Fit Score
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${fitScore.color}`}
                        style={{ width: `${fitScore.score}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{fitScore.score}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{fitScore.label}</p>
              </div>
            )}

            {/* LINKS EXTERNOS */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Links Externos</h4>
              <div className="space-y-2">
                {company.domain && (
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
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
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-4 w-4 text-blue-500" />
                    <span>LinkedIn</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                )}
                {apolloData.organization_id && (
                  <a
                    href={`https://app.apollo.io/#/companies/${apolloData.organization_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <img src={apolloIcon} alt="Apollo" className="h-4 w-4" />
                    <span>Apollo.io</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                )}
              </div>
            </div>

            {/* DECISORES */}
            {decisores.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Decisores ({decisores.length})
                </h4>
                <div className="space-y-3">
                  {decisores.slice(0, 5).map((decisor: any, idx: number) => {
                    const fullName = decisor.name || `${decisor.first_name || ''} ${decisor.last_name || ''}`.trim();
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <p className="font-medium text-sm">{fullName}</p>
                        {decisor.title && (
                          <p className="text-xs text-muted-foreground">{decisor.title}</p>
                        )}
                        <div className="flex items-center gap-3">
                          {decisor.linkedin_url && (
                            <a
                              href={decisor.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <Linkedin className="h-3 w-3" />
                              LinkedIn
                            </a>
                          )}
                          {decisor.email && (
                            <a
                              href={`mailto:${decisor.email}`}
                              className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                            >
                              <Mail className="h-3 w-3" />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
          
        </div>

        {/* BOTÕES */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" size="sm"
                  onClick={() => navigate(`/company/${company.id}`)}>
            <Building2 className="h-4 w-4 mr-2" />
            Ver Detalhes Completos
          </Button>
          <Button size="sm"
                  onClick={() => navigate(`/company/${company.id}/strategy`)}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Criar Estratégia
          </Button>
        </div>

      </div>
    </div>
  );
}
