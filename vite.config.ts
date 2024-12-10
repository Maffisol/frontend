import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
      plugins: [
        ...(process.env.NODE_ENV === 'production'
          ? [
              NodeGlobalsPolyfillPlugin({
                buffer: true,
                process: true,
              }),
              NodeModulesPolyfillPlugin(),
            ]
          : []),
      ],
    },
  },
  resolve: {
    alias: {
      process: path.resolve(__dirname, 'node_modules/process/browser.js'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline',
    rollupOptions: {
      plugins: process.env.NODE_ENV === 'production'
        ? []
        : [
            NodeGlobalsPolyfillPlugin({
              buffer: true,
              process: true,
            }),
            NodeModulesPolyfillPlugin(),
          ],
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL,
        changeOrigin: true,
        secure: true, // Force HTTPS for proxy
      },
      '/socket.io': {
        target: process.env.VITE_SOCKET_URL,
        ws: true,
        changeOrigin: true,
        secure: true,
        headers: {
          'Access-Control-Allow-Origin': 'https://it-memo.nl', // Voeg de juiste frontend URL toe
          'Access-Control-Allow-Credentials': 'true',
        },
      },
    },
    host: '0.0.0.0',
    port: 3000,
  },
});
