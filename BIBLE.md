# DM Hub Project Bible

## Vision
The DM Hub is a high-fidelity, premium tool for Dungeon Masters to manage combat, encounters, and tactical map building with a "Wowed at first glance" aesthetic.

## Architecture
- **State Management**: Centralized `useEncounterState` hook using `IndexedDB` for persistent snapshots.
- **Combat Engine**: Reactive turn management with automated initiative and resource tracking.
- **Tactical Map Engine**: Multi-layer HTML5 Canvas rendering pipeline:
  - **Base Layer**: Procedural/Fixed Grid (50px).
  - **Terrain Layer**: Keyed coordinate painting (`rpgTile` assets).
  - **Object Layer**: Stamp-based decoration entities with scale and rotation.
  - **Sketch Layer**: Vector-based tactical drawing (pencil tool).
  - **Token Layer**: SVG-enhanced interactive entity tokens with drag-and-drop.

## UI/UX Design System
- **Theme**: Dark-mode primary with glassmorphism effects (`glass-dark`).
- **Typography**: Inter / Outfit (Modern Sans).
- **Animations**: `framer-motion` for transitions, palette slide-outs, and damage popups.
- **Micro-interactions**: Hover-scaling, tool active states, and canvas cursor indicators.

## Assets & Persistence
- **Asset Library**: 228+ high-fidelity CC0 tactical tiles (Kenney RPG Base) integrated into a slide-out palette.
- **Path Resolution**: Relative path management using Vite `BASE_URL` for robust deployment.
- **Key Strategy**: Unique key generation for tokens using `${entity.id}-${index}` to prevent reconciliation collisions.

## Feature Implementation Log
- [x] High-fidelity Tactical Map Engine (Multi-layer Canvas).
- [x] Persistent Map State (Serialization into snapshots).
- [x] Advanced Toolset (Paint, Stamp, Pencil, Eraser, Move).
- [x] Asset Palette (228 Kenney tiles integration).
- [x] Procedural Scene Templates (Forest, Dungeon, Tavern).
- [x] Grid Visualization & Toggling.
- [x] Multi-layer Object Stamping.
- [x] Duplicate Key reconciliation fix.
- [x] Base Path resolution fix for sub-directory hosting.
