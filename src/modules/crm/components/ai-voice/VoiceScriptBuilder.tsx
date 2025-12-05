import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, GripVertical, MessageSquare, Zap, 
  FileText, Copy, RefreshCw, Save, PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: 'open' | 'yesno' | 'multiple';
  options?: string[];
}

interface Objection {
  id: string;
  objection: string;
  response: string;
}

const TEMPLATES = {
  b2b_saas: {
    name: 'B2B SaaS',
    greeting: 'Olá! Sou o assistente virtual da {company_name}. Estou entrando em contato sobre soluções de software que podem otimizar seus processos. Você tem alguns minutos?',
    questions: [
      { id: '1', text: 'Qual o maior desafio que sua empresa enfrenta atualmente?', type: 'open' },
      { id: '2', text: 'Vocês utilizam algum sistema atualmente para gestão?', type: 'yesno' },
      { id: '3', text: 'Quantos usuários teriam acesso ao sistema?', type: 'open' },
    ],
    objections: [
      { id: '1', objection: 'Já temos um sistema', response: 'Entendo! Muitos de nossos clientes também tinham. O que descobrimos é que a integração de sistemas gera uma economia média de 40%. Posso compartilhar alguns casos similares?' },
      { id: '2', objection: 'Muito caro', response: 'Compreendo sua preocupação. Na verdade, nosso ROI médio é de 18 meses. Que tal calcularmos juntos quanto sua empresa economizaria?' },
    ]
  },
  ecommerce: {
    name: 'E-commerce',
    greeting: 'Olá! Sou o assistente virtual da {company_name}. Vi que vocês têm uma loja online. Estou ligando para falar sobre como podemos aumentar suas vendas. Posso explicar rapidamente?',
    questions: [
      { id: '1', text: 'Quantas vendas vocês realizam por mês atualmente?', type: 'open' },
      { id: '2', text: 'Qual sua principal dificuldade: tráfego, conversão ou logística?', type: 'multiple', options: ['Tráfego', 'Conversão', 'Logística'] },
      { id: '3', text: 'Vocês já investem em marketing digital?', type: 'yesno' },
    ],
    objections: [
      { id: '1', objection: 'Não tenho tempo agora', response: 'Entendo perfeitamente! Que tal agendarmos uma conversa de 15 minutos em um horário melhor para você?' },
      { id: '2', objection: 'Já trabalho com outra empresa', response: 'Ótimo! Ter parceiros é importante. Muitos de nossos clientes trabalham com múltiplas soluções. Posso enviar um material comparativo?' },
    ]
  },
  servicos: {
    name: 'Serviços Profissionais',
    greeting: 'Olá! Sou o assistente virtual da {company_name}. Estamos ajudando empresas de serviços a automatizar processos e aumentar eficiência. Você tem interesse em conhecer?',
    questions: [
      { id: '1', text: 'Quantos colaboradores sua empresa possui?', type: 'open' },
      { id: '2', text: 'Quais processos vocês gostariam de automatizar primeiro?', type: 'open' },
      { id: '3', text: 'Vocês têm orçamento aprovado para investir em tecnologia?', type: 'yesno' },
    ],
    objections: [
      { id: '1', objection: 'Não é nossa prioridade agora', response: 'Compreendo. Apenas para contextualizar: empresas que automatizam economizam em média 30% do tempo operacional. Posso enviar um e-book sobre o tema?' },
      { id: '2', objection: 'Preciso conversar com meu sócio', response: 'Claro! Faz total sentido. Que tal eu enviar um material completo para vocês analisarem juntos?' },
    ]
  }
};

