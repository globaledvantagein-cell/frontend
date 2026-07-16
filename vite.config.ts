import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // SSR routes served by the Express backend (not React) — forward them in
      // dev so /city/*, /category/*, /career-guide*, and /sitemap.xml render
      // real HTML instead of falling through to the SPA index.html.
      '/city': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/category': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/career-guide': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/sitemap.xml': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
    },
  },
})