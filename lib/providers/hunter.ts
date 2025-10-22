/**
 * Provider: Hunter.io (OPCIONAL)
 * Se HUNTER_API_KEY não existir, retorna items sem modificação
 * Valida e-mails e/ou descobre novos e-mails por domínio
 */

export async function enrichHunter(domain: string, items: any[]): Promise<any[]> {
  if (!process.env.HUNTER_API_KEY) return items;

  const t0 = performance.now();

  try {
    // Para cada pessoa, tentar validar/descobrir e-mail
    const enriched = await Promise.all(
      items.map(async (person) => {
        // Extrair primeiro nome e sobrenome
        const nameParts = person.full_name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];

        // Email Finder API
        const res = await fetch(
          `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${process.env.HUNTER_API_KEY}`
        );

        if (!res.ok) return person;

        const json = await res.json();
        const data = json.data;

        if (data && data.email) {
          // Adicionar ou atualizar e-mail
          const existingEmail = person.contacts?.find((c: any) => c.type === 'email');

          if (existingEmail) {
            existingEmail.value = data.email;
            existingEmail.verified = data.status === 'valid';
            existingEmail.source = 'hunter';
          } else {
            person.contacts = person.contacts || [];
            person.contacts.push({
              type: 'email',
              value: data.email,
              verified: data.status === 'valid',
              source: 'hunter',
            });
          }

          // Atualizar confiança se e-mail verificado
          if (data.status === 'valid') {
            person.confidence = Math.max(person.confidence, 85);
          }
        }

        return person;
      })
    );

    const latency = Math.round(performance.now() - t0);
    console.log(`Hunter enrichment completed in ${latency}ms`);

    return enriched;
  } catch (e: any) {
    console.error('Hunter enrichment error:', e);
    return items; // Retorna sem modificação em caso de erro
  }
}

