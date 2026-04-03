import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'LOBI - Building Management',
        short_name: 'LOBI',
        description: 'Premium Residential Building Management System',
        theme_color: '#7B5EA7',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@providers': '/src/providers',
      '@enums': '/src/enums',
      '@entities': '/src/entities',
      '@api': '/src/api',
      '@skeletons': '/src/skeletons',
      '@constants': '/src/constants',
      '@utils': '/src/utils',
      '@types': '/src/types',
    },
  },
});
