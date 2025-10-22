/**
 * Dashboard Page - Página principal da aplicação
 */
'use client';
import SearchHub from '@/components/SearchHub';
import { useCompany } from '@/lib/state/company';
import Link from 'next/link';

export default function DashboardPage() {
  const companyId = useCompany((s) => s.companyId);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Busque empresas por CNPJ ou Website. Os dados são enriquecidos automaticamente.
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-medium mb-4">🔍 SearchHub</h2>
        <SearchHub />
      </div>

      {!companyId && (
        <div className="border rounded-lg p-6 bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            💡 Nenhuma empresa selecionada. Use o SearchHub acima para buscar e selecionar uma
            empresa.
          </p>
        </div>
      )}

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-medium mb-4">🚀 Navegação Rápida</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/companies"
            className="border rounded p-4 bg-background hover:bg-accent transition-colors"
          >
            <h3 className="font-medium mb-2">📋 Lista de Empresas</h3>
            <p className="text-xs text-muted-foreground">
              Visualize, filtre e gerencie empresas cadastradas
            </p>
          </Link>
          <div className="border rounded p-4 bg-background opacity-50">
            <h3 className="font-medium mb-2">📊 Enriquecimento</h3>
            <p className="text-xs text-muted-foreground">
              Visualize dados enriquecidos (Ciclo 3)
            </p>
          </div>
          <div className="border rounded p-4 bg-background opacity-50">
            <h3 className="font-medium mb-2">📄 Relatórios</h3>
            <p className="text-xs text-muted-foreground">Gere relatórios PDF (Ciclo 4)</p>
          </div>
          <div className="border rounded p-4 bg-background opacity-50">
            <h3 className="font-medium mb-2">🎨 Canvas</h3>
            <p className="text-xs text-muted-foreground">
              Visualização colaborativa (Ciclo 5)
            </p>
          </div>
        </div>
      </div>

      {companyId && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-medium mb-4">✅ Empresa Ativa</h2>
          <p className="text-sm text-muted-foreground">
            Você pode navegar pelos módulos acima ou{' '}
            <Link href="/companies" className="underline text-primary">
              visualizar todas as empresas
            </Link>
            .
          </p>
        </div>
      )}
    </main>
  );
}

