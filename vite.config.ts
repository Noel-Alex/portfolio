import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',
  build: {
    sourcemap: true,
    // three.js lives in the lazy engine chunk; the menu bundle stays small
    chunkSizeWarningLimit: 600,
  },
})
