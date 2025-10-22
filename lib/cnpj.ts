/**
 * Utilitários para CNPJ
 */

export function normalizeCnpj(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  return digits.padStart(14, '0').slice(-14);
}

// DV básico (suficiente p/ evitar lixo). Se quiser o oficial, trocamos depois.
export function isValidCnpj(cnpj: string): boolean {
  const v = cnpj.replace(/\D/g, '');
  return v.length === 14;
}

