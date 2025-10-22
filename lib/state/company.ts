/**
 * Company Context - Estado Global (Zustand)
 * Mantém empresa selecionada em toda a aplicação
 */
import { create } from 'zustand';

type CompanyCtx = {
  companyId?: string;
  name?: string;
  cnpj?: string;
  website?: string;
  setCompany: (c: { id: string; name?: string; cnpj?: string; website?: string }) => void;
  clear: () => void;
};

export const useCompany = create<CompanyCtx>((set) => ({
  companyId: undefined,
  setCompany: (c) => {
    set({ companyId: c.id, name: c.name, cnpj: c.cnpj, website: c.website });
    if (typeof window !== 'undefined') {
      localStorage.setItem('olv.company', JSON.stringify(c));
    }
  },
  clear: () => {
    set({ companyId: undefined, name: undefined, cnpj: undefined, website: undefined });
    if (typeof window !== 'undefined') localStorage.removeItem('olv.company');
  },
}));

// Restore on load (optional: chamar em layout)
export function restoreCompanyFromStorage() {
  if (typeof window === 'undefined') return;
  const s = localStorage.getItem('olv.company');
  if (!s) return;
  try {
    const c = JSON.parse(s);
    useCompany.getState().setCompany({ id: c.id, name: c.name, cnpj: c.cnpj, website: c.website });
  } catch {}
}

