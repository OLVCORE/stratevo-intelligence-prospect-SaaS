import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ban, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventBlock {
  id: string;
  date: string;
  reason: string;
  block_type: string;
  is_full_day: boolean;
}

export function EventBlocksManager() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [blocks, setBlocks] = useState<EventBlock[]>([]);
  const [blocksForDate, setBlocksForDate] = useState<EventBlock[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [blockType, setBlockType] = useState<"manutencao" | "evento" | "indisponivel">("manutencao");

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      filterBlocksByDate(selectedDate);
    }
  }, [selectedDate, blocks]);

  const fetchBlocks = async () => {
    const { data, error } = await supabase
      .from("event_blocks")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar bloqueios");
      return;
    }

    setBlocks(data || []);
  };

  const filterBlocksByDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const filtered = blocks.filter((block) => block.date === dateStr);
    setBlocksForDate(filtered);
  };

  const handleCreateBlock = async () => {
    if (!selectedDate || !reason.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("event_blocks").insert({
      date: selectedDate.toISOString().split("T")[0],
      reason: reason.trim(),
      block_type: blockType,
      is_full_day: true,
    });

    if (error) {
      toast.error("Erro ao criar bloqueio");
      return;
    }

    toast.success("Bloqueio criado com sucesso");
    setIsDialogOpen(false);
    setReason("");
    fetchBlocks();
  };

  const handleDeleteBlock = async (id: string) => {
    const { error } = await supabase.from("event_blocks").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao remover bloqueio");
      return;
    }

    toast.success("Bloqueio removido");
    fetchBlocks();
  };

  const getBlockedDates = () => {
    return blocks.map((block) => new Date(block.date + "T00:00:00"));
  };

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case "evento":
        return "destructive";
      case "manutencao":
        return "secondary";
      case "indisponivel":
        return "outline";
      default:
        return "default";
    }
  };

  const getBlockTypeLabel = (type: string) => {
    switch (type) {
      case "evento":
        return "Evento Confirmado";
      case "manutencao":
        return "Manutenção";
      case "indisponivel":
        return "Indisponível";
      default:
        return type;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendário de Bloqueios
          </CardTitle>
          <CardDescription>
            Datas em vermelho estão bloqueadas. Clique em uma data para gerenciar bloqueios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              blocked: getBlockedDates(),
            }}
            modifiersStyles={{
              blocked: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" },
            }}
          />
          
          <div className="mt-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Ban className="h-4 w-4 mr-2" />
                  Bloquear Data Selecionada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bloquear Data</DialogTitle>
                  <DialogDescription>
                    Bloqueie a data {selectedDate?.toLocaleDateString("pt-BR")} para eventos ou manutenção
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="blockType">Tipo de Bloqueio</Label>
                    <Select value={blockType} onValueChange={(value: any) => setBlockType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evento">Evento Confirmado</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="indisponivel">Indisponível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Motivo do Bloqueio</Label>
                    <Textarea
                      id="reason"
                      placeholder="Ex: Casamento da Maria Silva"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateBlock}>Bloquear Data</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Bloqueios em {selectedDate?.toLocaleDateString("pt-BR")}
          </CardTitle>
          <CardDescription>
            {blocksForDate.length === 0 ? "Nenhum bloqueio nesta data" : `${blocksForDate.length} bloqueio(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blocksForDate.map((block) => (
              <div key={block.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Badge variant={getBlockTypeColor(block.block_type)} className="mb-2">
                    {getBlockTypeLabel(block.block_type)}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{block.reason}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBlock(block.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
