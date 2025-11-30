import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadDistributionConfig } from "@/components/admin/LeadDistributionConfig";
import { RolesHierarchyInfo } from "@/components/admin/RolesHierarchyInfo";
import { Users, Loader2 } from "lucide-react";

const Distribution = () => {
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            Distribuição de Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure e monitore a distribuição automática de leads entre sua equipe de vendas
          </p>
        </div>

        <LeadDistributionConfig />
        
        <RolesHierarchyInfo />
      </div>
    </AdminLayout>
  );
};

export default Distribution;
