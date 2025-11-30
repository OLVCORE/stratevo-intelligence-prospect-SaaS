import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PenTool, Trash2, Check, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProposalSignatureProps {
  proposalId: string;
  proposalData?: any;
}

export const ProposalSignature = ({ proposalId, proposalData }: ProposalSignatureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureDocument, setSignatureDocument] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [existingSignature, setExistingSignature] = useState<any>(null);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");

  useEffect(() => {
    if (proposalData?.signature_data) {
      setExistingSignature(proposalData.signature_data);
    }
  }, [proposalData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing style
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (!signatureName.trim() || !signatureDocument.trim()) {
      toast.error("Preencha seu nome e documento");
      return;
    }

    let signatureDataUrl = "";

    if (signatureMode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const isEmpty = !imageData.data.some(channel => channel !== 0);

      if (isEmpty) {
        toast.error("Desenhe sua assinatura no campo acima");
        return;
      }

      signatureDataUrl = canvas.toDataURL("image/png");
    } else {
      if (!typedSignature.trim()) {
        toast.error("Digite sua assinatura");
        return;
      }

      // Create a canvas with typed signature
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 600;
      tempCanvas.height = 200;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.font = "48px 'Dancing Script', cursive";
      tempCtx.fillStyle = "#000000";
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";
      tempCtx.fillText(typedSignature, tempCanvas.width / 2, tempCanvas.height / 2);

      signatureDataUrl = tempCanvas.toDataURL("image/png");
    }

    setIsSigning(true);

    try {
      const signatureData = {
        signature: signatureDataUrl,
        name: signatureName,
        document: signatureDocument,
        signed_at: new Date().toISOString(),
        ip_address: "N/A",
        mode: signatureMode,
      };

      const { error } = await supabase
        .from("proposals")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
        })
        .eq("id", proposalId);

      if (error) throw error;

      toast.success("Proposta assinada com sucesso!");
      setExistingSignature(signatureData);
      clearSignature();
      setTypedSignature("");
    } catch (error) {
      console.error("Error signing proposal:", error);
      toast.error("Erro ao assinar proposta");
    } finally {
      setIsSigning(false);
    }
  };

  if (existingSignature) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-600" />
            Proposta Assinada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="h-3 w-3 mr-1" />
            Assinada em {format(new Date(existingSignature.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Badge>

          <div className="border rounded-lg p-4">
            <img
              src={existingSignature.signature}
              alt="Assinatura"
              className="max-h-32 mx-auto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nome:</p>
              <p className="font-medium">{existingSignature.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Documento:</p>
              <p className="font-medium">{existingSignature.document}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Assinatura Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signatureName">Nome Completo *</Label>
          <Input
            id="signatureName"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Digite seu nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signatureDocument">CPF ou CNPJ *</Label>
          <Input
            id="signatureDocument"
            value={signatureDocument}
            onChange={(e) => setSignatureDocument(e.target.value)}
            placeholder="Digite seu CPF ou CNPJ"
          />
        </div>

        <div className="space-y-2">
          <Label>Assinatura *</Label>
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant={signatureMode === "draw" ? "default" : "outline"}
              onClick={() => setSignatureMode("draw")}
              className="flex-1"
            >
              Desenhar
            </Button>
            <Button
              type="button"
              variant={signatureMode === "type" ? "default" : "outline"}
              onClick={() => setSignatureMode("type")}
              className="flex-1"
            >
              Digitar
            </Button>
          </div>

          {signatureMode === "draw" ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-48 bg-white cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Desenhe sua assinatura no campo acima usando o mouse ou touch
              </p>
            </>
          ) : (
            <>
              <Input
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Digite seu nome completo"
                className="text-3xl font-['Dancing_Script'] text-center h-48"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              />
              <p className="text-xs text-muted-foreground">
                Digite seu nome por extenso - será formatado como assinatura
              </p>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearSignature}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
          <Button
            onClick={handleSign}
            disabled={isSigning}
            className="gap-2 flex-1"
          >
            <Check className="h-4 w-4" />
            {isSigning ? "Assinando..." : "Assinar Proposta"}
          </Button>
        </div>

        <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">Validade Jurídica:</p>
          <p>
            Esta assinatura digital possui validade jurídica de acordo com a Lei nº 14.063/2020
            que regulamenta assinaturas eletrônicas no Brasil.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};