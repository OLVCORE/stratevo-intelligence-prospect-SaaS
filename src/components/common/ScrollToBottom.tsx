import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToBottom() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostrar botão quando NÃO estiver no final da página
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Mostrar se há conteúdo abaixo (scrollTop + windowHeight < documentHeight - 100)
      const isAtBottom = scrollTop + windowHeight >= documentHeight - 100;
      
      if (!isAtBottom && scrollTop > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    window.addEventListener("resize", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      window.removeEventListener("resize", toggleVisibility);
    };
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToBottom}
      size="icon"
      className={cn(
        "fixed bottom-4 right-20 sm:bottom-8 sm:right-28 z-[55] h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
        "bg-muted hover:bg-muted/80 text-muted-foreground",
        "border border-border",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-16 pointer-events-none"
      )}
      aria-label="Ir para o final da página"
    >
      <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
    </Button>
  );
}

export default ScrollToBottom;

