// src/modules/crm/components/proposals/ProposalSignaturePanel.tsx
// Painel de assinatura digital

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileCheck, Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// @ts-ignore - react-signature-canvas não tem tipos TypeScript
import SignatureCanvas from "react-signature-canvas";
import React from "react";

interface ProposalSignaturePanelProps {
  proposalId: string;
}

export function ProposalSignaturePanel({ proposalId }: ProposalSignaturePanelProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerRole, setSignerRole] = useState("");
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);

  const { data: signatures, isLoading } = useQuery({
    queryKey: ["proposal-signatures", proposalId, tenant?.id],
    queryFn: async () => {
      if (!proposalId || !tenant?.id) return [];
      const { data, error } = await supabase
        .from("proposal_signatures")
        .select("*")
        .eq("proposal_id", proposalId)
        .eq("tenant_id", tenant.id)
        .order("signed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!proposalId && !!tenant?.id,
  });

  const sendForSignature = useMutation({
    mutationFn: async () => {
      if (!signerName || !signerEmail) {
        throw new Error("Preencha nome e email do signatário");
      }

      if (!signaturePad) {
        throw new Error("Assine o documento");
      }

      const signatureDataUrl = signaturePad.toDataURL();

      const { data, error } = await supabase
        .from("proposal_signatures")
        .insert({
          tenant_id: tenant?.id,
          proposal_id: proposalId,
          signer_name: signerName,
          signer_email: signerEmail,
          signer_role: signerRole,
          signature_image_url: signatureDataUrl,
          signature_data: {
            signed_at: new Date().toISOString(),
            method: "manual",
          },
          status: "signed",
          signed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar proposta
      await supabase
        .from("proposals")
        .update({
          signed_at: new Date().toISOString(),
          signature_data: {
            signatures: [data.id],
          },
        })
        .eq("id", proposalId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-signatures"] });
      toast({ title: "Assinatura registrada com sucesso!" });
      setSignerName("");
      setSignerEmail("");
      setSignerRole("");
      signaturePad?.clear();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar assinatura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle>Assinatura Digital</CardTitle>
          <CardDescription>Registre assinaturas do documento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signer-name">Nome do Signatário *</Label>
              <Input
                id="signer-name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signer-email">Email *</Label>
              <Input
                id="signer-email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="joao@empresa.com.br"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="signer-role">Cargo/Função</Label>
              <Input
                id="signer-role"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                placeholder="CEO, Diretor Comercial, etc"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assinatura</Label>
            <div className="border rounded-lg p-4 bg-white">
              <SignatureCanvas
                ref={(ref) => setSignaturePad(ref)}
                canvasProps={{
                  className: "w-full h-32 border rounded",
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => signaturePad?.clear()}
              >
                Limpar
              </Button>
            </div>
          </div>

          <Button onClick={() => sendForSignature.mutate()} disabled={sendForSignature.isPending} className="w-full">
            {sendForSignature.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            Registrar Assinatura
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de Assinaturas */}
      {signatures && signatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas Registradas</CardTitle>
            <CardDescription>Histórico de assinaturas do documento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signatures.map((signature: any) => (
                <div key={signature.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {signature.signature_image_url && (
                      <img
                        src={signature.signature_image_url}
                        alt="Assinatura"
                        className="h-16 w-48 border rounded bg-white object-contain"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{signature.signer_name}</span>
                        {getStatusIcon(signature.status)}
                        <Badge variant="outline">{signature.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{signature.signer_email}</p>
                      {signature.signer_role && (
                        <p className="text-xs text-muted-foreground">{signature.signer_role}</p>
                      )}
                      {signature.signed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assinado em: {format(new Date(signature.signed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

