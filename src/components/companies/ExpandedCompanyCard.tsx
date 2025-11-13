import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  MapPin,
  Globe,
  Target,
  Users,
  Shield,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  ExternalLink,
  Edit,
  Plus,
  Linkedin,
} from 'lucide-react';
import { TOTVSStatusBadge } from '@/components/totvs/TOTVSStatusBadge';

interface ExpandedCompanyCardProps {
  company: any;
}

export function ExpandedCompanyCard({ company }: ExpandedCompanyCardProps) {
  const navigate = useNavigate();
  const receitaData = company.raw_data?.receita_federal || company.raw_data?.receita || {};
  const decisores = company.decision_makers || company.raw_data?.decision_makers || [];
  const icpScore = company.icp_score || 0;
  const apolloOrg = company.raw_data?.apollo_organization || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-lg border border-slate-700/50">
      
      {/* ========== COLUNA ESQUERDA ========== */}
      <div className="space-y-4">
        
        {/* 1️⃣ IDENTIFICAÇÃO CADASTRAL */}
        <div className="p-4 bg-slate-800/60 rounded-lg border border-blue-500/30">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-400">
            <Shield className="h-4 w-4" />
            Identificação Cadastral
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400 text-xs block mb-1">Razão Social</span>
              <p className="font-medium text-white">{receitaData.razao_social || company.name || company.razao_social}</p>
            </div>
            {receitaData.fantasia && (
              <div>
                <span className="text-slate-400 text-xs block mb-1">Nome Fantasia</span>
                <p className="font-medium text-white">{receitaData.fantasia}</p>
              </div>
            )}
            {company.cnpj && (
              <div>
                <span className="text-slate-400 text-xs block mb-1">CNPJ</span>
                <p className="font-mono text-xs text-blue-400">{company.cnpj}</p>
              </div>
            )}
            {receitaData.situacao && (
              <div>
                <span className="text-slate-400 text-xs block mb-1">Situação</span>
                <Badge variant={receitaData.situacao === 'ATIVA' ? 'default' : 'destructive'} className="text-xs">
                  {receitaData.situacao}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* 2️⃣ LOCALIZAÇÃO COMPLETA */}
        <div className="p-4 bg-slate-800/60 rounded-lg border border-purple-500/30">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-400">
            <MapPin className="h-4 w-4" />
            Localização Completa
          </h4>
          <div className="space-y-2 text-sm">
            {receitaData.logradouro && (
              <p className="text-slate-300">
                {receitaData.logradouro}, {receitaData.numero || 'S/N'}
                {receitaData.complemento && ` - ${receitaData.complemento}`}
              </p>
            )}
            {receitaData.bairro && (
              <p className="text-slate-400">{receitaData.bairro}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {(receitaData.municipio || company.city) && (
                <span className="font-medium text-white">
                  {receitaData.municipio || company.city}
                </span>
              )}
              {(receitaData.uf || company.state) && (
                <Badge variant="outline" className="text-xs">
                  {receitaData.uf || company.state}
                </Badge>
              )}
              {receitaData.cep && (
                <span className="text-xs font-mono text-slate-400">
                  CEP: {receitaData.cep}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3️⃣ ATIVIDADE ECONÔMICA */}
        <div className="p-4 bg-slate-800/60 rounded-lg border border-cyan-500/30">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-cyan-400">
            <Briefcase className="h-4 w-4" />
            Atividade Econômica
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Setor:</span>
              <span className="font-medium text-white">{company.industry || receitaData.setor_amigavel || 'N/A'}</span>
            </div>
            {receitaData.cnae_fiscal && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">CNAE:</span>
                <span className="font-mono text-xs text-cyan-400">{receitaData.cnae_fiscal}</span>
              </div>
            )}
            {receitaData.porte && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Porte:</span>
                <Badge variant="secondary" className="text-xs">{receitaData.porte}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* 4️⃣ CONTATO */}
        {(company.raw_data?.melhor_telefone || company.raw_data?.emails_validados_departamentos) && (
          <div className="p-4 bg-slate-800/60 rounded-lg border border-green-500/30">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-400">
              <Phone className="h-4 w-4" />
              Informações de Contato
            </h4>
            <div className="space-y-2 text-sm">
              {company.raw_data?.melhor_telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <a href={`tel:${company.raw_data.melhor_telefone}`} className="text-green-400 hover:underline font-mono text-xs">
                    {company.raw_data.melhor_telefone}
                  </a>
                </div>
              )}
              {company.raw_data?.emails_validados_departamentos && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span className="text-green-400 text-xs">{company.raw_data.emails_validados_departamentos}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== COLUNA DIREITA ========== */}
      <div className="space-y-4">
        
        {/* 5️⃣ SCORE ICP */}
        {icpScore > 0 && (
          <div className="p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/40">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-300">
              <Target className="h-4 w-4" />
              Score ICP
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={icpScore} className="h-4" />
              </div>
              <span className="text-4xl font-bold text-blue-400">{icpScore}</span>
            </div>
            <p className="text-xs text-blue-300/70 mt-2">
              {icpScore >= 80 && '🟢 Excelente fit para ICP TOTVS'}
              {icpScore >= 60 && icpScore < 80 && '🟡 Bom fit para ICP'}
              {icpScore < 60 && '🟠 Fit moderado - avaliar critérios'}
            </p>
          </div>
        )}

        {/* 6️⃣ STATUS TOTVS */}
        <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-300">
            <Building2 className="h-4 w-4" />
            Verificação TOTVS
          </h4>
          <div className="flex items-center justify-center">
            <TOTVSStatusBadge
              status={company.totvs_status}
              confidence={company.totvs_confidence}
              size="lg"
              showDetails
            />
          </div>
        </div>

        {/* 7️⃣ LINKS EXTERNOS */}
        <div className="p-4 bg-slate-800/60 rounded-lg border border-indigo-500/30">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-indigo-400">
            <Globe className="h-4 w-4" />
            Links Externos
          </h4>
          <div className="space-y-2">
            {/* WEBSITE */}
            {company.website && (
              <div className="flex items-center justify-between group">
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="h-4 w-4" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/company/${company.id}`);
                  }}
                  title="Editar website"
                >
                  <Edit className="h-3 w-3 text-slate-400" />
                </Button>
              </div>
            )}
            
            {/* LINKEDIN */}
            {(company.linkedin_url || company.raw_data?.digital_presence?.linkedin) && (
              <div className="flex items-center justify-between group">
                <a
                  href={company.linkedin_url || company.raw_data?.digital_presence?.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/company/${company.id}`);
                  }}
                  title="Editar LinkedIn"
                >
                  <Edit className="h-3 w-3 text-slate-400" />
                </Button>
              </div>
            )}
            
            {/* APOLLO */}
            {(company.apollo_organization_id || apolloOrg.id) && (
              <div className="flex items-center justify-between group">
                <a
                  href={`https://app.apollo.io/#/organizations/${company.apollo_organization_id || apolloOrg.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img src="https://www.apollo.io/favicon.ico" className="h-4 w-4" alt="Apollo" />
                  Apollo.io
                  <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex items-center gap-2">
                  {company.enrichment_source === 'auto' && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30">
                      🤖 AUTO
                    </Badge>
                  )}
                  {company.enrichment_source === 'manual' && (
                    <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500/40">
                      ✅ VALIDADO
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/${company.id}`);
                    }}
                    title="Editar Apollo ID"
                  >
                    <Edit className="h-3 w-3 text-slate-400" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 8️⃣ DECISORES */}
        {decisores.length > 0 ? (
          <div className="p-4 bg-gradient-to-br from-emerald-900/30 to-blue-900/30 rounded-lg border border-emerald-500/40">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-400">
              <Users className="h-4 w-4" />
              Decisores ({decisores.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {decisores.slice(0, 5).map((dm: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-800/80 rounded border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                  <div className="font-medium text-sm text-white">{dm.name || dm.full_name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{dm.title || dm.position}</div>
                  <div className="flex gap-3 mt-2">
                    {dm.email && (
                      <a
                        href={`mailto:${dm.email}`}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </a>
                    )}
                    {dm.phone && (
                      <a
                        href={`tel:${dm.phone}`}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3 w-3" />
                        Tel
                      </a>
                    )}
                    {dm.linkedin_url && (
                      <a
                        href={dm.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Linkedin className="h-3 w-3" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {decisores.length > 5 && (
                <p className="text-xs text-center text-slate-400 mt-2 pt-2 border-t border-slate-700">
                  + {decisores.length - 5} decisores • 
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/${company.id}`);
                    }}
                    className="text-emerald-400 hover:underline ml-1"
                  >
                    Ver todos
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/50 text-center">
            <p className="text-xs text-slate-400 mb-3">Nenhum decisor cadastrado</p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/company/${company.id}`);
              }}
            >
              <Plus className="h-3 w-3 mr-1.5" />
              Buscar Decisores no Apollo
            </Button>
          </div>
        )}

        {/* 9️⃣ FINANCEIRO */}
        {receitaData.capital_social && (
          <div className="p-4 bg-slate-800/60 rounded-lg border border-yellow-500/30">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-400">
              <DollarSign className="h-4 w-4" />
              Informações Financeiras
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400 text-xs block mb-1">Capital Social</span>
                <p className="font-bold text-green-400">
                  R$ {parseFloat(receitaData.capital_social).toLocaleString('pt-BR')}
                </p>
              </div>
              {receitaData.porte && (
                <div>
                  <span className="text-slate-400 text-xs block mb-1">Porte</span>
                  <Badge variant="secondary" className="text-xs">{receitaData.porte}</Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== AÇÕES RÁPIDAS (RODAPÉ) ========== */}
      <div className="lg:col-span-2 flex justify-center gap-3 pt-6 border-t border-slate-700/50">
        <Button
          variant="default"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/company/${company.id}`);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Ver Detalhes Completos
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/account-strategy?company=${company.id}`);
          }}
          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
        >
          <Target className="h-4 w-4 mr-2" />
          Criar Estratégia
        </Button>
      </div>
    </div>
  );
}

