import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GripVertical, Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface ProposalBlock {
  id: string;
  type: "header" | "services" | "pricing" | "terms" | "notes" | "custom";
  content: any;
  order: number;
}

interface ProposalBuilderProps {
  initialBlocks?: ProposalBlock[];
  onSave: (blocks: ProposalBlock[]) => void;
  onPreview: (blocks: ProposalBlock[]) => void;
}

const defaultBlocks: ProposalBlock[] = [
  {
    id: "header",
    type: "header",
    order: 0,
    content: {
      title: "Proposta Comercial",
      subtitle: "Espaço Linda - Eventos Inesquecíveis",
    },
  },
  {
    id: "services",
    type: "services",
    order: 1,
    content: {
      title: "Serviços Inclusos",
      items: [
        { name: "Locação do Espaço", description: "Espaço completo para seu evento" },
      ],
    },
  },
  {
    id: "pricing",
    type: "pricing",
    order: 2,
    content: {
      title: "Investimento",
      items: [],
      discount: 0,
    },
  },
];

export const ProposalBuilder = ({ initialBlocks, onSave, onPreview }: ProposalBuilderProps) => {
  const [blocks, setBlocks] = useState<ProposalBlock[]>(initialBlocks || defaultBlocks);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlock || draggedBlock === targetBlockId) return;

    const draggedIndex = blocks.findIndex((b) => b.id === draggedBlock);
    const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);

    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, removed);

    // Reorder
    const reordered = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));

    setBlocks(reordered);
    setDraggedBlock(null);
  };

  const updateBlockContent = (blockId: string, content: any) => {
    setBlocks(
      blocks.map((block) =>
        block.id === blockId ? { ...block, content: { ...block.content, ...content } } : block
      )
    );
  };

  const addBlock = (type: ProposalBlock["type"]) => {
    const newBlock: ProposalBlock = {
      id: `${type}-${Date.now()}`,
      type,
      order: blocks.length,
      content: {},
    };
    setBlocks([...blocks, newBlock]);
    toast.success("Bloco adicionado!");
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
    toast.success("Bloco removido!");
  };

  const renderBlockEditor = (block: ProposalBlock) => {
    switch (block.type) {
      case "header":
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.content.title || ""}
                onChange={(e) => updateBlockContent(block.id, { title: e.target.value })}
                placeholder="Título da proposta"
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input
                value={block.content.subtitle || ""}
                onChange={(e) => updateBlockContent(block.id, { subtitle: e.target.value })}
                placeholder="Subtítulo"
              />
            </div>
          </div>
        );

      case "services":
        return (
          <div className="space-y-4">
            <div>
              <Label>Título da Seção</Label>
              <Input
                value={block.content.title || "Serviços Inclusos"}
                onChange={(e) => updateBlockContent(block.id, { title: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={block.content.description || ""}
                onChange={(e) => updateBlockContent(block.id, { description: e.target.value })}
                placeholder="Descreva os serviços..."
                rows={4}
              />
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-4">
            <div>
              <Label>Título da Seção</Label>
              <Input
                value={block.content.title || "Investimento"}
                onChange={(e) => updateBlockContent(block.id, { title: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={block.content.notes || ""}
                onChange={(e) => updateBlockContent(block.id, { notes: e.target.value })}
                placeholder="Observações sobre preços..."
                rows={3}
              />
            </div>
          </div>
        );

      case "terms":
        return (
          <div className="space-y-4">
            <div>
              <Label>Termos e Condições</Label>
              <Textarea
                value={block.content.terms || ""}
                onChange={(e) => updateBlockContent(block.id, { terms: e.target.value })}
                placeholder="Digite os termos e condições..."
                rows={6}
              />
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="space-y-4">
            <div>
              <Label>Observações</Label>
              <Textarea
                value={block.content.notes || ""}
                onChange={(e) => updateBlockContent(block.id, { notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={4}
              />
            </div>
          </div>
        );

      case "custom":
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.content.title || ""}
                onChange={(e) => updateBlockContent(block.id, { title: e.target.value })}
                placeholder="Título do bloco"
              />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={block.content.content || ""}
                onChange={(e) => updateBlockContent(block.id, { content: e.target.value })}
                placeholder="Conteúdo personalizado..."
                rows={6}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Editor de Proposta</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onPreview(blocks)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => onSave(blocks)}>Salvar Proposta</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {blocks
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <Card
              key={block.id}
              className="p-4"
              draggable
              onDragStart={(e) => handleDragStart(e, block.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, block.id)}
            >
              <div className="flex items-start gap-4">
                <div className="cursor-move pt-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold capitalize">{block.type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlock(block.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderBlockEditor(block)}
                </div>
              </div>
            </Card>
          ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => addBlock("header")}>
            <Plus className="h-4 w-4 mr-2" />
            Cabeçalho
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("services")}>
            <Plus className="h-4 w-4 mr-2" />
            Serviços
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("pricing")}>
            <Plus className="h-4 w-4 mr-2" />
            Preços
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("terms")}>
            <Plus className="h-4 w-4 mr-2" />
            Termos
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("notes")}>
            <Plus className="h-4 w-4 mr-2" />
            Observações
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("custom")}>
            <Plus className="h-4 w-4 mr-2" />
            Bloco Customizado
          </Button>
        </div>
      </Card>
    </div>
  );
};
