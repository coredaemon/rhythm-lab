import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH ?? (mode === 'production' ? '/rhythm-lab/' : '/');

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
        manifest: {
          name: 'RhythmLab',
          short_name: 'RhythmLab',
          description: 'Ритм-помощник для дыхания, фокуса, музыки и тренировок.',
          theme_color: '#4f8f8b',
          background_color: '#f6f2ea',
          display: 'standalone',
          lang: 'ru',
          orientation: 'portrait',
          scope: base,
          start_url: base,
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icons/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true
        }
      })
    ]
  };
});
