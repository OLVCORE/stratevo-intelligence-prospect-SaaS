/**
 * LinkWatch - Monitora links quebrados em desenvolvimento
 * Valida links internos em tempo real durante navegação
 * APENAS EM DEV - não afeta produção
 */
'use client';
import { useEffect } from 'react';

export default function LinkWatch({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const handler = async (e: any) => {
      const a = e.target.closest('a[href]');
      if (!a) return;

      const href = a.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('http')
      )
        return;

      try {
        const res = await fetch(href, { method: 'HEAD' });
        if (!res.ok) {
          console.warn('🔴 Link possivelmente quebrado:', href, 'Status:', res.status);
        }
      } catch (err) {
        console.warn('🔴 Link inválido:', href, err);
      }
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return <>{children}</>;
}

