/**
 * Tabela de Resultados da Busca de Empresas
 * 
 * Exibe empresas encontradas com opção de seleção
 * para envio ao Motor de Qualificação
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Building2, Globe, Linkedin, Mail, Phone } from 'lucide-react';
import { EmpresaEnriquecida } from '../services/enrichmentService';
import { BotaoEnviarQualificacao } from './BotaoEnviarQualificacao';

interface ResultadoEmpresasTableProps {
  empresas: EmpresaEnriquecida[];
  onEnviarQualificacao?: (ids: number[]) => Promise<void>;
}

export function ResultadoEmpresasTable({
  empresas,
  onEnviarQualificacao,
}: ResultadoEmpresasTableProps) {
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  const toggleSelecionado = (index: number) => {
    const novosSelecionados = new Set(selecionados);
    if (novosSelecionados.has(index)) {
      novosSelecionados.delete(index);
    } else {
      novosSelecionados.add(index);
    }
    setSelecionados(novosSelecionados);
  };

  const selecionarTodos = () => {
    if (selecionados.size === empresas.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(empresas.map((_, idx) => idx)));
    }
  };

  const handleEnviar = async () => {
    if (onEnviarQualificacao && selecionados.size > 0) {
      // Por enquanto, usamos índices. Em produção, usar IDs reais
      await onEnviarQualificacao(Array.from(selecionados));
    }
  };

  if (empresas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma empresa encontrada. Ajuste os filtros e tente novamente.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resultados da Busca</CardTitle>
            <CardDescription>
              {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} encontrada
              {empresas.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selecionarTodos}>
              {selecionados.size === empresas.length ? 'Desselecionar Todos' : 'Selecionar Todos'}
            </Button>
            {selecionados.size > 0 && (
              <Badge variant="secondary">{selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selecionados.size === empresas.length && empresas.length > 0}
                    onCheckedChange={selecionarTodos}
                  />
                </TableHead>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Informações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Checkbox
                      checked={selecionados.has(idx)}
                      onCheckedChange={() => toggleSelecionado(idx)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{empresa.razao_social}</div>
                        {empresa.nome_fantasia && (
                          <div className="text-xs text-muted-foreground">{empresa.nome_fantasia}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{empresa.cnpj || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {empresa.cidade && empresa.uf ? (
                        <>
                          {empresa.cidade}, {empresa.uf}
                        </>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {empresa.site && (
                        <a
                          href={empresa.site.startsWith('http') ? empresa.site : `https://${empresa.site}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {empresa.linkedin && (
                        <a
                          href={empresa.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {empresa.emails && empresa.emails.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Mail className="h-3 w-3" />
                          {empresa.emails.length}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      {empresa.faturamento_estimado && (
                        <div>
                          Faturamento: R$ {empresa.faturamento_estimado.toLocaleString('pt-BR')}
                        </div>
                      )}
                      {empresa.funcionarios_estimados && (
                        <div>Funcionários: {empresa.funcionarios_estimados}</div>
                      )}
                      {empresa.decisores && empresa.decisores.length > 0 && (
                        <div>
                          Decisores: {empresa.decisores.length}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {selecionados.size > 0 && (
          <div className="mt-4 flex justify-end">
            <BotaoEnviarQualificacao
              selecionados={Array.from(selecionados)}
              onEnviar={handleEnviar}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

