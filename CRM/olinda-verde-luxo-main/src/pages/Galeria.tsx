import { useState } from "react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { galleryCategories, categoryList } from "@/data/galleryCategories";
import { Sparkles, Waves, TreePine, PartyPopper, Building, Gem } from "lucide-react";

const iconMap = {
  Sparkles,
  Waves,
  TreePine,
  PartyPopper,
  Building,
  Gem
};

const Galeria = () => {
  const [activeCategory, setActiveCategory] = useState("destaques");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/galeria/espacoolinda/1Wk7UzKRbPJlTuzXcc3hnBmNqkUQgGBHC.jpg"
            alt="Vista panorâmica do Espaço Olinda - eventos e casamentos premium"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Galeria de Fotos
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            Conheça cada canto do nosso paraíso verde
          </p>
        </div>
      </section>

      {/* Gallery Categories */}
      <section className="container mx-auto px-4 py-12">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <div className="mb-8 overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full md:w-full justify-start md:justify-center bg-muted/50 p-2 rounded-lg">
              {categoryList.map((category) => {
                const Icon = iconMap[category.icon as keyof typeof iconMap];
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-md whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {Object.entries(galleryCategories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <GalleryGrid
                images={category.images}
                title={category.title}
                description={category.description}
              />
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="animate-fade-in">
            <div className="text-4xl font-bold text-primary mb-2">178</div>
            <div className="text-muted-foreground">Fotos Reais</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="text-4xl font-bold text-primary mb-2">6</div>
            <div className="text-muted-foreground">Categorias</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="text-4xl font-bold text-primary mb-2">6.240 m²</div>
            <div className="text-muted-foreground">De Área Verde</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-muted-foreground">Natureza</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Galeria;
