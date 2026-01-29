/**
 * Página Data Enrich - Sistema Lovable (olv-dataenrich) incorporado via iframe.
 * Layout full-bleed para parecer página nativa: ocupa toda a área útil, sem margens que desenquadrem o iframe.
 * Sem companyId: lista de empresas. Com companyId: empresa específica no Lovable.
 *
 * Cache-bust: ?v=timestamp para que cada abertura/atualização busque a versão mais recente
 * publicada no Lovable (evita ver versão antiga em cache no navegador/Vercel).
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/common/BackButton';

const LOVABLE_APP_BASE = 'https://olv-dataenrich.lovable.app';
const IFRAME_LOAD_TIMEOUT_MS = 8000;

export default function DataEnrichPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [showFallback, setShowFallback] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cache-bust: nova versão a cada montagem da página e ao clicar em "Atualizar" → iframe carrega a última publicação do Lovable
  const [iframeVersion, setIframeVersion] = useState(() => Date.now());

  const basePath = companyId ? `${LOVABLE_APP_BASE}/companies/${companyId}` : `${LOVABLE_APP_BASE}/companies`;
  const iframeSrc = `${basePath}?v=${iframeVersion}`;

  useEffect(() => {
    setShowFallback(false);
    timeoutRef.current = setTimeout(() => setShowFallback(true), IFRAME_LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [iframeSrc]);

  const onIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowFallback(false);
  };

  // Layout: rota já usa AppLayout (um único sidebar STRATEVO). Aqui só o conteúdo da página.
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Barra mínima no estilo STRATEVO: só título e abrir em nova aba */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton />
          <h1 className="text-base font-semibold flex items-center gap-2 truncate">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            Data Enrich
          </h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIframeVersion(Date.now())}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            title="Recarregar o conteúdo do Data Enrich (ver últimas atualizações publicadas no Lovable)"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <a href={basePath} target="_blank" rel="noopener noreferrer" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
              Abrir em nova aba
            </a>
          </Button>
        </div>
      </div>
      {/* Iframe ocupa o resto: 100% largura e altura, sem bordas para parecer nativo */}
      <div className="flex-1 min-h-0 relative bg-background">
        {showFallback && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-muted/95 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <p className="text-sm font-medium">
              O app Data Enrich pode estar bloqueando incorporação nesta janela.
            </p>
            <Button asChild>
              <a href={basePath} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir Data Enrich em nova aba
              </a>
            </Button>
          </div>
        )}
        <iframe
          src={iframeSrc}
          title="Data Enrich - Sistema Lovable"
          className="absolute inset-0 w-full h-full border-0 bg-background"
          allow="clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          onLoad={onIframeLoad}
        />
      </div>
    </div>
  );
}
