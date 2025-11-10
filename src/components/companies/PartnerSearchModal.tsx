import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Users } from "lucide-react";

interface PartnerSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompanies?: (companies: any[]) => void;
}

export function PartnerSearchModal({ open, onOpenChange, onImportCompanies }: PartnerSearchModalProps) {
  const [searchType, setSearchType] = useState<'exato' | 'semelhante'>('exato');
  const [entityType, setEntityType] = useState<'fisica' | 'juridica'>('fisica');
  const [partnerName, setPartnerName] = useState('');
  const [cpf, setCpf] = useState('');
  const [qualification, setQualification] = useState('TODAS');
  const [ageRange, setAgeRange] = useState('TODAS');
  const [situation, setSituation] = useState('TODAS');
  const [uf, setUf] = useState('TODOS');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!partnerName && !cpf) {
      toast.error('Preencha pelo menos o nome ou CPF do sócio');
      return;
    }

    try {
      setSearching(true);
      
      toast.info('🔍 Buscando empresas do sócio...', {
        description: 'Isso pode levar alguns minutos'
      });

      // 🎯 INTEGRAÇÃO COM API EMPRESASAQUI
      // TODO: Implementar chamada real à API
      
      // Simulação temporária:
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('✅ Busca concluída!', {
        description: 'Empresas encontradas serão importadas'
      });
      
      if (onImportCompanies) {
        onImportCompanies([]);
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao buscar sócios:', error);
      toast.error('Erro na busca', {
        description: error.message
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Buscar por Sócios
          </DialogTitle>
          <DialogDescription>
            Encontre empresas através dos sócios/proprietários
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nome */}
          <div className="space-y-3">
            <Label>Nome do Sócio</Label>
            <RadioGroup value={searchType} onValueChange={(v: any) => setSearchType(v)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="exato" id="exato" />
                <Label htmlFor="exato">Exato</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="semelhante" id="semelhante" />
                <Label htmlFor="semelhante">Semelhante</Label>
              </div>
            </RadioGroup>
            <Input
              placeholder="Nome ou Parte do Nome"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
          </div>

          {/* Tipo e CPF */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Tipo de Pessoa</Label>
              <RadioGroup value={entityType} onValueChange={(v: any) => setEntityType(v)} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="fisica" id="fisica" />
                  <Label htmlFor="fisica">Física</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="juridica" id="juridica" />
                  <Label htmlFor="juridica">Jurídica</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-3">
              <Label>CPF (Opcional - 6 dígitos do meio)</Label>
              <Input
                placeholder="222.333"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                maxLength={7}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Qualificação</Label>
              <Select value={qualification} onValueChange={setQualification}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">TODAS</SelectItem>
                  <SelectItem value="ACIONISTA">ACIONISTA</SelectItem>
                  <SelectItem value="DIRETOR">DIRETOR</SelectItem>
                  <SelectItem value="SOCIO-ADMINISTRADOR">SÓCIO-ADMINISTRADOR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={situation} onValueChange={setSituation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">TODAS</SelectItem>
                  <SelectItem value="ATIVAS">ATIVAS</SelectItem>
                  <SelectItem value="BAIXADAS">BAIXADAS</SelectItem>
                  <SelectItem value="SUSPENSAS">SUSPENSAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Empresas
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

