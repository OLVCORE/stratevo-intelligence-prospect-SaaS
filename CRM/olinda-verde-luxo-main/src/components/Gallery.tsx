import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const galleryImages = [
  { src: "/galeria/espacoolinda/1punqxUhlZjv923olUOSSsSIMgGkIVctq.jpg", alt: "Galeria Espaço Olinda", category: "Destaques" },
  { src: "/galeria/espacoolinda/13yza05PuQsZe63siMqU6hxibWTt8U65f.jpg", alt: "Galeria Espaço Olinda", category: "Eventos" },
  { src: "/galeria/espacoolinda/1bioQ7JsmcRBcU-uueQ8gFWRulscPM1AE.jpg", alt: "Galeria Espaço Olinda", category: "Natureza" },
  { src: "/galeria/espacoolinda/1epGhwTaywkOBdMwvhXrTw0xyTjkCCXiZ.jpg", alt: "Galeria Espaço Olinda", category: "Lazer" },
  { src: "/galeria/espacoolinda/1Wk7UzKRbPJlTuzXcc3hnBmNqkUQgGBHC.jpg", alt: "Galeria Espaço Olinda", category: "Estrutura" },
  { src: "/galeria/espacoolinda/1ThnarWxz5EyCuKGaZhCCgvHsa0EJm1FE.jpg", alt: "Galeria Espaço Olinda", category: "Detalhes" },
  { src: "/galeria/espacoolinda/10T5LEO_2zBzB8ALe0c9A36DMKeQnQGiZ.jpg", alt: "Galeria Espaço Olinda", category: "Eventos" },
  { src: "/galeria/espacoolinda/1FomSThQp6Ohpex0sGXnJ0_mtImPyRyc9.jpg", alt: "Galeria Espaço Olinda", category: "Destaques" },
];

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const resolvedImages = galleryImages;

  return (
    <section id="galeria" className="py-24 lg:py-32 px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Eventos <span className="text-primary">Reais</span>, Momentos Verdadeiros
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Cada celebração no Espaço Olinda é única. Veja como transformamos sonhos em realidade.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resolvedImages.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer card-premium"
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-sm font-semibold text-primary">
                    {image.category}
                  </span>
                  <p className="text-sm text-foreground/90 mt-1">
                    {image.alt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            onClick={() => (window.location.href = "/galeria")}
            className="px-6 py-3"
          >
            Ver Galeria Completa
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          <img
            src={resolvedImages[selectedImage].src}
            alt={resolvedImages[selectedImage].alt}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
          />
        </div>
      )}
    </section>
  );
};

export default Gallery;

