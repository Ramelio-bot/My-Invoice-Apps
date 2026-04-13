import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'vite.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
      },
      manifest: {
        name: 'MyInvoice - Solusi Bisnis All-in-One',
        short_name: 'MyInvoice',
        description: 'Standar elit manajemen bisnis untuk UMKM Indonesia.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  },
})
