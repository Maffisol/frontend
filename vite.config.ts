import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true
        })
      ]
    }
  },
  resolve: {
    alias: {
      process: path.resolve('./node_modules/process/browser.js'), // Alias for process
      buffer: path.resolve('./node_modules/buffer/'), // Alias for buffer
      '@': path.resolve(__dirname, 'src'), // Alias for src
    },
  },
  build: {
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false, // Minify only in production
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline', // Enable sourcemaps only in non-production
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000/', // Proxy API requests to your backend
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000/',
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
      },
    },
    host: '0.0.0.0', // Allow access from any IP address
    port: 3000, // Vite server port
  },
});
