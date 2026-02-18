export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt', '@nuxt/ui'],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'POC Afiliación Offline',
      short_name: 'Afiliación',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0b5fff',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      runtimeCaching: [
        // acá puedes cachear assets o endpoints si quieres
      ]
    }
  }
})
