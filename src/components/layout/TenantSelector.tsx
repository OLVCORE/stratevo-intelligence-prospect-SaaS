// src/components/layout/TenantSelector.tsx
// Seletor para trocar entre múltiplos tenants (CNPJs)

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TenantOption {
  id: string;
  nome: string;
  cnpj: string;
}

export function TenantSelector() {
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTenants();
  }, [user]);

  const loadTenants = async () => {
    if (!user?.id) return;

    try {
      const { data: userData, error } = await (supabase as any)
        .from('users')
        .select('tenant_id, tenants(id, nome, cnpj)')
        .eq('auth_user_id', user.id);

      if (error) {
        // Não logar erro se a tabela não existir ainda (usuário sem tenant)
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Erro ao carregar tenants:', error);
        }
        return;
      }

      if (!userData || userData.length === 0) {
        setTenants([]);
        return;
      }

      const tenantList = userData
        ?.map((u: any) => u.tenants)
        .filter(Boolean)
        .map((t: any) => ({
          id: t.id,
          nome: t.nome,
          cnpj: t.cnpj,
        })) || [];

      setTenants(tenantList);
    } catch (error: any) {
      // Ignorar erros de tabela não encontrada (usuário ainda não tem tenant)
      if (error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Erro:', error);
      }
    }
  };

  const handleSwitchTenant = async (tenantId: string) => {
    if (!user?.id || tenantId === currentTenant?.id) return;

    try {
      setLoading(true);
      
      // 🆕 Apenas salvar a preferência no localStorage (não atualiza banco!)
      // O sistema multi-tenant permite múltiplos registros por usuário
      localStorage.setItem('selectedTenantId', tenantId);
      
      console.log('[TenantSelector] ✅ Trocando para tenant:', tenantId);
      toast.success('Empresa alterada! Recarregando...');
      
      // Recarregar página para aplicar novo tenant
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 300);
    } catch (error: any) {
      console.error('Erro ao trocar empresa:', error);
      toast.error('Erro ao trocar empresa');
    } finally {
      setLoading(false);
    }
  };

  if (tenants.length <= 1) {
    // Se tiver apenas 1 tenant ou nenhum, não mostrar seletor
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentTenant?.id || ''}
        onValueChange={handleSwitchTenant}
        disabled={loading}
      >
        <SelectTrigger className="min-w-[200px] max-w-[320px] h-auto min-h-9 py-1">
          <div className="flex items-center gap-2 text-left">
            <Building2 className="h-4 w-4 shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-sm truncate max-w-[250px]">
                {currentTenant?.nome || 'Selecionar empresa'}
              </span>
              {currentTenant?.cnpj && (
                <span className="text-xs text-muted-foreground">
                  {currentTenant.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                </span>
              )}
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="min-w-[320px]">
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex flex-col">
                <span className="font-medium">{t.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {t.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

