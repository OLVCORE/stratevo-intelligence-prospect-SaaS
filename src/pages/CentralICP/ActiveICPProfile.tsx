import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantICP } from '@/hooks/useTenantICP';
import { useICPLibrary } from '@/hooks/useICPLibrary';
import { ICPExecutiveSummary } from '@/components/icp/ICPExecutiveSummary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, ChevronLeft, BookOpen } from 'lucide-react';

/**
 * Página do ICP Ativo
 * MC1[ui]: Exibe o ICP principal/ativo com resumo executivo completo
 */
export default function ActiveICPProfile() {
  const navigate = useNavigate();
  const [selectedIcpId, setSelectedIcpId] = useState<string | undefined>(undefined);
  
  const { data: libraryData, isLoading: libraryLoading } = useICPLibrary();
  const icp = useTenantICP(selectedIcpId);

  console.log('MC1[ui]: painel ICP ativo montado', {
    icpId: selectedIcpId || libraryData?.activeICP?.id,
    icpNome: selectedIcpId ? libraryData?.data.find(p => p.id === selectedIcpId)?.nome : libraryData?.activeICP?.nome,
  });

  // Usar ICP selecionado ou ICP ativo da biblioteca
  const currentIcpId = selectedIcpId || libraryData?.activeICP?.id;
  const currentIcp = icp;

  const handleIcpChange = (icpId: string) => {
    console.log(`MC1[ui]: ICP selecionado na biblioteca = ${icpId}`);
    setSelectedIcpId(icpId);
  };

  if (libraryLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando ICP...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!libraryData || libraryData.data.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhum ICP Encontrado</CardTitle>
            <CardDescription>Você ainda não possui ICPs cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/tenant-onboarding')}>
              Criar Primeiro ICP
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              ICP – Perfil Ideal
            </h1>
            <p className="text-muted-foreground mt-1">
              Retrato vivo do ICP ativo com inteligência mercadológica consolidada
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/central-icp/library')}>
            <BookOpen className="h-4 w-4 mr-2" />
            Biblioteca de ICPs
          </Button>
        </div>
      </div>

      {/* Seletor de ICP */}
      {libraryData.data.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecionar ICP</CardTitle>
            <CardDescription>Escolha qual ICP visualizar</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={currentIcpId || ''}
              onValueChange={handleIcpChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um ICP" />
              </SelectTrigger>
              <SelectContent>
                {libraryData.data.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      <span>{profile.nome}</span>
                      {profile.icp_principal && (
                        <span className="text-xs text-muted-foreground">(Principal)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Resumo Executivo */}
      {currentIcp && (
        <>
          {currentIcp.isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Carregando dados do ICP...</span>
                </div>
              </CardContent>
            </Card>
          ) : currentIcp.error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-destructive">Erro ao carregar ICP: {currentIcp.error.message}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ICPExecutiveSummary icp={currentIcp} />
          )}
        </>
      )}

      {/* Link para ver detalhes completos */}
      {currentIcpId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Para ver todos os detalhes, análises completas e editar o ICP
              </p>
              <Button onClick={() => navigate(`/central-icp/profile/${currentIcpId}`)}>
                Ver Detalhes Completos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

