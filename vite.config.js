import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA responsiva para tablets Android y celulares.
// Acento azul, fondo claro. Sin colores de marca.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Gestion de Mantenimiento',
        short_name: 'Mantenimiento',
        description: 'Gestion de mantenimiento en tiempo real - planta de tejido',
        theme_color: '#1d4ed8',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // No cachear Firestore: necesitamos tiempo real, su SDK gestiona offline.
        navigateFallbackDenylist: [/^\/__/]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
})
