# Noel Alex — Portfolio

Two ways into the same work. Visitors choose on arrival:

- **The portfolio** (`/home`, `/projects/<id>`, `/resume`): a fast, readable site. Each project page is built in that project's own visual language (Arachne's brutalist dashboard, HELIX's TempleOS-style machine, PolySafe's lab bench, Stretchy's folio, and so on), with a small working demo on most of them.
- **The 3D world** (`/play`, `/world`): a modded-Minecraft-style client. A floating island where every build is a project; click one, walk there, read its guidebook. Third or first person (`V`), touch controls on phones.

Static React + TypeScript + three.js on GitHub Pages. The two halves are separate bundles, so a reader never downloads three.js.

## Local development

```bash
npm install
npm run dev
```

Lint, typecheck and build:

```bash
npm run check
```

## Where things live

- `src/site/`: the readable portfolio.
  - `cases.ts` holds each project's facts (summary, headline number, stack, limits, links); `profile.ts` holds experience, education, leadership and skills, shared with the résumé.
  - `pages/<Project>.tsx` + `.css`: one page per project, each lazy-loaded with its own fonts. `kit.tsx` has the shared pieces (site bar, ending, dioramas); `util.ts` the hooks.
  - `Resume.tsx` renders the one-page résumé from the same data.
- `src/content.ts`: the 3D world's copy (guidebooks, servers, advancements).
- `src/engine/`: the voxel world. `world.ts` generates the island, `Engine.ts` is the renderer, camera, player and input, `nav.ts` the A* pathfinding.
- `src/ui/`: the game client UI. `router.ts` maps every screen to a real URL for both halves.
- `public/builds/*.webp`: each build rendered from the 3D world as an isometric diorama, used as artwork on the portfolio. Regenerate after changing the world: run `npm run dev`, open `/portfolio/capture.html`, wait for "Done" (dev only; `src/engine/diorama.ts`).

## Job search tools

```bash
npm run ref -- acme "ML engineer"
```

Prints tracked links for one application. Visits arriving with `?ref=acme&role=ml-engineer` are tagged in PostHog (first ref is kept, so return visits stay attributed), and the parameters are stripped from the address bar.

```bash
npm run build
npm run resume
```

Prints `/resume` to `public/Noel-Alex-Resume.pdf` with headless Chrome or Edge (one A4 page). `npm run resume -- --ref acme` writes `tmp/Noel-Alex-Resume-acme.pdf` instead, whose portfolio link carries `ref=resume-acme`.

```bash
npm run stats
```

What visitors did over the last 30 days (`npm run stats -- 7` for a week): visitors per application link, time on site, the portfolio-or-world choice, pages, projects opened, emails and résumé downloads per ref, countries, referrers and interactions. Reads `POSTHOG_PERSONAL_KEY`, `POSTHOG_PROJECT_ID` and `POSTHOG_HOST` from `.env.local`, which is git-ignored and never bundled.

## Analytics

PostHog (`src/analytics.ts`) loads after the page is idle: pageviews, clicks, heatmaps, session replays with inputs masked, and named events (`gate_choice`, `project_click`, `email_click`, `resume_download`, `world_enter`, `travel`, `demo` and more). It stays off in local dev and on any `localhost` build. Open the live site once with `?notrack` on your own devices so your visits don't count; `?track` undoes it.

## Things to try in the world

`T` or `/` opens chat (`/help`, `/tp aster`, `/time set night`, `/weather rain`). `V` or `F5` switches first/third person, `Shift` sprints, `E` opens the inventory, `L` the advancements, `F3` the debug overlay, `1`–`9` walk to a build, `Esc` pauses.

## Accessibility

Every project has a plain HTML page. The world's guidebooks are keyboard-navigable, motion follows the system's reduced-motion setting on both halves, and the portfolio has no horizontal scroll down to 375px.

## Truthfulness

Numbers come from the projects' own measurements and sit next to their known limits. Stretchy, PhishGCN and PolySafe show outcomes only; their methods stay private. Demos that are illustrations say so.

This fan-made portfolio is not affiliated with Mojang or Microsoft.
