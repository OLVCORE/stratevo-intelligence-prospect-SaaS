import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo-official.png";

interface ContractTemplateProps {
  proposal: any;
}

export const ContractTemplate = ({ proposal }: ContractTemplateProps) => {
  const today = new Date();

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
          <p className="text-sm text-muted-foreground mt-2">Ref. Proposta Nº {proposal.proposal_number}</p>
        </div>

        {/* Parties */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">CONTRATANTE:</h3>
            <p><strong>Nome:</strong> {proposal.leads?.name || "______________________________"}</p>
            <p><strong>Email:</strong> {proposal.leads?.email || "______________________________"}</p>
            <p><strong>Telefone:</strong> {proposal.leads?.phone || "______________________________"}</p>
            {proposal.leads?.company_name && (
              <p><strong>Empresa:</strong> {proposal.leads.company_name}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">CONTRATADA:</h3>
            <p><strong>Razão Social:</strong> Espaço Colinda Eventos LTDA</p>
            <p><strong>CNPJ:</strong> 00.000.000/0001-00</p>
            <p><strong>Endereço:</strong> [Endereço completo]</p>
            <p><strong>Telefone:</strong> (11) 5028-3344</p>
          </div>
        </div>

        {/* Event Details */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3">CLÁUSULA 1ª - DO OBJETO</h3>
          <p className="text-sm leading-relaxed">
            O presente contrato tem por objeto a prestação de serviços de locação de espaço para eventos e serviços correlatos, 
            conforme especificado abaixo:
          </p>
          
          <div className="mt-4 p-4 bg-muted/30 rounded space-y-2">
            <p><strong>Tipo de Evento:</strong> {proposal.event_type}</p>
            {proposal.event_date && (
              <p>
                <strong>Data do Evento:</strong>{" "}
                {format(new Date(proposal.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
            {proposal.guest_count && (
              <p><strong>Número de Convidados:</strong> {proposal.guest_count} pessoas</p>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3">CLÁUSULA 2ª - DOS SERVIÇOS CONTRATADOS</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between p-2 border-b">
              <span>Locação do Espaço</span>
              <span className="font-medium">R$ {proposal.venue_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between p-2 border-b">
              <span>Gastronomia ({proposal.guest_count} pessoas)</span>
              <span className="font-medium">R$ {proposal.catering_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>

            {proposal.extra_services && proposal.extra_services.length > 0 && (
              <>
                {proposal.extra_services.map((service: any, index: number) => (
                  <div key={index} className="flex justify-between p-2 border-b">
                    <span>{service.name}</span>
                    <span className="font-medium">R$ {service.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3">CLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO</h3>
          
          <div className="space-y-2">
            <p className="text-sm">O valor total dos serviços contratados é de:</p>
            
            {proposal.discount_percentage > 0 && (
              <div className="text-sm text-green-600">
                <p>Desconto aplicado: {proposal.discount_percentage}%</p>
              </div>
            )}
            
            <div className="p-4 bg-primary/10 rounded">
              <p className="text-2xl font-bold text-primary text-center">
                R$ {proposal.final_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-4 text-sm space-y-2">
              <p><strong>Forma de Pagamento:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>30% (sinal) na assinatura do contrato</li>
                <li>40% até 30 dias antes do evento</li>
                <li>30% (saldo) até 7 dias antes do evento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3">CLÁUSULA 4ª - DAS OBRIGAÇÕES DAS PARTES</h3>
          
          <div className="text-sm space-y-3">
            <div>
              <p className="font-semibold">4.1 - São obrigações da CONTRATADA:</p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Fornecer o espaço e os serviços contratados conforme especificado;</li>
                <li>Garantir que o espaço esteja em perfeitas condições de uso;</li>
                <li>Executar os serviços com qualidade e profissionalismo;</li>
                <li>Cumprir os horários acordados para montagem e realização do evento.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">4.2 - São obrigações do CONTRATANTE:</p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Efetuar os pagamentos nas datas estabelecidas;</li>
                <li>Fornecer informações completas e corretas sobre o evento;</li>
                <li>Respeitar as normas e regulamentos do espaço;</li>
                <li>Responsabilizar-se por danos causados por seus convidados.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cancellation */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3">CLÁUSULA 5ª - DO CANCELAMENTO</h3>
          
          <div className="text-sm space-y-2">
            <p>5.1 - Em caso de cancelamento por parte do CONTRATANTE:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Com mais de 90 dias de antecedência: reembolso de 70% dos valores pagos;</li>
              <li>Entre 60 e 90 dias: reembolso de 50% dos valores pagos;</li>
              <li>Entre 30 e 60 dias: reembolso de 30% dos valores pagos;</li>
              <li>Com menos de 30 dias: sem reembolso.</li>
            </ul>
          </div>
        </div>

        {/* Notes */}
        {proposal.notes && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-3">CLÁUSULA 6ª - DAS DISPOSIÇÕES GERAIS</h3>
            <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">CLÁUSULA 7ª - DO FORO</h3>
          <p className="text-sm mb-6">
            As partes elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas oriundas do presente contrato.
          </p>

          <p className="text-sm text-center mb-8">
            São Paulo, {format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>

          <div className="grid grid-cols-2 gap-8 mt-12">
            <div className="text-center">
              <div className="border-t border-foreground pt-2">
                <p className="font-semibold">CONTRATANTE</p>
                <p className="text-sm">{proposal.leads?.name}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground pt-2">
                <p className="font-semibold">CONTRATADA</p>
                <p className="text-sm">Espaço Colinda Eventos LTDA</p>
              </div>
            </div>
          </div>

          {proposal.signature_data && (
            <div className="mt-8 p-4 bg-muted/30 rounded">
              <p className="text-xs text-center text-muted-foreground">
                Documento assinado digitalmente em {format(new Date(proposal.signature_data.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                por {proposal.signature_data.name} - {proposal.signature_data.document}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Espaço Colinda - Espaço para Eventos</p>
          <p>contato@espacoolinda.com.br | (11) 5028-3344</p>
        </div>
      </CardContent>
    </Card>
  );
};