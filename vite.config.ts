import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Critical: snarkjs expects a global object in browser environments
    global: 'globalThis',
  },
  server: {
    port: 3000,
    open: true,
  },
});