export function VoiceScriptBuilder({ onSave }: { onSave?: (data: any) => void }) {
  const { tenant } = useTenant();
  const [greeting, setGreeting] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [closing, setClosing] = useState('');

  // Aplicar template
  const applyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    setGreeting(template.greeting.replace('{company_name}', tenant?.name || 'nossa empresa'));
    setQuestions(template.questions as Question[]);
    setObjections(template.objections as Objection[]);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  // Adicionar pergunta
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'open'
    };
    setQuestions([...questions, newQuestion]);
  };

  // Remover pergunta
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Atualizar pergunta
  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  // Adicionar objeção
  const addObjection = () => {
    const newObjection: Objection = {
      id: Date.now().toString(),
      objection: '',
      response: ''
    };
    setObjections([...objections, newObjection]);
  };

  // Remover objeção
  const removeObjection = (id: string) => {
    setObjections(objections.filter(o => o.id !== id));
  };

  // Atualizar objeção
  const updateObjection = (id: string, field: keyof Objection, value: string) => {
    setObjections(objections.map(o => 
      o.id === id ? { ...o, [field]: value } : o
    ));
  };

  // Salvar script
  const handleSave = () => {
    const scriptData = {
      greeting_script: greeting,
      qualification_questions: questions.map(q => q.text),
      objection_handling: objections.reduce((acc, obj) => ({
        ...acc,
        [obj.objection]: obj.response
      }), {}),
      closing_script: closing
    };

    if (onSave) {
      onSave(scriptData);
    }
    toast.success('Script salvo com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Templates Prontos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Templates Prontos
          </CardTitle>
          <CardDescription>
            Comece rápido com scripts pré-configurados para seu segmento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <Card key={key} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4" onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{template.name}</h4>
                    <Badge variant="outline">{template.questions.length} perguntas</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.greeting.substring(0, 100)}...
                  </p>
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    <Copy className="w-4 h-4 mr-2" />
                    Usar Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="greeting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="greeting">Saudação</TabsTrigger>
          <TabsTrigger value="questions">Perguntas</TabsTrigger>
          <TabsTrigger value="objections">Objeções</TabsTrigger>
          <TabsTrigger value="closing">Encerramento</TabsTrigger>
        </TabsList>

        {/* Tab: Saudação */}
        <TabsContent value="greeting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Script de Saudação</CardTitle>
              <CardDescription>
                Como o agente iniciará a conversa (use {'{company_name}'} para nome dinâmico)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Olá! Sou o assistente virtual da {company_name}..."
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Variáveis disponíveis: {'{company_name}'}, {'{lead_name}'}, {'{lead_company}'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Perguntas */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Perguntas de Qualificação</CardTitle>
                  <CardDescription>
                    Defina as perguntas que o agente fará para qualificar o lead
                  </CardDescription>
                </div>
                <Button onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pergunta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma pergunta adicionada ainda</p>
                  <Button variant="outline" onClick={addQuestion} className="mt-4">
                    Adicionar Primeira Pergunta
                  </Button>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Card key={question.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge>{index + 1}</Badge>
                            <Input
                              placeholder="Digite a pergunta..."
                              value={question.text}
                              onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                          {question.type === 'multiple' && (
                            <div className="ml-12">
                              <Label className="text-xs">Opções (separadas por vírgula)</Label>
                              <Input
                                placeholder="Opção 1, Opção 2, Opção 3"
                                value={question.options?.join(', ')}
                                onChange={(e) => updateQuestion(question.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Objeções */}
        <TabsContent value="objections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tratamento de Objeções</CardTitle>
                  <CardDescription>
                    Ensine o agente como responder objeções comuns
                  </CardDescription>
                </div>
                <Button onClick={addObjection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Objeção
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {objections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma objeção configurada ainda</p>
                  <Button variant="outline" onClick={addObjection} className="mt-4">
                    Adicionar Primeira Objeção
                  </Button>
                </div>
              ) : (
                objections.map((objection, index) => (
                  <Card key={objection.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge>Objeção {index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjection(objection.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Objeção do Prospect</Label>
                          <Input
                            placeholder='Ex: "Já temos um sistema"'
                            value={objection.objection}
                            onChange={(e) => updateObjection(objection.id, 'objection', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Resposta do Agente</Label>
                          <Textarea
                            placeholder="Ex: Entendo! Muitos de nossos clientes também tinham..."
                            value={objection.response}
                            onChange={(e) => updateObjection(objection.id, 'response', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Encerramento */}
        <TabsContent value="closing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Script de Encerramento</CardTitle>
              <CardDescription>
                Como o agente encerrará a conversa de forma profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Foi um prazer conversar com você. Em breve um consultor entrará em contato..."
                value={closing}
                onChange={(e) => setClosing(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Salvar Script
        </Button>
        <Button variant="outline" size="lg">
          <PlayCircle className="w-4 h-4 mr-2" />
          Testar Script
        </Button>
        <Button variant="outline" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Resetar
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview do Script Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm font-mono bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
            {greeting && (
              <div>
                <Badge className="mb-2">Saudação</Badge>
                <p className="text-muted-foreground">{greeting}</p>
              </div>
            )}
            
            {questions.length > 0 && (
              <div>
                <Badge className="mb-2">Perguntas ({questions.length})</Badge>
                {questions.map((q, i) => (
                  <p key={q.id} className="text-muted-foreground ml-4">
                    {i + 1}. {q.text || '(vazio)'}
                  </p>
                ))}
              </div>
            )}

            {objections.length > 0 && (
              <div>
                <Badge className="mb-2">Objeções ({objections.length})</Badge>
                {objections.map((o) => (
                  <div key={o.id} className="ml-4 mb-2">
                    <p className="text-muted-foreground">
                      <strong>Se:</strong> {o.objection || '(vazio)'}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Responder:</strong> {o.response || '(vazio)'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {closing && (
              <div>
                <Badge className="mb-2">Encerramento</Badge>
                <p className="text-muted-foreground">{closing}</p>
              </div>
            )}

            {!greeting && questions.length === 0 && objections.length === 0 && !closing && (
              <p className="text-center text-muted-foreground py-8">
                Script vazio. Use um template ou adicione conteúdo nas abas acima.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
