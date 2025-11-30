import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChefHat, Wine, Sparkles, UtensilsCrossed } from "lucide-react";

const Gastronomia = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/galeria/espacoolinda/3475295836982687835_3475295828744869905.jpg"
            alt="Gastronomia no Espaço Olinda - experiência gastronômica premium"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full backdrop-blur-sm">
                <ChefHat className="w-16 h-16 text-primary" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-foreground mb-6 tracking-tight">
              Gastronomia & Bar
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Uma experiência gastronômica exclusiva para celebrar momentos inesquecíveis
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
              Sabores que Encantam
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              No Espaço Olinda, a gastronomia é parte fundamental da experiência. 
              Nossa equipe de profissionais cria cardápios personalizados que harmonizam 
              perfeitamente com cada tipo de celebração, sempre priorizando ingredientes 
              frescos, apresentação impecável e sabores memoráveis.
            </p>
          </div>
        </div>
      </section>

      {/* Cardápios Section - Ready to be filled */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <UtensilsCrossed className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
              Nossos Cardápios
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Opções cuidadosamente elaboradas para cada ocasião especial
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Cardápio Card 1 */}
            <div className="group card-premium p-8 hover:shadow-2xl transition-all duration-500 animate-fade-in">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <ChefHat className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-4">
                Menu Executivo
              </h3>
              <p className="text-muted-foreground mb-6">
                Perfeito para eventos corporativos e celebrações intimistas
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-6" />
              <p className="text-sm text-muted-foreground italic">
                Cardápio em breve...
              </p>
            </div>

            {/* Cardápio Card 2 */}
            <div className="group card-premium p-8 hover:shadow-2xl transition-all duration-500 animate-fade-in delay-100">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-4">
                Menu Premium
              </h3>
              <p className="text-muted-foreground mb-6">
                Experiência gastronômica sofisticada para casamentos e grandes eventos
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-6" />
              <p className="text-sm text-muted-foreground italic">
                Cardápio em breve...
              </p>
            </div>

            {/* Cardápio Card 3 */}
            <div className="group card-premium p-8 hover:shadow-2xl transition-all duration-500 animate-fade-in delay-200">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <UtensilsCrossed className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-4">
                Menu Personalizado
              </h3>
              <p className="text-muted-foreground mb-6">
                Criado exclusivamente para atender suas preferências e necessidades
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-6" />
              <p className="text-sm text-muted-foreground italic">
                Cardápio em breve...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bar Section - Ready to be filled */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Wine className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
              Bar & Drinks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Drinks autorais, carta de vinhos selecionada e serviço de bartending premium
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Drinks Section */}
              <div className="card-premium p-10 text-center animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wine className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-serif text-foreground mb-4">
                  Drinks Autorais
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Criações exclusivas e clássicos revisitados por nossos bartenders especializados
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-8" />
                <p className="text-sm text-muted-foreground italic">
                  Menu de drinks em breve...
                </p>
              </div>

              {/* Bar Services */}
              <div className="card-premium p-10 text-center animate-fade-in delay-100">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-serif text-foreground mb-4">
                  Serviços Premium
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Open bar completo, carta de vinhos, espumantes e serviço de coquetelaria
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-8" />
                <p className="text-sm text-muted-foreground italic">
                  Detalhes dos serviços em breve...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
              Pronto para uma Experiência Gastronômica Única?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Entre em contato e descubra como podemos criar um menu exclusivo para o seu evento
            </p>
            <a 
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/20 font-medium"
            >
              <Wine className="w-5 h-5" />
              Solicite um Orçamento
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gastronomia;
