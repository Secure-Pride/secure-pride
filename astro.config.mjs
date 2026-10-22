import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://securepride.org',
  output: 'static',
  // Emit every script and stylesheet as a file, never inline, so pages stay
  // compatible with the repo's intended CSP (script-src 'self';
  // style-src 'self' in _headers). See DECISION-007.
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 0,
    },
    ssr: {
      external: ['svgo'],
    },
  },
});
