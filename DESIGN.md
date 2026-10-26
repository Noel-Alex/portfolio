---
name: Noel Alex — Modded Client
description: A portfolio built as a modded Minecraft client over a live voxel island.
colors:
  ink-white: "#ffffff"
  ink-shadow: "#3f3f3f"
  ink-gray: "#a8a8a8"
  ink-yellow: "#ffff55"
  ink-green: "#80ff20"
  ink-red: "#ff5555"
  ink-aqua: "#55ffff"
  stone: "#6f6f6f"
  stone-hi: "#a9a9a9"
  stone-lo: "#3a3a3a"
  stone-hover: "#7d86b8"
  stone-dead: "#2c2c2c"
  panel: "#c6c6c6"
  panel-hi: "#ffffff"
  panel-lo: "#555555"
  panel-label: "#3f3f3f"
  slot: "#8b8b8b"
  slot-lo: "#373737"
  tip-bg: "#100010"
  tip-edge: "#5000ff"
  tip-edge-lo: "#28007f"
  paper: "#f3ead3"
  paper-2: "#e8dcbc"
  paper-edge: "#c9b98f"
  leather: "#6b3a1e"
  leather-lo: "#3d1f0f"
  trim: "#c89b3c"
  page-ink: "#2b1d12"
  page-muted: "#6b5a45"
  page-accent: "#8c2b16"
  night-ground: "#0d1a33"
  gui-border: "#000000"
  field-border: "#a0a0a0"
  selection: "#3b4bd8"
  plaque: "#3a2a1a"
  plaque-ink: "#f0d9a0"
  terminal: "#1d1a16"
  terminal-ink: "#e8e2cc"
  frame-gold: "#e8c040"
  frame-challenge: "#b04ae0"
  scrim: "#00000080"
typography:
  display:
    fontFamily: "Monocraft, ui-monospace, monospace"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "Monocraft, ui-monospace, monospace"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "Monocraft, ui-monospace, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Monocraft, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.35
  caption:
    fontFamily: "Monocraft, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  micro:
    fontFamily: "Monocraft, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
  stat:
    fontFamily: "Monocraft, ui-monospace, monospace"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.1
rounded:
  none: "0"
  panel: "4px"
  book: "10px"
  goal: "12px"
spacing:
  gui: "2px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button:
    backgroundColor: "{colors.stone}"
    textColor: "#e0e0e0"
    rounded: "{rounded.none}"
    height: "40px"
    width: "400px"
    padding: "0 14px"
  button-hover:
    backgroundColor: "{colors.stone-hover}"
    textColor: "{colors.ink-yellow}"
  button-disabled:
    backgroundColor: "{colors.stone-dead}"
    textColor: "#8a8a8a"
  button-half:
    width: "196px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.panel-label}"
    rounded: "{rounded.panel}"
    padding: "14px"
  slot:
    backgroundColor: "{colors.slot}"
    size: "36px"
  tooltip:
    backgroundColor: "{colors.tip-bg}"
    textColor: "{colors.ink-white}"
    typography: "{typography.label}"
    padding: "6px 8px"
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.page-ink}"
    typography: "{typography.body}"
    padding: "34px 38px 48px"
  input:
    backgroundColor: "#000000"
    textColor: "#e0e0e0"
    height: "40px"
---

## Overview

**Creative North Star: "The Modded Client."** The portfolio is not a website styled like Minecraft; it is a Minecraft client with a modpack installed. The title screen sits over a live, slowly orbiting voxel island; menus are the client's own menus (stone buttons, grey inventory panels, purple item tooltips, yellow splash text); and the project writeups are Patchouli-style guidebooks with cream pages and a leather cover. Every surface is a screen the visitor already knows how to use if they have ever played.

Density follows the client: compact, pixel-exact GUI chrome at fixed sizes, with reading surfaces (guidebooks, mod details, server pages) given generous measure. The world carries the color; the GUI stays grey and lets it through, darkening or blurring it depending on how much attention the screen needs.

**Key Characteristics:**
- One typeface, Monocraft, for every role, rendered with the client's hard one-unit text shadow.
- GUI depth is drawn with inset pixel bevels (light top-left, dark bottom-right), never soft drop shadows.
- The 3D world is always present behind the UI and changes treatment per screen: soft blur on the title, heavy blur and dim on menus, clear but dimmed while peeking at a mod.
- Textures are painted in code from the world's own block tiles (stone on buttons, dirt behind advancements and the WebGL fallback).
- Every number on a page is a measured result; illustrations say they are illustrations.

