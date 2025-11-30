import { ArrowRight } from "lucide-react";
import heroPoster from "@/assets/hero-main-real.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover brightness-50"
          poster={heroPoster}
        >
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60" />
      </div>

      {/* Content com Contraste Melhorado */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="max-w-3xl animate-slide-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight text-white drop-shadow-2xl">
            Onde o "sim" encontra a{" "}
            <span className="text-primary drop-shadow-lg">natureza</span> — e tudo fica perfeito.
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-white/95 font-light drop-shadow-lg">
            Cerimônia coberta • Hospedagem on-site • 1 evento por dia
          </p>
          
          <p className="text-lg mb-10 text-white/90 max-w-2xl leading-relaxed drop-shadow-md">
            Uma experiência completa a poucos minutos da cidade. O Espaço Olinda oferece 
            o cenário perfeito para seu casamento dos sonhos ou evento corporativo exclusivo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/agendamento"
              className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:gap-3 shadow-xl shadow-primary/20"
            >
              Agendar Visita
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/60 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
