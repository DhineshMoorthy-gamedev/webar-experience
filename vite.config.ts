import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: './',
  plugins: [
    basicSsl()
  ],
  server: {
    host: true,
    port: 5173,
    https: true
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});
