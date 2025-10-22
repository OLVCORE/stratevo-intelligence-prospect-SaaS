/**
 * Página: Lista de Empresas
 * Tabela paginada com filtros e ação "Tornar Ativa"
 */
import CompaniesTable from '@/components/CompaniesTable';

export default function CompaniesPage() {
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Empresas</h1>
        <p className="text-sm text-muted-foreground">
          Visualize, filtre e selecione empresas cadastradas no sistema.
        </p>
      </div>
      <CompaniesTable />
    </main>
  );
}

