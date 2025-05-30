const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  devServer: {
    port: 3000,
    historyApiFallback: true
  },
  pwa: {
    name: 'ServiceLink',
    themeColor: '#3498db',
    msTileColor: '#3498db',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      exclude: [/\.map$/, /_redirects/],
      runtimeCaching: [
        {
          urlPattern: new RegExp('http://localhost:3000/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: new RegExp('^https://fonts\\.googleapis\\.com/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: new RegExp('^https://cdnjs\\.cloudflare\\.com/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'cdn-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        }
      ]
    },
    manifestOptions: {
      name: 'ServiceLink',
      short_name: 'ServiceLink',
      description: 'Connect with service providers',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#3498db',
      background_color: '#ffffff',
      icons: [
        {
          src: 'http://localhost:3000/img/icons/servicelink-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'http://localhost:3000/img/icons/servicelink-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'http://localhost:3000/img/icons/servicelink-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: 'http://localhost:3000/img/icons/servicelink-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        {
          src: 'http://localhost:3000/img/screenshots/desktop.png',
          sizes: '1280x800',
          type: 'image/png',
          form_factor: 'wide',
          label: 'ServiceLink Desktop View'
        },
        {
          src: 'http://localhost:3000/img/screenshots/mobile.png',
          sizes: '390x844',
          type: 'image/png',
          label: 'ServiceLink Mobile View'
        }
      ],
      related_applications: [],
      prefer_related_applications: false
    }
  }
})
