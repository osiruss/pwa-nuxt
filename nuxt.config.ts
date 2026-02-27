export default defineNuxtConfig({
  ssr: false,
  modules: ['@vite-pwa/nuxt', '@nuxt/ui'],

  app: {
    head: {
      meta: [{ name: 'theme-color', content: '#0b5fff' }],
      link: [
        { rel: 'icon', type: 'image/png', href: '/pwa-192x192.png' },
        { rel: 'apple-touch-icon', href: '/pwa-192x192.png' }
      ]
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'POC Afiliación Offline',
      short_name: 'Afiliación',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0b5fff',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    devOptions: {
      enabled: true
    }
  },

  runtimeConfig: {
    public: { apiBase: '' }
  }
})