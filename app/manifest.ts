/* eslint-disable prettier/prettier */

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Karnika',
        short_name: 'Karnika',
        description: '',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
            {
                src: '/karnika-logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/karnika-logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}