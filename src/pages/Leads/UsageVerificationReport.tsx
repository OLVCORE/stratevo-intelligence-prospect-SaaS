// src/pages/Leads/UsageVerificationReport.tsx
// Página de relatório de verificação de uso (genérico, multi-tenant)

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2, Printer, UserPlus } from "lucide-react";
import UsageVerificationCard from "@/components/totvs/TOTVSCheckCard";
import { supabase } from "@/integrations/supabase/client";
import { DraggableDialog } from "@/components/ui/draggable-dialog";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function UsageVerificationReport() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();

  const [companyMeta, setCompanyMeta] = useState<{ name: string; cnpj?: string; domain?: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const qpName = searchParams.get("name") || undefined;
  const qpCnpj = searchParams.get("cnpj") || undefined;
  const qpDomain = searchParams.get("domain") || undefined;
  const qpCompanyId = searchParams.get("companyId") || undefined;
  const resolvedCompanyId = companyId || qpCompanyId;

  // 🔥 CARREGAR latestReport do banco para persistir dados salvos
  const { data: latestReport } = useQuery({
    queryKey: ['latest-verification-report', resolvedCompanyId],
    queryFn: async () => {
      if (!resolvedCompanyId) return null;
      
      const { data, error } = await supabase
        .from('stc_verification_history')
        .select('*')
        .eq('company_id', resolvedCompanyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('[VERIFICATION-REPORT] ❌ Erro ao carregar latestReport:', error);
        return null;
      }
      
      if (data) {
        console.log('[VERIFICATION-REPORT] ✅ latestReport carregado:', {
          id: data.id,
          hasFullReport: !!data.full_report,
          fullReportKeys: data.full_report ? Object.keys(data.full_report) : []
        });
      }
      
      return data || null;
    },
    enabled: !!resolvedCompanyId,
    staleTime: 30000, // 30 segundos
    gcTime: 300000, // 5 minutos
  });

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!resolvedCompanyId) return;

      // Preferir dados vindos por query string para evitar consultas desnecessárias
      if (qpName || qpCnpj || qpDomain) {
        if (!ignore) setCompanyMeta({ name: qpName || "Empresa", cnpj: qpCnpj || undefined, domain: qpDomain || undefined });
        return;
      }

      // Fallback: tentar obter metadados da quarentena
      const { data } = await supabase
        .from("icp_analysis_results")
        .select("razao_social, cnpj, domain")
        .eq("id", resolvedCompanyId)
        .maybeSingle();

      if (!ignore) {
        setCompanyMeta({
          name: (data as any)?.razao_social || "Empresa",
          cnpj: (data as any)?.cnpj || undefined,
          domain: (data as any)?.domain || undefined,
        });
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [resolvedCompanyId, qpName, qpCnpj, qpDomain]);

  const headerTitle = useMemo(() => companyMeta?.name || "Relatório de Verificação de Uso", [companyMeta]);

  const handlePrint = () => {
    window.print();
    toast.success("Preparando relatório para impressão...");
  };

  const handleAssign = () => {
    setShowAssignDialog(true);
    toast.info("Funcionalidade de atribuição em breve!");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      navigate(-1);
    }
  };

  const reportContent = (
    <UsageVerificationCard
      companyId={resolvedCompanyId}
      companyName={companyMeta?.name}
      cnpj={companyMeta?.cnpj}
      domain={companyMeta?.domain}
      latestReport={latestReport}
      autoVerify={false}
    />
  );

  // Modo Minimizado (botão flutuante)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <Button 
          variant="default" 
          onClick={() => {
            setIsMinimized(false);
          }}
          className="shadow-xl hover-scale"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          {headerTitle}
        </Button>
      </div>
    );
  }

  // Modo Fullscreen
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{headerTitle}</h1>
              <p className="text-muted-foreground">Relatório completo de verificação de uso</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleAssign}>
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Minimize2 className="h-4 w-4 mr-2" />
                Sair Fullscreen
              </Button>
              <Button variant="outline" size="sm" onClick={toggleMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                Fechar
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            {reportContent}
          </div>
        </div>
      </div>
    );
  }

  // Modo Normal (Página)
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{headerTitle}</h1>
            <p className="text-muted-foreground">Relatório completo de verificação de uso</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleAssign}>
            <UserPlus className="h-4 w-4 mr-2" />
            Atribuir
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMinimize}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {reportContent}
        </CardContent>
      </Card>
    </div>
  );
}

