/**
 * Provider: ReceitaWS
 * Busca dados de CNPJ na ReceitaWS
 */
import { fetchWithTimeout, retry } from '../fetchers';

export async function fetchReceitaWS(cnpj: string) {
  const token = process.env.RECEITAWS_API_TOKEN;
  if (!token) throw new Error('RECEITAWS_API_TOKEN missing');

  return retry(async () => {
    const { res, ms } = await fetchWithTimeout(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
      timeoutMs: 8000,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 422) throw new Error(`422 RECEITAWS: ${text}`);
      throw new Error(`RECEITAWS_${res.status}: ${text}`);
    }
    const json = await res.json();
    if (json.status && String(json.status).toUpperCase() === 'ERROR') {
      const msg = json.message || 'Erro ReceitaWS';
      const err: any = new Error(msg);
      (err.code as any) = 422;
      throw err;
    }
    return { json, ms, source: 'receitaws' as const };
  }, 3, 1000);
}

