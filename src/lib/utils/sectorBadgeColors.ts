/**
 * Cores canônicas para badges de Setor e Categoria (CNAE).
 * Usado em Leads Aprovados (seletor/coluna Setor) e Pipeline (cards).
 * Mesmo nome = mesma cor em toda a aplicação → interpretação uniforme.
 */
export function getSectorBadgeColors(name: string | null | undefined, type: 'setor' | 'categoria'): string {
  if (!name) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700';

  const normalizedName = name.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  let secondaryHash = 0;
  const firstChars = normalizedName.substring(0, Math.min(5, normalizedName.length));
  for (let i = 0; i < firstChars.length; i++) {
    secondaryHash = secondaryHash * 31 + firstChars.charCodeAt(i);
  }
  const combinedHash = Math.abs(hash * 17 + secondaryHash * 23);

  const colorPalettes = [
    { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200', border: 'border-blue-300', darkBorder: 'dark:border-blue-700' },
    { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-200', border: 'border-purple-300', darkBorder: 'dark:border-purple-700' },
    { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200', border: 'border-green-300', darkBorder: 'dark:border-green-700' },
    { bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'dark:bg-orange-900', darkText: 'dark:text-orange-200', border: 'border-orange-300', darkBorder: 'dark:border-orange-700' },
    { bg: 'bg-pink-100', text: 'text-pink-800', darkBg: 'dark:bg-pink-900', darkText: 'dark:text-pink-200', border: 'border-pink-300', darkBorder: 'dark:border-pink-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', darkBg: 'dark:bg-indigo-900', darkText: 'dark:text-indigo-200', border: 'border-indigo-300', darkBorder: 'dark:border-indigo-700' },
    { bg: 'bg-teal-100', text: 'text-teal-800', darkBg: 'dark:bg-teal-900', darkText: 'dark:text-teal-200', border: 'border-teal-300', darkBorder: 'dark:border-teal-700' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', darkBg: 'dark:bg-cyan-900', darkText: 'dark:text-cyan-200', border: 'border-cyan-300', darkBorder: 'dark:border-cyan-700' },
    { bg: 'bg-amber-100', text: 'text-amber-800', darkBg: 'dark:bg-amber-900', darkText: 'dark:text-amber-200', border: 'border-amber-300', darkBorder: 'dark:border-amber-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', darkBg: 'dark:bg-emerald-900', darkText: 'dark:text-emerald-200', border: 'border-emerald-300', darkBorder: 'dark:border-emerald-700' },
    { bg: 'bg-rose-100', text: 'text-rose-800', darkBg: 'dark:bg-rose-900', darkText: 'dark:text-rose-200', border: 'border-rose-300', darkBorder: 'dark:border-rose-700' },
    { bg: 'bg-violet-100', text: 'text-violet-800', darkBg: 'dark:bg-violet-900', darkText: 'dark:text-violet-200', border: 'border-violet-300', darkBorder: 'dark:border-violet-700' },
    { bg: 'bg-slate-100', text: 'text-slate-800', darkBg: 'dark:bg-slate-900', darkText: 'dark:text-slate-200', border: 'border-slate-300', darkBorder: 'dark:border-slate-700' },
    { bg: 'bg-lime-100', text: 'text-lime-800', darkBg: 'dark:bg-lime-900', darkText: 'dark:text-lime-200', border: 'border-lime-300', darkBorder: 'dark:border-lime-700' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', darkBg: 'dark:bg-fuchsia-900', darkText: 'dark:text-fuchsia-200', border: 'border-fuchsia-300', darkBorder: 'dark:border-fuchsia-700' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200', border: 'border-yellow-300', darkBorder: 'dark:border-yellow-700' },
  ];

  const hashOffset = type === 'categoria' ? 5000 : 0;
  const colorIndex = (combinedHash + hashOffset) % colorPalettes.length;
  const colors = colorPalettes[colorIndex];
  return `${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} ${colors.border} ${colors.darkBorder}`;
}
