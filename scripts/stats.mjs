// What visitors did, from PostHog, in the terminal.
//   npm run stats            last 30 days
//   npm run stats -- 7       last 7 days
//   npm run stats -- 7 all   include test accounts (your own devices, localhost, the Claude browser)
// Needs POSTHOG_PERSONAL_KEY, POSTHOG_PROJECT_ID and POSTHOG_HOST in .env.local (git-ignored, never bundled).
// The same numbers, charted, live on the "Portfolio · …" dashboards in PostHog (see docs/analytics.md).
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => /^\w+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const { POSTHOG_PERSONAL_KEY: key, POSTHOG_PROJECT_ID: project, POSTHOG_HOST: host = 'https://us.posthog.com' } = env
if (!key || !project) throw new Error('Set POSTHOG_PERSONAL_KEY and POSTHOG_PROJECT_ID in .env.local')
const days = Number(process.argv[2]) || 30
const everyone = process.argv[3] === 'all'

// {filters} applies the date range and, unless "all", the project's test-account filters
async function q(title, sql) {
  const res = await fetch(`${host}/api/projects/${project}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql, filters: { dateRange: { date_from: `-${days}d` }, filterTestAccounts: !everyone } } }),
  })
  if (!res.ok) throw new Error(`${title}: ${res.status} ${await res.text()}`)
  const { columns, results } = await res.json()
  console.log(`\n${title}`)
  if (!results.length) return console.log('  (nothing yet)')
  console.table(results.map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]]))))
}

console.log(`Last ${days} days${everyone ? ', including test accounts' : ''}`)
await q('Visitors by application link', `
  select coalesce(properties.ref, 'direct') as ref, count(distinct person_id) as people, countIf(event = '$pageview') as pageviews,
         countIf(event in ('project_click', 'book_open')) as projects, countIf(event in ('email_click', 'email_copy', 'resume_download')) as contact,
         max(timestamp) as last_seen
  from events where {filters} group by ref order by people desc limit 25`)
await q('Time on site (per session)', `
  select count() as sessions, round(avg(d)) as avg_seconds, round(median(d)) as median_seconds, round(quantile(0.9)(d)) as p90_seconds
  from (select $session_id as s, dateDiff('second', min(timestamp), max(timestamp)) as d
        from events where {filters} and $session_id is not null and $session_id != '' group by s)`)
await q('Front door: portfolio or 3D world', `
  select properties.to as chose, count() as times from events where event = 'gate_choice' and {filters} group by chose`)
await q('Time and scroll per page', `
  select replaceRegexpOne(properties.$prev_pageview_pathname, '^/portfolio', '') as page, count() as views,
         round(median(toFloat(properties.$prev_pageview_duration))) as median_s,
         round(100 * median(toFloat(properties.$prev_pageview_max_scroll_percentage))) as median_scroll_pct
  from events where {filters} and event in ('$pageview', '$pageleave') and properties.$prev_pageview_pathname is not null
  group by page order by views desc limit 20`)
await q('Projects opened', `
  select coalesce(properties.id, properties.book) as project, countIf(event = 'project_click') as on_site, countIf(event = 'book_open') as in_world
  from events where event in ('project_click', 'book_open') and {filters} group by project order by on_site + in_world desc`)
await q('Contact and résumé', `
  select event, properties.from as from, coalesce(properties.ref, 'direct') as ref, count() as times
  from events where event in ('email_click', 'email_copy', 'resume_download') and {filters} group by event, from, ref order by times desc`)
await q('Where visitors are', `
  select properties.$geoip_country_name as country, count(distinct person_id) as people
  from events where event = '$pageview' and {filters} group by country order by people desc limit 15`)
await q('Where they came from', `
  select coalesce(properties.$referring_domain, '$direct') as referrer, count(distinct person_id) as people
  from events where event = '$pageview' and {filters} group by referrer order by people desc limit 15`)
await q('Core Web Vitals (p75)', `
  select properties.app as app, properties.$device_type as device, count() as samples,
         round(quantile(0.75)(toFloat(properties.$web_vitals_LCP_value))) as lcp_ms,
         round(quantile(0.75)(toFloat(properties.$web_vitals_INP_value))) as inp_ms,
         round(quantile(0.75)(toFloat(properties.$web_vitals_CLS_value)), 3) as cls
  from events where event = '$web_vitals' and {filters} group by app, device order by samples desc`)
await q('3D world load', `
  select properties.pointer as pointer, count() as boots, countIf(toString(properties.ok) != 'true') as failures,
         round(quantile(0.5)(toFloat(properties.ms))) as p50_ms, round(quantile(0.9)(toFloat(properties.ms))) as p90_ms
  from events where event = 'world_ready' and {filters} group by pointer`)
await q('Interactions', `
  select event, count() as times from events where {filters} and event not like '$%' group by event order by times desc limit 25`)
