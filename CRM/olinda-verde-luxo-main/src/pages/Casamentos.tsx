import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Heart, Users, Home, Calendar } from "lucide-react";
import EventSchema from "@/components/schemas/EventSchema";
import Breadcrumbs from "@/components/Breadcrumbs";

const Casamentos = () => {
  return (
    <div className="min-h-screen">
      <EventSchema
        eventType="Wedding"
        name="Casamentos no Espaço Olinda"
        description="Celebre o amor em um espaço exclusivo rodeado pela natureza exuberante de São Paulo. Estrutura completa para casamentos até 150 pessoas com hospedagem on-site."
        offers={[
          { name: "Pacote Locação", price: "15000", priceCurrency: "BRL" },
          { name: "Pacote Completo", price: "40000", priceCurrency: "BRL" },
        ]}
      />
      <Header />
      
      <div className="container mx-auto px-4 pt-20">
        <Breadcrumbs
          items={[
            { name: "Início", href: "/" },
            { name: "Casamentos" },
          ]}
        />
      </div>
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/galeria/espacoolinda/2379529821192281476.jpg"
            alt="Casamento no Espaço Olinda - cerimônia em ambiente natural"
            className="w-full h-full object-cover"
            style={{ filter: 'blur(2px)' }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Onde o "Sim" Encontra a Natureza
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Celebre o amor em um espaço exclusivo rodeado pela natureza exuberante de São Paulo
          </p>
          <Button size="lg" className="text-lg px-8">
            Agendar Visita
          </Button>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Por Que Escolher o Espaço Olinda?
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Cada detalhe pensado para tornar seu casamento inesquecível
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-card rounded-lg p-8 shadow-lg">
              <Heart className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Exclusividade Total</h3>
              <p className="text-muted-foreground">
                Apenas 1 evento por dia. O espaço é inteiramente seu, sem compartilhamento. 
                Você e seus convidados terão privacidade absoluta para celebrar este momento único.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-lg">
              <Home className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Hospedagem On-Site</h3>
              <p className="text-muted-foreground">
                Suítes e acomodações para até 40 pessoas. Seus familiares e padrinhos podem 
                aproveitar o pré e pós-casamento sem preocupações com deslocamento.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-lg">
              <Calendar className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Cerimônia Coberta</h3>
              <p className="text-muted-foreground">
                Estrutura coberta para a cerimônia garante conforto em qualquer clima. 
                Sol ou chuva, seu grande dia acontece sem imprevistos.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-lg">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Capacidade Ideal</h3>
              <p className="text-muted-foreground">
                Espaço projetado para até 150 convidados, criando a atmosfera perfeita 
                entre intimidade e celebração. Áreas internas e externas integradas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Incluso no Pacote Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            O Que Está Incluso
          </h2>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 max-w-4xl mx-auto">
            {[
              "Uso exclusivo do espaço durante o período contratado",
              "Cerimônia coberta com estrutura completa",
              "Hospedagem on-site para até 40 pessoas",
              "Área de recepção interna e externa",
              "Mobiliário: mesas, cadeiras, bancos",
              "Estacionamento amplo para convidados",
              "Equipe de apoio e segurança durante o período contratado",
              "Gerador de energia de backup",
              "Sistema de som ambiente",
              "Iluminação decorativa externa",
              "Área kids com brinquedos",
              "Assessoria para montagem de fornecedores"
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pacotes e Valores Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Pacotes e Investimento
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Transparência total nos valores
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pacote Locação */}
            <div className="border-2 border-border rounded-lg p-8 hover:border-primary transition-colors">
              <h3 className="text-2xl font-bold mb-2">Pacote Locação</h3>
              <div className="text-4xl font-bold text-primary mb-6">
                A partir de R$ 15.000
              </div>
              <p className="text-muted-foreground mb-6">
                Ideal para quem deseja contratar fornecedores independentes
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>Uso exclusivo do espaço durante o período contratado</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>Toda infraestrutura e mobiliário</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>Liberdade total de fornecedores</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span className="font-medium">Monte seu pacote exclusivo e acomode sua família e amigos em nossas suítes aconchegantes</span>
                </li>
              </ul>
              <Button className="w-full mt-8" variant="outline">
                Solicitar Orçamento
              </Button>
            </div>

            {/* Pacote Completo */}
            <div className="border-2 border-primary rounded-lg p-8 relative bg-primary/5">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                MAIS ESCOLHIDO
              </div>
              <h3 className="text-2xl font-bold mb-2">Pacote Completo</h3>
              <div className="text-4xl font-bold text-primary mb-6">
                A partir de R$ 40.000
              </div>
              <p className="text-muted-foreground mb-6">
                Tudo incluso para até 150 pessoas
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>Tudo do Pacote Locação</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>Buffet completo + bebidas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>Equipe de garçons e bartenders</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>Limpeza e segurança</span>
                </li>
              </ul>
              <Button className="w-full mt-8">
                Solicitar Orçamento
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            * Valores válidos para 2025. Pacotes customizáveis conforme necessidades do casal.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0">
          <img
            src="/galeria/espacoolinda/2794495467876746762.jpg"
            alt="Vista do Espaço Olinda ao entardecer - casamentos inesquecíveis"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto Para Realizar o Casamento dos Seus Sonhos?
          </h2>
          <p className="text-xl mb-8">
            Agende uma visita e conheça pessoalmente o Espaço Olinda. 
            Nosso time está pronto para ajudar você a planejar cada detalhe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg">
              Agendar Visita
            </Button>
            <Button size="lg" variant="outline" className="text-lg bg-white/10 border-white text-white hover:bg-white hover:text-primary">
              Solicitar Orçamento
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Casamentos;
