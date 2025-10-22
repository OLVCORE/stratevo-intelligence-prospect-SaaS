/**
 * Provider: Apollo.io (OPCIONAL)
 * Se APOLLO_API_KEY não existir, retorna null (SEM ERRO)
 * Busca decisores por domínio da empresa
 */

export type PersonResult = {
  full_name: string;
  title?: string;
  department?: string;
  seniority?: string;
  location?: string;
  contacts?: Array<{
    type: 'email' | 'phone' | 'whatsapp' | 'linkedin';
    value: string;
    verified?: boolean;
    source: string;
    source_url?: string;
  }>;
  confidence: number;
  source: 'apollo' | 'hunter' | 'phantom';
  source_url?: string;
  latency_ms: number;
  meta?: any;
};

export async function fetchApollo(domain: string): Promise<PersonResult[] | null> {
  if (!process.env.APOLLO_API_KEY) return null;

  const t0 = performance.now();

  try {
    // Apollo.io GraphQL API
    // Buscar pessoas por domínio com filtros de cargo relevantes
    const query = `
      query SearchPeople($domain: String!) {
        people(
          filters: {
            organization_domains: [$domain]
            person_titles: ["CTO", "CIO", "COO", "CEO", "Director", "Manager", "TI", "Compras"]
          }
          page: 1
          per_page: 20
        ) {
          people {
            id
            first_name
            last_name
            title
            headline
            seniority
            department {
              name
            }
            organization {
              name
            }
            email
            phone_numbers
            linkedin_url
            city
            state
            country
          }
        }
      }
    `;

    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': process.env.APOLLO_API_KEY,
      },
      body: JSON.stringify({
        api_key: process.env.APOLLO_API_KEY,
        q_organization_domains: domain,
        person_titles: ['CTO', 'CIO', 'COO', 'CEO', 'Director', 'Manager'],
        page: 1,
        per_page: 20,
      }),
    });

    const latency = Math.round(performance.now() - t0);

    if (!res.ok) {
      console.error(`Apollo API error: ${res.status}`);
      return null;
    }

    const json = await res.json();
    const people = json.people || [];

    // Normalizar para PersonResult
    const results: PersonResult[] = people.map((p: any) => {
      const contacts: PersonResult['contacts'] = [];

      if (p.email) {
        contacts.push({
          type: 'email',
          value: p.email,
          verified: false,
          source: 'apollo',
        });
      }

      if (p.phone_numbers && p.phone_numbers.length > 0) {
        contacts.push({
          type: 'phone',
          value: p.phone_numbers[0],
          verified: false,
          source: 'apollo',
        });
      }

      if (p.linkedin_url) {
        contacts.push({
          type: 'linkedin',
          value: p.linkedin_url,
          verified: false,
          source: 'apollo',
          source_url: p.linkedin_url,
        });
      }

      return {
        full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        title: p.title || p.headline,
        department: p.department?.name,
        seniority: p.seniority,
        location: [p.city, p.state, p.country].filter(Boolean).join(', '),
        contacts,
        confidence: 75,
        source: 'apollo',
        source_url: p.linkedin_url,
        latency_ms: latency,
        meta: {
          organization: p.organization?.name,
          apollo_id: p.id,
        },
      };
    });

    return results;
  } catch (e: any) {
    console.error('Apollo fetch error:', e);
    return null;
  }
}

