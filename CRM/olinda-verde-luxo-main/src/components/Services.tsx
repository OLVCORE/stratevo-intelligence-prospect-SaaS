import { Heart, Building2, Home } from "lucide-react";
import { Link } from "react-router-dom";
import weddingImage from "@/assets/wedding-ceremony-real.jpg";
import corporateImage from "@/assets/corporate-event-real.jpg";
import accommodationImage from "@/assets/accommodation-real.jpg";

const services = [
  {
    icon: Heart,
    title: "Casamentos",
    description: "O cenário perfeito para o seu grande dia. Cerimônia ao ar livre com cobertura, decoração personalizada e estrutura completa.",
    image: weddingImage,
    imageAlt: "Cerimônia de casamento ao ar livre no Espaço Olinda com decoração elegante e área verde em Santa Isabel SP",
    features: ["Cerimônia coberta", "Decoração personalizada", "Hospedagem para convidados"],
    link: "/casamentos",
  },
  {
    icon: Building2,
    title: "Eventos Corporativos",
    description: "Espaço versátil para lançamentos, confraternizações e reuniões. Tecnologia, conforto e privacidade no campo.",
    image: corporateImage,
    imageAlt: "Eventos corporativos e confraternizações de empresas no Espaço Olinda - estrutura premium em São Paulo",
    features: ["Equipamentos audiovisuais", "Salões flexíveis", "Catering premium"],
    link: "/corporativo",
  },
  {
    icon: Home,
    title: "Hospedagem",
    description: "Acomodações aconchegantes integradas ao evento. Seus convidados podem aproveitar cada momento sem preocupações.",
    image: accommodationImage,
    imageAlt: "Suítes e acomodações para hospedagem de eventos e casamentos no Espaço Olinda - até 40 pessoas",
    features: ["Quartos privativos", "Café da manhã", "Área de lazer"],
    link: "/hospedagem",
  },
];

const Services = () => {
  return (
    <section id="servicos" className="py-24 lg:py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Experiências que <span className="text-primary">Transformam</span> Momentos
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            Do casamento dos sonhos ao evento corporativo de sucesso. Cada detalhe pensado para criar memórias inesquecíveis.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="card-premium p-8 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-64 rounded-xl overflow-hidden mb-6">
                <img
                  src={service.image}
                  alt={service.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <service.icon className="w-12 h-12 text-primary" />
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              
              <p className="text-foreground/80 mb-6 leading-relaxed">
                {service.description}
              </p>

              <ul className="space-y-3">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                    <span className="text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={service.link}
                className="mt-8 w-full py-3 rounded-lg border-2 border-primary/40 text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center"
              >
                Saiba Mais
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
