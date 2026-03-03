import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/ant.png', 'assets/ants.gif', 'assets/ant-walking.gif'],
      manifest: {
        id: '/',
        name: 'Accumulator - Discipline Through Numbers',
        short_name: 'Accumulator',
        description: 'Mobile endless math game about discipline through intentional choices.',
        theme_color: '#2c3e50',
        background_color: '#2c3e50',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['games', 'education'],
        icons: [
          {
            src: '/assets/ant.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/ant.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/assets/ant.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,gif,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }

          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  publicDir: 'public',
});
