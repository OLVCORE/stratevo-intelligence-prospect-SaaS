// ✅ Serviço para consultar Apollo.io SEM Edge Function
// Funciona diretamente no frontend (com API key exposta - OK para agora)

const APOLLO_API_KEY = import.meta.env.VITE_APOLLO_API_KEY;

export async function searchApolloOrganizations(name: string, domain?: string): Promise<{
  success: boolean;
  organizations?: any[];
  error?: string;
}> {
  if (!APOLLO_API_KEY) {
    return {
      success: false,
      error: 'VITE_APOLLO_API_KEY não configurada no .env.local'
    };
  }

  try {
    console.log('[Apollo] 🔍 Buscando organizações:', name, domain);

    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify({
        q_organization_name: name,
        q_organization_domains: domain ? [domain] : undefined,
        page: 1,
        per_page: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] ❌ Erro:', response.status, errorText);
      return {
        success: false,
        error: `Apollo retornou status ${response.status}`
      };
    }

    const data = await response.json();
    console.log('[Apollo] ✅ Sucesso:', data.organizations?.length || 0, 'organizações');

    return {
      success: true,
      organizations: data.organizations || []
    };

  } catch (error: any) {
    console.error('[Apollo] ❌ Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao consultar Apollo'
    };
  }
}

export async function searchApolloPeople(organizationId: string, limit: number = 10): Promise<{
  success: boolean;
  people?: any[];
  error?: string;
}> {
  if (!APOLLO_API_KEY) {
    return {
      success: false,
      error: 'VITE_APOLLO_API_KEY não configurada'
    };
  }

  try {
    console.log('[Apollo] 🔍 Buscando decisores:', organizationId);

    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify({
        organization_ids: [organizationId],
        person_titles: [
          'CEO', 'CFO', 'CIO', 'CTO', 'COO',
          'Diretor', 'Diretora', 'Director',
          'VP', 'Vice President',
          'Gerente', 'Manager'
        ],
        page: 1,
        per_page: limit,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] ❌ Erro pessoas:', response.status, errorText);
      return {
        success: false,
        error: `Apollo retornou status ${response.status}`
      };
    }

    const data = await response.json();
    console.log('[Apollo] ✅ Decisores encontrados:', data.people?.length || 0);

    return {
      success: true,
      people: data.people || []
    };

  } catch (error: any) {
    console.error('[Apollo] ❌ Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar decisores'
    };
  }
}

// 🔍 BUSCA AVANÇADA DE PESSOAS (com critérios: nome, cidade, país, raio 50 milhas)
export async function searchApolloPeopleAdvanced(params: {
  organizationId?: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  radius?: number; // Raio em milhas
  postalCode?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  people?: any[];
  error?: string;
}> {
  if (!APOLLO_API_KEY) {
    return {
      success: false,
      error: 'VITE_APOLLO_API_KEY não configurada'
    };
  }

  try {
    console.log('[Apollo] 🔍 Busca avançada de decisores:', params);

    const searchBody: any = {
      person_titles: [
        'CEO', 'CFO', 'CIO', 'CTO', 'COO', 'CMO',
        'President', 'Presidente',
        'Diretor', 'Diretora', 'Director',
        'VP', 'Vice President', 'Vice-Presidente',
        'Gerente', 'Manager', 'Gerente Geral',
        'Superintendente', 'Superintendent',
        'Head of', 'Head', 'Líder'
      ],
      page: 1,
      per_page: params.limit || 50,
    };

    // Critérios de busca
    if (params.organizationId) {
      searchBody.organization_ids = [params.organizationId];
    }

    if (params.organizationName) {
      searchBody.q_organization_name = params.organizationName;
    }

    if (params.firstName) {
      searchBody.person_first_name = params.firstName;
    }

    if (params.lastName) {
      searchBody.person_last_name = params.lastName;
    }

    if (params.city) {
      searchBody.q_person_city = params.city;
    }

    if (params.country) {
      searchBody.q_person_country = params.country;
    }

    if (params.postalCode) {
      searchBody.q_person_postal_code = params.postalCode.replace(/[^\d]/g, '');
    }

    // Raio de busca (em milhas) - Apollo usa location_radius
    if (params.radius && params.city) {
      // Apollo usa location_radius apenas com city
      // Converter milhas para formato Apollo (usa metros ou código específico)
      searchBody.location_radius = params.radius; // Apollo aceita milhas diretamente
    }

    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify(searchBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] ❌ Erro busca avançada:', response.status, errorText);
      return {
        success: false,
        error: `Apollo retornou status ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[Apollo] ✅ Busca avançada: encontrados', data.people?.length || 0, 'decisores');

    return {
      success: true,
      people: data.people || []
    };

  } catch (error: any) {
    console.error('[Apollo] ❌ Erro busca avançada:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar decisores'
    };
  }
}

