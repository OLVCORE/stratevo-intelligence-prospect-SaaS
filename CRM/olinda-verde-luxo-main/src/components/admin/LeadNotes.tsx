import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, FileText, Edit2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadNotesProps {
  leadId: string;
}

export const LeadNotes = ({ leadId }: LeadNotesProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<any>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [leadId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lead_id", leadId)
        .eq("type", "note")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error("Error fetching notes:", error);
      toast.error("Erro ao carregar notas");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    const submittingTimeout = setTimeout(() => {
      console.warn("[LeadNotes] Timeout ao adicionar nota");
      setIsSubmitting(false);
      toast.error("Tempo esgotado ao adicionar nota. Verifique sua conexão e tente novamente.");
    }, 15000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("activities").insert({
        lead_id: leadId,
        type: "note",
        subject: "Nota adicionada",
        description: newNote,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Nota adicionada com sucesso");
      setNewNote("");
      fetchNotes();
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.error("Erro ao adicionar nota");
    } finally {
      clearTimeout(submittingTimeout);
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!newNote.trim() || !editingNote) return;

    setIsSubmitting(true);
    const submittingTimeout = setTimeout(() => {
      console.warn("[LeadNotes] Timeout ao atualizar nota");
      setIsSubmitting(false);
      toast.error("Tempo esgotado ao atualizar nota. Verifique sua conexão e tente novamente.");
    }, 15000);

    try {
      const { error } = await supabase
        .from("activities")
        .update({ description: newNote })
        .eq("id", editingNote.id);

      if (error) throw error;

      toast.success("Nota atualizada com sucesso");
      setNewNote("");
      setEditingNote(null);
      fetchNotes();
    } catch (error: any) {
      console.error("Error updating note:", error);
      toast.error("Erro ao atualizar nota");
    } finally {
      clearTimeout(submittingTimeout);
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
      toast.success("Nota excluída com sucesso");
      setDeleteNoteId(null);
      fetchNotes();
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast.error("Erro ao excluir nota");
    }
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setNewNote(note.description || "");
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNewNote("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">
              {editingNote ? "Editar Nota" : "Nova Nota"}
            </h3>
            {editingNote && (
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Adicionar uma nova nota..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={editingNote ? handleUpdateNote : handleAddNote}
              disabled={isSubmitting || !newNote.trim()}
              className="gap-2 flex-1"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting 
                ? (editingNote ? "Atualizando..." : "Adicionando...") 
                : (editingNote ? "Atualizar Nota" : "Adicionar Nota")
              }
            </Button>
            {editingNote && (
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma nota registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {note.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteNoteId(note.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nota</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteNoteId && handleDeleteNote(deleteNoteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
