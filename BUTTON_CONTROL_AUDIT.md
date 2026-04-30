# DnDex Button and Control Audit

## Summary
- **Date:** 2026-04-29
- **Branch:** main
- **Files inspected:** TopBar.jsx, MainDisplay.jsx, InitiativeLedger.jsx, EntityCard.jsx, entity-card/EntityHP.jsx, entity-card/EntityStats.jsx, entity-card/EntityConditions.jsx, entity-card/EntityLegendaryResources.jsx, entity-card/EntityActions.jsx, entity-card/EntityReference.jsx, NowActingPanel.jsx, TacticalAlertStack.jsx, MapDisplay.jsx, GroupDamageSheet.jsx, BestiaryModal.jsx, CommandPalette.jsx, SnapshotDrawer.jsx
- **Result:** 5 bugs found (B-MAP-01/02/03, B-GDS-01/02). All fixed in this session.

## Controls

| Component | Control | Handler | State/API Target | Verified By | Status | Notes |
|---|---|---|---|---|---|---|
| TopBar | Next Action (advance turn) | `advanceTurn(1)` | `updateState` → `combatEngine.advanceTurn` | source+smoke | OK | |
| TopBar | Prev Turn (ChevronLeft) | `advanceTurn(-1)` | same | source | OK | |
| TopBar | Undo | `undo()` | history stack | source+smoke | OK | Shows toast via TopBar |
| TopBar | Redo | `redo()` | history stack | source+smoke | OK | Shows toast via TopBar |
| TopBar | View: List/Map toggle | `setView('list'/'map')` | local FSM | source+smoke | OK | Two buttons in nav |
| TopBar | New Hero | `addEntity(true)` | `updateState` | source | OK | In Quick Add dropdown |
| TopBar | New Foe | `addEntity(false)` | `updateState` | source | OK | In Quick Add dropdown |
| TopBar | From Bestiary | `toggleBestiary()` | modal FSM | source+smoke | OK | In Quick Add dropdown |
| TopBar | Rules Reference | `toggleRules()` | modal FSM | source | OK | Book icon button |
| TopBar | Snapshots | `toggleSnapshots()` | modal FSM | source | OK | Camera icon button |
| TopBar | Archive Campaign | `exportState()` | file download | source | OK | In Settings dropdown |
| TopBar | Player Handout | `handleExport('player')` | file download | source | OK | In Settings dropdown |
| TopBar | Upload Session | `importState(parsed)` | `updateState` | source+test | OK | File input in Settings |
| TopBar | Wipe Encounter | `clearEncounter()` | `updateState` | source | OK | confirm() guard |
| TopBar | Reset Battlefield | `resetMap()` | `updateState` | source | OK | confirm() guard |
| MapDisplay | Move tool | `setTool('move')` | local state | source | OK | |
| MapDisplay | Paint tool | `setTool('paint')` + palette | `commitTerrain(pendingTiles)` on mouseup | source | FIXED | was `placeTile` per move with skipHistory |
| MapDisplay | Stamp tool | `setTool('stamp')` + palette | `placeObject(...)` | source | FIXED | was skipHistory; now history-aware |
| MapDisplay | Sketch (Pencil) | `setTool('pencil')` | `commitDrawing(path)` on mouseup | source | FIXED | was `updateMap({drawing:...})` with skipHistory |
| MapDisplay | Eraser | draws colored overlay path | `commitDrawing(path)` on mouseup | source | FIXED | same fix as pencil |
| MapDisplay | Grid toggle | `setShowGrid(!showGrid)` | local state only | source | OK | intentionally local, no persistence |
| MapDisplay | Purge Sketches | `clearDrawing()` | `clearMapDrawing()` | source | FIXED | was `updateMap({drawing:[]})` |
| MapDisplay | Clear Battlefield | confirm → `clearMap()` | `updateState` with message | source | FIXED | was `updateMap(...)` skipHistory + dropped msg |
| MapDisplay | Apply Template | `applyTemplate(tmpl)` | `updateState` with message | source | FIXED | was `updateMap(...)` skipHistory |
| MapDisplay | Next Turn HUD | `encounter.advanceTurn(1)` | same as TopBar | source | OK | |
| MapDisplay | Token drag | `updateToken(id, pos, isFinal)` | skipHistory during drag, history on end | source+test | OK | transaction boundary correct |
| MapDisplay | Fog tool | `setTool('fog')` | `setFogCell(x,y,hidden)` per cell | source | NEW | added this session |
| MapDisplay | Fog mode toggle | `setFogMode(...)` | local state | source | NEW | hide/reveal toggle |
| MapDisplay | Clear Fog | `clearFog()` | `updateState` | source | NEW | added this session |
| InitiativeLedger | Quick-Start Demo | `loadEncounter(demoEncounter)` | `updateState` | source+smoke | OK | empty state only |
| InitiativeLedger | Add Hero | `addEntity(true)` | `updateState` | source | OK | |
| InitiativeLedger | Add Foe | `addEntity(false)` | `updateState` | source | OK | |
| InitiativeLedger | Open Bestiary | `toggleBestiary()` | modal FSM | source+smoke | OK | |
| InitiativeLedger | Area Damage | `toggleGroupDamage()` | modal FSM (GROUP_DAMAGE) | source | FIXED | was missing entirely — B-GDS-02 |
| InitiativeLedger | Entity drag/reorder | `setEntitiesOrder(newOrder)` | `updateState` | source+test | OK | preserves active turn index |
| EntityCard | Expand/Compact toggle | local `isExpanded` state | local state | source | OK | |
| EntityCard | HP edit/preview | local `hpInput` state | local state until Apply | source | OK | |
| EntityCard | Apply damage | `applyDamage(id, amount, type)` | `updateState` | source+test | OK | |
| EntityCard | Apply healing | `applyHealing(id, amount)` | `updateState` | source+test | OK | |
| EntityCard | Condition toggle | `updateEntity(id, {conditions})` | `updateState` | source | OK | |
| EntityCard | Concentration toggle | `updateEntity(id, {concentration})` | `updateState` | source | OK | |
| EntityCard | Remove entity | `removeEntity(id)` | `updateState` | source | OK | |
| EntityCard | Duplicate entity | `duplicateEntity(id)` | `updateState` | source | OK | |
| EntityHP | HP input | local input state → `applyDamage`/`applyHealing` | `updateState` | source | OK | |
| EntityStats | Initiative edit | `updateEntity(id, {initiative})` | `updateState` | source | OK | |
| EntityStats | AC edit | `updateEntity(id, {ac})` | `updateState` | source | OK | |
| EntityLegendaryResources | Spend LA | `spendLegendaryAction(id)` | `updateState` | source | OK | |
| EntityLegendaryResources | Spend LR | `spendLegendaryResistance(id)` | `updateState` | source | OK | |
| NowActingPanel | End Turn / Next | `advanceTurn(1)` | `updateState` | source | OK | |
| NowActingPanel | Damage apply | `applyDamage(id, amount, type)` | `updateState` | source | OK | |
| NowActingPanel | Healing apply | `applyHealing(id, amount)` | `updateState` | source | OK | |
| NowActingPanel | Spend LA | `spendLegendaryAction(id)` | `updateState` | source | OK | |
| NowActingPanel | Spend LR | `spendLegendaryResistance(id)` | `updateState` | source | OK | |
| TacticalAlertStack | Clear alert | `clearAlert(id)` | `updateState` skipHistory | source | OK | correct — alert clear isn't undoable |
| TacticalAlertStack | Concentration Pass | `resolveConcentration(id, true)` | `updateState` | source+test | OK | |
| TacticalAlertStack | Concentration Fail | `resolveConcentration(id, false)` | `updateState`, clears concentration | source+test | OK | |
| MainDisplay | Alert clear (inline) | `clearAlert(id)` | same | source | OK | |
| GroupDamageSheet | Select targets | local `selectedIds` state | local only | source | FIXED | now reachable via InitiativeLedger |
| GroupDamageSheet | Set base damage | local `baseAmount` state | local only | source | FIXED | now reachable |
| GroupDamageSheet | Per-target save/resistance | local `overrides` state | local only | source | FIXED | now reachable |
| GroupDamageSheet | Apply Area Damage | `onApply(damageMap, type, msg)` → `applyBulkDamage` | `updateState` | source | FIXED | wired via App.jsx B-GDS-01 |
| GroupDamageSheet | Cancel | `onClose()` | modal FSM | source | FIXED | now reachable |
| BestiaryModal | Search | local filter state | local state | source+smoke | OK | |
| BestiaryModal | Deploy monster | `onAdd(monster)` → `addEntityFromTemplate` | `updateState` | source+smoke | OK | |
| CommandPalette | All commands | per-command handlers | various | source | OK | |
| SnapshotDrawer | Save snapshot | `saveSnapshot(name)` | `updateState` | source | OK | |
| SnapshotDrawer | Load snapshot | `loadSnapshot(id)` | `updateState` | source | OK | |
| SnapshotDrawer | Delete snapshot | `deleteSnapshot(id)` | `updateState` | source | OK | |

