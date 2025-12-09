import { useNavigate } from 'react-router-dom';
import { useICPLibrary } from '@/hooks/useICPLibrary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Building2, ChevronLeft, Eye, Star } from 'lucide-react';

/**
 * Página da Biblioteca de ICPs
 * MC1[ui]: Lista todos os ICPs do tenant com destaque para o principal
 */
export default function ICPLibrary() {
  const navigate = useNavigate();
  const { data: libraryData, isLoading } = useICPLibrary();

  console.log('MC1[ui]: biblioteca de ICPs exibida', {
    totalICPs: libraryData?.data.length || 0,
    activeICP: libraryData?.activeICP?.nome,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando biblioteca de ICPs...</span>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            Biblioteca de ICPs
          </h1>
          <p className="text-muted-foreground mt-1">
            {libraryData.data.length} ICP{libraryData.data.length !== 1 ? 's' : ''} cadastrado{libraryData.data.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grid de ICPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {libraryData.data.map((profile) => {
          const isActive = profile.id === libraryData.activeICP?.id;
          
          return (
            <Card
              key={profile.id}
              className={`border-l-4 transition-all duration-200 ${
                isActive
                  ? 'border-l-indigo-600/90 shadow-md bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30'
                  : 'border-l-slate-300 dark:border-l-slate-700 hover:shadow-md'
              }`}
            >
              <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className={`h-5 w-5 ${isActive ? 'text-indigo-700 dark:text-indigo-500' : 'text-slate-600 dark:text-slate-400'}`} />
                      <CardTitle className={`text-lg ${isActive ? 'text-indigo-800 dark:text-indigo-100' : ''}`}>
                        {profile.nome}
                      </CardTitle>
                    </div>
                    {profile.descricao && (
                      <CardDescription className="line-clamp-2">{profile.descricao}</CardDescription>
                    )}
                  </div>
                  {isActive && (
                    <Star className="h-5 w-5 text-indigo-600 fill-indigo-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.icp_principal && (
                    <Badge className="bg-indigo-600/90 text-white text-[10px]">Principal</Badge>
                  )}
                  {profile.ativo && (
                    <Badge className="bg-emerald-600/90 text-white text-[10px]">Ativo</Badge>
                  )}
                  {profile.tipo && (
                    <Badge variant="outline" className="text-[10px]">{profile.tipo}</Badge>
                  )}
                </div>
                
                {(profile.setor_foco || profile.nicho_foco) && (
                  <div className="space-y-1">
                    {profile.setor_foco && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Setor:</span> {profile.setor_foco}
                      </p>
                    )}
                    {profile.nicho_foco && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Nicho:</span> {profile.nicho_foco}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/central-icp/profile/${profile.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {isActive && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate('/central-icp/active')}
                    >
                      Ver Ativo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/central-icp/active')}>
              Ver ICP Ativo
            </Button>
            <Button variant="outline" onClick={() => navigate('/tenant-onboarding')}>
              Criar Novo ICP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

