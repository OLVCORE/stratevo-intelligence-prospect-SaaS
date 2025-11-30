import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Lightbulb, Users, Wifi, Coffee, Shield } from "lucide-react";
import EventSchema from "@/components/schemas/EventSchema";
import Breadcrumbs from "@/components/Breadcrumbs";

const Corporativo = () => {
  return (
    <div className="min-h-screen">
      <EventSchema
        eventType="BusinessEvent"
        name="Eventos Corporativos no Espaço Olinda"
        description="O ambiente ideal para treinamentos, lançamentos e confraternizações empresariais. Estrutura profissional completa em meio à natureza."
        offers={[
          { name: "Meio Período", price: "8000", priceCurrency: "BRL" },
          { name: "Dia Completo", price: "15000", priceCurrency: "BRL" },
          { name: "Imersão", price: "25000", priceCurrency: "BRL" },
        ]}
      />
      <Header />
      
      <div className="container mx-auto px-4 pt-20">
        <Breadcrumbs
          items={[
            { name: "Início", href: "/" },
            { name: "Corporativo" },
          ]}
        />
      </div>
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/galeria/espacoolinda/1543149765041980857.jpg"
            alt="Evento Corporativo no Espaço Olinda - ambiente profissional"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Eventos Corporativos de Impacto
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            O ambiente ideal para treinamentos, lançamentos e confraternizações empresariais
          </p>
          <Button size="lg" className="text-lg px-8">
            Solicitar Proposta
          </Button>
        </div>
      </section>

      {/* Tipos de Eventos Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Eventos Corporativos Ideais para o Espaço
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Estrutura completa para diversos formatos de eventos empresariais
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-lg text-center">
              <Lightbulb className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Treinamentos e Workshops</h3>
              <p className="text-muted-foreground">
                Ambiente inspirador afastado da agitação urbana. Ideal para capacitações, 
                workshops e programas de desenvolvimento de equipes.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-lg text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Confraternizações</h3>
              <p className="text-muted-foreground">
                Celebre conquistas da empresa em um espaço único. Perfeito para festas 
                de fim de ano, aniversários corporativos e team buildings.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-lg text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Lançamentos de Produtos</h3>
              <p className="text-muted-foreground">
                Ambiente sofisticado para apresentar novos produtos ou serviços. 
                Impressione clientes e parceiros com exclusividade e natureza.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Infraestrutura Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Infraestrutura Profissional
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Wifi, title: "Wi-Fi de Alta Velocidade", desc: "Internet fibra para videoconferências e streaming" },
              { icon: Coffee, title: "Coffee Break", desc: "Área equipada para pausas e networking" },
              { icon: Shield, title: "Segurança Durante o Evento", desc: "Equipe dedicada para tranquilidade durante todo o período" },
              { icon: Users, title: "Capacidade até 150", desc: "Espaços flexíveis para diferentes formatos" },
              { icon: Lightbulb, title: "Iluminação Profissional", desc: "Sistema ajustável para apresentações" },
              { icon: Check, title: "Equipamento A/V", desc: "Projetor, telão e sistema de som disponível" }
            ].map((item, index) => (
              <div key={index} className="bg-background rounded-lg p-6 shadow">
                <item.icon className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais Corporativos Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Por Que Empresas Escolhem o Espaço Olinda?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Foco Total</h3>
                  <p className="text-muted-foreground">
                    Afastado da cidade, suas equipes se concentram 100% no evento 
                    sem distrações urbanas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Exclusividade</h3>
                  <p className="text-muted-foreground">
                    Apenas 1 evento por dia. Privacidade e sigilo garantidos para 
                    reuniões estratégicas e lançamentos confidenciais.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Flexibilidade</h3>
                  <p className="text-muted-foreground">
                    Espaços indoor e outdoor adaptáveis. Configure o ambiente 
                    conforme o formato do seu evento.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Localização Estratégica</h3>
                  <p className="text-muted-foreground">
                    A 50 minutos de São Paulo. Fácil acesso para colaboradores e 
                    clientes vindos da capital e região.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
              <img 
                src="/galeria/espacoolinda/1928569793858940144.jpg" 
                alt="Evento corporativo no Espaço Olinda com equipe reunida"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pacotes Corporativos Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Pacotes Corporativos
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Soluções customizadas para cada tipo de evento
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Pacote Meio Período */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Meio Período</h3>
              <div className="text-3xl font-bold text-primary mb-4">
                A partir de R$ 8.000
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                4 horas de evento
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Uso do espaço</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Wi-Fi e equipamento A/V</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Coffee break básico</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Estacionamento</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-6">
                Solicitar Proposta
              </Button>
            </div>

            {/* Pacote Dia Completo */}
            <div className="bg-background border-2 border-primary rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Dia Completo</h3>
              <div className="text-3xl font-bold text-primary mb-4">
                A partir de R$ 15.000
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                8 horas de evento
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Tudo do Meio Período</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Almoço completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Coffee breaks (2x)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Equipe de apoio</span>
                </li>
              </ul>
              <Button className="w-full mt-6">
                Solicitar Proposta
              </Button>
            </div>

            {/* Pacote Imersão */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Imersão</h3>
              <div className="text-3xl font-bold text-primary mb-4">
                A partir de R$ 25.000
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                2 dias com hospedagem
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Tudo do Dia Completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Hospedagem (até 40 pax)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Café da manhã e jantar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                  <span>Atividades de integração</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-6">
                Solicitar Proposta
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            * Valores de referência. Propostas customizadas conforme necessidades específicas da empresa.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto Para Criar um Evento Corporativo Memorável?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Entre em contato e nossa equipe comercial preparará uma proposta 
            personalizada para as necessidades da sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg">
              Solicitar Proposta
            </Button>
            <Button size="lg" variant="outline" className="text-lg border-white text-white hover:bg-white hover:text-primary">
              Agendar Visita Técnica
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Corporativo;