## Broken Controls Found

### B-MAP-01 — All Map Operations Bypass Undo/Redo History
- **File:** `src/hooks/useEncounterState.js:438`
- **Cause:** `updateMap` passes `skipHistory: true` unconditionally. Every map mutation (terrain, objects, drawing, clearMap, applyTemplate) routes through this path.
- **Impact:** No map edit can be undone or redone. History stack is untouched by any map operation except token drag-end.

### B-MAP-02 — Paint Tool Creates No Useful State Transition
- **File:** `src/hooks/useEncounterState.js:449`, `src/components/MapDisplay.jsx:188,226`
- **Cause:** `placeTile` called per mousemove event, each modifying terrain via `updateMap` (skipHistory). Paint strokes create zero history entries.
- **Impact:** Painting a stroke has no undo entry. Also: per-move calls (even though skipHistory) cause redundant state reads via `stateRef`.

### B-MAP-03 — clearMap Drops Log Message
- **File:** `src/hooks/useEncounterState.js:469`
- **Cause:** `clearMap` calls `updateMap({ ..., "Battlefield sanitized." })` — `updateMap(updates)` only takes one argument. The second arg is ignored.
- **Impact:** clearMap produces no audit log entry.

### B-GDS-01/02 — GroupDamageSheet Completely Unreachable
- **Files:** `src/App.jsx`, `src/components/MainDisplay.jsx`, `src/components/InitiativeLedger.jsx`
- **Cause:** `GroupDamageSheet` was imported nowhere and had no trigger. Complete component exists but has no entry point in the application.
- **Impact:** Area damage UI is inaccessible. The "Atomic multi-target transaction" feature is dead code.

