import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  // The shared contracts are TypeScript source in a sibling workspace.
  transpilePackages: ['@fridge/shared'],
  turbopack: { root: path.join(__dirname, '..') },
  // The browser talks to this site's /api, which forwards to the recipe server: no CORS to configure.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_URL ?? 'http://localhost:8787'}/:path*` }];
  },
};

export default config;
