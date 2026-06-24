import { defineConfig } from 'vite';
import mkcert from "vite-plugin-mkcert";
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), mkcert(), tsconfigPaths()],
  server: {
    origin: "https://localhost:3000",
    host: 'localhost',
    port: 3000,
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: true,
  }
});