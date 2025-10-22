/**
 * GlobalHeader - Header fixo com contexto da empresa selecionada
 */
'use client';
import { useCompany } from '@/lib/state/company';
import Link from 'next/link';
import WorkspaceSwitcher from './WorkspaceSwitcher';

export default function GlobalHeader() {
  const { companyId, name, cnpj, clear } = useCompany();
  return (
    <div className="w-full border-b bg-background/50 backdrop-blur p-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-medium hover:text-primary transition-colors">
          OLV Intelligent Prospect v2
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/companies" className="hover:text-primary transition-colors">
            Empresas
          </Link>
          <Link href="/playbooks" className="hover:text-primary transition-colors">
            Playbooks
          </Link>
          <Link href="/reports" className="hover:text-primary transition-colors">
            Relatórios
          </Link>
          <Link href="/analytics" className="hover:text-primary transition-colors">
            Analytics
          </Link>
          <Link href="/alerts" className="hover:text-primary transition-colors">
            Alertas
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Workspace:</span>
          <WorkspaceSwitcher />
        </div>
        <div className="flex items-center gap-3">
          {companyId ? (
            <div className="flex items-center gap-2">
              <span className="text-sm px-2 py-1 rounded border bg-background">
                {name}
                {cnpj ? ` (${cnpj})` : ''}
              </span>
              <button onClick={clear} className="text-xs underline hover:no-underline">
                Trocar
              </button>
            </div>
          ) : (
            <span className="text-sm opacity-70">Selecione uma empresa</span>
          )}
        </div>
      </div>
    </div>
  );
}

