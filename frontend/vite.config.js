import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['frog-icon.svg'],
      manifest: {
        name: 'Eat the Frog Tracker',
        short_name: 'FrogTracker',
        description: 'Elimina la procrastinación con recordatorios via WhatsApp',
        theme_color: '#10B981',
        background_color: '#111827',
        display: 'standalone',
        icons: [
          {
            src: 'frog-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'frog-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
