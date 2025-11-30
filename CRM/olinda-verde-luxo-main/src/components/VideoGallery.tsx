import { Play } from "lucide-react";
import { useState } from "react";

const videos = [
  {
    src: "/videos/video-1.mp4",
    poster: "/galeria/espacoolinda/1-yeBABbwCDOg_l8WEODdXu8ggiQuQU7V.jpg",
    title: "Vista Aérea do Espaço Olinda",
    duration: "0:45"
  },
  {
    src: "/videos/video-2.mp4",
    poster: "/galeria/espacoolinda/10T5LEO_2zBzB8ALe0c9A36DMKeQnQGiZ.jpg",
    title: "Tour Completo pelas Instalações",
    duration: "1:32"
  },
  {
    src: "/videos/video-3.mp4",
    poster: "/galeria/espacoolinda/10mw6s-YG1NcUz04lyuSzesqDda6wN-ah.jpg",
    title: "Área de Lazer e Piscina",
    duration: "1:15"
  },
  {
    src: "/videos/video-4.mp4",
    poster: "/galeria/espacoolinda/124ZzI-D5fxdrn_Ux8ASz_d4PbV0p9lAz.jpg",
    title: "Jardins e Natureza",
    duration: "0:55"
  },
  {
    src: "/videos/video-5.mp4",
    poster: "/galeria/espacoolinda/12lL8_GfEggvaJbq7M2tW3dPC3bfs4pMc.jpg",
    title: "Infraestrutura Completa",
    duration: "1:20"
  },
  {
    src: "/videos/video-6.mp4",
    poster: "/galeria/espacoolinda/13Ds47d12T2vffW-U7Wwyz2aK02RxFAey.jpg",
    title: "Eventos e Celebrações",
    duration: "1:05"
  },
  {
    src: "/videos/video-7.mp4",
    poster: "/galeria/espacoolinda/13kSdfE2fUMfu-p2WoUV06akcnR4bbdcS.jpg",
    title: "Áreas Verdes",
    duration: "0:50"
  },
  {
    src: "/videos/video-8.mp4",
    poster: "/galeria/espacoolinda/13vh-gMI07dCxgSDytn7ufKBiqSG8Yrvr.jpg",
    title: "Espaços Internos",
    duration: "1:10"
  },
  {
    src: "/videos/video-9.mp4",
    poster: "/galeria/espacoolinda/13yza05PuQsZe63siMqU6hxibWTt8U65f.jpg",
    title: "Detalhes do Ambiente",
    duration: "0:40"
  },
  {
    src: "/videos/video-10.mp4",
    poster: "/galeria/espacoolinda/14JGaL6x_-0LkbZM_5HJ8gAWnS17md6C2.jpg",
    title: "Experiência Completa",
    duration: "1:25"
  },
  {
    src: "/videos/video-11.mp4",
    poster: "/galeria/espacoolinda/14PVE7-Ja0XMUzjnO0hhUA694YvhHMRLm.jpg",
    title: "Ambientes Exclusivos",
    duration: "1:15"
  },
  {
    src: "/videos/video-12.mp4",
    poster: "/galeria/espacoolinda/14YgteT66h710_B8FLRECAkJhe7gaq_gP.jpg",
    title: "Vista Panorâmica",
    duration: "0:58"
  },
  {
    src: "/videos/video-13.mp4",
    poster: "/galeria/espacoolinda/15tbOTLo8ctba2xlFwlV-dnRr_JnNoxJQ.jpg",
    title: "Espaços para Eventos",
    duration: "1:22"
  },
  {
    src: "/videos/video-14.mp4",
    poster: "/galeria/espacoolinda/16Jzp3XWB6qLlhyJCWsA7mSBjrGrx1Si6.jpg",
    title: "Áreas de Convivência",
    duration: "1:08"
  },
  {
    src: "/videos/video-15.mp4",
    poster: "/galeria/espacoolinda/16hr_ishaHbzea5WZFSUhQkpSOPYSFk1P.jpg",
    title: "Paisagismo e Jardins",
    duration: "0:52"
  },
  {
    src: "/videos/video-16.mp4",
    poster: "/galeria/espacoolinda/17IVcGdPZKkqVxr26a_syiigN1meSANg4.jpg",
    title: "Instalações Modernas",
    duration: "1:18"
  },
  {
    src: "/videos/video-17.mp4",
    poster: "/galeria/espacoolinda/18UEzlsNbS1QlPsr6QOA5nHXGsg2H4Lbp.jpg",
    title: "Tour Virtual Completo",
    duration: "1:35"
  },
  {
    src: "/videos/video-18.mp4",
    poster: "/galeria/espacoolinda/18s2Hj7RP6vVSOGlYsqCk9dlWFerCVSdx.jpg",
    title: "Espaço ao Ar Livre",
    duration: "1:05"
  },
  {
    src: "/videos/video-19.mp4",
    poster: "/galeria/espacoolinda/19Y9uXIs2g3iDqHbvTnRaovblzVR5weZv.jpg",
    title: "Estrutura Completa",
    duration: "1:12"
  },
  {
    src: "/videos/video-20.mp4",
    poster: "/galeria/espacoolinda/19oDy-T95Ny_BA7yNsxmUpu7T9gJ9LuU7.jpg",
    title: "Vista Final do Espaço",
    duration: "1:28"
  },
  {
    src: "/videos/video-21.mp4",
    poster: "/galeria/espacoolinda/19sFW7V0g8O7Mb9_t4nRVHXDEKs2y5jrm.jpg",
    title: "Áreas de Convivência Premium",
    duration: "1:10"
  },
  {
    src: "/videos/video-22.mp4",
    poster: "/galeria/espacoolinda/1AMMASIdfoNuWQZsf7OhyCEh6E3YpE_1R.jpg",
    title: "Natureza e Paisagens",
    duration: "0:55"
  },
  {
    src: "/videos/video-23.mp4",
    poster: "/galeria/espacoolinda/1Ag0rowLqbvsSTIKpwYxQ7A-WfBzmAo-P.jpg",
    title: "Instalações Completas",
    duration: "1:18"
  },
  {
    src: "/videos/video-24.mp4",
    poster: "/galeria/espacoolinda/1AmU-4BywemMvTndd3MLl5JKioVbTF3hN.jpg",
    title: "Espaços para Celebrações",
    duration: "1:05"
  },
  {
    src: "/videos/video-25.mp4",
    poster: "/galeria/espacoolinda/1AvusmUSuw3UeGtF2vdocmPwsV2DLqpOS.jpg",
    title: "Tour Exclusivo",
    duration: "1:20"
  }
];

const VideoGallery = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Conheça o Espaço <span className="text-primary">em Vídeo</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Veja de perto cada detalhe que torna o Espaço Olinda único
          </p>
        </div>

        {/* Videos Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <div
              key={video.src}
              className="group relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {activeVideo === video.src ? (
                <video
                  src={video.src}
                  controls
                  autoPlay
                  className="w-full h-64 object-cover"
                >
                  Seu navegador não suporta vídeos.
                </video>
              ) : (
                <div
                  className="relative h-64 cursor-pointer"
                  onClick={() => setActiveVideo(video.src)}
                >
                  <img
                    src={video.poster.startsWith("/galeria") ? `https://espacoolinda.com.br${video.poster}` : video.poster}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="bg-primary/90 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
                    {video.duration}
                  </div>
                </div>
              )}
              <div className="p-4 bg-card">
                <h3 className="font-semibold text-lg">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoGallery;
