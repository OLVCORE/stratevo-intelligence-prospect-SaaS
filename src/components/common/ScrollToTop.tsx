import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostrar botão quando rolar mais de 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[55] h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
        "bg-muted hover:bg-muted/80 text-muted-foreground",
        "border border-border",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-16 pointer-events-none"
      )}
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
    </Button>
  );
}

export default ScrollToTop;
