// src/features/linkedin/utils/linkedinValidation.ts

/**
 * Valida formato de cookie li_at do LinkedIn
 */
export function isValidLiAtCookie(cookie: string): boolean {
  if (!cookie || cookie.length < 10) return false;
  // li_at geralmente começa com "AQED" ou similar e tem pelo menos 100 caracteres
  return cookie.length >= 100 && /^[A-Za-z0-9_-]+$/.test(cookie);
}

/**
 * Valida formato de cookie JSESSIONID
 */
export function isValidJSessionIdCookie(cookie: string): boolean {
  if (!cookie) return true; // Opcional
  return cookie.length >= 20 && /^[A-Za-z0-9_-]+$/.test(cookie);
}

/**
 * Valida URL de busca do LinkedIn
 */
export function isValidLinkedInSearchUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('linkedin.com') &&
      (urlObj.pathname.includes('/search/results/people') ||
       urlObj.pathname.includes('/sales/search'))
    );
  } catch {
    return false;
  }
}

/**
 * Extrai parâmetros de uma URL de busca do LinkedIn
 */
export function parseLinkedInSearchUrl(url: string): {
  keywords?: string;
  network?: string[];
  location?: string;
  industry?: string;
} {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      keywords: params.get('keywords') || undefined,
      network: params.get('network') 
        ? JSON.parse(params.get('network') || '[]')
        : undefined,
      location: params.get('geoUrn') || params.get('location') || undefined,
      industry: params.get('industry') || undefined,
    };
  } catch {
    return {};
  }
}

