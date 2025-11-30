import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserManagement } from "@/components/admin/UserManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Users = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const allowedRoles = ["admin", "direcao", "gerencia", "gestor"];
      const hasAccess = roles?.some((r) => allowedRoles.includes(r.role));

      if (!hasAccess) {
        navigate("/admin");
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuthorization();
  }, [navigate]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários e suas permissões no sistema. Apenas administradores podem criar usuários e atribuir roles.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários e Roles</CardTitle>
            <CardDescription>
              Controle de acesso e permissões. Roles disponíveis: Admin, Direção, Gerência, Gestor, Sales, SDR, Vendedor e Viewer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagement />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Users;
