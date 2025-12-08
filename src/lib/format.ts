/**
 * Helpers de formatação e normalização de dados
 */

/**
 * Normaliza CNPJ removendo caracteres especiais (pontos, traços, barras)
 * ✅ FUNÇÃO CENTRAL: Usar em TODOS os lugares onde CNPJ é processado
 * 
 * @param cnpj - CNPJ com ou sem formatação (ex: "17.304.635/0001-85" ou "17304635000185")
 * @returns CNPJ apenas com números (14 dígitos) ou null se inválido
 * 
 * @example
 * normalizeCnpj('17.304.635/0001-85') // '17304635000185'
 * normalizeCnpj('17304635000185')     // '17304635000185'
 * normalizeCnpj('123')                // null (menos de 14 dígitos)
 * normalizeCnpj(null)                 // null
 */
export function normalizeCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  
  // Remove TODOS os caracteres não numéricos (pontos, traços, barras, espaços)
  const cleaned = String(cnpj).replace(/\D/g, '');
  
  // ✅ CRÍTICO: Deve ter exatamente 14 dígitos
  if (cleaned.length !== 14) {
    return null;
  }
  
  // Retorna apenas números (14 dígitos)
  return cleaned;
}

/**
 * Valida se CNPJ tem formato válido (14 dígitos)
 */
export function isValidCnpj(cnpj: string | null | undefined): boolean {
  const normalized = normalizeCnpj(cnpj);
  return normalized !== null && normalized.length === 14;
}

