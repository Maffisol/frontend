import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
      loader: {
        '.ts': 'tsx',
        '.tsx': 'tsx',
      },
    },
  },
  resolve: {
    alias: {
      process: path.resolve('./node_modules/process/browser.js'),
      buffer: path.resolve('./node_modules/buffer/'),
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
