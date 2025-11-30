import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadTagsManagerProps {
  leadId: string;
  tags: string[];
  onTagsUpdate: (tags: string[]) => void;
}

export const LeadTagsManager = ({ leadId, tags, onTagsUpdate }: LeadTagsManagerProps) => {
  const [newTag, setNewTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const updatedTags = [...tags, newTag.trim()];
    
    try {
      const { error } = await supabase
        .from("leads")
        .update({ tags: updatedTags })
        .eq("id", leadId);

      if (error) throw error;

      onTagsUpdate(updatedTags);
      setNewTag("");
      setIsAdding(false);
      toast.success("Tag adicionada");
    } catch (error: any) {
      console.error("Error adding tag:", error);
      toast.error("Erro ao adicionar tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    
    try {
      const { error } = await supabase
        .from("leads")
        .update({ tags: updatedTags })
        .eq("id", leadId);

      if (error) throw error;

      onTagsUpdate(updatedTags);
      toast.success("Tag removida");
    } catch (error: any) {
      console.error("Error removing tag:", error);
      toast.error("Erro ao remover tag");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="Nova tag..."
            className="h-8"
            autoFocus
          />
          <Button size="sm" onClick={handleAddTag}>
            Adicionar
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            setIsAdding(false);
            setNewTag("");
          }}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Tag
        </Button>
      )}
    </div>
  );
};
