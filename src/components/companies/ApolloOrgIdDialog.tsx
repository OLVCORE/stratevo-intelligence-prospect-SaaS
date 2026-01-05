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
            Buscar por Apollo Organization ID
          </DialogTitle>
          <DialogDescription>
            Cole o Organization ID do Apollo.io para buscar os contatos diretamente. 
            Você encontra o ID na URL da página da empresa no Apollo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apollo-org-id">Apollo Organization ID</Label>
            <Input
              id="apollo-org-id"
              placeholder="Cole a URL completa ou só o ID: 5a9d68c2a6da98d9466cf9bc"
              value={apolloOrgId}
              onChange={(e) => setApolloOrgId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              ✅ Pode colar a URL COMPLETA! O ID será extraído automaticamente.
            </p>
            <p className="text-xs text-muted-foreground">
              Exemplo: https://app.apollo.io/#/organizations/<strong className="text-primary">5a9d68c2a6da98d9466cf9bc</strong>
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
            Buscar Contatos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
