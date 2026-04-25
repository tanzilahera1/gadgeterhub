// src/app/manifest.ts
import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gadget Collections',
    short_name: 'Gadgets',
    description: 'Best Gadgets at the Best Prices in Bangladesh. Shop smartphones, audio, smartwatches.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a', // তোমার ব্র্যান্ড কালার দাও
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['shopping', 'electronics', 'technology'],
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
    shortcuts: [
      {
        name: 'Smartphones',
        short_name: 'Phones',
        description: 'Browse latest smartphones',
        url: '/products/smartphones',
        icons: [{ src: '/logo.png', sizes: '96x96' }]
      },
      {
        name: 'Track Order',
        short_name: 'Track',
        description: 'Track your order',
        url: '/track-order',
        icons: [{ src: '/logo.png', sizes: '96x96' }]
      }
    ]
  }
}