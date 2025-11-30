import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface WhatsAppQuickRepliesProps {
  onSelectReply: (message: string) => void;
}

export const WhatsAppQuickReplies = ({ onSelectReply }: WhatsAppQuickRepliesProps) => {
  const quickReplies = [
    {
      category: "Saudação",
      replies: [
        "Olá! Como posso ajudar com seu evento?",
        "Bom dia! Obrigado por entrar em contato com o Espaço Olinda.",
        "Boa tarde! Estamos aqui para tornar seu evento inesquecível.",
      ],
    },
    {
      category: "Informações",
      replies: [
        "Nosso espaço comporta até 200 pessoas e oferece infraestrutura completa para seu evento.",
        "Temos diversos pacotes disponíveis. Gostaria de agendar uma visita para conhecer o espaço?",
        "Enviamos uma proposta personalizada em até 24 horas após a visita.",
      ],
    },
    {
      category: "Agendamento",
      replies: [
        "Temos disponibilidade para {{data}}. Qual horário seria melhor para você?",
        "Perfeito! Vou agendar sua visita para {{data}} às {{hora}}. Confirma?",
        "Sua visita está confirmada! Nos vemos em {{data}} às {{hora}}.",
      ],
    },
    {
      category: "Follow-up",
      replies: [
        "Olá {{nome}}! Já teve tempo de analisar nossa proposta?",
        "Oi {{nome}}! Como foi a visita? Ficou com alguma dúvida?",
        "Olá! Passando para saber se precisa de mais informações sobre o evento.",
      ],
    },
    {
      category: "Encerramento",
      replies: [
        "Obrigado pelo contato! Qualquer dúvida, estamos à disposição.",
        "Foi um prazer atendê-lo! Aguardo seu retorno.",
        "Até breve! Esperamos realizar seu evento conosco.",
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Respostas Rápidas
        </CardTitle>
        <CardDescription>
          Clique para inserir uma resposta pronta (use variáveis como {'{{nome}}'}, {'{{data}}'}, {'{{hora}}'})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
        {quickReplies.map((category) => (
          <div key={category.category} className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">{category.category}</h4>
            <div className="space-y-2">
              {category.replies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => onSelectReply(reply)}
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
