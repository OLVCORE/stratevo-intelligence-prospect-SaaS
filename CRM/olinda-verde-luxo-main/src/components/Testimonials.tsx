import { Star } from "lucide-react";

export type Testimonial = {
  name: string;
  event: string;
  date: string;
  isoDate: string;
  rating: number;
  text: string;
  initials: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Ana Paula & Ricardo",
    event: "Casamento",
    date: "Setembro 2024",
    isoDate: "2024-09-15",
    rating: 5,
    text: "O Espaço Olinda superou todas as nossas expectativas. A cerimônia ao ar livre foi mágica e a equipe nos apoiou em cada detalhe. Nossos convidados elogiaram muito!",
    initials: "AP",
  },
  {
    name: "Tech Solutions Brasil",
    event: "Evento Corporativo",
    date: "Agosto 2024",
    isoDate: "2024-08-20",
    rating: 5,
    text: "Realizamos nosso evento de lançamento no Espaço Olinda. A estrutura é impecável, o ambiente inspirador e o atendimento excepcional. Voltaremos com certeza!",
    initials: "TS",
  },
  {
    name: "Juliana & Fernando",
    event: "Casamento",
    date: "Julho 2024",
    isoDate: "2024-07-10",
    rating: 5,
    text: "Um sonho realizado! Desde a primeira visita até o grande dia, tudo foi perfeito. A hospedagem permitiu que aproveitássemos cada momento com nossa família.",
    initials: "JF",
  },
];

const Testimonials = () => {
  const reviewsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: testimonials.map((t, index) => ({
      "@type": "Review",
      position: index + 1,
      author: { "@type": "Person", name: t.name },
      datePublished: t.isoDate,
      reviewBody: t.text,
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(t.rating),
        bestRating: "5",
        worstRating: "1",
      },
      itemReviewed: {
        "@type": "EventVenue",
        name: "Espaço Olinda",
      },
    })),
  };

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-secondary/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            O Que Nossos <span className="text-primary">Clientes</span> Dizem
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Histórias reais de quem confiou no Espaço Olinda para celebrar seus momentos mais importantes.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="card-premium p-8"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                  <span className="text-lg font-bold text-primary">
                    {testimonial.initials}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-foreground/60">
                    {testimonial.event} • {testimonial.date}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground/80 leading-relaxed italic">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-foreground/70">Eventos Realizados</div>
          </div>
          <div className="h-12 w-px bg-primary/20" />
          <div>
            <div className="text-4xl font-bold text-primary mb-2">4.9</div>
            <div className="text-sm text-foreground/70">Avaliação Média</div>
          </div>
          <div className="h-12 w-px bg-primary/20" />
          <div>
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-foreground/70">Satisfação</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
