import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Redec - Free Online Tools',
    short_name: 'Redec',
    description: 'A collection of fast, free, and open source online tools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#151221',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
