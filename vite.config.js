import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base debe coincidir con el nombre del repo en GitHub Pages: /<repo>/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
});
