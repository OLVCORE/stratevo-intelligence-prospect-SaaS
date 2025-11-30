import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Shield, UserCog, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateUserDialog } from "./CreateUserDialog";

interface User {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

type AppRole = "admin" | "sales" | "viewer" | "direcao" | "gerencia" | "gestor" | "sdr" | "vendedor";

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; role: string }>({
    open: false,
    userId: "",
    role: "",
  });

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();

    // Subscribe to realtime changes
    const userRolesChannel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userRolesChannel);
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!error && data) {
        setCurrentUserIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Use the database function to get all users with their roles
      const { data: usersData, error } = await supabase
        .rpc('get_users_with_roles');

      if (error) throw error;

      // Transform the data to match our User interface
      const usersWithRoles = usersData?.map((user: any) => ({
        id: user.id,
        email: user.email || "Usuário sem email",
        created_at: user.created_at,
        roles: user.roles || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const addRole = async (userId: string, role: AppRole) => {
    if (!currentUserIsAdmin) {
      toast.error("Apenas administradores podem gerenciar roles");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast.success(`Role "${role}" adicionada com sucesso`);
      fetchUsers();
    } catch (error) {
      console.error("Error adding role:", error);
      toast.error("Erro ao adicionar role");
    }
  };

  const confirmRemoveRole = (userId: string, role: string) => {
    if (!currentUserIsAdmin) {
      toast.error("Apenas administradores podem gerenciar roles");
      return;
    }
    setDeleteDialog({ open: true, userId, role });
  };

  const removeRole = async () => {
    const { userId, role } = deleteDialog;
    
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as AppRole);

      if (error) throw error;

      toast.success(`Role "${role}" removida com sucesso`);
      fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Erro ao remover role");
    } finally {
      setDeleteDialog({ open: false, userId: "", role: "" });
    }
  };

  const getRoleBadgeIcon = (role: string) => {
    switch (role) {
      case "admin":
      case "direcao":
        return <Shield className="h-3 w-3" />;
      case "sales":
      case "gerencia":
      case "gestor":
        return <UserCog className="h-3 w-3" />;
      case "viewer":
      case "sdr":
      case "vendedor":
        return <Eye className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
      case "direcao":
        return "default" as const;
      case "sales":
      case "gerencia":
      case "gestor":
        return "secondary" as const;
      case "viewer":
      case "sdr":
      case "vendedor":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };
  
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Admin",
      sales: "Sales",
      viewer: "Viewer",
      direcao: "Direção",
      gerencia: "Gerência",
      gestor: "Gestor",
      sdr: "SDR",
      vendedor: "Vendedor",
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando usuários...</div>
      </div>
    );
  }

  if (!currentUserIsAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Usuários Cadastrados</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie usuários e suas permissões
            </p>
          </div>
          <CreateUserDialog onUserCreated={fetchUsers} />
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Roles Atuais</TableHead>
                <TableHead>Adicionar Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {user.roles.length === 0 ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Nenhuma role atribuída
                          </Badge>
                        ) : (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              className="gap-1"
                            >
                              {getRoleBadgeIcon(role)}
                              {getRoleLabel(role)}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => confirmRemoveRole(user.id, role)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => addRole(user.id, value as AppRole)}
                        disabled={!currentUserIsAdmin}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecione uma role" />
                        </SelectTrigger>
                        <SelectContent>
                          {!user.roles.includes("admin") && (
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Admin
                              </div>
                            </SelectItem>
                          )}
                          {!user.roles.includes("direcao") && (
                            <SelectItem value="direcao">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Direção
                              </div>
                            </SelectItem>
                          )}
                          {!user.roles.includes("gerencia") && (
                            <SelectItem value="gerencia">
                              <div className="flex items-center gap-2">
                                <UserCog className="h-4 w-4" />
                                Gerência
                              </div>
                            </SelectItem>
                          )}
                          {!user.roles.includes("gestor") && (
                            <SelectItem value="gestor">
                              <div className="flex items-center gap-2">
                                <UserCog className="h-4 w-4" />
                                Gestor
                              </div>
                            </SelectItem>
                          )}
                          {!user.roles.includes("sales") && (
                            <SelectItem value="sales">
                              <div className="flex items-center gap-2">
                                <UserCog className="h-4 w-4" />
                                Sales
                              </div>
                            </SelectItem>
                          )}
                          {!user.roles.includes("sdr") && (
                            <SelectItem value="sdr">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                SDR
                              </div>
                            </SelectItem>
                          )}
                          {!user.roles.includes("vendedor") && (
                            <SelectItem value="vendedor">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Vendedor
                              </div>
                            </SelectItem>
                          )}
                          {!user.roles.includes("viewer") && (
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Viewer
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sobre as Roles
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><strong>Admin:</strong> Acesso total ao sistema, pode gerenciar usuários e permissões</li>
            <li><strong>Direção:</strong> Acesso total para visualização e gerenciamento estratégico</li>
            <li><strong>Gerência:</strong> Pode gerenciar leads, agendamentos e propostas da equipe</li>
            <li><strong>Gestor:</strong> Pode visualizar e gerenciar leads e atividades</li>
            <li><strong>Sales:</strong> Pode gerenciar leads, agendamentos e propostas</li>
            <li><strong>SDR:</strong> Pode criar e visualizar leads, focar em prospecção</li>
            <li><strong>Vendedor:</strong> Pode criar e gerenciar leads, focar em vendas</li>
            <li><strong>Viewer:</strong> Apenas visualização, sem permissões de edição</li>
          </ul>
          <div className="mt-4 p-3 bg-background rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary">
              💡 Importante: Use o botão "Adicionar Usuário" acima para criar novos usuários no sistema
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, userId: "", role: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a role "{deleteDialog.role}"? 
              O usuário perderá as permissões associadas a esta role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
