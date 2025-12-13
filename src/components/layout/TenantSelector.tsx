// src/components/layout/TenantSelector.tsx
// [HF-STRATEVO-TENANT] Arquivo mapeado para fluxo de tenants/empresas
// Seletor para trocar entre múltiplos tenants (CNPJs)
// ✅ USANDO HOOK useUserTenants (RPC get_user_tenants_complete)

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useUserTenants, type UserTenant } from '@/hooks/useUserTenants';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Building2, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TenantSelector() {
  const { tenant: currentTenant, setTenant, switchTenant } = useTenant();
  const { tenants, loading, error, refetch } = useUserTenants();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // 🔥 BUG 2 FIX: Refetch quando tenant é atualizado - usar ref para evitar loops infinitos
  const refetchRef = React.useRef(refetch);
  
  // Atualizar ref quando refetch mudar
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  
  useEffect(() => {
    const handleTenantUpdated = () => {
      console.log('[TenantSelector] Tenant atualizado, refetchando...');
      // Usar ref ao invés de refetch diretamente para evitar dependência circular
      refetchRef.current();
    };

    window.addEventListener('tenant-updated', handleTenantUpdated);
    return () => {
      window.removeEventListener('tenant-updated', handleTenantUpdated);
    };
  }, []); // 🔥 BUG 2 FIX: Array vazio - não depende de refetch para evitar loops

  // [HF-STRATEVO-TENANT] Converter UserTenant para formato do TenantContext
  const convertToTenantContext = (userTenant: UserTenant) => {
    return {
      id: userTenant.id,
      slug: '',
      nome: userTenant.nome || userTenant.name || '',
      cnpj: userTenant.cnpj || '',
      email: userTenant.email || '',
      telefone: '',
      schema_name: '',
      plano: (userTenant.plano || 'FREE') as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
      status: (userTenant.status || 'ACTIVE') as 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
      creditos: userTenant.creditos || 0,
      data_expiracao: userTenant.data_expiracao || undefined,
      created_at: userTenant.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleChangeTenant = async (tenantId: string) => {
    const selected = tenants.find(t => t.id === tenantId);
    if (!selected) {
      console.warn('[HF-STRATEVO-TENANT] TenantSelector -> tenant não encontrado:', tenantId);
      return;
    }

    console.log('[HF-STRATEVO-TENANT] TenantSelector -> handleChangeTenant', selected);
    
    // 🔥 CORRIGIDO: Usar switchTenant ao invés de setTenant (seguindo melhores práticas)
    // switchTenant já faz tudo: busca dados completos, atualiza contexto, localStorage e dispara eventos
    if (switchTenant) {
      try {
        await switchTenant(tenantId);
        console.log('[HF-STRATEVO-TENANT] ✅ Tenant mudado via switchTenant:', selected.nome);
        
        // Refetch lista de tenants para garantir sincronização
        await refetch();
        
        setOpen(false);
        return;
      } catch (err) {
        console.error('[HF-STRATEVO-TENANT] ❌ Erro ao mudar tenant via switchTenant:', err);
        // Fallback para método antigo se switchTenant falhar
      }
    }
    
    // FALLBACK: Método antigo (caso switchTenant não esteja disponível)
    // Buscar dados completos do tenant via RPC se necessário
    let tenantObj;
    try {
      const { data: tenantData, error: rpcError } = await (supabase as any).rpc('get_tenant_safe', {
          p_tenant_id: tenantId,
        });

      if (!rpcError && tenantData && tenantData.length > 0) {
        const fullTenant = tenantData[0];
        tenantObj = {
          id: fullTenant.id,
          slug: fullTenant.slug || '',
          nome: fullTenant.nome || fullTenant.name || '',
          cnpj: fullTenant.cnpj || '',
          email: fullTenant.email || '',
          telefone: fullTenant.telefone || '',
          schema_name: fullTenant.schema_name || '',
          plano: (fullTenant.plano || 'FREE') as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
          status: (fullTenant.status || 'ACTIVE') as 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
          creditos: fullTenant.creditos || 0,
          data_expiracao: fullTenant.data_expiracao || undefined,
          created_at: fullTenant.created_at || new Date().toISOString(),
          updated_at: fullTenant.updated_at || new Date().toISOString(),
        };
        console.log('[HF-STRATEVO-TENANT] Tenant atualizado via setTenant (RPC):', tenantObj.nome);
      } else {
        // Fallback: usar dados do hook
        tenantObj = convertToTenantContext(selected);
        console.log('[HF-STRATEVO-TENANT] Tenant atualizado via setTenant (hook):', tenantObj.nome);
      }
    } catch (err) {
      console.warn('[HF-STRATEVO-TENANT] Erro ao buscar tenant completo, usando dados do hook:', err);
      tenantObj = convertToTenantContext(selected);
    }

    // 🔥 CRÍTICO: Atualizar tenant no contexto
    setTenant(tenantObj);
    
    // 🔥 CRÍTICO: Disparar evento para que OnboardingWizard e outros componentes recarreguem dados
    window.dispatchEvent(new CustomEvent('tenant-changed', { 
      detail: { 
        tenantId: tenantObj.id, 
        nome: tenantObj.nome,
        tenant: tenantObj 
      } 
    }));
    
    // 🔥 CRÍTICO: Disparar evento para refetch de lista de tenants
    window.dispatchEvent(new CustomEvent('tenant-updated', { 
      detail: { tenantId: tenantObj.id } 
    }));

    setOpen(false);
  };

  // Normalizar nome para exibição
  const getTenantName = (t: UserTenant) => t.nome || t.name || 'Empresa';
  const getTenantCnpj = (t: UserTenant) => t.cnpj || '';

  // Determinar tenant atual para exibição
  // 🔥 CRÍTICO: Priorizar currentTenant do contexto (pode estar mais atualizado que a lista)
  const displayTenant = currentTenant 
    ? (tenants.find(t => t.id === currentTenant.id) || {
        // Fallback: usar currentTenant diretamente se não encontrado na lista
        id: currentTenant.id,
        nome: currentTenant.nome,
        name: currentTenant.nome,
        cnpj: currentTenant.cnpj,
        email: currentTenant.email,
        plano: currentTenant.plano,
        status: currentTenant.status,
        creditos: currentTenant.creditos,
        data_expiracao: currentTenant.data_expiracao,
        created_at: currentTenant.created_at,
      })
    : (tenants.length > 0 ? tenants[0] : null);

  if (error) {
    console.warn('[TenantSelector] Erro ao carregar tenants:', error);
  }

  return (
    <div className="flex items-center gap-2 min-w-[240px] h-10 flex-shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[300px] max-w-[600px] h-10 px-3 py-2 justify-start text-left hover:text-foreground"
            disabled={loading}
          >
            <Building2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-medium text-sm whitespace-nowrap truncate">
                {displayTenant 
                  ? getTenantName(displayTenant)
                  : currentTenant?.nome 
                  ? currentTenant.nome
                  : loading 
                  ? 'Carregando...' 
                  : 'Selecionar empresa'}
              </span>
              {(displayTenant?.cnpj || currentTenant?.cnpj) && (
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {(displayTenant?.cnpj || currentTenant?.cnpj || '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                </span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[500px] p-1 bg-background border shadow-lg z-[999999]" 
          align="start"
          style={{ zIndex: 999999 }}
        >
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando empresas...
              </div>
            )}
            
            {!loading && error && (
              <div className="py-6 text-center text-sm text-destructive">
                Erro ao carregar empresas
              </div>
            )}
            
            {!loading && !error && tenants.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma empresa disponível
              </div>
            )}

            {!loading && !error && tenants.length > 0 && (
              <div className="space-y-1">
                {tenants.map((t) => {
                  const isSelected = t.id === (currentTenant?.id || displayTenant?.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleChangeTenant(t.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isSelected ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                      <Building2 className="h-4 w-4 flex-shrink-0 text-primary" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{getTenantName(t)}</span>
                        {getTenantCnpj(t) && (
                        <span className="text-xs text-muted-foreground truncate">
                            {getTenantCnpj(t).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                        </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/my-companies')}
        title="Gerenciar empresas"
        className="h-9 w-9"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
