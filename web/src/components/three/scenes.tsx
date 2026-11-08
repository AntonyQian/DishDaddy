'use client';

import dynamic from 'next/dynamic';

// Three.js is large and needs a browser, so each scene loads on the client only, after the page has painted.
export const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
export const BowlScene = dynamic(() => import('./BowlScene'), { ssr: false });
export const CookScene = dynamic(() => import('./CookScene'), { ssr: false });
