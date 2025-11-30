import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  business_model: string | null;
  crm_config: any;
}

export const useTenant = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTenant();
  }, []);

  const fetchUserTenant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Buscar tenant_id via função SQL
      const { data: tenantIdData, error: fnError } = await supabase
        .rpc('get_user_tenant_id') as { data: string | null, error: any };

      if (fnError || !tenantIdData) {
        console.warn("User has no active tenant");
        // Por enquanto, continua sem tenant (modo single-tenant temporário)
        setTenantId(null);
        setLoading(false);
        return;
      }

      setTenantId(tenantIdData);

      // Buscar dados completos do tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants" as any)
        .select("*")
        .eq("id", tenantIdData)
        .single() as { data: Tenant | null, error: any };

      if (!tenantError && tenantData) {
        setTenant(tenantData);
      }
    } catch (error) {
      console.error("Error fetching tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  return { tenant, tenantId, loading, refreshTenant: fetchUserTenant };
};
