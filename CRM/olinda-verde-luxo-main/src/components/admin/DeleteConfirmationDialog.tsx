import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityName: string;
  entityId: string;
  entityData: any;
  onConfirm: () => void;
}

export const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  entityType,
  entityName,
  entityId,
  entityData,
  onConfirm,
}: DeleteConfirmationDialogProps) => {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password.trim()) {
      toast.error("Digite sua senha para confirmar");
      return;
    }

    if (!reason.trim()) {
      toast.error("É necessário fornecer um motivo para a deleção");
      return;
    }

    setIsDeleting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Validate password by trying to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (authError) {
        toast.error("Senha incorreta");
        setIsDeleting(false);
        return;
      }

      // Create audit log
      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: user.id,
        action_type: `delete_${entityType}`,
        entity_type: entityType,
        entity_id: entityId,
        entity_data: entityData,
        reason: reason,
        ip_address: "client", // Could be enhanced with actual IP detection
      });

      if (auditError) {
        console.error("Error creating audit log:", auditError);
        toast.error("Erro ao criar registro de auditoria");
        setIsDeleting(false);
        return;
      }

      // Perform soft delete on leads table
      const { error: deleteError } = await supabase
        .from("leads")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq("id", entityId);

      if (deleteError) {
        console.error("Error deleting lead:", deleteError);
        toast.error("Erro ao deletar lead");
        setIsDeleting(false);
        return;
      }

      toast.success(`${entityType} deletado com sucesso`);
      setPassword("");
      setReason("");
      onOpenChange(false);
      onConfirm();
    } catch (error) {
      console.error("Error in delete confirmation:", error);
      toast.error("Erro ao processar deleção");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Confirmar Deleção</DialogTitle>
          </div>
          <DialogDescription>
            Esta ação irá deletar <strong>{entityName}</strong>. Um registro de auditoria será
            criado. Por favor, confirme com sua senha e forneça um motivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha Atual</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Deleção</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique por que este registro está sendo deletado..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setPassword("");
              setReason("");
              onOpenChange(false);
            }}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deletando..." : "Confirmar Deleção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
