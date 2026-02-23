import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Use the same port for HMR websocket as the dev server (no separate 8081)
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
  build: {
    // Ensure clean output
    outDir: 'dist',
    emptyOutDir: true,
  },
})
