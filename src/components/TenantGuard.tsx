// src/components/TenantGuard.tsx
// Componente que verifica se o usuário tem tenant e redireciona para onboarding se necessário

import React from 'react';
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
  const { tenant, loading: tenantLoading, error, switchTenant } = useTenant();
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

  // 🔥 BUG 1 FIX: Tentar carregar tenant do localStorage se não estiver carregado
  // Usar useRef para rastrear tentativas e evitar loops infinitos
  const attemptedLoadRef = React.useRef(false);
  const switchTenantRef = React.useRef(switchTenant);
  
  // Atualizar ref quando switchTenant mudar
  React.useEffect(() => {
    switchTenantRef.current = switchTenant;
  }, [switchTenant]);
  
  React.useEffect(() => {
    if (tenant || tenantLoading || attemptedLoadRef.current) return; // Já tem tenant ou já tentou carregar
    
    const localTenantId = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('selectedTenantId') 
      : null;
    
    if (!localTenantId) return; // Não há tenant no localStorage
    
    let timeoutId: NodeJS.Timeout;
    attemptedLoadRef.current = true; // Marcar como tentado usando ref (não state)
    
    const tryLoadTenant = async () => {
      try {
        console.log('[TenantGuard] 🔄 Tentando carregar tenant do localStorage:', localTenantId);
        await switchTenantRef.current(localTenantId);
      } catch (err) {
        console.error('[TenantGuard] ❌ Erro ao carregar tenant do localStorage:', err);
        // Se falhar após 3 segundos, redirecionar para onboarding
        timeoutId = setTimeout(() => {
          console.log('[TenantGuard] ⏱️ Timeout: redirecionando para onboarding após falha ao carregar tenant');
          window.location.href = '/tenant-onboarding';
        }, 3000);
      }
    };
    
    tryLoadTenant();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [tenant, tenantLoading]); // 🔥 BUG 1 FIX: Removido attemptedLoad e switchTenant das dependências

  // 🔥 BUG 1 FIX: Se não tiver tenant e não está mais carregando, redirecionar para onboarding
  if (!tenant && !tenantLoading) {
    // 🔥 CRÍTICO: Verificar se há tenant no localStorage antes de redirecionar
    const localTenantId = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('selectedTenantId') 
      : null;
    
    if (!localTenantId) {
      // Só redirecionar se realmente não há tenant
      console.log('[TenantGuard] ❌ Sem tenant e sem localStorage, redirecionando para onboarding');
      return <Navigate to="/tenant-onboarding" replace />;
    }
    
    // Se há tenant no localStorage mas ainda não foi carregado, mostrar loader
    // (o useEffect acima tentará carregá-lo)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando workspace...</span>
      </div>
    );
  }

  // Se tiver tenant, permitir acesso
  return <>{children}</>;
}

