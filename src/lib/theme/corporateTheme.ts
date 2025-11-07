/**
 * 🎨 CORPORATE THEME - Paleta profissional para light + dark themes
 * Baseado em: Salesforce, HubSpot, LinkedIn, Microsoft
 * Contraste WCAG AA (4.5:1)
 */

export const corporateTheme = {
  // Ações primárias (Extrair, Descobrir, etc.)
  primary: {
    light: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    dark: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  
  // Sucesso (Salvar, Confirmar)
  success: {
    light: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dark: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  
  // Atenção (Alterações não salvas)
  warning: {
    light: 'bg-amber-500 hover:bg-amber-600 text-slate-900',
    dark: 'bg-amber-500 hover:bg-amber-600 text-slate-900',
  },
  
  // Perigo (Descartar, Deletar)
  danger: {
    light: 'bg-rose-600 hover:bg-rose-700 text-white',
    dark: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  
  // Secundário/Neutro
  secondary: {
    light: 'bg-slate-200 hover:bg-slate-300 text-slate-900',
    dark: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
  },
  
  // Badges
  badges: {
    decisionMaker: {
      light: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
      dark: 'bg-indigo-900/30 text-indigo-300 border border-indigo-700',
    },
    influencer: {
      light: 'bg-slate-100 text-slate-700 border border-slate-300',
      dark: 'bg-slate-700/50 text-slate-300 border border-slate-600',
    },
    source: {
      light: 'bg-slate-100 text-slate-600 border border-slate-300',
      dark: 'bg-slate-700 text-slate-400 border border-slate-600',
    },
  },
  
  // Cards
  cards: {
    light: 'bg-white border border-slate-200',
    dark: 'bg-slate-800 border border-slate-700',
    hover: 'hover:border-indigo-500',
  },
  
  // Status icons (semáforo)
  status: {
    verified: 'text-emerald-500', // verde suave (email confirmado)
    pending: 'text-amber-500', // amarelo/ouro (requer ação)
    error: 'text-rose-500', // vermelho suave (faltando)
  },
} as const;

// Helper para pegar classe baseada no tema atual
export function getThemeClass(
  category: keyof typeof corporateTheme,
  variant?: string,
  isDark: boolean = true
): string {
  const themeSection = corporateTheme[category];
  
  if (!variant) {
    return isDark ? (themeSection as any).dark : (themeSection as any).light;
  }
  
  const variantSection = (themeSection as any)[variant];
  return isDark ? variantSection.dark : variantSection.light;
}

