import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Eve Who\'s Who',
  description: 'Chart viewer and admin tools',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="site-nav" aria-label="Primary">
            <Link href="/chart">Chart</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
