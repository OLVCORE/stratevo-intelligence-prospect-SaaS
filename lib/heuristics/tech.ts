/**
 * Heuristics: Tech Detection
 * Detecta tecnologias por padrões no HTML/scripts/links
 * SEM MOCKS - se não detectar, retorna array vazio
 */

type Rule = {
  name: string;
  category: string;
  test: (ctx: { metas: string[]; scripts: string[]; links: string[]; html: string }) => boolean;
  confidence: number;
};

const rules: Rule[] = [
  // CMS
  {
    name: 'WordPress',
    category: 'cms',
    test: ({ html }) => /wp-content|wp-includes/i.test(html),
    confidence: 85,
  },
  {
    name: 'Wix',
    category: 'cms',
    test: ({ html }) => /wix\.com|wixstatic\.com/i.test(html),
    confidence: 90,
  },
  {
    name: 'Shopify',
    category: 'cms',
    test: ({ html }) => /cdn\.shopify\.com|shopifycdn\.com/i.test(html),
    confidence: 90,
  },

  // Frameworks
  {
    name: 'Next.js',
    category: 'framework',
    test: ({ scripts, html }) =>
      /__NEXT_DATA__/i.test(html) || scripts.some((s) => /\/_next\//i.test(s)),
    confidence: 85,
  },
  {
    name: 'React',
    category: 'framework',
    test: ({ html }) => /__REACT_|react\.development\.js|react\.production\.min\.js/i.test(html),
    confidence: 75,
  },
  {
    name: 'Vue.js',
    category: 'framework',
    test: ({ html }) => /vue\.js|vue\.min\.js|__VUE__/i.test(html),
    confidence: 75,
  },
  {
    name: 'Angular',
    category: 'framework',
    test: ({ html }) => /ng-version|angular\.io|angular\.min\.js/i.test(html),
    confidence: 75,
  },

  // Analytics
  {
    name: 'Google Analytics',
    category: 'analytics',
    test: ({ html }) =>
      /gtag\('config'|google-analytics\.com\/analytics\.js|googletagmanager\.com\/gtag/i.test(html),
    confidence: 85,
  },
  {
    name: 'Google Tag Manager',
    category: 'analytics',
    test: ({ html }) => /googletagmanager\.com\/gtm\.js/i.test(html),
    confidence: 85,
  },
  {
    name: 'Hotjar',
    category: 'analytics',
    test: ({ html }) => /static\.hotjar\.com\/c\/hotjar-|hj\.script/i.test(html),
    confidence: 85,
  },
  {
    name: 'Facebook Pixel',
    category: 'analytics',
    test: ({ html }) => /connect\.facebook\.net\/.*\/fbevents\.js/i.test(html),
    confidence: 80,
  },

  // Infra
  {
    name: 'Cloudflare',
    category: 'infra',
    test: ({ html }) => /cf-ray|cloudflare/i.test(html),
    confidence: 70,
  },
  {
    name: 'Vercel',
    category: 'infra',
    test: ({ links, scripts }) =>
      [...links, ...scripts].some((u) => /vercel\.app|vercel-insights/i.test(u)),
    confidence: 75,
  },
  {
    name: 'AWS',
    category: 'infra',
    test: ({ html }) => /amazonaws\.com|cloudfront\.net/i.test(html),
    confidence: 60,
  },

  // Ads
  {
    name: 'Google Ads',
    category: 'ads',
    test: ({ html }) => /googleadservices\.com|googlesyndication\.com/i.test(html),
    confidence: 80,
  },

  // UI/CSS
  {
    name: 'Bootstrap',
    category: 'ui',
    test: ({ html, links }) =>
      /bootstrap\.min\.css|bootstrap\.css/i.test(html) ||
      links.some((l) => /bootstrap/i.test(l)),
    confidence: 70,
  },
  {
    name: 'Tailwind CSS',
    category: 'ui',
    test: ({ html }) => /tailwindcss|tailwind\.css/i.test(html),
    confidence: 70,
  },
  {
    name: 'Font Awesome',
    category: 'ui',
    test: ({ html, links }) =>
      /font-awesome|fontawesome/i.test(html) || links.some((l) => /fontawesome/i.test(l)),
    confidence: 75,
  },

  // Forms/Chat
  {
    name: 'Typeform',
    category: 'forms',
    test: ({ html }) => /typeform\.com/i.test(html),
    confidence: 85,
  },
  {
    name: 'Intercom',
    category: 'chat',
    test: ({ html }) => /intercom\.io|widget\.intercom/i.test(html),
    confidence: 85,
  },
  {
    name: 'Drift',
    category: 'chat',
    test: ({ html }) => /drift\.com|js\.driftt\.com/i.test(html),
    confidence: 85,
  },
];

export function detectTech(ctx: {
  metas: string[];
  scripts: string[];
  links: string[];
  html: string;
}) {
  return rules
    .filter((r: any) => r.test(ctx))
    .map((r: any) => ({
      tech_name: r.name,
      category: r.category,
      confidence: r.confidence,
      evidence: {},
    }));
}

