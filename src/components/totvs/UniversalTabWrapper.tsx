import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

interface UniversalTabWrapperProps {
  children: ReactNode;
  tabName: string;
}

export function UniversalTabWrapper({ children, tabName }: UniversalTabWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative h-full flex flex-col">
      {/* Botão Expandir/Encolher - RESTAURADO */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 shadow-lg bg-background/95 backdrop-blur"
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-4 h-4" />
              Encolher
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              Expandir
            </>
          )}
        </Button>
      </div>

      {/* Conteúdo da Aba com Scroll Universal */}
      <div
        className={`
          flex-1 overflow-y-auto overflow-x-hidden
          ${isExpanded ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-350px)]'}
          pr-2
          scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent
          hover:scrollbar-thumb-primary/40
          transition-all duration-300
        `}
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="pb-8 pt-16">
          {children}
        </div>
      </div>
    </div>
  );
}

