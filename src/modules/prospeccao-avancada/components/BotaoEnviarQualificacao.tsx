/**
 * Botão para Enviar Empresas para Motor de Qualificação
 * 
 * Envia empresas selecionadas para a tabela prospects_qualificados
 * que será processada pelo Motor de Qualificação
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BotaoEnviarQualificacaoProps {
  selecionados: number[];
  onEnviar?: () => Promise<void>;
}

export function BotaoEnviarQualificacao({
  selecionados,
  onEnviar,
}: BotaoEnviarQualificacaoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleEnviar = async () => {
    if (selecionados.length === 0) {
      toast({
        title: 'Nenhuma empresa selecionada',
        description: 'Selecione pelo menos uma empresa para enviar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);

    try {
      if (onEnviar) {
        await onEnviar();
      }

      setIsSuccess(true);
      toast({
        title: 'Empresas enviadas com sucesso!',
        description: `${selecionados.length} empresa${selecionados.length !== 1 ? 's' : ''} enviada${selecionados.length !== 1 ? 's' : ''} para o Motor de Qualificação.`,
      });

      // Reset após 2 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('[BotaoEnviarQualificacao] Erro ao enviar:', error);
      toast({
        title: 'Erro ao enviar empresas',
        description: 'Ocorreu um erro ao enviar as empresas para qualificação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (selecionados.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={handleEnviar}
      disabled={isLoading || isSuccess}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Enviado!
        </>
      ) : (
        <>
          Enviar para Motor de Qualificação
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

