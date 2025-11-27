// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable server-side rendering for API routes and admin pages
  adapter: cloudflare({
    platformProxy: {
      enabled: true, // Enable local D1 emulation for development
    },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
