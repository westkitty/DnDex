# DM_Hub Frontend Redesign — Grimdark Manuscript / Open Tome

**Date:** 2026-04-15  
**Status:** Approved  
**Scope:** Full visual redesign — all existing functionality preserved, visual layer replaced

---

## Context

DM_Hub is a React 19 / Vite D&D encounter tracker for Dungeon Masters. The existing design uses a dark glass-morphism aesthetic with a "dragon" color palette. The build is currently broken (missing Sidebar component + CSS circular dependency). This redesign replaces the visual layer entirely with an "Open Tome" grimdark manuscript aesthetic while preserving all existing component logic and interactions.

---

## Aesthetic Direction: Grimdark Manuscript / Open Tome

The app renders as a massive open grimoire filling the browser window. The metaphor: a DM's spellbook laid flat on a dark walnut table. Everything — typography, color, texture, interaction details — serves this metaphor.

**The one unforgettable thing:** The UI looks like a physical tome. Not skeuomorphic kitsch — a refined, functional tool that happens to feel like it was bound in a dungeon scriptorium.

---

## Layout

### Two-Panel Tome
- Full viewport. Behind it: near-black `#0d0b09` (dark table surface).
- The tome occupies a two-column CSS grid: **55% left / 45% right**.
- A thick **spine** divides the panels — a dark vertical band (`~24px`) with box-shadow casting left and right onto the pages.
- Both pages have aged parchment texture: layered `radial-gradient` (ivory center → amber-brown edges) + CSS noise overlay for grain. Corner vignettes.
- Spine center has faint embossed text: *Dungeon Master's Tome* (UnifrakturMaguntia, low-opacity).
- Right panel (rules/log) is collapsible. When hidden, left panel expands to full width — "single open page" view.

---

## Typography

All fonts via Google Fonts (free):

| Font | Use |
|------|-----|
| `UnifrakturMaguntia` | App title, major section labels (used sparingly) |
| `Cinzel` | Subheadings, entity names, tab labels (Cinzel Decorative for display) |
| `Crimson Pro` | Body text, notes, descriptions (already in project) |
| `JetBrains Mono` | Numbers only: initiative, HP, AC, damage (already in project) |

---

## Color System (CSS Custom Properties)

```css
--parchment:      #e8ddc8;  /* Page background */
--parchment-dark: #c9b88a;  /* Card backgrounds, inset areas */
--parchment-deep: #a8976a;  /* Pressed/active card states */
--ink:            #1c1208;  /* Primary text */
--ink-faded:      #5a4a30;  /* Secondary/muted text */
--ink-ghost:      #8a7a60;  /* Placeholder text, timestamps */
--blood:          #7a1515;  /* HP damage, active entity highlight, danger */
--blood-dark:     #4a0d0d;  /* Deep damage, dead state */
--iron:           #3d3d45;  /* Borders, dividers */
--iron-light:     #6a6a75;  /* Light borders */
--gold:           #b8960c;  /* Player characters, important accents */
--gold-dim:       #7a6308;  /* Muted gold */
--moss:           #2d4a2d;  /* Healing, positive states */
--moss-light:     #4a7a4a;  /* Healed glow */
--candle:         #d4780a;  /* Warning / concentration / amber alert */
--spine:          #0d0b09;  /* Table background, tome spine */
--spine-border:   #2a1f0f;  /* Spine edge highlight */
```

---

## Component Designs

### TopBar → Tome Header
- A header band spanning the full width of both pages (not outside the tome).
- **Left:** *DM's Tome* in UnifrakturMaguntia (~24px), `--ink` color.
- **Center:** Round counter displayed as `ROUND IV` (Roman numerals) in Cinzel Decorative. Prev/next navigation flanking it, styled as ink-drawn chevrons (`‹` / `›`) in `--iron` bordered buttons.
- **Right:** Add Player (gold) / Add Monster (blood) icon buttons, undo/redo pair, export/import dropdown — all using small `--iron`-bordered icon clusters.
- Bottom edge: thick ink-rule `border-bottom: 2px solid --ink`.
- Background: `--parchment-dark` — slightly darker than the page body to frame the header.

### InitiativeLedger → "Battle Manifest" (Left Page)
- Page label: `BATTLE MANIFEST` in Cinzel, letter-spaced, with decorative ink rules on either side (thin `--iron-light` horizontal lines).
- Entity count badge in `--ink-faded` (e.g., "6 Combatants").
- Drag-reorder handles: `⁞⁞` glyphs in `--ink-ghost`, monospaced.
- Thin `--iron-light` dividers between entity entries.
- Scrollable within the left page — custom scrollbar styled as a thin `--iron` track.

