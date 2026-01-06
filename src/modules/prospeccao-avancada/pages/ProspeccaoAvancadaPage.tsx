/**
 * Página Principal do Motor de Busca Avançada
 * 
 * Interface completa para busca e qualificação de empresas
 */

import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { BuscaEmpresasForm } from '../components/BuscaEmpresasForm';
import { ResultadoEmpresasTable } from '../components/ResultadoEmpresasTable';
import {
  buscarDadosEmpresas,
  salvarEmpresasBrutas,
  filtrarEmpresasSemFit,
  type FiltrosBusca,
  type EmpresaEnriquecida,
} from '../services/enrichmentService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, Building2, Download } from 'lucide-react';
import { LinkedInLeadCollector } from '@/components/icp/LinkedInLeadCollector';
import { useState } from 'react';

export default function ProspeccaoAvancadaPage() {
  const { tenant } = useTenant();
  const [empresas, setEmpresas] = useState<EmpresaEnriquecida[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [empresasSalvas, setEmpresasSalvas] = useState<number[]>([]);
  const [linkedInLeadCollectorOpen, setLinkedInLeadCollectorOpen] = useState(false);

  const handleBuscar = async (filtros: FiltrosBusca) => {
    if (!tenant?.id) {
      toast({
        title: 'Tenant não encontrado',
        description: 'Por favor, selecione um tenant antes de buscar empresas.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setEmpresas([]);
    setEmpresasSalvas([]);

    try {
      // Buscar empresas (agora retorna ResponseBusca)
      const response = await buscarDadosEmpresas(filtros, tenant.id);

      if (!response.sucesso || response.empresas.length === 0) {
        const mensagem = response.diagnostics 
          ? `Candidatas coletadas: ${response.diagnostics.candidates_collected}, após filtro: ${response.diagnostics.candidates_after_filter}`
          : 'Tente ajustar os filtros de busca.';
        
        toast({
          title: 'Nenhuma empresa encontrada',
          description: mensagem,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Filtrar empresas sem fit (opcional - já filtrado na Edge Function)
      const empresasFiltradas = filtrarEmpresasSemFit(response.empresas);

      if (empresasFiltradas.length === 0) {
        toast({
          title: 'Nenhuma empresa encontrada',
          description: 'Todas as empresas foram filtradas (sem site/LinkedIn/decisores).',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Salvar empresas brutas no Supabase (com upsert/dedupe)
      const idsSalvos = await salvarEmpresasBrutas(empresasFiltradas, tenant.id);
      setEmpresasSalvas(idsSalvos);
      setEmpresas(empresasFiltradas);

      toast({
        title: 'Busca concluída!',
        description: `${empresasFiltradas.length} empresa${empresasFiltradas.length !== 1 ? 's' : ''} encontrada${empresasFiltradas.length !== 1 ? 's' : ''} e salva${empresasFiltradas.length !== 1 ? 's' : ''}.`,
      });
    } catch (error: any) {
      console.error('[ProspeccaoAvancadaPage] Erro ao buscar empresas:', error);
      
      // Mensagem amigável baseada no erro
      let mensagem = 'Ocorreu um erro ao buscar empresas. Tente novamente.';
      if (error.message?.includes('EMPRESAQUI_API_KEY')) {
        mensagem = 'EMPRESAQUI_API_KEY não configurada. Entre em contato com o administrador.';
      }
      
      toast({
        title: 'Erro ao buscar empresas',
        description: mensagem,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviarQualificacao = async (indices: number[]) => {
    if (!tenant?.id) {
      toast({
        title: 'Tenant não encontrado',
        description: 'Por favor, selecione um tenant.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Mapear índices para IDs reais das empresas salvas
      const idsParaEnviar = indices
        .map((idx) => empresasSalvas[idx])
        .filter((id) => id !== undefined);

      if (idsParaEnviar.length === 0) {
        toast({
          title: 'Nenhuma empresa válida',
          description: 'Não foi possível encontrar as empresas selecionadas.',
          variant: 'destructive',
        });
        return;
      }

      // Inserir na tabela prospects_qualificados
      const empresasParaQualificar = idsParaEnviar.map((prospectId) => ({
        tenant_id: tenant.id,
        prospect_id: prospectId,
        status: 'pendente',
      }));

      const { error } = await supabase
        .from('prospects_qualificados')
        .insert(empresasParaQualificar);

      if (error) {
        console.error('[ProspeccaoAvancadaPage] Erro ao enviar para qualificação:', error);
        throw error;
      }

      toast({
        title: 'Empresas enviadas com sucesso!',
        description: `${idsParaEnviar.length} empresa${idsParaEnviar.length !== 1 ? 's' : ''} enviada${idsParaEnviar.length !== 1 ? 's' : ''} para o Motor de Qualificação.`,
      });

      // Limpar seleção
      setEmpresas([]);
      setEmpresasSalvas([]);
    } catch (error) {
      console.error('[ProspeccaoAvancadaPage] Erro ao enviar para qualificação:', error);
      toast({
        title: 'Erro ao enviar empresas',
        description: 'Ocorreu um erro ao enviar as empresas para qualificação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Motor de Busca Avançada
          </h1>
          <p className="text-muted-foreground mt-2">
            Encontre empresas ideais com filtros específicos e enriquecimento automático de dados
          </p>
        </div>
        <Button
          onClick={() => setLinkedInLeadCollectorOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Coletar Leads do LinkedIn
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Encontradas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empresas.length}</div>
            <p className="text-xs text-muted-foreground">Total de resultados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Salvas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empresasSalvas.length}</div>
            <p className="text-xs text-muted-foreground">Armazenadas no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? 'Buscando...' : 'Pronto'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Processando busca' : 'Sistema operacional'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Busca */}
      <BuscaEmpresasForm onBuscar={handleBuscar} isLoading={isLoading} />

      {/* Tabela de Resultados */}
      {empresas.length > 0 && (
        <ResultadoEmpresasTable
          empresas={empresas}
          onEnviarQualificacao={handleEnviarQualificacao}
        />
      )}

      {/* 📥 COLETOR DE LEADS LINKEDIN */}
      <LinkedInLeadCollector
        open={linkedInLeadCollectorOpen}
        onOpenChange={setLinkedInLeadCollectorOpen}
        companyId={undefined}
        onLeadsCollected={(count) => {
          toast({
            title: 'Leads coletados!',
            description: `${count} leads coletados com sucesso.`,
          });
        }}
      />
    </div>
  );
}

