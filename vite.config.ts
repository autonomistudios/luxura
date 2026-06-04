import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split heavy vendors into discrete chunks so the browser can cache them
    // independently and the initial route doesn't ship Firebase/GSAP/AI SDKs it
    // doesn't need on first paint. Order matters: more specific matches first.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase') || id.includes('@firebase'))            return 'firebase'
          if (id.includes('react-router'))                                    return 'router'
          if (id.includes('lucide-react'))                                    return 'icons'
          if (id.includes('framer-motion') || id.includes('motion-dom') ||
              id.includes('motion-utils'))                                    return 'motion'
          if (id.includes('gsap'))                                            return 'gsap'
          if (id.includes('@google/genai') || id.includes('@google/generative-ai') ||
              id.includes('google-auth-library'))                             return 'google-ai'
          if (id.includes('/react/') || id.includes('/react-dom/') ||
              id.includes('/scheduler/'))                                     return 'react-vendor'
          return 'vendor'
        },
      },
    },
    // Vendors are intentionally chunked above; raise the warn ceiling so a
    // legitimately large-but-isolated vendor chunk doesn't spam the build log.
    chunkSizeWarningLimit: 900,
  },
})
