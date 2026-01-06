// src/features/linkedin/services/linkedinParser.ts

/**
 * Parser para dados brutos do LinkedIn
 */

export interface ParsedLinkedInProfile {
  profileId: string;
  publicIdentifier: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  location: string;
  profilePicture?: string;
  companyName?: string;
  connectionDegree: string;
  sharedConnections: number;
}

/**
 * Extrai perfil de um resultado de busca do LinkedIn
 */
export function parseLinkedInSearchResult(rawData: any): ParsedLinkedInProfile | null {
  try {
    // Buscar MiniProfile nos included
    const miniProfile = rawData.included?.find((item: any) =>
      item.$type === 'com.linkedin.voyager.identity.shared.MiniProfile'
    );

    if (!miniProfile) return null;

    // Buscar EntityResult para dados adicionais
    const entityResult = rawData.elements?.find((item: any) =>
      item.$type === 'com.linkedin.voyager.dash.search.EntityResultViewModel'
    );

    const profileId = miniProfile.entityUrn?.split(':').pop() || '';
    const publicIdentifier = miniProfile.publicIdentifier || '';
    const firstName = miniProfile.firstName || '';
    const lastName = miniProfile.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    // Extrair headline e localização
    let headline = miniProfile.occupation || '';
    let location = '';
    let companyName = '';

    if (entityResult) {
      headline = entityResult.primarySubtitle?.text || headline;
      location = entityResult.secondarySubtitle?.text || '';
      companyName = entityResult.primarySubtitle?.text?.split(' at ')?.[1] || '';
    }

    // Extrair foto de perfil
    let profilePicture: string | undefined;
    if (miniProfile.picture?.rootUrl) {
      const artifact = miniProfile.picture.artifacts?.[0];
      profilePicture = `${miniProfile.picture.rootUrl}${artifact?.fileIdentifyingUrlPathSegment || ''}`;
    }

    // Extrair grau de conexão
    const connectionDegree = entityResult?.badgeData?.text || '2nd';

    // Extrair conexões em comum
    const sharedConnections = parseInt(
      entityResult?.insightsResolutionResult?.text?.match(/\d+/)?.[0] || '0'
    );

    return {
      profileId,
      publicIdentifier,
      firstName,
      lastName,
      fullName,
      headline,
      location,
      profilePicture,
      companyName,
      connectionDegree,
      sharedConnections,
    };
  } catch (error) {
    console.error('[LinkedIn Parser] Erro ao parsear resultado:', error);
    return null;
  }
}

/**
 * Personaliza mensagem de convite com variáveis
 */
export function personalizeInviteMessage(
  template: string,
  lead: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    company_name?: string;
    headline?: string;
    location?: string;
  }
): string {
  return template
    .replace(/\{\{firstName\}\}/g, lead.first_name || '')
    .replace(/\{\{lastName\}\}/g, lead.last_name || '')
    .replace(/\{\{fullName\}\}/g, lead.full_name || '')
    .replace(/\{\{company\}\}/g, lead.company_name || 'sua empresa')
    .replace(/\{\{headline\}\}/g, lead.headline || '')
    .replace(/\{\{location\}\}/g, lead.location || '')
    .substring(0, 300); // Limite do LinkedIn
}

