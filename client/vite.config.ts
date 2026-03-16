import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