### EntityCard → "Manuscript Entry"
Each card is a torn-parchment entry:
- Background: `--parchment-dark` with rough bottom edge via `clip-path` (or pseudo-element mask).
- **Name** in Cinzel (16px), `--ink`.
- **Stats row** (Initiative / AC / HP) in JetBrains Mono, compact. Separated by `·` glyphs in `--ink-faded`.
- **HP bar:** horizontal, fills blood-red (`--blood`) from the left proportional to current HP. Empty portion is `--parchment-deep`. When below 25%: bar pulses faintly. Dead: grayscale.
- **Conditions:** small wax-seal badges — filled circles with 2-letter abbreviations in Cinzel, colored by condition severity.
- **Active entity:** thick `3px --blood` left border + subtle `box-shadow: inset 4px 0 12px rgba(122,21,21,0.15)` candle-glow.
- **Expand/collapse** for settings: ink-stain reveal animation (`scaleY` from top + `opacity`).
- **Delete** button: a quill-strike-through icon in `--blood`.
- Damage/heal inputs use `--parchment-deep` inset backgrounds with `--ink` text.

### RulesPanel + ActionLedger → "Reference Pages" (Right Page)
- Page label: `REFERENCE` in Cinzel with ink-rule decorators.
- **Tabs** (Ledger / Library): diagonal-cut tab shapes — like manuscript bookmarks extending from the top of the panel. Active tab: `--parchment` (matches page). Inactive: `--parchment-dark`.
- **ActionLedger entries:** look like footnotes — `--ink-ghost` timestamp (JetBrains Mono), event text in Crimson Pro, a small colored left-dot (`--blood` for damage, `--moss` for heal, `--iron-light` for info).
- **Library (Grimoire):** search input styled as a quill-ink underline field (no box, just a bottom border). Results as manuscript entries with `Cinzel` term headers and `Crimson Pro` descriptions.

---

## Broken Build Fixes (Prerequisites)

Both must be resolved before any visual work:

1. **Missing Sidebar component** — `App.jsx` imports `./components/Sidebar` which doesn't exist. Remove the import and any JSX usage. The Sidebar was superseded by `RulesPanel`.
2. **CSS circular dependency** — `index.css` uses `@apply font-serif` which creates a Tailwind circular dependency. Replace with explicit `font-family: 'Crimson Pro', Georgia, serif`.

---

## Animation & Motion

- Use existing **Framer Motion** (already installed) for entity card transitions, panel slide-in/out.
- Page load: staggered fade-in of left page → spine → right page (`staggerChildren: 0.1`).
- Entity add: card slides in from top with ink-blot fade.
- Entity remove: card shreds downward (scaleY to 0 + slight skew).
- HP change: bar animates width transition (`transition: width 0.4s ease`). Damage flash: brief blood-red pulse on card.
- Active turn transition: left border slides in with `scaleY` from center.
- Keep all motion subtle — fast enough not to interrupt play (max 300ms for interactive responses).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/App.jsx` | Remove Sidebar import, update layout to two-panel tome grid |
| `src/index.css` | Complete rewrite: new CSS variables, parchment textures, base styles |
| `tailwind.config.js` | Add custom colors, fonts, extend theme |
| `index.html` | Add Google Fonts link tags (UnifrakturMaguntia, Cinzel, Cinzel Decorative) |
| `src/components/TopBar.jsx` | Redesign header |
| `src/components/InitiativeLedger.jsx` | Apply new classes, section label treatment |
| `src/components/EntityCard.jsx` | Complete visual redesign |
| `src/components/RulesPanel.jsx` | Tab treatment, page label |
| `src/components/ActionLedger.jsx` | Footnote-style log entries |

---

## Out of Scope

- No new functionality added
- No changes to data model, state management, or IndexedDB layer
- No changes to export/import format
- No mobile/tablet layout (desktop-first)

---

## Verification

1. `cd /Users/andrew/Projects/DM_Hub && bun run build` — must complete without errors
2. `bun run dev` — open in browser, verify:
   - Two-panel tome layout renders with parchment texture
   - Add a player + monster, check entity cards render with new style
   - Drag to reorder initiative — drag handles visible and functional
   - Deal damage — HP bar animates, blood fill correct
   - Toggle right panel (rules) — collapses cleanly
   - Action log entries appear as footnote-style
   - Library search works
3. Check fonts loaded (Network tab: UnifrakturMaguntia, Cinzel, Crimson Pro, JetBrains Mono)
