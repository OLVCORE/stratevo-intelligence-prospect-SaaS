import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoOriginal from "@/assets/logo-official.png";

const LogoProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const processLogo = async () => {
    try {
      setProcessing(true);
      toast.info("Removendo fundo do logo...");

      // Convert logo to base64
      const response = await fetch(logoOriginal);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      console.log("Logo carregado, processando com IA...");

      // Call edge function to remove background
      const { data, error } = await supabase.functions.invoke("remove-logo-background", {
        body: { imageUrl: base64 },
      });

      if (error) throw error;

      console.log("Fundo removido com sucesso!");
      
      setProcessedImage(data.imageUrl);
      toast.success("Logo processado! Use o botão para baixar.");
    } catch (error: any) {
      console.error("Erro ao processar logo:", error);
      toast.error("Erro ao processar logo: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const a = document.createElement("a");
    a.href = processedImage;
    a.download = "logo-transparent.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Logo baixado!");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Processar Logo</h1>
          <p className="text-muted-foreground mt-1">
            Remova o fundo do logo automaticamente com IA
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Logo Original</CardTitle>
              <CardDescription>Com fundo marrom</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img src={logoOriginal} alt="Logo Original" className="max-w-full h-auto max-h-64 object-contain" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo Processado</CardTitle>
              <CardDescription>Fundo transparente</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {processedImage ? (
                <>
                  <div className="bg-sidebar p-4 rounded-lg">
                    <img src={processedImage} alt="Logo Processado" className="max-w-full h-auto max-h-64 object-contain" />
                  </div>
                  <Button onClick={downloadImage}>
                    Baixar Logo Transparente
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Clique em processar para gerar
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={processLogo} 
              disabled={processing}
              size="lg"
              className="w-full"
            >
              {processing ? "Processando com IA..." : "🪄 Remover Fundo do Logo"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LogoProcessor;
