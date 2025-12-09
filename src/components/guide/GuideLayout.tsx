/**
 * Layout do Guia STRATEVO One
 * 
 * Layout padrão para todas as páginas do guia interativo
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { STRATEVO_GUIDE_SECTIONS, getPreviousSection, getNextSection, GuideSectionId } from '@/config/guide/stratevoGuideConfig';
import { cn } from '@/lib/utils';

interface GuideLayoutProps {
  children: ReactNode;
  title: string;
  sectionId?: GuideSectionId;
}

export function GuideLayout({ children, title, sectionId }: GuideLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const currentSection = sectionId 
    ? STRATEVO_GUIDE_SECTIONS.find(s => s.id === sectionId)
    : undefined;

  const previousSection = sectionId ? getPreviousSection(sectionId) : undefined;
  const nextSection = sectionId ? getNextSection(sectionId) : undefined;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/guide" className="hover:text-foreground transition-colors">
          Guia STRATEVO One
        </Link>
        {sectionId && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{title}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Navegação */}
        <aside className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Navegação do Guia</h3>
              </div>
              
              <nav className="space-y-1">
                {STRATEVO_GUIDE_SECTIONS.map((section) => {
                  const isActive = currentPath === section.route;
                  return (
                    <Link
                      key={section.id}
                      to={section.route}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="flex-1">{section.title}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Link para módulos relacionados */}
              {currentSection && currentSection.relatedRoutes.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                    Módulos Relacionados
                  </h4>
                  <div className="space-y-1">
                    {currentSection.relatedRoutes.map((route) => (
                      <Link
                        key={route}
                        to={route}
                        className="block text-xs text-primary hover:underline py-1"
                      >
                        {route}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Conteúdo Principal */}
        <main className="lg:col-span-3">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {currentSection && (
              <p className="text-muted-foreground">{currentSection.shortDescription}</p>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              {children}
            </CardContent>
          </Card>

          {/* Navegação Anterior/Próxima */}
          {(previousSection || nextSection) && (
            <div className="mt-6 flex justify-between gap-4">
              {previousSection ? (
                <Button
                  variant="outline"
                  asChild
                  className="flex-1"
                >
                  <Link to={previousSection.route}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {previousSection.title}
                  </Link>
                </Button>
              ) : (
                <div className="flex-1" />
              )}

              {nextSection ? (
                <Button
                  variant="default"
                  asChild
                  className="flex-1"
                >
                  <Link to={nextSection.route}>
                    {nextSection.title}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

