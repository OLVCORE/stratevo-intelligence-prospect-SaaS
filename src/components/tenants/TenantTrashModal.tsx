// src/components/tenants/TenantTrashModal.tsx
// Modal de Lixeira de Tenants - Permite restaurar ou deletar permanentemente

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  Loader2,
  Building2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DeletedTenant {
  id: string;
  nome: string;
  cnpj: string;
  plano: string;
  deleted_at: string;
  expires_at: string;
  days_until_expiry: number;
}

interface TenantTrashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTenantRestored?: () => void;
}

export function TenantTrashModal({ open, onOpenChange, onTenantRestored }: TenantTrashModalProps) {
  const [deletedTenants, setDeletedTenants] = useState<DeletedTenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeletedTenant | null>(null);

  useEffect(() => {
    if (open) {
      loadDeletedTenants();
    }
  }, [open]);

  const loadDeletedTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc('list_deleted_tenants');
      
      if (error) {
        // Se a função não existir, mostrar mensagem
        if (error.message?.includes('does not exist')) {
          console.warn('[TenantTrash] Função list_deleted_tenants não existe ainda');
          setDeletedTenants([]);
          return;
        }
        throw error;
      }
      
      setDeletedTenants(data || []);
    } catch (error: any) {
      console.error('[TenantTrash] Erro ao carregar lixeira:', error);
      toast.error('Erro ao carregar lixeira');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (tenant: DeletedTenant) => {
    setActionLoading(tenant.id);
    try {
      const { data, error } = await (supabase as any).rpc('restore_tenant', {
        p_deleted_id: tenant.id
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`"${tenant.nome}" restaurado com sucesso!`);
        loadDeletedTenants();
        onTenantRestored?.();
      } else {
        toast.error(data?.error || 'Erro ao restaurar');
      }
    } catch (error: any) {
      console.error('[TenantTrash] Erro ao restaurar:', error);
      toast.error('Erro ao restaurar empresa');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (tenant: DeletedTenant) => {
    setActionLoading(tenant.id);
    try {
      const { data, error } = await (supabase as any).rpc('permanent_delete_tenant', {
        p_deleted_id: tenant.id
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`"${tenant.nome}" deletado permanentemente`);
        setConfirmDelete(null);
        loadDeletedTenants();
      } else {
        toast.error(data?.error || 'Erro ao deletar');
      }
    } catch (error: any) {
      console.error('[TenantTrash] Erro ao deletar permanentemente:', error);
      toast.error('Erro ao deletar empresa');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj?.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') || cnpj;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Lixeira de Empresas
            </DialogTitle>
            <DialogDescription>
              Empresas deletadas ficam aqui por 30 dias antes de serem removidas permanentemente.
              Você pode restaurá-las ou deletá-las definitivamente.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : deletedTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Lixeira vazia</h3>
              <p className="text-muted-foreground">
                Nenhuma empresa deletada encontrada.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedTenants.map((tenant) => (
                <Card 
                  key={tenant.id}
                  className={cn(
                    "border-l-4",
                    tenant.days_until_expiry <= 7 
                      ? "border-l-destructive bg-destructive/5" 
                      : "border-l-amber-500 bg-amber-500/5"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{tenant.nome}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          CNPJ: {formatCNPJ(tenant.cnpj)}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <Badge variant="outline">{tenant.plano}</Badge>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Deletado em {formatDate(tenant.deleted_at)}
                          </span>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-xs mt-2",
                          tenant.days_until_expiry <= 7 ? "text-destructive" : "text-amber-600"
                        )}>
                          <AlertTriangle className="h-3 w-3" />
                          {tenant.days_until_expiry > 0 
                            ? `Expira em ${tenant.days_until_expiry} dias`
                            : "Expira hoje!"
                          }
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(tenant)}
                          disabled={actionLoading === tenant.id}
                          className="border-green-500 text-green-600 hover:bg-green-500/10"
                        >
                          {actionLoading === tenant.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restaurar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setConfirmDelete(tenant)}
                          disabled={actionLoading === tenant.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de deleção permanente */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Deletar Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja deletar <strong>"{confirmDelete?.nome}"</strong> permanentemente?
              </p>
              <p className="text-destructive font-semibold">
                ⚠️ Esta ação é IRREVERSÍVEL. Todos os dados serão perdidos para sempre.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handlePermanentDelete(confirmDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading === confirmDelete?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

