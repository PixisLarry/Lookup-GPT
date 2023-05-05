import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import crx from 'vite-plugin-crx-mv3'

export default defineConfig(({ mode }) => {
    const prod = mode == 'production'
    return {
        plugins: [
            react(),
            crx({
                manifest: './src/manifest.json',
            }),
        ],
        build: {
            chunkSizeWarningLimit: 1000,
            emptyOutDir: prod,
        },
        minify: prod
    }
})
