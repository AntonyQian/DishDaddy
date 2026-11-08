import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { FloatingNav } from '@/components/FloatingNav';
import { SmoothScroll } from '@/components/SmoothScroll';
import { Aurora } from '@/components/ui/Aurora';
import './globals.css';

export const metadata: Metadata = {
  title: 'DishDaddy: cook with what you have',
  description: 'Scan your fridge, find recipes you can cook right now, and cook them step by step.',
  icons: { icon: '/icon.png' },
};
export const viewport: Viewport = { themeColor: '#050507' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="grain min-h-screen">
        <SmoothScroll>
          <Aurora />
          <FloatingNav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
