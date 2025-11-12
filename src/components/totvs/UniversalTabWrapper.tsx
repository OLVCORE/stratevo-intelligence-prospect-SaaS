import { ReactNode } from 'react';

interface UniversalTabWrapperProps {
  children: ReactNode;
  tabName: string;
}

export function UniversalTabWrapper({ children, tabName }: UniversalTabWrapperProps) {
  return (
    <div className="relative h-full flex flex-col">
      {/* Conteúdo da Aba com Scroll Universal */}
      <div
        className="
          flex-1 overflow-y-auto overflow-x-hidden
          h-[calc(100vh-350px)]
          pr-2
          scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent
          hover:scrollbar-thumb-primary/40
          transition-all duration-300
        "
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="pb-8 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

