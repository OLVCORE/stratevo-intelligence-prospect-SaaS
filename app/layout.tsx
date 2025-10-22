import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LinkWatch from '@/components/dev/LinkWatch';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OLV Intelligence Prospect v2',
  description: 'Plataforma de Prospecção & Inteligência B2B com dados reais',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {process.env.NODE_ENV !== 'production' ? (
          <LinkWatch>{children}</LinkWatch>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
