import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:8010'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5180,
      strictPort: true,
      proxy: {
        '/api': backendUrl,
        '/uploads': backendUrl,
      },
    },
  }
})
