// src/components/TenantGuard.tsx
// Componente que verifica se o usuário tem tenant e redireciona para onboarding se necessário

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

interface TenantGuardProps {
  children: React.ReactNode;
}

/**
 * TenantGuard: Verifica se o usuário autenticado tem um tenant.
 * Se não tiver, redireciona para o onboarding.
 * Se tiver, permite acesso ao conteúdo protegido.
 */
export function TenantGuard({ children }: TenantGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading, error } = useTenant();
  const location = useLocation();

  // Aguardar carregamento do auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver nas páginas de onboarding, permitir acesso SEM verificar tenant
  if (location.pathname === '/tenant-onboarding' || location.pathname === '/tenant-onboarding-intro') {
    return <>{children}</>;
  }

  // Aguardar carregamento do tenant
  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando workspace...</span>
      </div>
    );
  }

  // Se não tiver tenant, redirecionar para onboarding
  if (!tenant) {
    return <Navigate to="/tenant-onboarding" replace />;
  }

  // Se tiver tenant, permitir acesso
  return <>{children}</>;
}

