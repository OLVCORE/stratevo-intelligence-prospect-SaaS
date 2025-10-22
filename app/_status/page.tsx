'use client';
import { useEffect, useState } from 'react';

export default function StatusPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setData({ ok: false, error: 'Falha ao conectar com /api/health' });
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Status do Sistema</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Diagnóstico de saúde da aplicação e integradores
        </p>

        {loading ? (
          <div className="border rounded-lg p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-sm text-muted-foreground">Verificando sistemas...</p>
          </div>
        ) : (
          <>
            {data?.ok ? (
              <div className="border border-green-500/20 bg-green-500/10 rounded-lg p-4 mb-4">
                <h2 className="text-green-600 font-semibold text-lg mb-2">✅ Sistema Operacional</h2>
                <p className="text-sm text-muted-foreground">
                  Todos os componentes essenciais estão funcionando corretamente.
                </p>
              </div>
            ) : (
              <div className="border border-red-500/20 bg-red-500/10 rounded-lg p-4 mb-4">
                <h2 className="text-red-600 font-semibold text-lg mb-2">
                  ⚠️ Sistema com Problemas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Verifique as variáveis de ambiente e conexões abaixo.
                </p>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b">
                <h3 className="font-medium text-sm">Detalhes Técnicos (JSON)</h3>
              </div>
              <pre className="bg-zinc-950 text-zinc-100 p-4 text-xs overflow-auto max-h-[600px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">🔍 Como Usar Este Painel</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  <strong>supabase: true</strong> → Conexão com banco OK
                </li>
                <li>
                  <strong>providers: {'{...}'}</strong> → Status de cada integrador (ReceitaWS,
                  Serper, etc.)
                </li>
                <li>
                  Se algum provider estiver <code className="text-red-500">false</code>, verifique
                  a chave no <code>.env.local</code>
                </li>
                <li>
                  Acesse <code>/api/health</code> diretamente para ver JSON raw
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

