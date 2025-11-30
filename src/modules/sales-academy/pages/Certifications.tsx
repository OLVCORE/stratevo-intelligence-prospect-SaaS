// src/modules/sales-academy/pages/Certifications.tsx
// Página de certificações

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Award, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Certifications() {
  const { tenant } = useTenant();
  const { user } = useAuth();

  // Buscar certificações disponíveis
  const { data: availableCerts } = useQuery({
    queryKey: ["certifications", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Buscar certificações do usuário
  const { data: userCerts } = useQuery({
    queryKey: ["user-certifications", user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return [];

      const { data, error } = await supabase
        .from("user_certifications")
        .select(`
          *,
          certification:certification_id (
            id,
            name,
            description
          )
        `)
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!tenant?.id,
  });

  const earnedCerts = userCerts?.filter((c: any) => c.status === "earned") || [];
  const expiredCerts = userCerts?.filter((c: any) => c.status === "expired") || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Certificações</h1>
        <p className="text-muted-foreground">
          Certifique suas habilidades de vendas
        </p>
      </div>

      {/* Certificações Conquistadas */}
      {earnedCerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Minhas Certificações</CardTitle>
            <CardDescription>
              Certificações que você conquistou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {earnedCerts.map((cert: any) => (
                <div key={cert.id} className="p-6 border rounded-lg text-center">
                  <Award className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                  <h3 className="font-semibold text-lg mb-2">
                    {cert.certification?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {cert.certification?.description}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Conquistada em {new Date(cert.earned_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {cert.certificate_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Certificado
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificações Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Certificações Disponíveis</CardTitle>
          <CardDescription>
            Complete as trilhas para conquistar certificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableCerts && availableCerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCerts.map((cert: any) => {
                const userCert = userCerts?.find((uc: any) => uc.certification_id === cert.id);
                const isEarned = userCert?.status === "earned";

                return (
                  <div key={cert.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{cert.name}</h3>
                      {isEarned && (
                        <Badge variant="default">
                          <Award className="h-3 w-3 mr-1" />
                          Conquistada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {cert.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p>Score mínimo: {cert.minimum_score}%</p>
                      {cert.validity_days && (
                        <p>Validade: {cert.validity_days} dias</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma certificação disponível no momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

