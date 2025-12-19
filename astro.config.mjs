// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable server-side rendering for API routes and admin pages
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8080'),
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
    formats: ['avif', 'webp'],
    quality: {
      avif: 65,
      webp: 75,
      jpg: 80,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
