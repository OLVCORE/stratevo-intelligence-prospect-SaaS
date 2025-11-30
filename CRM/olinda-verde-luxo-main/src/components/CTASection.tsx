import { Button } from "@/components/ui/button";
import { Calendar, Calculator, MessageCircle } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4">
            Pronto para dar o próximo passo?
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha a melhor forma de conhecer o Espaço Olinda e planejar seu evento perfeito
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Agendar Visita */}
          <div className="bg-background rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border border-primary/10">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Agende uma Visita</h3>
            <p className="text-muted-foreground mb-6">
              Conheça o espaço pessoalmente com um tour guiado e atendimento personalizado.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={() => window.location.href = '/agendamento'}
            >
              Agendar Agora
            </Button>
          </div>

          {/* Calculadora */}
          <div className="bg-background rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border border-primary/10">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Calcule seu Orçamento</h3>
            <p className="text-muted-foreground mb-6">
              Faça uma simulação rápida e descubra o investimento para seu evento.
            </p>
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/calculadora'}
            >
              Calcular Agora
            </Button>
          </div>

          {/* Fale Conosco */}
          <div className="bg-background rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border border-primary/10">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Fale Conosco</h3>
            <p className="text-muted-foreground mb-6">
              Tire suas dúvidas diretamente com nossa equipe via WhatsApp ou chat.
            </p>
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '#contato'}
            >
              Entrar em Contato
            </Button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
          <div>
            <div className="text-3xl font-bold text-primary mb-1">17+</div>
            <div className="text-sm text-muted-foreground">Anos de Experiência</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Eventos Realizados</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-1">200</div>
            <div className="text-sm text-muted-foreground">Capacidade</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-1">100%</div>
            <div className="text-sm text-muted-foreground">Satisfação</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
