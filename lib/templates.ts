/**
 * Template Rendering
 * Renderiza templates com variáveis usando sintaxe Mustache simples
 * SEM MOCKS - se variável não existir, retorna vazia
 */

export function renderTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Substituir variáveis {{key}} ou {{obj.key}}
  const matches = template.matchAll(/\{\{([^}]+)\}\}/g);

  for (const match of matches) {
    const path = match[1].trim();
    const value = getNestedValue(variables, path);
    result = result.replace(match[0], String(value || ''));
  }

  return result;
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Extrai variáveis disponíveis a partir de company + person
 */
export function buildTemplateVariables(company: any, person: any) {
  const firstName = person?.full_name?.split(' ')[0] || '';
  const lastName = person?.full_name?.split(' ').slice(1).join(' ') || '';

  return {
    company: {
      name: company?.name || company?.trade_name || '',
      cnpj: company?.cnpj || '',
      domain: company?.domain || '',
      website: company?.website || '',
    },
    person: {
      full_name: person?.full_name || '',
      first_name: firstName,
      last_name: lastName,
      title: person?.title || '',
      department: person?.department || '',
    },
  };
}

