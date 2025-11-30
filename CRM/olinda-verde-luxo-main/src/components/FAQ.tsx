import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, DollarSign, Utensils, Clock, Users, Building2, UserCheck, Eye, FileText, Gift, Home, Car, Star, Phone } from "lucide-react";

const faqData = [
  {
    icon: MapPin,
    question: "Onde fica o Espaço Olinda e como chegar?",
    answer: "Estamos localizados na Estrada da Pedra Branca, Km 1,5 - Rua C (ao lado do Colégio Teiji Kita), Santa Isabel - SP. A apenas 50 minutos da capital, no eixo entre Arujá (Via Dutra) e Igaratá (Via Dom Pedro).",
    detail: "📍 Waze: https://waze.com/ul/h6gz5e4hkx | Google Maps: https://maps.app.goo.gl/huT3APdZyHYnC3Vs9"
  },
  {
    icon: DollarSign,
    question: "Qual o valor da locação do Espaço Olinda?",
    answer: "Os valores de locação iniciam em R$ 15.000, incluindo o uso exclusivo do espaço durante o período contratado, mobiliário completo e estrutura de apoio (salas, suítes e áreas de preparação para noivos, padrinhos e familiares)."
  },
  {
    icon: Utensils,
    question: "Há pacotes com buffet incluso?",
    answer: "Sim. O pacote com locação + buffet completo parte de R$ 40.000 para até 150 pessoas, e inclui:",
    list: [
      "Buffet gastronômico completo",
      "Equipe de garçons e copeiros",
      "Serviço de bebidas",
      "Segurança, limpeza e estacionamento"
    ],
    detail: "Serviços como decoração, bar exclusivo, sonorização, audiovisual e cerimonial podem ser contratados à parte, conforme o perfil do evento."
  },
  {
    icon: Clock,
    question: "Qual é a duração dos eventos?",
    answer: "Casamentos e eventos sociais contam com 6 a 8 horas de festa, além de acesso liberado a partir das 9h para preparativos e ambientação.",
    detail: "Para eventos corporativos (confraternizações, lançamentos, workshops), o tempo é ajustado conforme o contrato e a necessidade do cliente."
  },
  {
    icon: Users,
    question: "Qual é a capacidade máxima do Espaço Olinda?",
    answer: "O espaço se adapta para diferentes formatos:",
    list: [
      "Eventos sociais: até 300 convidados",
      "Hospedagem completa: até 40 pessoas, distribuídas entre suítes e acomodações internas",
      "Configuração flexível: coquetel, banquete, teatro, reunião ou imersão empresarial"
    ]
  },
  {
    icon: Building2,
    question: "O Espaço Olinda atende empresas?",
    answer: "Sim. O Espaço Olinda é ideal para eventos corporativos de alto padrão, como:",
    list: [
      "Confraternizações e premiações",
      "Treinamentos, imersões e workshops",
      "Lançamentos de produtos",
      "Experiências de marca, gravações e produções audiovisuais"
    ],
    detail: "A atmosfera é elegante e reservada — perfeita para integrar times, celebrar conquistas e encantar clientes."
  },
  {
    icon: UserCheck,
    question: "Posso contratar meus próprios fornecedores?",
    answer: "Sim. O cliente tem liberdade total para escolher seus fornecedores (buffet, decoração, banda, cerimonial, etc.), desde que sejam regulamentados e cumpram as normas de segurança e integridade do espaço."
  },
  {
    icon: Eye,
    question: "Há visitas presenciais ou tours virtuais?",
    answer: "Sim. Oferecemos visitas presenciais agendadas e também tours virtuais personalizados mediante solicitação.",
    detail: "É a melhor forma de conhecer a estrutura completa, a área verde e os ambientes exclusivos antes de fechar seu evento."
  },
  {
    icon: FileText,
    question: "Qual a política de reserva, adiantamento e cancelamento?",
    answer: "As condições são personalizadas conforme o tipo e porte do evento. O contrato é customizado e define percentuais de entrada, prazos e multas.",
    detail: "As remarcações e cancelamentos são tratados com flexibilidade e transparência, buscando sempre preservar o investimento do cliente."
  },
  {
    icon: Gift,
    question: "Há pacotes promocionais ou descontos sazonais?",
    answer: "Sim. O Espaço Olinda publica promoções sazonais e pacotes exclusivos em datas especiais — especialmente para eventos corporativos, elopement weddings e celebrações fora de temporada.",
    detail: "Acompanhe as novidades e campanhas no nosso Instagram oficial."
  },
  {
    icon: Home,
    question: "O Espaço Olinda oferece hospedagem?",
    answer: "Sim. Dispomos de suítes confortáveis e estrutura residencial integrada, permitindo que noivos, familiares e convidados selecionados desfrutem de hospedagem premium e experiências estendidas no local."
  },
  {
    icon: Car,
    question: "O espaço é acessível e possui estacionamento?",
    answer: "Sim. Temos acessibilidade para pessoas com mobilidade reduzida e estacionamento interno seguro, incluído nos pacotes principais."
  },
  {
    icon: Star,
    question: "Quais são os diferenciais do Espaço Olinda?",
    answer: "Os principais diferenciais incluem:",
    list: [
      "Localização estratégica e acesso rápido a São Paulo",
      "Estrutura híbrida (social + corporativa)",
      "Espaços amplos, verdes e sofisticados",
      "Liberdade total para fornecedores",
      "Capacidade de hospedagem no mesmo local",
      "Gestão personalizada e atendimento premium",
      "Experiência de evento completa: da celebração ao descanso"
    ]
  },
  {
    icon: Phone,
    question: "Como posso solicitar um orçamento personalizado?",
    answer: "Entre em contato pelo WhatsApp oficial ou pelo formulário do site, informando:",
    list: [
      "Tipo de evento",
      "Data desejada",
      "Número estimado de convidados",
      "Serviços adicionais desejados"
    ],
    detail: "Nossa equipe retornará com uma proposta customizada e detalhada, dentro de 1 dia útil."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo o que você precisa saber sobre o Espaço Olinda. Transparência total para planejar seu evento com confiança.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq, index) => {
              const Icon = faq.icon;
              return (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline group">
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="pl-14 space-y-3 text-muted-foreground">
                      <p>{faq.answer}</p>
                      {faq.list && (
                        <ul className="space-y-2 mt-3">
                          {faq.list.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {faq.detail && (
                        <p className="mt-3 text-sm italic border-l-2 border-primary/30 pl-4">
                          {faq.detail}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Não encontrou o que procurava?</p>
          <a 
            href="#contato" 
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Entre em Contato
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;