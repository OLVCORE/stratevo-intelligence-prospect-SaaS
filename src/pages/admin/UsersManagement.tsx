// src/pages/admin/UsersManagement.tsx
// Página para gerenciar usuários dentro de um tenant

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Mail, UserX, Shield, User, Eye, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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

interface TenantUser {
  id: string;
  email: string;
  nome: string;
  role: 'OWNER' | 'ADMIN' | 'USER' | 'VIEWER';
  created_at: string;
}

const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  STARTER: 2,
  GROWTH: 5,
  ENTERPRISE: 999999, // Ilimitado
};

export default function UsersManagement() {
  const { tenant } = useTenant();
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'USER' | 'VIEWER'>('USER');
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      loadUsers();
    }
  }, [tenant]);

  const loadUsers = async () => {
    if (!tenant?.id) return;

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const checkUserLimit = (): boolean => {
    if (!tenant) return false;
    
    const limit = PLAN_LIMITS[tenant.plano] || 1;
    const currentCount = users.length;
    
    return currentCount < limit;
  };

  const handleInvite = async () => {
    if (!tenant || !inviteEmail) return;

    // Validar limite
    if (!checkUserLimit()) {
      const limit = PLAN_LIMITS[tenant.plano] || 1;
      toast.error(`Limite de usuários atingido! Seu plano ${tenant.plano} permite apenas ${limit} usuário(s). Faça upgrade para adicionar mais.`);
      return;
    }

    setInviting(true);
    try {
      // TODO: Implementar sistema de convite real (enviar email)
      // Por enquanto, apenas criar usuário diretamente
      
      // Verificar se email já existe
      const { data: existingUser } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('email', inviteEmail)
        .single();

      if (existingUser) {
        toast.error('Este email já está cadastrado nesta empresa');
        return;
      }

      // Criar usuário (sem auth_user_id ainda - será vinculado quando aceitar convite)
      const { error } = await (supabase as any)
        .from('users')
        .insert({
          tenant_id: tenant.id,
          email: inviteEmail,
          nome: inviteEmail.split('@')[0],
          role: inviteRole,
        });

      if (error) throw error;

      toast.success(`Convite enviado para ${inviteEmail}`);
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('USER');
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao convidar usuário:', error);
      toast.error(error.message || 'Erro ao convidar usuário');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!tenant) return;

    try {
      const { error } = await (supabase as any)
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      toast.success('Usuário removido com sucesso');
      setRemovingUserId(null);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!tenant) return;

    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      toast.success('Permissão atualizada');
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
    }
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, any> = {
      OWNER: Crown,
      ADMIN: Shield,
      USER: User,
      VIEWER: Eye,
    };
    return icons[role] || User;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      OWNER: 'Proprietário',
      ADMIN: 'Administrador',
      USER: 'Usuário',
      VIEWER: 'Visualizador',
    };
    return labels[role] || role;
  };

  const currentUser = users.find(u => u.email === authUser?.email);
  const canManageUsers = currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';
  const userLimit = tenant ? PLAN_LIMITS[tenant.plano] || 1 : 1;
  const currentUserCount = users.length;
  const canAddMore = currentUserCount < userLimit;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground text-center">
            Apenas proprietários e administradores podem gerenciar usuários
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Convidar e gerenciar usuários da empresa {tenant?.nome}
          </p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          disabled={!canAddMore}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limite de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Plano atual: <strong>{tenant?.plano}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Usuários: <strong>{currentUserCount} / {userLimit === 999999 ? 'Ilimitado' : userLimit}</strong>
              </p>
            </div>
            {!canAddMore && (
              <Button variant="outline" onClick={() => window.location.href = '/plans'}>
                Fazer Upgrade
              </Button>
            )}
          </div>
          {!canAddMore && (
            <p className="text-sm text-destructive mt-2">
              Limite de usuários atingido. Faça upgrade do plano para adicionar mais usuários.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários da Empresa</CardTitle>
          <CardDescription>
            {users.length} usuário(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => {
              const RoleIcon = getRoleIcon(user.role);
              const isCurrentUser = user.email === authUser?.email;
              const canEdit = canManageUsers && !isCurrentUser;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <RoleIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.nome}</p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleChangeRole(user.id, value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER">Proprietário</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                        <SelectItem value="USER">Usuário</SelectItem>
                        <SelectItem value="VIEWER">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemovingUserId(user.id)}
                      >
                        <UserX className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Convite */}
      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convidar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Envie um convite para adicionar um novo usuário à empresa. O usuário receberá um email com instruções.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@empresa.com.br"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="role">Permissão</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="VIEWER">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleInvite} disabled={inviting || !inviteEmail}>
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Remoção */}
      <AlertDialog open={!!removingUserId} onOpenChange={() => setRemovingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingUserId && handleRemoveUser(removingUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

