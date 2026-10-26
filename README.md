# Noel Alex — Portfolio

A portfolio you play. It opens like a modded Minecraft client: a live 3D floating island behind the title screen, a Mods list of projects, a Multiplayer list of communities, and a Singleplayer world where every build is a project. Click a build, the player walks there, and its guidebook opens.

Static React + TypeScript + three.js, deployed to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

Production verification (lint, typecheck, build):

```bash
npm run check
```

## Where things live

- `src/content.ts`: every fact on the site: projects, stats, limits, links, servers, advancements. Edit copy here.
- `src/engine/`: the voxel world, lazy-loaded so the title menu works before WebGL is ready.
  - `world.ts` generates the island and its builds; `textures.ts` paints the 16px block atlas; `mesher.ts` builds face-culled, ambient-occluded meshes; `effects.ts` holds sky, clouds, particles and animated decor; `Engine.ts` is the renderer, camera, player and input.
- `src/ui/`: the client UI: title, mods, guidebooks (`Book.tsx`) and their demos, HUD and chat, inventory and crafting, advancements, options. `router.ts` maps screens to real URLs (`/world/helix`, `/mods`, `/multiplayer/gdg`), so every guidebook can be linked directly.

## Things to try

Press `T` or `/` in the world for chat commands (`/help`, `/tp aster`, `/time set night`, `/weather rain`, `/summon creeper`). `E` opens the inventory and crafting, `L` the advancements, `F3` the debug overlay, `1`–`9` walk to a build.

## Accessibility

Everything in the 3D world has a DOM route: the hotbar and the Mods list reach every project, the guidebooks are keyboard-navigable (`←` `→` `Esc`), and motion follows the system setting unless changed in Options.

## Truthfulness

Numbers come from the projects’ own benchmarks and are paired with their known limits. Stretchy, Arachne + PhishGuard and PolySafe show outcomes only; their methods stay private. Demos inside the guidebooks that are illustrations say so.

This fan-made portfolio is not affiliated with Mojang or Microsoft.
