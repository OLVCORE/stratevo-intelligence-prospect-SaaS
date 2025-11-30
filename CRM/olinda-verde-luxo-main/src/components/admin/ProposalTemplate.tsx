import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo-official.png";

interface ProposalTemplateProps {
  proposal: any;
}

export const ProposalTemplate = ({ proposal }: ProposalTemplateProps) => {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <img src={logo} alt="Logo" className="h-16" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-primary">PROPOSTA COMERCIAL</h1>
            <p className="text-sm text-muted-foreground">Nº {proposal.proposal_number}</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">CLIENTE</h3>
            <p className="font-medium">{proposal.leads?.name || "N/A"}</p>
            <p className="text-sm">{proposal.leads?.email}</p>
            <p className="text-sm">{proposal.leads?.phone}</p>
            {proposal.leads?.company_name && (
              <p className="text-sm font-medium mt-1">{proposal.leads.company_name}</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">EVENTO</h3>
            <p className="text-sm"><span className="font-medium">Tipo:</span> {proposal.event_type}</p>
            {proposal.event_date && (
              <p className="text-sm">
                <span className="font-medium">Data:</span>{" "}
                {format(new Date(proposal.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
            {proposal.guest_count && (
              <p className="text-sm"><span className="font-medium">Convidados:</span> {proposal.guest_count}</p>
            )}
            <p className="text-sm">
              <span className="font-medium">Validade:</span>{" "}
              {format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">SERVIÇOS INCLUSOS</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
              <div>
                <p className="font-medium">Locação do Espaço</p>
                <p className="text-sm text-muted-foreground">Espaço Colinda - Uso exclusivo do local</p>
              </div>
              <p className="font-bold">R$ {proposal.venue_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
              <div>
                <p className="font-medium">Gastronomia</p>
                <p className="text-sm text-muted-foreground">
                  Cardápio completo para {proposal.guest_count} pessoas
                </p>
              </div>
              <p className="font-bold">R$ {proposal.catering_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>

            {proposal.extra_services && proposal.extra_services.length > 0 && (
              <>
                <h4 className="font-semibold mt-4">Serviços Adicionais</h4>
                {proposal.extra_services.map((service: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                    <p className="font-medium">{service.name}</p>
                    <p className="font-bold">R$ {service.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">R$ {proposal.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          
          {proposal.discount_percentage > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto ({proposal.discount_percentage}%)</span>
              <span className="font-medium">
                - R$ {((proposal.total_price * proposal.discount_percentage) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between text-xl font-bold pt-3 border-t">
            <span>VALOR TOTAL</span>
            <span className="text-primary">R$ {proposal.final_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Terms */}
        {proposal.terms_and_conditions && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">TERMOS E CONDIÇÕES</h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {proposal.terms_and_conditions}
            </p>
          </div>
        )}

        {/* Notes */}
        {proposal.notes && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">OBSERVAÇÕES</h3>
            <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Espaço Colinda - Espaço para Eventos</p>
          <p>contato@espacoolinda.com.br | (11) 5028-3344</p>
          <p className="mt-2">Proposta válida até {format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </CardContent>
    </Card>
  );
};