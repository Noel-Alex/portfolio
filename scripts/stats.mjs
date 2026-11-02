// What visitors did, from PostHog, in the terminal.
//   npm run stats            last 30 days
//   npm run stats -- 7       last 7 days
// Needs POSTHOG_PERSONAL_KEY, POSTHOG_PROJECT_ID and POSTHOG_HOST in .env.local (git-ignored, never bundled).
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => /^\w+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const { POSTHOG_PERSONAL_KEY: key, POSTHOG_PROJECT_ID: project, POSTHOG_HOST: host = 'https://us.posthog.com' } = env
if (!key || !project) throw new Error('Set POSTHOG_PERSONAL_KEY and POSTHOG_PROJECT_ID in .env.local')
const days = Number(process.argv[2]) || 30
const since = `timestamp > now() - interval ${days} day`

async function q(title, sql) {
  const res = await fetch(`${host}/api/projects/${project}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql } }),
  })
  if (!res.ok) throw new Error(`${title}: ${res.status} ${await res.text()}`)
  const { columns, results } = await res.json()
  console.log(`\n${title}`)
  if (!results.length) return console.log('  (nothing yet)')
  console.table(results.map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]]))))
}

console.log(`Last ${days} days`)
await q('Visitors by application link', `
  select coalesce(person.properties.first_ref, 'direct') as ref, count(distinct person_id) as people, count() as pageviews
  from events where event = '$pageview' and ${since} group by ref order by people desc limit 25`)
await q('Time on site (per session)', `
  select count() as sessions, round(avg(d)) as avg_seconds, round(median(d)) as median_seconds, round(quantile(0.9)(d)) as p90_seconds
  from (select properties.$session_id as s, dateDiff('second', min(timestamp), max(timestamp)) as d
        from events where ${since} and properties.$session_id is not null group by s)`)
await q('Front door: portfolio or 3D world', `
  select properties.to as chose, count() as times from events where event = 'gate_choice' and ${since} group by chose`)
await q('Most viewed pages', `
  select properties.$pathname as page, count() as views, count(distinct person_id) as people
  from events where event = '$pageview' and ${since} group by page order by views desc limit 20`)
await q('Projects opened', `
  select properties.id as project, count() as opens from events where event = 'project_click' and ${since} group by project order by opens desc`)
await q('Contact and résumé', `
  select event, coalesce(person.properties.first_ref, 'direct') as ref, count() as times
  from events where event in ('email_click', 'resume_download') and ${since} group by event, ref order by times desc`)
await q('Where visitors are', `
  select properties.$geoip_country_name as country, count(distinct person_id) as people
  from events where event = '$pageview' and ${since} group by country order by people desc limit 15`)
await q('Where they came from', `
  select coalesce(properties.$referring_domain, '$direct') as referrer, count(distinct person_id) as people
  from events where event = '$pageview' and ${since} group by referrer order by people desc limit 15`)
await q('Interactions', `
  select event, count() as times from events where ${since} and event not like '$%' group by event order by times desc limit 25`)
