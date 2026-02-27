// export default defineNuxtConfig({
//   ssr: false,
//   modules: ['@vite-pwa/nuxt', '@nuxt/ui'],

//   app: {
//     head: {
//       meta: [{ name: 'theme-color', content: '#0b5fff' }],
//       link: [
//         { rel: 'icon', type: 'image/png', href: '/pwa-192x192.png' },
//         { rel: 'apple-touch-icon', href: '/pwa-192x192.png' }
//       ]
//     }
//   },

//   pwa: {
//     registerType: 'autoUpdate',
//     manifest: {
//       name: 'POC Afiliación Offline',
//       short_name: 'Afiliación',
//       start_url: '/',
//       scope: '/',
//       display: 'standalone',
//       background_color: '#ffffff',
//       theme_color: '#0b5fff',
//       icons: [
//         { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
//         { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
//       ]
//     },
//     devOptions: {
//       enabled: true
//     }
//   },

//   runtimeConfig: {
//     public: { apiBase: '' }
//   }
// })

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
    strategies: 'generateSW',
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
       additionalManifestEntries: [
      { url: '/', revision: null }
    ],
      globPatterns: ['**/*.{html,js,css,ico,png,svg,webmanifest,woff2}'],
      globIgnores: ['**/sw.js', '**/workbox-*.js'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages',
            networkTimeoutSeconds: 3
          }
        }
      ]
    },
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
      enabled: false
    }
  },

  runtimeConfig: {
    public: { apiBase: '' }
  }
})