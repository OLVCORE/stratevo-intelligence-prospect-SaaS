// 🔍 WEBSITE DISCOVERY - USA TODAS AS FERRAMENTAS DISPONÍVEIS!
// Serper + Jina + BrasilAPI + Hunter + Apollo + ReceitaWS

import { supabase } from '@/integrations/supabase/client';

export interface DigitalPresence {
  website?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  confidence: number;
  sources: string[];
}

/**
 * 🔥 DESCOBERTA COMPLETA DE PRESENÇA DIGITAL
 * Usa TODAS as ferramentas para encontrar website + redes sociais
 */
export async function discoverFullDigitalPresence(
  razaoSocial: string,
  cnpj?: string
): Promise<DigitalPresence> {
  const presence: DigitalPresence = {
    emails: [],
    phones: [],
    addresses: [],
    confidence: 0,
    sources: [],
  };

  console.log('[DISCOVERY] 🔍 Iniciando busca completa para:', razaoSocial);

  // ESTRATÉGIA 1: BrasilAPI → Email corporativo → Domain
  if (cnpj) {
    try {
      const cnpjClean = cnpj.replace(/\D/g, '');
      const brasilApiUrl = `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`;
      const brasilResponse = await fetch(brasilApiUrl);
      
      if (brasilResponse.ok) {
        const brasilData = await brasilResponse.json();
        
        if (brasilData.email) {
          presence.emails.push(brasilData.email);
          const domain = brasilData.email.split('@')[1];
          if (domain && !domain.includes('gmail') && !domain.includes('hotmail')) {
            presence.website = `https://${domain}`;
            presence.confidence += 30;
            presence.sources.push('BrasilAPI (email corporativo)');
            console.log('[DISCOVERY] ✅ Website via BrasilAPI:', presence.website);
          }
        }

        if (brasilData.telefone) {
          presence.phones.push(brasilData.telefone);
        }
      }
    } catch (error) {
      console.warn('[DISCOVERY] ⚠️ BrasilAPI falhou:', error);
    }
  }

  // ESTRATÉGIA 2: Serper → Busca Google (website oficial)
  try {
    const serperKey = import.meta.env.VITE_SERPER_API_KEY;
    if (serperKey) {
      const queries = [
        `"${razaoSocial}" site oficial`,
        `${razaoSocial} empresa website`,
        `${razaoSocial} contato`,
      ];

      for (const query of queries) {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: query, num: 3 }),
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          const organic = serperData.organic || [];

          for (const result of organic) {
            const url = result.link || '';
            
            // Filtrar backlinks inválidos
            const invalidDomains = [
              'cnpj.net', 'cnpj.biz', 'cnpj.ws',
              'empresasaqui.com.br', 'econodata.com.br',
              'jusbrasil.com.br', 'guiamais.com.br',
              'linkedin.com', 'facebook.com', 'instagram.com',
            ];

            const isValid = !invalidDomains.some(d => url.includes(d));
            
            if (isValid && url.match(/^https?:\/\//)) {
              if (!presence.website) {
                presence.website = url;
                presence.confidence += 25;
                presence.sources.push('Serper (Google Search)');
                console.log('[DISCOVERY] ✅ Website via Serper:', url);
                break;
              }
            }
          }

          if (presence.website) break;
        }
      }
    }
  } catch (error) {
    console.warn('[DISCOVERY] ⚠️ Serper falhou:', error);
  }

  // ESTRATÉGIA 3: Serper → LinkedIn
  try {
    const serperKey = import.meta.env.VITE_SERPER_API_KEY;
    if (serperKey && !presence.linkedin) {
      const linkedinQuery = `site:linkedin.com/company ${razaoSocial}`;
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: linkedinQuery, num: 3 }),
      });

      if (response.ok) {
        const data = await response.json();
        const linkedinResult = data.organic?.find((r: any) => 
          r.link?.includes('linkedin.com/company')
        );
        
        if (linkedinResult) {
          presence.linkedin = linkedinResult.link;
          presence.confidence += 15;
          presence.sources.push('Serper (LinkedIn)');
          console.log('[DISCOVERY] ✅ LinkedIn:', presence.linkedin);
        }
      }
    }
  } catch (error) {
    console.warn('[DISCOVERY] ⚠️ LinkedIn search falhou:', error);
  }

  // ESTRATÉGIA 4: Serper → Instagram
  try {
    const serperKey = import.meta.env.VITE_SERPER_API_KEY;
    if (serperKey && !presence.instagram) {
      const instaQuery = `site:instagram.com ${razaoSocial}`;
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: instaQuery, num: 3 }),
      });

      if (response.ok) {
        const data = await response.json();
        const instaResult = data.organic?.find((r: any) => 
          r.link?.includes('instagram.com')
        );
        
        if (instaResult) {
          presence.instagram = instaResult.link;
          presence.confidence += 10;
          presence.sources.push('Serper (Instagram)');
          console.log('[DISCOVERY] ✅ Instagram:', presence.instagram);
        }
      }
    }
  } catch (error) {
    console.warn('[DISCOVERY] ⚠️ Instagram search falhou:', error);
  }

  // ESTRATÉGIA 5: Serper → Twitter
  try {
    const serperKey = import.meta.env.VITE_SERPER_API_KEY;
    if (serperKey && !presence.twitter) {
      const twitterQuery = `site:twitter.com OR site:x.com ${razaoSocial}`;
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: twitterQuery, num: 3 }),
      });

      if (response.ok) {
        const data = await response.json();
        const twitterResult = data.organic?.find((r: any) => 
          r.link?.includes('twitter.com') || r.link?.includes('x.com')
        );
        
        if (twitterResult) {
          presence.twitter = twitterResult.link;
          presence.confidence += 10;
          presence.sources.push('Serper (Twitter/X)');
          console.log('[DISCOVERY] ✅ Twitter:', presence.twitter);
        }
      }
    }
  } catch (error) {
    console.warn('[DISCOVERY] ⚠️ Twitter search falhou:', error);
  }

  // ESTRATÉGIA 6: Serper → Facebook
  try {
    const serperKey = import.meta.env.VITE_SERPER_API_KEY;
    if (serperKey && !presence.facebook) {
      const fbQuery = `site:facebook.com ${razaoSocial}`;
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: fbQuery, num: 3 }),
      });

      if (response.ok) {
        const data = await response.json();
        const fbResult = data.organic?.find((r: any) => 
          r.link?.includes('facebook.com')
        );
        
        if (fbResult) {
          presence.facebook = fbResult.link;
          presence.confidence += 10;
          presence.sources.push('Serper (Facebook)');
          console.log('[DISCOVERY] ✅ Facebook:', presence.facebook);
        }
      }
    }
  } catch (error) {
    console.warn('[DISCOVERY] ⚠️ Facebook search falhou:', error);
  }

  // ESTRATÉGIA 7: Hunter.io → Domain Search (se já temos website)
  if (presence.website) {
    try {
      const domain = new URL(presence.website).hostname.replace('www.', '');
      const { data, error } = await supabase.functions.invoke('hunter-domain-search', {
        body: { domain },
      });

      if (!error && data?.emails) {
        presence.emails.push(...data.emails.map((e: any) => e.value));
        presence.confidence += 10;
        presence.sources.push('Hunter.io (Domain Search)');
        console.log('[DISCOVERY] ✅ Hunter emails:', data.emails.length);
      }
    } catch (error) {
      console.warn('[DISCOVERY] ⚠️ Hunter falhou:', error);
    }
  }

  // ESTRATÉGIA 8: Apollo.io → Organization Enrichment
  if (presence.website) {
    try {
      const domain = new URL(presence.website).hostname.replace('www.', '');
      const { data, error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: { companyName: razaoSocial, domain },
      });

      if (!error && data?.decisores) {
        const apolloEmails = data.decisores
          .map((d: any) => d.email)
          .filter(Boolean);
        presence.emails.push(...apolloEmails);
        presence.confidence += 10;
        presence.sources.push('Apollo.io (Decisores)');
        console.log('[DISCOVERY] ✅ Apollo decisores:', data.decisores.length);
      }
    } catch (error) {
      console.warn('[DISCOVERY] ⚠️ Apollo falhou:', error);
    }
  }

  // NORMALIZAR confidence (0-100)
  presence.confidence = Math.min(100, presence.confidence);

  // Deduplicate emails
  presence.emails = [...new Set(presence.emails)];

  console.log('[DISCOVERY] 🎉 Busca concluída! Confidence:', presence.confidence);
  console.log('[DISCOVERY] 📊 Encontrado:', {
    website: !!presence.website,
    linkedin: !!presence.linkedin,
    instagram: !!presence.instagram,
    twitter: !!presence.twitter,
    facebook: !!presence.facebook,
    emails: presence.emails.length,
  });

  return presence;
}