## Colors

### Primary
- **Splash Yellow** (#ffff55): the client's highlight. Splash text, hovered button labels, advancement titles, chat command suggestions, the focus ring. Used sparingly so it still reads as "look here".
- **Stone Grey** (#6f6f6f, bevel #a9a9a9 / #3a3a3a): every button, under a 32px tile of the painted stone texture.

### Secondary
- **Tooltip Violet** (#100010 field, #5000ff → #28007f edge): item and world tooltips only.
- **XP Green** (#80ff20): experience bar, level number, ping bars, "SAFE" verdicts.

### Tertiary
- **Guidebook Oxblood** (#8c2b16): section headings, stat values, bars and turn arrows inside guidebooks. Never used outside the book.
- **Leather and Trim** (#6b3a1e, #3d1f0f, #c89b3c): the guidebook cover and its close button.

### Neutral
- **Inventory Grey** (#c6c6c6, bevel #ffffff / #555555): container panels (inventory, recipes, advancements).
- **Slot Grey** (#8b8b8b, inset #373737 / #ffffff): every inventory slot.
- **Label Charcoal** (#3f3f3f): container labels, text shadow color.
- **Lore Grey** (#a8a8a8): secondary text in tooltips, MOTDs, mod versions.
- **Cream Paper** (#f3ead3, #e8dcbc, edge #c9b98f) with **Page Ink** (#2b1d12) and **Page Muted** (#6b5a45): guidebook pages.
- **Night Ground** (#0d1a33): the body color under the canvas before WebGL paints.
- **GUI Border** (#000000) and **Field Border** (#a0a0a0): the 2px outline around every button, panel and slot; text fields and photos take the lighter edge.
- **Scrim** (#00000080 and its 40–73% siblings): the darkening behind menus, chat lines and dialogs.
- **Selection Blue** (#3b4bd8): text selection, the client's highlight colour.
- **Edition Plaque** (#3a2a1a, ink #f0d9a0): the "Data Science Edition" plaque under the logo.
- **Terminal** (#1d1a16, ink #e8e2cc): code and output panes inside guidebook demos.
- **Frame Gold** (#e8c040) and **Challenge Violet** (#b04ae0): earned advancement frames.

### Named Rules
**The Client Palette Rule.** GUI text uses Minecraft's formatting colors (white, gray, yellow, green, red, aqua) and nothing else. New accents belong to the world or the book, never to chrome.

**The Book Keeps Its Ink Rule.** Oxblood and cream live only inside guidebooks. Bringing them into menus breaks the line between "client" and "mod content".

## Typography

**Display, body and label font:** Monocraft (OFL, self-hosted, subset to woff2), falling back to `ui-monospace, monospace`. Font smoothing is turned off so it renders pixel-sharp.

### Hierarchy
- **Stat** (700, 34px, 1.1): headline numbers on a guidebook's numbers page.
- **Display** (700, 26px, 1.15): guidebook titles and mod names.
- **Headline** (400, 18px): screen titles ("Options", "Play Multiplayer") and guidebook section heads in oxblood with an underline rule.
- **Body** (400, 16px, 1.7): guidebook and mod-detail prose, held to about 62–72ch.
- **Label** (400, 13–14px, 1.35): tooltips, container labels, chat, MOTDs, slot keys (11px).

### Named Rules
**The One Face Rule.** Monocraft carries every role. Hierarchy comes from size, weight and color, never from a second family.

**The Shadow Is The Font Rule.** On dark ground, GUI text carries `text-shadow: 0.125em 0.125em 0 #3f3f3f`. It is part of how the client renders type, not decoration. Text on paper or on light panels carries no shadow.

## Layout

The title screen is a single centered column: logo, then a 400px button stack (Singleplayer, Multiplayer, Mods), then a row of two 196px buttons flanked by 40px icon buttons that sit outside the column, as in the real client. Footer lines pin to the bottom corners.

Menu screens share one frame: centered title at top, a dark scrolling band (`#00000073` with inset top and bottom shadows) for the body, and centered footer buttons. The Mods screen is a two-column list and detail grid (340px + up to 720px) whose band is transparent, so the build the camera flies to shows through.

Guidebooks are a two-page spread up to 1080×640 above 900px wide, and a single page with swipe and a top ribbon row below it. Container screens (inventory, advancements) keep the client's fixed slot geometry and scale up as a whole (`zoom: 1.4` / `1.15`) on screens of at least 1200×760.

Spacing runs on the GUI unit of 2px: 4, 8, 16, 24. Phones (≤760px) collapse two-column screens to one, stack the title row, put the splash in flow under the plaque, and shrink hotbar slots to 36px.

## Elevation & Depth

GUI depth is pixel bevel, drawn with zero-blur inset shadows that mirror the client's sprites:

- **Raised (buttons):** `inset 2px 2px 0 #a9a9a9, inset -2px -4px 0 #3a3a3a` inside a 2px black border. Pressed swaps the two.
- **Panel:** `inset 4px 4px 0 #ffffff, inset -4px -4px 0 #555555` inside a 2px black border.
- **Sunken (slots, advancement view, player preview):** `inset 2px 2px 0 #373737, inset -2px -2px 0 #ffffff`.

The only soft shadow in the system is the guidebook's ambient lift (`0 24px 48px -12px #000000cc`), because the book is a physical object floating over the world. Depth between UI and world comes from the world itself: blur and dim filters on the canvas layer.

**The Bevel Not Blur Rule.** Chrome never gets a soft drop shadow. A raised GUI element is raised by its bevel, exactly as the client draws it.

## Shapes

Square by default: buttons, slots, inputs, tooltips and the hotbar have no radius. Container panels take a 4px corner (the client's notched panel corner). The guidebook cover is rounded at 10px; its close button is a circle. Advancement frames encode type by shape: square for tasks, 12px rounded for goals, an octagonal clip for challenges.

## Components

### Buttons
- **Shape:** square, 2px black border, 40px tall; full (400px), half (196px), icon (40px) and auto widths.
- **Default:** stone tile texture under a `#5e5e5ed0` wash, label `#e0e0e0` with text shadow.
- **Hover / Focus:** blue-violet wash (`#6a74b8d8`), white border, yellow label. Focus and hover look the same, as in the client.
- **Disabled:** near-black wash, grey label, no bevel.

### Tooltips
- **Style:** `#100010f2` field, 2px violet gradient border, white title, grey lore lines; rare items title in aqua. Appear on hover and on keyboard focus.

### Container panels and slots
- **Panel:** Inventory Grey with panel bevel, charcoal labels without shadow.
- **Slot:** 36px sunken square; hovered slots get a white 50% overlay inside the bevel.

### Inputs
- **Style:** black field, 2px `#a0a0a0` border turning white on focus, white caret. Chat input is a translucent black bar across the bottom.

### Guidebook (signature component)
Two cream pages inside a leather cover with gold trim, bookmark ribbons (red, blue, green, gold) sticking out of the right edge, oxblood turn arrows in the bottom corners. Turning a page flips a real 3D leaf (`rotateY` over 720ms with `cubic-bezier(0.45, 0.05, 0.35, 1)` and a moving crease shade). Pages hold a cover, numbers, story, an interactive demo and honest limits with links.

### HUD
Hotbar of nine 40px slots with a white selection frame, hearts and an XP bar above it, a nametag tracking the player, chat lines that fade after nine seconds, a light-grey tutorial toast, dark advancement toasts sliding in from the right, and an F3 debug overlay.

## Do's and Don'ts

### Do:
- **Do** take every new texture from the world's own painted tiles (`tileCanvas`) so GUI and world share one material.
- **Do** keep numbers paired with their limits, and label illustrative demos as illustrations.
- **Do** give every 3D interaction a DOM route (hotbar, Mods list, guidebook routes like `/world/helix`).
- **Do** drive reduced motion from `html[data-motion]`, so animations still end and fire their end events.
- **Do** keep Monocraft subset to the characters the copy uses, and re-run the subset when copy adds a new glyph.

### Don't:
- **Don't** add soft drop shadows, glass or gradients to GUI chrome; use the bevels.
- **Don't** add a second typeface.
- **Don't** use Mojang's textures, logo or sounds; everything is painted or synthesized in code.
- **Don't** describe the methods behind Stretchy, Arachne + PhishGuard or PolySafe; outcomes and numbers only.
- **Don't** put kicker labels above headings or helper text under controls; if a screen needs it, fix the screen.
