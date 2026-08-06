import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Citas — Gonza & Juli',
        short_name: 'Citas',
        description: 'Diario de citas, pendientes y planes de pareja',
        lang: 'es-AR',
        theme_color: '#ff4770',
        background_color: '#ffeaf0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        runtimeCaching: [
          {
            // Datos de la pareja: siempre en vivo, nunca servidos desde caché
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly'
          },
          {
            // Tiles del mapa: sí conviene cachearlos para que el mapa abra offline
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.basemaps.cartocdn.com') || url.hostname.endsWith('.tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: ({ url }) =>
              url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: {
        // Apagado en `npm run dev`: no queremos un Service Worker cacheando
        // código a medio cambiar mientras se está desarrollando.
        enabled: false
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    open: true
  }
})
