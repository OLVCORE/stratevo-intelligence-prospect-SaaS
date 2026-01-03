/**
 * Módulo de Prospecção Avançada
 * 
 * Motor de Busca Avançada para encontrar empresas ideais
 * com base em filtros específicos e enriquecimento de dados
 */

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const ProspeccaoAvancadaPage = lazy(() => import('./pages/ProspeccaoAvancadaPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function ProspeccaoAvancadaModule() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProspeccaoAvancadaPage />
    </Suspense>
  );
}

export default ProspeccaoAvancadaModule;

