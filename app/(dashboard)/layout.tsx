/**
 * Dashboard Layout - Layout para páginas autenticadas
 */
'use client';
import { useEffect } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import { restoreCompanyFromStorage } from '@/lib/state/company';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Restaurar empresa selecionada do localStorage na montagem
    restoreCompanyFromStorage();
  }, []);

  return (
    <div className="min-h-screen">
      <GlobalHeader />
      {children}
    </div>
  );
}

