/**
 * Página de redirecionamento para Relatórios ICP
 * Redireciona para o relatório do ICP ativo
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useICPLibrary } from '@/hooks/useICPLibrary';
import { Loader2 } from 'lucide-react';

export default function CentralICPReportsRedirect() {
  const navigate = useNavigate();
  const { data: icpLibraryData, isLoading } = useICPLibrary();
  const activeICP = icpLibraryData?.activeICP;

  useEffect(() => {
    if (isLoading) return;

    if (!activeICP?.id) {
      // Se não houver ICP ativo, levar para /central-icp/profiles
      navigate('/central-icp/profiles', { replace: true });
      return;
    }

    navigate(`/central-icp/reports/${activeICP.id}?type=resumo`, {
      replace: true,
    });
  }, [isLoading, activeICP, navigate]);

  return (
    <div className="flex h-full items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Carregando relatórios do ICP...</p>
      </div>
    </div>
  );
}

