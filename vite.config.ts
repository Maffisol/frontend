import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis', // Ensure global references are replaced
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
  resolve: {
    alias: {
      process: path.resolve(__dirname, 'node_modules/process/browser.js'), // Polyfill for process
      buffer: path.resolve(__dirname, 'node_modules/buffer/'), // Polyfill for buffer
      '@': path.resolve(__dirname, 'src'), // Alias for src
    },
  },
  build: {
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false, // Minify in production only
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline', // Enable sourcemaps in development
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000/', // Proxy API to backend
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000/', // Proxy WebSocket to backend
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
      },
    },
    host: '0.0.0.0', // Allow access from any IP
    port: 3000, // Vite dev server port
  },
});
