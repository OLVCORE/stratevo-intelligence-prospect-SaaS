// src/features/linkedin/services/linkedinParser.ts
import { LinkedInLead } from "../types/linkedin.types";

export function parseLinkedInProfile(data: any): Partial<LinkedInLead> {
  return {
    linkedin_profile_id: data.profileId || data.entityUrn?.split(':').pop() || '',
    linkedin_profile_url: data.profileUrl || `https://www.linkedin.com/in/${data.publicIdentifier}`,
    linkedin_public_id: data.publicIdentifier || data.vanityName || '',
    first_name: data.firstName || data.first_name || '',
    last_name: data.lastName || data.last_name || '',
    full_name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    headline: data.headline || data.occupation || '',
    location: data.location || '',
    avatar_url: data.profilePicture || data.avatarUrl,
    company_name: data.companyName || data.company || '',
    connection_degree: data.connectionDegree || '2nd',
    shared_connections: data.sharedConnections || 0,
    raw_data: data,
  };
}

export function parseLinkedInSearchResults(results: any[]): Partial<LinkedInLead>[] {
  return results.map(parseLinkedInProfile);
}
