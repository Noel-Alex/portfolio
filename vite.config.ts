import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, writeFileSync } from 'node:fs'

/** Dev server only: capture.html posts rendered build dioramas here, saved to public/builds/. */
function captureBuilds(): Plugin {
  return {
    name: 'capture-builds',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__capture', (req, res) => {
        const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? ''
        if (req.method !== 'POST' || !/^[a-z]+$/.test(id)) { res.statusCode = 400; res.end(); return }
        let body = ''
        req.on('data', c => { body += c })
        req.on('end', () => {
          const data = body.replace(/^data:image\/webp;base64,/, '')
          mkdirSync('public/builds', { recursive: true })
          writeFileSync(`public/builds/${id}.webp`, Buffer.from(data, 'base64'))
          res.end('ok')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), captureBuilds()],
  base: '/portfolio/',
  build: {
    sourcemap: true,
    // three.js lives in the lazy engine chunk; the menu bundle stays small
    chunkSizeWarningLimit: 600,
  },
})
