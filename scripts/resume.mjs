// Prints the /resume page to PDF with headless Edge or Chrome, from the same data as the site.
//   npm run resume                 -> public/Noel-Alex-Resume.pdf (the one the site links to)
//   npm run resume -- --ref acme   -> tmp/Noel-Alex-Resume-acme.pdf, whose portfolio link carries ?ref=resume-acme
// Run `npm run build` first; this serves dist/ with vite preview.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { preview } from 'vite'

const arg = name => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined }
const ref = arg('ref')?.toLowerCase().replace(/[^a-z0-9-]+/g, '-')

const browsers = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean)
const browser = browsers.find(b => existsSync(b))
if (!browser) throw new Error('No Chrome or Edge found. Set CHROME=/path/to/chrome.')
if (!existsSync('dist/index.html')) throw new Error('No build found. Run `npm run build` first.')

const out = resolve(ref ? `tmp/Noel-Alex-Resume-${ref}.pdf` : 'public/Noel-Alex-Resume.pdf')
mkdirSync(resolve(out, '..'), { recursive: true })

const server = await preview({ preview: { port: 4321, strictPort: false, open: false }, logLevel: 'silent' })
const base = server.resolvedUrls.local[0]
const url = `${base}resume${ref ? `?ref=${ref}` : ''}`
// a throwaway profile, so an already-open browser can't swallow the headless run
const profile = mkdtempSync(join(tmpdir(), 'resume-'))
try {
  // async: the preview server lives in this process and has to keep answering
  await promisify(execFile)(browser, [
    `--user-data-dir=${profile}`,
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=4000', `--print-to-pdf=${out}`, url,
  ], { timeout: 60_000 })
  console.log(`Saved ${out}`)
} finally {
  await server.close()
  rmSync(profile, { recursive: true, force: true })
}
