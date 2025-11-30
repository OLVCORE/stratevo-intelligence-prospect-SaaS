import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Home, Bed, Coffee, Wifi, AirVent, Users } from "lucide-react";

const Hospedagem = () => {
  const amenities = [
    {
      icon: Bed,
      title: "Quartos Privativos",
      description: "Acomodações confortáveis para até 40 pessoas"
    },
    {
      icon: Coffee,
      title: "Café da Manhã",
      description: "Café colonial completo incluso"
    },
    {
      icon: Wifi,
      title: "Wi-Fi",
      description: "Internet de alta velocidade em todas as áreas"
    },
    {
      icon: AirVent,
      title: "Climatização",
      description: "Ambientes climatizados para seu conforto"
    },
    {
      icon: Users,
      title: "Áreas Comuns",
      description: "Espaços de convivência integrados"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/galeria/espacoolinda/2799019774506057805.jpg"
            alt="Hospedagem no Espaço Olinda - acomodações confortáveis"
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        </div>
        <div className="relative z-10 text-center px-6">
          <Home className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Hospedagem Completa
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Acomodações confortáveis para você e seus convidados aproveitarem cada momento
          </p>
        </div>
      </section>

      {/* Storytelling Section */}
      <section className="py-20 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-4xl font-bold mb-6">
              Mais que <span className="text-primary">Hospedagem</span>
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed mb-6">
              No Espaço Olinda, a experiência vai além do evento. Oferecemos acomodações 
              integradas para que você e seus convidados possam aproveitar cada momento 
              sem preocupações com deslocamento.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Quartos privativos, áreas de convivência aconchegantes e café da manhã 
              colonial completam a vivência única que só o Espaço Olinda proporciona.
            </p>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/galeria/espacoolinda/1909017742917297697.jpg"
              alt="Acomodações premium do Espaço Olinda"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Amenities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {amenities.map((amenity) => (
            <div key={amenity.title} className="card-premium p-8 text-center">
              <amenity.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">{amenity.title}</h3>
              <p className="text-foreground/70">{amenity.description}</p>
            </div>
          ))}
        </div>

        {/* Image Gallery */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
            <img
              src="/galeria/espacoolinda/1923150786754415256.jpg"
              alt="Quarto confortável - Hospedagem Espaço Olinda"
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
            <img
              src="/galeria/espacoolinda/1911122575283653201.jpg"
              alt="Suite premium com vista para natureza"
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
            <img
              src="/galeria/espacoolinda/1910594436165880330.jpg"
              alt="Área comum de convivência"
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para Conhecer?</h2>
          <p className="text-xl text-foreground/80 mb-8">
            Agende uma visita e descubra como podemos tornar seu evento inesquecível
          </p>
          <a
            href="https://wa.me/5511910074444?text=Olá! Gostaria de conhecer as opções de hospedagem do Espaço Olinda."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-xl"
          >
            Agendar Visita
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Hospedagem;
