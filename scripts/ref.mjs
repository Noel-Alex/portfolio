// Makes tracked links for one application, so PostHog shows which company opened what.
//   npm run ref -- acme "ML engineer"
// Visits carry ref=acme and role=ml-engineer as person properties (see src/analytics.ts).
const [company, role] = process.argv.slice(2)
if (!company) {
  console.log('Usage: npm run ref -- <company> [role]')
  process.exit(1)
}
const slug = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const site = 'https://noel-alex.github.io/portfolio/'
const q = new URLSearchParams({ ref: slug(company), ...(role ? { role: slug(role) } : {}) })

console.log(`
Portfolio      ${site}?${q}
Straight to    ${site}home?${q}
3D world       ${site}play?${q}
Résumé PDF     npm run resume -- --ref ${slug(company)}   (its portfolio link carries ref=resume-${slug(company)})
`)
