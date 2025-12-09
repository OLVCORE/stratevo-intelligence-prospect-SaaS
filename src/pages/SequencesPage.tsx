/**
 * Página de Sequências Comerciais
 * 
 * Gerencia sequências de comunicação (WhatsApp, Email, Tasks)
 * para leads e deals
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Mail,
  MessageSquare,
  CheckSquare,
  Loader2,
  RefreshCw,
  ArrowRight,
  Copy,
  Eye,
  User,
  Briefcase,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';

interface Sequence {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  steps_count?: number;
}

interface SequenceStep {
  id: string;
  sequence_id: string;
  day_offset: number;
  tipo: 'whatsapp' | 'email' | 'task';
  template_text: string;
  subject?: string;
  step_order: number;
}

export default function SequencesPage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  const [loading, setLoading] = useState(true);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Step form states
  const [stepDayOffset, setStepDayOffset] = useState(0);
  const [stepTipo, setStepTipo] = useState<'whatsapp' | 'email' | 'task'>('email');
  const [stepTemplate, setStepTemplate] = useState('');
  const [stepSubject, setStepSubject] = useState('');

  useEffect(() => {
    if (tenantId) {
      loadSequences();
    }
  }, [tenantId]);

  const loadSequences = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sequences')
        .select(`
          *,
          sequence_steps (id)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Contar steps para cada sequência
      const sequencesWithCount = (data || []).map(seq => ({
        ...seq,
        steps_count: (seq.sequence_steps as any[])?.length || 0,
      }));

      setSequences(sequencesWithCount);
    } catch (error: any) {
      console.error('Erro ao carregar sequências:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar sequências',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSteps = async (sequenceId: string) => {
    try {
      const { data, error } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_order', { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar steps:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar passos da sequência',
        variant: 'destructive',
      });
    }
  };

  const handleCreateSequence = async () => {
    if (!tenantId || !formName.trim()) {
      toast({
        title: 'Atenção',
        description: 'Nome da sequência é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sequences')
        .insert({
          tenant_id: tenantId,
          name: formName,
          description: formDescription || null,
          is_active: formIsActive,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Sequência criada!',
        description: 'Adicione passos à sequência',
      });

      setDialogOpen(false);
      setFormName('');
      setFormDescription('');
      setFormIsActive(true);
      loadSequences();
    } catch (error: any) {
      console.error('Erro ao criar sequência:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar sequência',
        variant: 'destructive',
      });
    }
  };

  const handleAddStep = async () => {
    if (!selectedSequence || !stepTemplate.trim()) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma sequência e preencha o template',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Determinar ordem (último step + 1)
      const maxOrder = steps.length > 0 
        ? Math.max(...steps.map(s => s.step_order)) 
        : 0;

      const { error } = await supabase
        .from('sequence_steps')
        .insert({
          sequence_id: selectedSequence.id,
          day_offset: stepDayOffset,
          tipo: stepTipo,
          template_text: stepTemplate,
          subject: stepTipo === 'email' ? stepSubject : null,
          step_order: maxOrder + 1,
        });

      if (error) throw error;

      toast({
        title: '✅ Passo adicionado!',
      });

      setStepDialogOpen(false);
      setStepDayOffset(0);
      setStepTipo('email');
      setStepTemplate('');
      setStepSubject('');
      loadSteps(selectedSequence.id);
      loadSequences();
    } catch (error: any) {
      console.error('Erro ao adicionar passo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar passo',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSequence = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sequência?')) return;

    try {
      const { error } = await supabase
        .from('sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Sequência excluída',
      });

      loadSequences();
    } catch (error: any) {
      console.error('Erro ao excluir sequência:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir sequência',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateSequence = async (sequence: Sequence) => {
    try {
      // Criar nova sequência
      const { data: newSequence, error: seqError } = await supabase
        .from('sequences')
        .insert({
          tenant_id: tenantId,
          name: `${sequence.name} (Cópia)`,
          description: sequence.description,
          is_active: false, // Inativa por padrão
        })
        .select()
        .single();

      if (seqError) throw seqError;

      // Copiar steps
      if (steps.length > 0) {
        const { error: stepsError } = await supabase
          .from('sequence_steps')
          .insert(
            steps.map(step => ({
              sequence_id: newSequence.id,
              day_offset: step.day_offset,
              tipo: step.tipo,
              template_text: step.template_text,
              subject: step.subject,
              step_order: step.step_order,
            }))
          );

        if (stepsError) throw stepsError;
      }

      toast({
        title: '✅ Sequência duplicada!',
        description: 'A nova sequência foi criada como inativa',
      });

      loadSequences();
    } catch (error: any) {
      console.error('Erro ao duplicar sequência:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível duplicar sequência',
        variant: 'destructive',
      });
    }
  };

  const handleViewSteps = (sequence: Sequence) => {
    setSelectedSequence(sequence);
    loadSteps(sequence.id);
    setStepDialogOpen(true);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'email':
        return 'E-mail';
      case 'task':
        return 'Tarefa';
      default:
        return tipo;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Sequências Comerciais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sequências de comunicação para leads e deals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSequences} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Sequência
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Sequência Comercial</DialogTitle>
                <DialogDescription>
                  Crie uma nova sequência de comunicação
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Sequência de Follow-up"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descreva o objetivo desta sequência"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-sm">Ativa</label>
                </div>
                <Button onClick={handleCreateSequence} className="w-full">
                  Criar Sequência
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Sequências */}
      <Card>
        <CardHeader>
          <CardTitle>Sequências</CardTitle>
          <CardDescription>
            {sequences.length} sequência(s) cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sequences.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma sequência cadastrada.
              <br />
              <Button
                variant="link"
                onClick={() => setDialogOpen(true)}
                className="mt-2"
              >
                Criar primeira sequência
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Passos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences.map((sequence) => (
                  <TableRow key={sequence.id}>
                    <TableCell className="font-medium">{sequence.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sequence.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sequence.steps_count || 0} passos</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={sequence.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {sequence.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(sequence.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSteps(sequence)}
                          title="Editar sequência"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateSequence(sequence)}
                          title="Duplicar sequência"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSequence(sequence.id)}
                          title="Excluir sequência"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Steps */}
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Passos da Sequência: {selectedSequence?.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie os passos desta sequência comercial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Adicionar novo passo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Passo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Dia (offset)</label>
                    <Input
                      type="number"
                      value={stepDayOffset}
                      onChange={(e) => setStepDayOffset(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={stepTipo} onValueChange={(v) => setStepTipo(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="task">Tarefa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {stepTipo === 'email' && (
                  <div>
                    <label className="text-sm font-medium">Assunto</label>
                    <Input
                      value={stepSubject}
                      onChange={(e) => setStepSubject(e.target.value)}
                      placeholder="Assunto do e-mail"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Template *</label>
                  <Textarea
                    value={stepTemplate}
                    onChange={(e) => setStepTemplate(e.target.value)}
                    placeholder="Texto da mensagem/tarefa"
                    rows={4}
                  />
                </div>
                <Button onClick={handleAddStep} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Passo
                </Button>
              </CardContent>
            </Card>

            {/* Preview Visual da Sequência */}
            {steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview da Sequência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="relative flex items-start gap-4 p-4 border-l-4 rounded-lg bg-gray-50"
                        style={{
                          borderLeftColor: 
                            step.tipo === 'email' ? '#3b82f6' :
                            step.tipo === 'whatsapp' ? '#25d366' :
                            '#8b5cf6'
                        }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getTipoIcon(step.tipo)}
                              {getTipoLabel(step.tipo)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Dia {step.day_offset === 0 ? 'inicial' : `+${step.day_offset}`}
                            </span>
                          </div>
                          {step.subject && (
                            <div className="font-medium text-sm mb-1">{step.subject}</div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {step.template_text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de passos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Passos Configurados ({steps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {steps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum passo configurado ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getTipoIcon(step.tipo)}
                            {getTipoLabel(step.tipo)}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Dia {step.day_offset}</span>
                            {step.subject && (
                              <span className="text-sm text-muted-foreground">
                                - {step.subject}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {step.template_text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

