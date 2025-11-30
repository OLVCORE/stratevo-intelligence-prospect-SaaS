import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Início", href: "/" },
    { label: "Casamentos", href: "/casamentos" },
    { label: "Corporativo", href: "/corporativo" },
    { label: "Gastronomia & Bar", href: "/gastronomia" },
    { label: "Blog", href: "/blog" },
    { label: "Galeria", href: "/galeria" },
    { label: "Contato", href: "/#contato" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-primary/20"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28 lg:h-32">
          {/* Logo and Brand */}
          <a href="/" className="group relative flex items-center gap-3 sm:gap-4 lg:gap-5">
            <div className="relative">
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 bg-primary/30 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 scale-110" />
              
              {/* Logo with enhanced hover */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 transition-all duration-700 transform group-hover:scale-125 group-hover:rotate-3">
                <img
                  src={logo}
                  alt="Logo Espaço Olinda - eventos e casamentos premium em Santa Isabel São Paulo"
                  className="w-full h-full object-contain drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-700 group-hover:brightness-110 group-hover:contrast-110"
                />
              </div>
            </div>
            
            {/* Brand name next to logo */}
            <div className="hidden sm:flex flex-col">
              <h2 className="text-xl lg:text-2xl font-serif text-primary tracking-wide drop-shadow-md group-hover:text-primary/90 transition-colors">
                Espaço Olinda
              </h2>
              <p className="text-xs lg:text-sm text-primary/80 italic font-serif group-hover:text-primary/70 transition-colors">
                Eventos Especiais desde 2008
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors duration-300 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-full transition-all duration-500" />
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
              onClick={() => window.location.href = '/login'}
            >
              Login
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
              onClick={() => window.location.href = '#contato'}
            >
              Contato
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
              onClick={() => window.location.href = '#contato'}
            >
              Agendar Visita
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-lg border-b border-primary/20 shadow-xl animate-fade-in">
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-1">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Button
                  variant="outline"
                  className="w-full border-primary/30 hover:border-primary hover:bg-primary/5"
                  onClick={() => {
                    window.location.href = '/login';
                    setMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-primary/30 hover:border-primary hover:bg-primary/5"
                  onClick={() => {
                    window.location.href = '#contato';
                    setMobileMenuOpen(false);
                  }}
                >
                  Contato
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => {
                    window.location.href = '#contato';
                    setMobileMenuOpen(false);
                  }}
                >
                  Agendar Visita
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
