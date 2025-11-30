import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import weddingCeremony from "@/assets/wedding-ceremony.jpg";
import corporateEvent from "@/assets/corporate-event.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import wellnessRetreat from "@/assets/blog-wellness-retreat.jpg";
import techOutdoor from "@/assets/blog-tech-outdoor.jpg";
import leadershipRetreat from "@/assets/blog-leadership-retreat.jpg";
import sustainableWedding from "@/assets/blog-sustainable-wedding.jpg";
import socialIntimate from "@/assets/blog-social-intimate.jpg";
import productivityNature from "@/assets/blog-productivity-nature.jpg";

const Blog = () => {
  const articles = [
    {
      slug: "como-escolher-espaco-casamento-campo",
      title: "Como Escolher o Espaço Perfeito para Casamento no Campo",
      excerpt: "Guia completo com 10 critérios essenciais para avaliar espaços de casamento no campo e garantir que sua escolha seja perfeita.",
      image: weddingCeremony,
      date: "15 de Março, 2025",
      readTime: "8 min",
      category: "Casamentos"
    },
    {
      slug: "retiros-corporativos-bem-estar",
      title: "Retiros Corporativos: Investindo no Bem-Estar da Equipe",
      excerpt: "Como empresas líderes estão usando retiros em ambientes naturais para combater o burnout e aumentar a produtividade sustentável.",
      image: wellnessRetreat,
      date: "20 de Março, 2025",
      readTime: "7 min",
      category: "Corporativo"
    },
    {
      slug: "empresas-tecnologia-campo",
      title: "Por Que Empresas de Tecnologia Estão Levando Eventos Para o Campo",
      excerpt: "Descubra por que startups e empresas de tech estão trocando salas de reunião por espaços ao ar livre para seus eventos estratégicos.",
      image: techOutdoor,
      date: "18 de Março, 2025",
      readTime: "6 min",
      category: "Corporativo"
    },
    {
      slug: "eventos-corporativos-fora-cidade",
      title: "Por Que Realizar Eventos Corporativos Fora da Cidade?",
      excerpt: "Descubra os benefícios de sair do ambiente urbano para treinamentos, workshops e confraternizações empresariais.",
      image: corporateEvent,
      date: "10 de Março, 2025",
      readTime: "6 min",
      category: "Corporativo"
    },
    {
      slug: "lideranca-reflexao-natureza",
      title: "Retiros de Liderança: Reflexão Estratégica em Meio à Natureza",
      excerpt: "Como executivos estão usando retiros no campo para tomar decisões estratégicas longe das distrações do dia a dia corporativo.",
      image: leadershipRetreat,
      date: "12 de Março, 2025",
      readTime: "8 min",
      category: "Corporativo"
    },
    {
      slug: "casamentos-sustentaveis",
      title: "Casamentos Sustentáveis: Celebrando o Amor em Harmonia com a Natureza",
      excerpt: "A nova geração de casais está priorizando sustentabilidade sem abrir mão da beleza e exclusividade em seus casamentos.",
      image: sustainableWedding,
      date: "8 de Março, 2025",
      readTime: "7 min",
      category: "Casamentos"
    },
    {
      slug: "eventos-sociais-intimistas",
      title: "Eventos Sociais Intimistas: A Nova Tendência de Celebrações no Campo",
      excerpt: "Aniversários, comemorações e encontros familiares ganham novo significado em ambientes naturais exclusivos.",
      image: socialIntimate,
      date: "6 de Março, 2025",
      readTime: "5 min",
      category: "Sociais"
    },
    {
      slug: "produtividade-natureza",
      title: "Produtividade e Natureza: Como Ambientes Naturais Potencializam Resultados",
      excerpt: "Estudos científicos comprovam: reuniões e workshops em ambientes naturais geram resultados até 40% superiores.",
      image: productivityNature,
      date: "4 de Março, 2025",
      readTime: "6 min",
      category: "Corporativo"
    },
    {
      slug: "tendencias-casamento-2025",
      title: "Tendências de Casamento 2025: Natureza e Exclusividade",
      excerpt: "As principais tendências para casamentos em 2025 apostam em experiências exclusivas e contato com a natureza.",
      image: gallery1,
      date: "5 de Março, 2025",
      readTime: "7 min",
      category: "Tendências"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/galeria/espacoolinda/2203227716656776526.jpg"
            alt="Blog Espaço Olinda"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 container mx-auto max-w-6xl text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Blog Espaço Olinda
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            Dicas, tendências e inspirações para casamentos e eventos corporativos inesquecíveis
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link 
                key={article.slug}
                to={`/blog/${article.slug}`}
                className="group"
              >
                <article className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{article.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    
                    <p className="text-muted-foreground mb-4 flex-grow">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      Ler mais
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Receba Conteúdos Exclusivos
          </h2>
          <p className="text-muted-foreground mb-8">
            Cadastre-se para receber dicas, tendências e novidades diretamente no seu e-mail
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Seu melhor e-mail"
              className="flex-1 px-4 py-3 rounded-lg border border-input bg-background"
            />
            <Button size="lg" className="sm:w-auto">
              Inscrever-se
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
