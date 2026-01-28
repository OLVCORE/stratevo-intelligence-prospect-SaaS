import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import apolloLogo from "@/assets/logos/apollo.ico";

interface ApolloOrgIdDialogProps {
  onEnrich: (apolloOrgId: string) => Promise<void>;
  disabled?: boolean;
}

export function ApolloOrgIdDialog({ onEnrich, disabled }: ApolloOrgIdDialogProps) {
  const [open, setOpen] = useState(false);
  const [apolloOrgId, setApolloOrgId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEnrich = async () => {
    if (!apolloOrgId.trim()) return;
    
    setIsLoading(true);
    try {
      // EXTRAIR ID DA URL AUTOMATICAMENTE
      let cleanId = apolloOrgId.trim();
      
      // Se for URL completa, extrair apenas o ID
      if (cleanId.includes('apollo.io')) {
        const match = cleanId.match(/organizations\/([a-f0-9]{24})/i);
        if (match) {
          cleanId = match[1];
          console.log('✅ ID extraído da URL:', cleanId);
        }
      }
      
      // ✅ Aguardar enriquecimento completar ANTES de fechar o modal
      await onEnrich(cleanId);
      
      // ✅ Fechar modal apenas após sucesso (dados já foram recarregados)
      setOpen(false);
      setApolloOrgId("");
    } catch (error) {
      console.error('[ApolloOrgIdDialog] ❌ Erro no enriquecimento:', error);
      // ✅ NÃO fechar modal em caso de erro - usuário pode tentar novamente
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // ✅ Não permitir fechar durante o enriquecimento
      if (!isLoading) {
        setOpen(newOpen);
        if (!newOpen) {
          setApolloOrgId(""); // Limpar apenas quando fechar manualmente
        }
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <img src={apolloLogo} alt="Apollo" className="h-4 w-4" />
          Apollo ID Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => {
        // ✅ Não permitir fechar clicando fora durante o enriquecimento
        if (isLoading) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={apolloLogo} alt="Apollo" className="h-5 w-5" />
            Motor: Dados completos da empresa por Apollo
          </DialogTitle>
          <DialogDescription>
            Cole a <strong>URL da empresa no Apollo</strong> ou o Organization ID. O motor busca os <strong>Company details</strong> (descrição, industry, keywords, employees, SIC, NAICS, founding year) e os decisores. Use a URL da página da empresa no Apollo — o ID é extraído automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apollo-org-id">URL Apollo ou Organization ID</Label>
            <Input
              id="apollo-org-id"
              placeholder="https://app.apollo.io/#/organizations/64696fd0fd539b0001ca5d01/people?..."
              value={apolloOrgId}
              onChange={(e) => setApolloOrgId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              ✅ Cole a URL completa da empresa no Apollo — o motor extrai o ID e busca Company details + decisores.
            </p>
            <p className="text-xs text-muted-foreground">
              Exemplo: <code className="text-primary bg-muted px-1 rounded">…/organizations/<strong>64696fd0fd539b0001ca5d01</strong>/people</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEnrich} 
            disabled={!apolloOrgId.trim() || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Buscar dados da empresa + decisores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