## Fixes Applied

| Fix | Files | Description |
|-----|-------|-------------|
| B-MAP-01/02/03 | `useEncounterState.js`, `MapDisplay.jsx` | Replaced `updateMap`-based map mutations with `updateState`-based actions: `commitTerrain`, `commitDrawing`, `clearMapDrawing`, `placeObject` (rewritten), `removeObject` (rewritten), `applyTemplate` (rewritten), `clearMap` (rewritten). MapDisplay buffers paint strokes in `pendingTiles` local state and commits single history entry on mouseup. |
| B-GDS-01/02 | `App.jsx`, `MainDisplay.jsx`, `InitiativeLedger.jsx` | Added `GROUP_DAMAGE` to modal FSM. Imported and rendered `GroupDamageSheet`. Added "Area Damage" button (Zap icon) to InitiativeLedger toolbar, visible when entities exist. |

## Remaining Risks

- **Fog drag history spam:** Fog of War's `setFogCell` is called per-cell during drag painting, creating one history entry per cell. Future optimization: batch fog strokes like terrain.
- **Custom asset persistence:** Custom assets uploaded via the file input in MapDisplay are stored in the runtime `ASSETS` object only (not in map state). They are lost on page reload. This is a known limitation of the current architecture.
- **Map canvas fixed size:** Canvas is 2500×2500px. Performance on large terrain maps with many tiles has not been load-tested.
- **Grid toggle local only:** `showGrid` is local React state in MapDisplay and not persisted in encounter state. Toggling grid is lost on reload or view switch. This is intentional (cosmetic DM preference).
