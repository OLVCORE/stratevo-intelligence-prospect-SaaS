import { Leaf, MapPin, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Natureza Preservada",
    description: "Área verde de 6.240 m² com paisagismo cuidadoso e atmosfera única.",
  },
  {
    icon: MapPin,
    title: "Localização Privilegiada",
    description: "A 45 minutos de São Paulo, fácil acesso e estacionamento amplo.",
  },
  {
    icon: Clock,
    title: "Exclusividade Total",
    description: "Apenas 1 evento por dia. Toda a atenção para você e seus convidados.",
  },
  {
    icon: Shield,
    title: "Estrutura Completa",
    description: "Gerador, climatização, equipe profissional e suporte integral.",
  },
];

const Features = () => {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10 opacity-5">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            O Melhor do <span className="text-primary">Campo</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Combinamos a tranquilidade da natureza com toda a infraestrutura que seu evento merece.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <feature.icon className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-foreground/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
