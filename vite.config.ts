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
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  resolve: {
    alias: {
      process: path.resolve(__dirname, 'node_modules/process/browser.js'),
      // Remove buffer alias
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
      plugins: [
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
        target: 'http://localhost:5000/',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000/',
        ws: true,
        changeOrigin: true,
      },
    },
    host: '0.0.0.0',
    port: 3000,
  },
});
