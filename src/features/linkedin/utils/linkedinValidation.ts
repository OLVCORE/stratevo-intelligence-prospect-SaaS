// src/features/linkedin/utils/linkedinValidation.ts

export function isValidLinkedInSearchUrl(url: string): boolean {
  const pattern = /^https?:\/\/(www\.)?linkedin\.com\/search\/results\/people\/.*/i;
  return pattern.test(url);
}

export function isValidLinkedInProfileUrl(url: string): boolean {
  const pattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/i;
  return pattern.test(url);
}

export function extractLinkedInProfileId(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  return match ? match[1] : null;
}
