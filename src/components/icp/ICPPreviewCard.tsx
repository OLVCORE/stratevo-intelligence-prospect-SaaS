import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Building2, 
  MapPin, 
  TrendingUp,
  ExternalLink,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ICPPreviewCardProps {
  icp: {
    id: string;
    nome: string;
    descricao?: string;
    tipo?: string;
    setor_foco?: string;
    nicho_foco?: string;
    setores_alvo?: string[];
    porte_alvo?: string[];
    estados_alvo?: string[];
    regioes_alvo?: string[];
    faturamento_min?: number;
    faturamento_max?: number;
    funcionarios_min?: number;
    funcionarios_max?: number;
    icp_principal?: boolean;
    ativo?: boolean;
  };
  compact?: boolean;
}

export function ICPPreviewCard({ icp, compact = false }: ICPPreviewCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (compact) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{icp.nome}</span>
          </div>
          {icp.icp_principal && (
            <Badge variant="default" className="bg-emerald-600 h-5 text-[10px]">
              <Award className="w-3 h-3 mr-1" />
              Principal
            </Badge>
          )}
        </div>
        
        {icp.descricao && (
          <p className="text-xs text-muted-foreground">{icp.descricao}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {icp.setor_foco && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-emerald-600" />
              <span className="truncate">{icp.setor_foco}</span>
            </div>
          )}
          {icp.estados_alvo && icp.estados_alvo.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-sky-600" />
              <span className="truncate">{icp.estados_alvo.length} estados</span>
            </div>
          )}
          {icp.porte_alvo && icp.porte_alvo.length > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              <span className="truncate">{icp.porte_alvo[0]}</span>
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs h-7"
          onClick={() => navigate(`/central-icp/view/${icp.id}`)}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Ver perfil completo
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-indigo-600">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-100">
              <Target className="h-5 w-5" />
              {icp.nome}
            </CardTitle>
            {icp.descricao && (
              <CardDescription className="mt-2">{icp.descricao}</CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {icp.icp_principal && (
              <Badge variant="default" className="bg-emerald-600">
                <Award className="w-3 h-3 mr-1" />
                Principal
              </Badge>
            )}
            {icp.ativo !== undefined && (
              <Badge variant={icp.ativo ? "default" : "secondary"} className={icp.ativo ? "bg-sky-600" : ""}>
                {icp.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setor e Nicho */}
        {(icp.setor_foco || icp.nicho_foco) && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Setor e Nicho
            </h4>
            <div className="flex flex-wrap gap-2">
              {icp.setor_foco && (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 border-emerald-300">
                  {icp.setor_foco}
                </Badge>
              )}
              {icp.nicho_foco && (
                <Badge variant="outline" className="bg-sky-50 dark:bg-sky-950 border-sky-300">
                  {icp.nicho_foco}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Setores Alvo */}
        {icp.setores_alvo && icp.setores_alvo.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Setores Alvo ({icp.setores_alvo.length})</p>
            <div className="flex flex-wrap gap-1">
              {icp.setores_alvo.slice(0, 3).map((setor, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px]">
                  {setor}
                </Badge>
              ))}
              {icp.setores_alvo.length > 3 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{icp.setores_alvo.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Localização */}
        {((icp.estados_alvo && icp.estados_alvo.length > 0) || (icp.regioes_alvo && icp.regioes_alvo.length > 0)) && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </h4>
            <div className="space-y-1 text-sm">
              {icp.estados_alvo && icp.estados_alvo.length > 0 && (
                <p>Estados: <span className="font-semibold">{icp.estados_alvo.join(', ')}</span></p>
              )}
              {icp.regioes_alvo && icp.regioes_alvo.length > 0 && (
                <p>Regiões: <span className="font-semibold">{icp.regioes_alvo.join(', ')}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Porte e Faturamento */}
        {(icp.porte_alvo || icp.faturamento_min || icp.faturamento_max || icp.funcionarios_min || icp.funcionarios_max) && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Porte e Faturamento
            </h4>
            <div className="space-y-1 text-sm">
              {icp.porte_alvo && icp.porte_alvo.length > 0 && (
                <p>Porte: <span className="font-semibold">{icp.porte_alvo.join(', ')}</span></p>
              )}
              {(icp.faturamento_min || icp.faturamento_max) && (
                <p>
                  Faturamento: 
                  <span className="font-semibold"> {formatCurrency(icp.faturamento_min)} - {formatCurrency(icp.faturamento_max)}</span>
                </p>
              )}
              {(icp.funcionarios_min || icp.funcionarios_max) && (
                <p>
                  Funcionários: 
                  <span className="font-semibold"> {icp.funcionarios_min || 'N/A'} - {icp.funcionarios_max || 'N/A'}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate(`/central-icp/view/${icp.id}`)}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver perfil completo e critérios de pontuação
        </Button>
      </CardContent>
    </Card>
  );
}

