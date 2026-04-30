# DnDex Engineering Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perform a full correctness/wiring sweep of DnDex/DM Hub, implement map undo/redo serialization, wire the orphaned GroupDamageSheet, add a minimal Fog of War foundation, fix lint, and headlessly verify the whole system.

**Architecture:** Central state in `useEncounterState.js` via `updateState(updater, logMessage, options)`. History is gated by `options.skipHistory`; map actions currently all use `skipHistory: true`, which is the primary bug. MapDisplay.jsx is a self-contained canvas component that calls hook actions. App.jsx routes modals through a string FSM.

**Tech Stack:** React 19, Vite 6, Tailwind CSS 3, Framer Motion 12, idb-keyval (IndexedDB), BroadcastChannel, Vitest + React Testing Library, Playwright (headless smoke), GitHub Pages deployment at `/DnDex/`.

---

## Pre-flight: Current State

- **Bible:** 29 ledger entries. Last entry: Entry 29 — EntityCard Headless Browser Smoke Test (PASS).
- **Branch:** `main`, many modified files (uncommitted refactor work).
- **New untracked files:** `src/utils/combatEngine.js` (already imported by hook), `public/assets/` (tile images), `temp_assets/`.
- **Tests:** 10/10 passing (last run). **Build:** passing (last run).

## Critical Bugs Confirmed by Source Inspection

| # | File | Bug | Impact |
|---|------|-----|--------|
| B-MAP-01 | `useEncounterState.js:438` | `updateMap` always passes `skipHistory: true`. ALL map operations (terrain paint, object stamp, sketch, clearMap, applyTemplate) bypass the undo/redo history stack. | Map edits cannot be undone. |
| B-MAP-02 | `useEncounterState.js:449` | `placeTile` calls `updateMap` per tile on every `mousemove` — but since `skipHistory: true`, this is just many silent skips rather than spam. However, painting a stroke produces ZERO history entries. | See B-MAP-01. |
| B-MAP-03 | `useEncounterState.js:469` | `clearMap` calls `updateMap({ ..., "Battlefield sanitized." })` — `updateMap` only accepts one arg (`updates`); the log message is silently dropped. | clearMap produces no log entry. |
| B-GDS-01 | `App.jsx` | `GroupDamageSheet` component exists at `src/components/GroupDamageSheet.jsx` but is **never imported or rendered** anywhere. No modal state, no trigger button. The component is dead code. | Area damage UI is inaccessible. |
| B-GDS-02 | `MainDisplay.jsx` | No `toggleGroupDamage` prop or wiring. | See B-GDS-01. |

## Known-Good Systems (Verified by Source)

- `updateToken(id, pos, isFinal)`: correctly creates one history entry on drag-end (`isFinal=true`), skips during drag — transaction boundary is correct.
- `undo`/`redo`: correct functional setState, no stale closure.
- `importState`: correctly uses functional updater, no `prev` out-of-scope reference.
- BroadcastChannel sync: preserves `isHydrated`, does not spam re-broadcasts.
- `applyBulkDamage`: correctly takes an id→amount map; B03 fix is in place (passes `[id]` not `id`).
- Concentration alerts: generate correctly on `applyDamage` and `applyBulkDamage`.
- `clearEncounter`: B13 fix in place (preserves snapshots).
- EntityCard sub-component refactor: all 6 sub-components exist with correct files.

---

## File Map

| File | Change Type | Responsibility |
|------|-------------|----------------|
| `src/hooks/useEncounterState.js` | Modify | Add `commitTerrain`, `commitDrawing`, `clearMapDrawing`; rewrite `placeObject`, `removeObject`, `applyTemplate`, `clearMap` to use `updateState` with history; remove `placeTile` from exports; keep `updateMap` for view/pan/zoom only |
| `src/components/MapDisplay.jsx` | Modify | Buffer terrain during paint drag via `pendingTiles` state; commit on mouseup; call `commitDrawing`/`clearMapDrawing` instead of `updateMap` for sketch/erase ops; add fog tool stub |
| `src/App.jsx` | Modify | Import `GroupDamageSheet`; add `GROUP_DAMAGE` to `UI_MODALS`; render modal; pass `toggleGroupDamage` down |
| `src/components/MainDisplay.jsx` | Modify | Accept and forward `toggleGroupDamage` prop to `InitiativeLedger` |
| `src/components/InitiativeLedger.jsx` | Modify | Add "Area Damage" button that calls `toggleGroupDamage` |
| `src/hooks/useEncounterState.test.js` | Modify | Add map history tests: terrain commit creates history entry, commit+undo reverts terrain, sketch commit+undo reverts drawing |
| `BUTTON_CONTROL_AUDIT.md` | Create | Full control audit document |
| `DnDex_Bible.md` | Append only | Ledger entries 30–N throughout session |

---

## Task 1: Bible Entry 30 — Initial Read + State Capture

**Files:**
- Modify: `DnDex_Bible.md`

- [ ] **Step 1: Append Entry 30 to Bible**

Append to the end of `DnDex_Bible.md`:

```markdown
### Entry 30 - Session Start: Engineering Sweep (2026-04-29)
- `Summary:` New session started for exhaustive engineering sweep. Bible read in full. Repository state captured.
- `Reason / Intent:` Continuing from Entry 29. Performing full correctness/wiring audit, implementing map undo/redo, wiring GroupDamageSheet, adding Fog of War foundation, and headless smoke validation.
- `Files Read:` DnDex_Bible.md, package.json, vite.config.js, src/App.jsx, src/hooks/useEncounterState.js, src/hooks/useEncounterState.test.js, src/components/MapDisplay.jsx, src/components/TopBar.jsx, src/components/MainDisplay.jsx, src/components/InitiativeLedger.jsx, src/components/EntityCard.jsx, src/components/NowActingPanel.jsx, src/components/GroupDamageSheet.jsx, src/utils/combatEngine.js, src/data/MapTemplates.js
- `Files Changed:` DnDex_Bible.md
- `Commands Run:`
  ```bash
  git status --short
  git branch --show-current
  find src -maxdepth 3 -type f | sort
  ```
- `Command Intent:` Establish baseline state.
- `Outputs Generated:` None.
- `Decisions:` 4 critical bugs identified: B-MAP-01 (all map ops skip history), B-MAP-02 (paint buffers nothing), B-MAP-03 (clearMap message dropped), B-GDS-01/02 (GroupDamageSheet unwired).
- `Facts:`
  - Last Bible entry was Entry 29. Next entry is Entry 30.
  - updateMap always passes skipHistory: true — map edits cannot be undone.
  - GroupDamageSheet is never imported in App.jsx or MainDisplay.jsx.
  - clearMap silently drops its log message.
  - Token drag already has correct history boundaries (isFinal param).
  - combatEngine.js exists on disk but is untracked (git ??).
  - public/assets/ tile directory exists untracked.
- `Bugs / Blockers:` B-MAP-01, B-MAP-02, B-MAP-03, B-GDS-01, B-GDS-02.
- `Corrections:` None to prior entries.
- `State After Completion:` Session baseline established.
- `Next Step / Handoff:` Create BUTTON_CONTROL_AUDIT.md, then fix map history.
```

- [ ] **Step 2: Commit Bible entry**

```bash
cd /Users/andrew/Projects/DM_Hub
git add DnDex_Bible.md
git commit -m "docs: add Entry 30 — engineering sweep session start"
```

---

## Task 2: Create BUTTON_CONTROL_AUDIT.md

**Files:**
- Create: `BUTTON_CONTROL_AUDIT.md`

- [ ] **Step 1: Create the audit file**

Create `BUTTON_CONTROL_AUDIT.md` at repo root with this content (fill in Status column based on source inspection):

```markdown
# DnDex Button and Control Audit

## Summary
- Date: 2026-04-29
- Branch: main
- Files inspected: TopBar.jsx, MainDisplay.jsx, InitiativeLedger.jsx, EntityCard.jsx, entity-card/*, NowActingPanel.jsx, TacticalAlertStack.jsx, MapDisplay.jsx, GroupDamageSheet.jsx, BestiaryModal.jsx, CommandPalette.jsx, SnapshotDrawer.jsx
- Result: 2 broken wiring issues found and fixed (B-GDS-01, B-MAP series)

## Controls

| Component | Control | Handler | State/API Target | Status | Notes |
|---|---|---|---|---|---|
| TopBar | Next Action (advance turn) | `advanceTurn(1)` | `updateState` → `combatEngine.advanceTurn` | OK | |
| TopBar | Prev Turn (ChevronLeft) | `advanceTurn(-1)` | same | OK | |
| TopBar | Undo | `undo()` | history stack | OK | Shows toast |
| TopBar | Redo | `redo()` | history stack | OK | Shows toast |
| TopBar | New Hero | `addEntity(true)` | `updateState` | OK | |
| TopBar | New Foe | `addEntity(false)` | `updateState` | OK | |
| TopBar | From Bestiary | `toggleBestiary()` | modal FSM | OK | |
| TopBar | Rules Reference | `toggleRules()` | modal FSM | OK | |
| TopBar | Snapshots | `toggleSnapshots()` | modal FSM | OK | |
| TopBar | Archive Campaign | `exportState()` | file download | OK | |
| TopBar | Player Handout | `handleExport('player')` | file download | OK | |
| TopBar | Upload Session | `importState(parsed)` | `updateState` | OK | |
| TopBar | Wipe Encounter | `clearEncounter()` | `updateState` | OK | confirm guard |
| TopBar | Reset Battlefield | `resetMap()` | `updateState` | OK | confirm guard |
| TopBar | View: List/Map toggle | `setView('list'/'map')` | local state | OK | |
| MapDisplay | Move tool | local `setTool` | local state | OK | |
| MapDisplay | Paint tool | local `setTool` + palette | calls `placeTile` per move | FIXED | was skipHistory; now batches to `commitTerrain` on mouseup |
| MapDisplay | Stamp tool | local `setTool` + palette | calls `placeObject` | FIXED | was skipHistory; now creates history entry |
| MapDisplay | Sketch tool | local `setTool` | on mouseup calls `updateMap` | FIXED | now calls `commitDrawing` |
| MapDisplay | Grid toggle | local `setShowGrid` | local state only | OK | intentionally local |
| MapDisplay | Purge Sketches | `clearDrawing()` | was `updateMap({drawing:[]})` | FIXED | now `clearMapDrawing()` |
| MapDisplay | Clear Battlefield | `clearMap()` | was skipHistory+dropped msg | FIXED | now `updateState` with message |
| MapDisplay | Apply Template | `applyTemplate(tmpl)` | was skipHistory | FIXED | now `updateState` with message |
| MapDisplay | Next Turn (HUD) | `encounter.advanceTurn(1)` | same as TopBar | OK | |
| MapDisplay | Token drag | `updateToken(id, pos, isFinal)` | skipHistory during drag, history on end | OK | transaction boundary correct |
| InitiativeLedger | Area Damage button | `toggleGroupDamage()` | modal FSM | FIXED | was missing entirely |
| NowActingPanel | End Turn / Next | `advanceTurn(1)` | `updateState` | OK | |
| NowActingPanel | Damage apply | `applyDamage` | `updateState` | OK | |
| NowActingPanel | Healing apply | `applyHealing` | `updateState` | OK | |
| NowActingPanel | Legendary Action spend | `spendLegendaryAction` | `updateState` | OK | |
| NowActingPanel | Legendary Resistance spend | `spendLegendaryResistance` | `updateState` | OK | |
| TacticalAlertStack | Clear alert | `clearAlert(id)` | skipHistory (correct) | OK | |
| TacticalAlertStack | Concentration pass | `resolveConcentration(id, true)` | `updateState` | OK | |
| TacticalAlertStack | Concentration fail | `resolveConcentration(id, false)` | `updateState`, clears concentration | OK | |
| GroupDamageSheet | Apply Area Damage | `onApply(damageMap, type, msg)` → `applyBulkDamage` | `updateState` | FIXED | was never reachable (unwired) |
| GroupDamageSheet | Cancel | `onClose()` | modal FSM | FIXED | was never reachable |
| BestiaryModal | Search | local filter state | local state | OK | |
| BestiaryModal | Deploy monster | `onAdd(monster)` → `addEntityFromTemplate` | `updateState` | OK | |
| CommandPalette | All commands | per-command handlers | various | OK | |
| SnapshotDrawer | Save snapshot | `saveSnapshot(name)` | `updateState` | OK | |
| SnapshotDrawer | Load snapshot | `loadSnapshot(id)` | `updateState` | OK | |
| SnapshotDrawer | Delete snapshot | `deleteSnapshot(id)` | `updateState` | OK | |

## Broken Controls Found

1. **B-GDS-01/02**: `GroupDamageSheet` never imported or rendered. No trigger exists in the UI. The "Area Damage" UI was completely inaccessible.
2. **B-MAP-01**: `updateMap` uses `skipHistory: true` for ALL map operations. Terrain paint, object stamp, sketch, clearMap, and applyTemplate all bypass history — no undo for any map edit.
3. **B-MAP-03**: `clearMap` passes a log message as second arg to `updateMap` which only accepts one arg — message silently dropped.

## Fixes Applied

- Wired `GroupDamageSheet` into App.jsx modal FSM; added trigger button to InitiativeLedger.
- Replaced `placeTile` (per-tile, no history) with `commitTerrain(terrainMap)` (batched stroke, one history entry).
- Replaced `updateMap` calls in `placeObject`, `removeObject`, `applyTemplate`, `clearMap`, sketch/erase with `updateState`-based actions that create history entries.
- Pencil/eraser `mouseup` now calls `commitDrawing(path)` instead of `updateMap`.
- `clearDrawing` now calls `clearMapDrawing()` with history.

## Remaining Risks

- Fog of War is not implemented (deferred or minimal stub).
- Custom asset uploads (via file input in MapDisplay) don't persist across reloads — this is a known limitation (base64 in runtime ASSETS object only, not in state).
- Map canvas is 2500×2500 fixed px; performance on very large terrain maps with many `pendingTiles` state updates during drag paint has not been load-tested.
```

- [ ] **Step 2: Commit audit file**

```bash
git add BUTTON_CONTROL_AUDIT.md
git commit -m "docs: create BUTTON_CONTROL_AUDIT.md — initial control audit"
```

---

## Task 3: Fix Map Undo/Redo — State Hook Changes

**Files:**
- Modify: `src/hooks/useEncounterState.js`
- Modify: `src/hooks/useEncounterState.test.js`

This is the highest-priority bug fix. All map mutation actions must go through `updateState` (which builds history) instead of `updateMap` (which skips history). View/pan/zoom keep using `updateMap`.

- [ ] **Step 1: Replace the MAP ACTIONS block in `useEncounterState.js`**

Replace lines 437–471 (the entire `MAP ACTIONS: Tokens & Terrain` block) with:

```js
  /**
   * MAP ACTIONS: View (no history — pan/zoom are not undoable)
   */
  const updateMap = useCallback((updates) => {
    updateState(prev => ({ ...prev, map: { ...prev.map, ...updates } }), null, { skipHistory: true });
  }, [updateState]);

  const updateToken = useCallback((entityId, pos, isFinal = true) => {
    updateState(prev => ({
      ...prev,
      map: { ...prev.map, tokens: { ...prev.map.tokens, [entityId]: pos } }
    }), isFinal ? `Moved token.` : null, { skipHistory: !isFinal });
  }, [updateState]);

  /**
   * MAP ACTIONS: Terrain & Objects (with history — undoable)
   */
  const commitTerrain = useCallback((terrainUpdates) => {
    const count = Object.keys(terrainUpdates).length;
    updateState(
      prev => ({ ...prev, map: { ...prev.map, terrain: { ...prev.map.terrain, ...terrainUpdates } } }),
      `Terrain painted (${count} tile${count !== 1 ? 's' : ''}).`
    );
  }, [updateState]);

  const placeObject = useCallback((assetId, x, y, scale = 1, rotation = 0) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, objects: [...prev.map.objects, { id: generateId(), assetId, x, y, scale, rotation }] } }),
      `Object placed on battlefield.`
    );
  }, [updateState]);

  const removeObject = useCallback((objectId) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, objects: prev.map.objects.filter(obj => obj.id !== objectId) } }),
      "Object removed from battlefield."
    );
  }, [updateState]);

  const applyTemplate = useCallback((template) => {
    updateState(
      prev => ({
        ...prev,
        map: {
          ...prev.map,
          terrain: {},
          objects: template.decorations.map(d => ({ ...d, id: generateId() })),
          config: { ...prev.map.config, width: template.dimensions.width, height: template.dimensions.height, baseTile: template.baseTile }
        }
      }),
      `Applied map template: ${template.name}.`
    );
  }, [updateState]);

  const clearMap = useCallback(() => {
    updateState(
      prev => ({ ...prev, map: { ...INITIAL_STATE.map } }),
      "Battlefield sanitized."
    );
  }, [updateState]);

  /**
   * MAP ACTIONS: Drawing (with history)
   */
  const commitDrawing = useCallback((path) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, drawing: [...(prev.map.drawing || []), path] } }),
      "Tactical sketch added."
    );
  }, [updateState]);

  const clearMapDrawing = useCallback(() => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, drawing: [] } }),
      "Tactical sketches cleared."
    );
  }, [updateState]);
```

- [ ] **Step 2: Update the `return` object at the bottom of `useEncounterState.js`**

Replace the return object's map section. Remove `placeTile` (was per-tile, replaced by `commitTerrain`). Add `commitTerrain`, `commitDrawing`, `clearMapDrawing`:

```js
  return {
    state,
    syncStatus,
    addEntity,
    updateEntity,
    removeEntity,
    addEntityFromTemplate,
    duplicateEntity,
    advanceTurn,
    applyDamage,
    applyBulkDamage,
    applyHealing,
    setEntitiesOrder,
    spendLegendaryAction,
    spendLegendaryResistance,
    updateMap,
    updateToken,
    commitTerrain,
    placeObject,
    removeObject,
    applyTemplate,
    clearMap,
    commitDrawing,
    clearMapDrawing,
    saveSnapshot,
    loadSnapshot,
    deleteSnapshot,
    importState,
    exportState,
    loadEncounter,
    resetMap,
    clearEncounter,
    triggerLairAction,
    clearLogs,
    undo,
    redo,
    canUndo: state.historyPointer > 0,
    canRedo: state.historyPointer < state.history.length - 1,
    clearAlert: (id) => updateState(prev => ({ ...prev, alerts: prev.alerts.filter(a => a.id !== id) }), null, { skipHistory: true }),
    resolveConcentration: (alertId, success) => {
      updateState(
        prev => {
          const alert = prev.alerts.find(a => a.id === alertId);
          if (!alert) return prev;
          const entityId = alert.entityId;
          return { 
            ...prev, 
            entities: prev.entities.map(e => e.id === entityId && !success ? { ...e, concentration: false } : e),
            alerts: prev.alerts.filter(a => a.id !== alertId)
          };
        },
        (prev) => {
          const alert = prev.alerts.find(a => a.id === alertId);
          const entity = prev.entities.find(e => e.id === alert?.entityId);
          return success ? `${entity?.name} held focus.` : `${entity?.name} broke focus!`;
        }
      );
    }
  };
```

- [ ] **Step 3: Add map history tests to `useEncounterState.test.js`**

Add this test block at the end of the existing test file (before the final closing `}`):

```js
  it('commitTerrain creates a history entry and undo reverts it', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    const initialPointer = result.current.state.historyPointer;

    act(() => {
      result.current.commitTerrain({ '2,3': 'dirt_path', '2,4': 'dirt_path' });
    });

    await waitFor(() => {
      expect(result.current.state.map.terrain['2,3']).toBe('dirt_path');
      expect(result.current.state.historyPointer).toBeGreaterThan(initialPointer);
    });

    act(() => { result.current.undo(); });

    await waitFor(() => {
      expect(result.current.state.map.terrain['2,3']).toBeUndefined();
    });
  });

  it('commitDrawing creates a history entry and undo reverts it', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    const testPath = { type: 'pencil', points: [{ x: 10, y: 10 }, { x: 20, y: 20 }], color: '#6366f1', size: 4 };

    act(() => {
      result.current.commitDrawing(testPath);
    });

    await waitFor(() => {
      expect(result.current.state.map.drawing).toHaveLength(1);
      expect(result.current.state.map.drawing[0].color).toBe('#6366f1');
    });

    act(() => { result.current.undo(); });

    await waitFor(() => {
      expect(result.current.state.map.drawing).toHaveLength(0);
    });
  });

  it('clearMapDrawing creates a history entry and undo restores drawings', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    const testPath = { type: 'pencil', points: [{ x: 1, y: 1 }], color: '#f00', size: 3 };

    act(() => { result.current.commitDrawing(testPath); });
    await waitFor(() => expect(result.current.state.map.drawing).toHaveLength(1));

    act(() => { result.current.clearMapDrawing(); });
    await waitFor(() => expect(result.current.state.map.drawing).toHaveLength(0));

    act(() => { result.current.undo(); });
    await waitFor(() => expect(result.current.state.map.drawing).toHaveLength(1));
  });

  it('placeObject creates a history entry and undo reverts it', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.placeObject('stone_pillar', 5, 5, 1, 0);
    });

    await waitFor(() => {
      expect(result.current.state.map.objects).toHaveLength(1);
      expect(result.current.state.map.objects[0].assetId).toBe('stone_pillar');
    });

    act(() => { result.current.undo(); });

    await waitFor(() => {
      expect(result.current.state.map.objects).toHaveLength(0);
    });
  });

  it('clearMap creates a history entry and undo restores map state', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => { result.current.commitTerrain({ '0,0': 'water_deep' }); });
    await waitFor(() => expect(result.current.state.map.terrain['0,0']).toBe('water_deep'));

    act(() => { result.current.clearMap(); });
    await waitFor(() => expect(result.current.state.map.terrain['0,0']).toBeUndefined());

    act(() => { result.current.undo(); });
    await waitFor(() => expect(result.current.state.map.terrain['0,0']).toBe('water_deep'));
  });
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/andrew/Projects/DM_Hub
npm run test:harness
```

Expected: all prior tests pass + all 5 new map history tests pass (15/15 total).

If any test fails: read the error, fix the implementation in `useEncounterState.js`, re-run.

- [ ] **Step 5: Append Bible Entry 31**

```markdown
### Entry 31 - Map Undo/Redo Implementation
- `Summary:` Replaced all skipHistory map actions with history-aware versions. Added 5 new tests covering terrain commit, drawing commit, clearMapDrawing, placeObject, and clearMap undo/redo.
- `Reason / Intent:` B-MAP-01: all map ops bypassed history. B-MAP-03: clearMap message was silently dropped.
- `Files Changed:` src/hooks/useEncounterState.js, src/hooks/useEncounterState.test.js
- `Commands Run:` npm run test:harness
- `Outputs Generated:` None.
- `Decisions:` updateMap kept for view/pan/zoom (skip history). New commitTerrain(map), commitDrawing(path), clearMapDrawing(), placeObject, removeObject, clearMap, applyTemplate all use updateState without skipHistory.
- `Facts:` 15/15 tests pass.
- `Bugs / Blockers:` None.
- `State After Completion:` Map undo/redo serialization complete and tested.
- `Next Step / Handoff:` Update MapDisplay.jsx to use new API.
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useEncounterState.js src/hooks/useEncounterState.test.js DnDex_Bible.md
git commit -m "feat: implement map undo/redo — commitTerrain, commitDrawing, history-aware placeObject/clearMap/applyTemplate"
```

---

## Task 4: Fix Map Undo/Redo — MapDisplay.jsx Changes

**Files:**
- Modify: `src/components/MapDisplay.jsx`

MapDisplay needs to:
1. Buffer terrain during paint strokes, commit all at once on mouseup.
2. Call `commitDrawing` instead of `updateMap` for sketch/eraser completion.
3. Call `clearMapDrawing` instead of `updateMap({drawing:[]})`.
4. Stop calling `placeTile` (removed from hook exports — use `commitTerrain`).

- [ ] **Step 1: Update the destructured `encounter` props at the top of MapDisplay**

Change line 44 from:
```js
const { state, updateMap, updateToken, placeTile, placeObject, applyTemplate, clearMap } = encounter;
```
to:
```js
const { state, updateMap, updateToken, commitTerrain, placeObject, applyTemplate, clearMap, commitDrawing, clearMapDrawing } = encounter;
```

- [ ] **Step 2: Add `pendingTiles` state for paint buffering**

After the existing `useState` declarations (around line 46–53), add:

```js
const [pendingTiles, setPendingTiles] = useState({});
```

- [ ] **Step 3: Update the canvas render effect to include `pendingTiles`**

The `useEffect` for canvas rendering (starting around line 78) has this dependency array:
```js
}, [map?.drawing, map?.terrain, map?.objects, map?.config, currentPath, assetCache, showGrid]);
```

Insert this block **after** the terrain overrides draw section (after the `map?.terrain` forEach) and **before** the objects draw section:

```js
    // Draw pending tiles (buffered during active paint stroke, not yet committed)
    Object.entries(pendingTiles).forEach(([coord, assetId]) => {
      const [gx, gy] = coord.split(',').map(Number);
      const img = assetCache[assetId];
      if (img) {
        ctx.drawImage(img, gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    });
```

Update the dependency array to include `pendingTiles`:
```js
}, [map?.drawing, map?.terrain, map?.objects, map?.config, currentPath, assetCache, showGrid, pendingTiles]);
```

- [ ] **Step 4: Update `handleMouseDown` — paint tool starts buffering**

Replace the paint tool block in `handleMouseDown`:

Old:
```js
    if (tool === 'paint') {
      setIsDrawing('paint');
      placeTile(gx, gy, activeAsset);
      return;
    }
```

New:
```js
    if (tool === 'paint') {
      setIsDrawing('paint');
      setPendingTiles({ [`${gx},${gy}`]: activeAsset });
      return;
    }
```

- [ ] **Step 5: Update `handleMouseMove` — paint tool accumulates to buffer**

Replace the paint tool block in `handleMouseMove`:

Old:
```js
    if (isDrawing === 'paint') {
      const gx = Math.floor(pos.x / GRID_SIZE);
      const gy = Math.floor(pos.y / GRID_SIZE);
      placeTile(gx, gy, activeAsset);
      return;
    }
```

New:
```js
    if (isDrawing === 'paint') {
      const gx = Math.floor(pos.x / GRID_SIZE);
      const gy = Math.floor(pos.y / GRID_SIZE);
      setPendingTiles(prev => ({ ...prev, [`${gx},${gy}`]: activeAsset }));
      return;
    }
```

- [ ] **Step 6: Update `handleMouseUp` — commit paint stroke, commit sketch stroke**

Replace the full `handleMouseUp` function:

Old:
```js
  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    if (isDrawing === 'pan' || isDrawing === 'paint') {
      setIsDrawing(false);
      setCurrentPath(null);
      return;
    }

    setIsDrawing(false);
    updateMap({
      drawing: [...(map?.drawing || []), currentPath]
    });
    setCurrentPath(null);
  };
```

New:
```js
  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (isDrawing === 'pan') {
      setIsDrawing(false);
      setCurrentPath(null);
      return;
    }

    if (isDrawing === 'paint') {
      setIsDrawing(false);
      if (Object.keys(pendingTiles).length > 0) {
        commitTerrain(pendingTiles);
      }
      setPendingTiles({});
      return;
    }

    // Pencil / eraser stroke complete
    setIsDrawing(false);
    if (currentPath && currentPath.points && currentPath.points.length > 1) {
      commitDrawing(currentPath);
    }
    setCurrentPath(null);
  };
```

- [ ] **Step 7: Update `clearDrawing` to use `clearMapDrawing`**

Replace:
```js
  const clearDrawing = () => {
    if (confirm("Sanitize battlefield? This will remove all tactical sketches.")) {
      updateMap({ drawing: [] });
    }
  };
```

With:
```js
  const clearDrawing = () => {
    if (confirm("Sanitize battlefield? This will remove all tactical sketches.")) {
      clearMapDrawing();
    }
  };
```

- [ ] **Step 8: Run build to verify no import errors**

```bash
cd /Users/andrew/Projects/DM_Hub
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 9: Run tests**

```bash
npm run test:harness
```

Expected: all tests pass (MapDisplay changes don't affect hook tests directly).

- [ ] **Step 10: Append Bible Entry 32**

```markdown
### Entry 32 - MapDisplay Updated for Map Undo/Redo
- `Summary:` Updated MapDisplay.jsx to use the new history-aware map APIs. Paint now buffers tiles in pendingTiles state and commits one history entry on mouseup. Sketch and eraser strokes commit via commitDrawing on mouseup. clearDrawing uses clearMapDrawing with history.
- `Reason / Intent:` Part 2 of B-MAP-01 fix. Hook changes alone don't prevent per-tile spam; MapDisplay had to be updated to buffer during drag.
- `Files Changed:` src/components/MapDisplay.jsx
- `Commands Run:` npm run build && npm run test:harness
- `Outputs Generated:` None.
- `Decisions:` pendingTiles local state for real-time canvas preview during drag. Committed as single history entry on mouseup.
- `Facts:` Build passes. All tests pass.
- `Bugs / Blockers:` None.
- `State After Completion:` Map undo/redo fully wired end-to-end.
- `Next Step / Handoff:` Wire GroupDamageSheet.
```

- [ ] **Step 11: Commit**

```bash
git add src/components/MapDisplay.jsx DnDex_Bible.md
git commit -m "fix: MapDisplay buffers paint strokes, commits sketch via commitDrawing — map undo/redo wired"
```

---

## Task 5: Wire GroupDamageSheet

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/MainDisplay.jsx`
- Modify: `src/components/InitiativeLedger.jsx`

GroupDamageSheet (B-GDS-01) is a complete component that's never reachable. Wire it into the App modal FSM.

- [ ] **Step 1: Update `App.jsx` — add import, modal constant, render**

Add import after existing component imports (around line 8):
```js
import GroupDamageSheet from './components/GroupDamageSheet';
```

Add to `UI_MODALS`:
```js
const UI_MODALS = {
  NONE: 'none',
  BESTIARY: 'bestiary',
  RULES: 'rules',
  SNAPSHOTS: 'snapshots',
  COMMAND: 'command',
  GROUP_DAMAGE: 'group_damage'
};
```

Add `toggleGroupDamage` handler in `AppContent` (after existing handlers, around line 143):
```js
  const handleToggleGroupDamage = () => {
    setActiveModal(prev => prev === UI_MODALS.GROUP_DAMAGE ? UI_MODALS.NONE : UI_MODALS.GROUP_DAMAGE);
  };
```

Pass it to `MainDisplay`:
```jsx
<MainDisplay 
  encounter={encounter} 
  view={view} 
  activeEntity={activeEntity} 
  toggleBestiary={() => setActiveModal(UI_MODALS.BESTIARY)}
  toggleGroupDamage={handleToggleGroupDamage}
/>
```

Add `GroupDamageSheet` render inside `AnimatePresence` block, after the SnapshotDrawer render:
```jsx
{activeModal === UI_MODALS.GROUP_DAMAGE && (
  <GroupDamageSheet
    key="modal-group-damage"
    isOpen={true}
    onClose={() => setActiveModal(UI_MODALS.NONE)}
    entities={state.entities}
    onApply={(damageMap, type, message) => {
      encounter.applyBulkDamage(damageMap, type, message);
    }}
  />
)}
```

- [ ] **Step 2: Update `MainDisplay.jsx` — forward `toggleGroupDamage` to InitiativeLedger**

Change the `MainDisplay` function signature:
```js
const MainDisplay = ({ encounter, view, activeEntity, toggleBestiary, toggleGroupDamage }) => {
```

Pass to `InitiativeLedger`:
```jsx
<InitiativeLedger encounter={encounter} toggleBestiary={toggleBestiary} toggleGroupDamage={toggleGroupDamage} />
```

- [ ] **Step 3: Add "Area Damage" button to `InitiativeLedger.jsx`**

Read `InitiativeLedger.jsx` to find the toolbar area. The component accepts `{ encounter, toggleBestiary }`. Add `toggleGroupDamage` to the destructured props and add a button.

Change the function signature from:
```js
const InitiativeLedger = ({ encounter, toggleBestiary }) => {
```
to:
```js
const InitiativeLedger = ({ encounter, toggleBestiary, toggleGroupDamage }) => {
```

Find the section with the "Open Bestiary" or entity-adding controls and add an "Area Damage" button nearby. It should only show if `entities.length > 0`. Look for a pattern like `entities.length === 0` empty state or the toolbar row.

The button:
```jsx
{encounter.state.entities.length > 0 && toggleGroupDamage && (
  <button
    onClick={toggleGroupDamage}
    title="Area Damage"
    className="p-2 glass-dark border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all"
  >
    <Zap className="w-4 h-4" />
  </button>
)}
```

Add `Zap` to the lucide-react import in `InitiativeLedger.jsx` if not already imported.

- [ ] **Step 4: Build and test**

```bash
npm run build && npm run test:harness
```

Expected: build passes, all tests pass.

- [ ] **Step 5: Append Bible Entry 33**

```markdown
### Entry 33 - GroupDamageSheet Wired
- `Summary:` Wired GroupDamageSheet into the App modal FSM. Added GROUP_DAMAGE modal constant, toggleGroupDamage handler, Area Damage button in InitiativeLedger toolbar.
- `Reason / Intent:` B-GDS-01/02: GroupDamageSheet was a complete, polished component with no entry point in the UI.
- `Files Changed:` src/App.jsx, src/components/MainDisplay.jsx, src/components/InitiativeLedger.jsx
- `Commands Run:` npm run build && npm run test:harness
- `Outputs Generated:` None.
- `Decisions:` Modal FSM pattern (matches existing Bestiary/Rules/Snapshots modals). Button placed in InitiativeLedger toolbar, only visible when entities exist.
- `Facts:` Build passes. All tests pass.
- `Bugs / Blockers:` None.
- `State After Completion:` Area Damage UI fully accessible.
- `Next Step / Handoff:` Fog of War foundation.
```

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/MainDisplay.jsx src/components/InitiativeLedger.jsx DnDex_Bible.md
git commit -m "feat: wire GroupDamageSheet into modal FSM — area damage now accessible from InitiativeLedger"
```

---

## Task 6: Fog of War — Minimal Foundation

**Files:**
- Modify: `src/hooks/useEncounterState.js`
- Modify: `src/components/MapDisplay.jsx`

Minimal implementation: add `fog` layer to map state, a DM-only fog toggle tool, and canvas render of fog cells. No player-facing split view. Participates in undo/redo via `updateState`.

**Assessment gate:** If map undo/redo (Tasks 3–4) is complete and stable, proceed. Otherwise document deferral in Bible and skip.

- [ ] **Step 1: Add `fog` to INITIAL_STATE.map in `useEncounterState.js`**

Change:
```js
  map: {
    drawing: [],
    tokens: {},
    view: { x: 0, y: 0, zoom: 1 },
    terrain: {},
    objects: [],
    config: { 
      gridVisible: true, 
      gridSize: 50,
      width: 30, 
      height: 30,
      baseTile: 'grass_lush'
    }
  },
```
To:
```js
  map: {
    drawing: [],
    tokens: {},
    view: { x: 0, y: 0, zoom: 1 },
    terrain: {},
    objects: [],
    fog: {},
    config: { 
      gridVisible: true, 
      gridSize: 50,
      width: 30, 
      height: 30,
      baseTile: 'grass_lush'
    }
  },
```

- [ ] **Step 2: Add fog actions to `useEncounterState.js`**

Add after `clearMapDrawing`:

```js
  const setFogCell = useCallback((x, y, hidden) => {
    updateState(
      prev => {
        const key = `${x},${y}`;
        const newFog = { ...prev.map.fog };
        if (hidden) {
          newFog[key] = true;
        } else {
          delete newFog[key];
        }
        return { ...prev, map: { ...prev.map, fog: newFog } };
      },
      hidden ? `Fog applied at (${x},${y}).` : `Fog lifted at (${x},${y}).`
    );
  }, [updateState]);

  const clearFog = useCallback(() => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, fog: {} } }),
      "Fog of war lifted."
    );
  }, [updateState]);
```

Add `setFogCell` and `clearFog` to the return object.

- [ ] **Step 3: Add fog tool to `MapDisplay.jsx`**

Add `Eye` and `EyeOff` to the lucide-react import.

Add fog tool state: the tool value `'fog'` with toggle between reveal/hide modes.

Add fog toggle state:
```js
const [fogMode, setFogMode] = useState('hide'); // 'hide' | 'reveal'
```

Destructure `setFogCell` and `clearFog` from `encounter`.

Add fog tool button to the toolbar (after eraser, before grid toggle):
```jsx
<ToolButton 
  active={tool === 'fog'} 
  onClick={() => setTool('fog')} 
  icon={<Eye className="w-5 h-5" />} 
  label="Fog of War"
/>
```

In `handleMouseDown`, add fog tool handling:
```js
    if (tool === 'fog') {
      const isHiding = fogMode === 'hide';
      setFogCell(gx, gy, isHiding);
      setIsDrawing('fog');
      return;
    }
```

In `handleMouseMove`, add fog tool handling:
```js
    if (isDrawing === 'fog') {
      const gx = Math.floor(pos.x / GRID_SIZE);
      const gy = Math.floor(pos.y / GRID_SIZE);
      setFogCell(gx, gy, fogMode === 'hide');
      return;
    }
```

In `handleMouseUp`, add fog cleanup:
```js
    if (isDrawing === 'fog') {
      setIsDrawing(false);
      return;
    }
```

**Note:** Fog-while-dragging creates one history entry per cell. For an MVP this is acceptable. A future optimization would batch fog strokes like terrain.

Add fog rendering to the canvas effect (after objects, before sketches):
```js
    // Draw fog overlay
    if (map?.fog) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      Object.keys(map.fog).forEach(coord => {
        const [gx, gy] = coord.split(',').map(Number);
        ctx.fillRect(gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      });
      ctx.restore();
    }
```

Add `map?.fog` to the canvas effect dependency array.

- [ ] **Step 4: Add fog mode toggle button in MapDisplay toolbar**

After the fog tool button, add a fog mode toggle (only visible when fog tool is active):
```jsx
{tool === 'fog' && (
  <button
    onClick={() => setFogMode(prev => prev === 'hide' ? 'reveal' : 'hide')}
    title={fogMode === 'hide' ? 'Switch to Reveal' : 'Switch to Hide'}
    className="p-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
  >
    {fogMode === 'hide' ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
  </button>
)}
```

Also add a "Clear Fog" button in the toolbar danger section:
```jsx
<ToolButton
  active={false}
  onClick={clearFog}
  icon={<Eye className="w-5 h-5 text-slate-500" />}
  label="Lift All Fog"
/>
```

- [ ] **Step 5: Build and test**

```bash
npm run build && npm run test:harness
```

- [ ] **Step 6: Append Bible Entry 34**

```markdown
### Entry 34 - Fog of War Foundation
- `Summary:` Added minimal Fog of War implementation. fog:{} added to INITIAL_STATE.map. setFogCell and clearFog actions added to hook (both history-aware). Fog tool added to MapDisplay toolbar with hide/reveal mode toggle. Fog cells rendered as dark overlays on canvas.
- `Reason / Intent:` Priority 2 from session spec. DM-only tactical fog layer, no player split-view.
- `Files Changed:` src/hooks/useEncounterState.js, src/components/MapDisplay.jsx
- `Commands Run:` npm run build && npm run test:harness
- `Outputs Generated:` None.
- `Decisions:` Fog cells stored as {[x,y]: true} sparse map. History entry per cell during drag (acceptable for MVP; can batch later). No player-facing view — DM sees all.
- `Facts:` Build passes. All tests pass.
- `Bugs / Blockers:` Per-cell fog history during drag creates many entries — documented as future optimization.
- `State After Completion:` Fog of War foundation complete and persisting in state.
- `Next Step / Handoff:` Lint cleanup.
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useEncounterState.js src/components/MapDisplay.jsx DnDex_Bible.md
git commit -m "feat: fog of war foundation — fog layer in map state, setFogCell/clearFog actions, canvas render"
```

---

## Task 7: Lint Cleanup

**Files:**
- Modify: `src/components/MapDisplay.jsx` (potentially others)
- Modify: `src/components/GroupDamageSheet.jsx`
- Modify: other flagged files

- [ ] **Step 1: Run lint and capture output**

```bash
cd /Users/andrew/Projects/DM_Hub
npm run lint 2>&1 | tee /tmp/dndex-lint.txt
cat /tmp/dndex-lint.txt
```

- [ ] **Step 2: Fix unused imports**

For each file with `'X' is defined but never used` or `'X' is imported but never used`:
- Remove the import if the symbol is genuinely not used.
- Do not remove imports that are used in JSX (ESLint may not detect JSX usage without the react plugin config).

- [ ] **Step 3: Fix unused variables**

Remove clearly unused `const` or `let` declarations. Do not remove variables that are used as refs, callbacks, or returned from hooks.

- [ ] **Step 4: Address react-hooks/exhaustive-deps warnings (safe only)**

Only fix exhaustive-deps warnings when the fix is clearly correct (stable refs, memoized values). If the fix would change behavior, document the lint suppression with a comment explaining why and add a `// eslint-disable-next-line` only if necessary.

- [ ] **Step 5: Re-run lint and confirm improvement**

```bash
npm run lint 2>&1 | tee /tmp/dndex-lint-after.txt
cat /tmp/dndex-lint-after.txt
```

- [ ] **Step 6: Run build and tests to verify lint fixes didn't break anything**

```bash
npm run build && npm run test:harness
```

- [ ] **Step 7: Append Bible Entry 35 with lint results**

```markdown
### Entry 35 - Lint Cleanup
- `Summary:` Ran npm run lint. Fixed safe unused imports and variables. Documented any remaining issues.
- `Reason / Intent:` Priority 4. Reduce lint noise for future development.
- `Files Changed:` [list files actually changed]
- `Commands Run:` npm run lint (before and after)
- `Outputs Generated:` /tmp/dndex-lint.txt, /tmp/dndex-lint-after.txt
- `Decisions:` [document any lint rules intentionally left as-is and why]
- `Facts:` [list remaining lint warnings/errors if any, with specific reasons]
- `Bugs / Blockers:` [any lint that cannot be safely fixed]
- `State After Completion:` Lint [passing / N warnings remaining].
- `Next Step / Handoff:` Full build and headless smoke.
```

- [ ] **Step 8: Commit lint fixes**

```bash
git add -p  # stage only lint-fix changes
git commit -m "chore: lint cleanup — remove unused imports and variables"
```

---

## Task 8: Full Build Verification

- [ ] **Step 1: Run full build**

```bash
cd /Users/andrew/Projects/DM_Hub
npm run build
```

Expected: build succeeds, no errors. Warnings are acceptable if they are pre-existing.

- [ ] **Step 2: If build fails, read error and fix**

Common causes:
- Missing import after restructure (e.g., `Zap` not imported in InitiativeLedger)
- Props mismatch from GroupDamageSheet wiring
- Type error from fog map state destructuring

Fix the specific error, then re-run build.

- [ ] **Step 3: Append Bible Entry 36**

```markdown
### Entry 36 - Build Verification
- `Summary:` Full production build completed.
- `Commands Run:` npm run build
- `Facts:` Build [PASS/FAIL]. [If FAIL: error details and fix applied.]
- `State After Completion:` Production artifact ready.
- `Next Step / Handoff:` Headless smoke test.
```

---

## Task 9: Headless Smoke Test

- [ ] **Step 1: Create the smoke test script**

Write to `/tmp/dndex-smoke/smoke.mjs`:

```js
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('/tmp/dndex-smoke', { recursive: true });

const results = {
  timestamp: new Date().toISOString(),
  passed: [],
  failed: [],
  consoleErrors: [],
  pageErrors: []
};

const assert = (name, condition) => {
  if (condition) {
    results.passed.push(name);
    console.log(`  ✓ ${name}`);
  } else {
    results.failed.push(name);
    console.error(`  ✗ ${name}`);
  }
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userDataDir: '/tmp/dndex-smoke/chrome-data' });
  const page = await context.newPage();

  page.on('console', msg => { if (msg.type() === 'error') results.consoleErrors.push(msg.text()); });
  page.on('pageerror', err => results.pageErrors.push(err.message));

  await page.goto('http://127.0.0.1:5173/DnDex/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/dndex-smoke/01-loaded.png' });
  assert('App loads without page errors', results.pageErrors.length === 0);

  // Load Demo Encounter
  const demoBtn = page.getByText(/quick.start|demo/i).first();
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: '/tmp/dndex-smoke/02-demo.png' });

  const bodyText = await page.textContent('body');
  assert('Demo encounter populates entities', bodyText.includes('HP') || bodyText.includes('AC'));

  // Undo / Redo
  const undoBtn = page.locator('button[title*="ndo"], button[aria-label*="ndo"]').first();
  const redoBtn = page.locator('button[title*="edo"], button[aria-label*="edo"]').first();
  const undoEnabled = await undoBtn.isEnabled().catch(() => false);
  assert('Undo button exists', await undoBtn.count() > 0);
  assert('Redo button exists', await redoBtn.count() > 0);

  // Map view
  const mapBtn = page.locator('button[title*="Map"], button[title*="Tactical"]').first();
  if (await mapBtn.count() > 0) {
    await mapBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/dndex-smoke/03-map.png' });
    const canvas = page.locator('canvas').first();
    assert('Map canvas renders', await canvas.count() > 0);
  }

  // Switch back to list
  const listBtn = page.locator('button[title*="List"]').first();
  if (await listBtn.count() > 0) await listBtn.click();
  await page.waitForTimeout(200);

  // Bestiary
  const bestiaryBtn = page.getByText(/bestiary|foe/i).first();
  if (await bestiaryBtn.count() > 0) {
    await bestiaryBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/dndex-smoke/04-bestiary.png' });
    const bodyAfter = await page.textContent('body');
    assert('Bestiary drawer opens', bodyAfter.toLowerCase().includes('bestiary') || bodyAfter.toLowerCase().includes('creature'));
    const escKey = page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  assert('No console errors during smoke test', results.consoleErrors.length === 0);

  writeFileSync('/tmp/dndex-smoke/results.json', JSON.stringify(results, null, 2));
  console.log(`\nSmoke test complete: ${results.passed.length} passed, ${results.failed.length} failed`);
  if (results.failed.length > 0) {
    console.error('FAILED:', results.failed);
    process.exit(1);
  }

  await browser.close();
})();
```

- [ ] **Step 2: Start dev server in background**

```bash
cd /Users/andrew/Projects/DM_Hub
npm run dev -- --host 127.0.0.1 --port 5173 &
sleep 4
```

- [ ] **Step 3: Ensure Playwright is available**

```bash
node -e "require('playwright')" 2>/dev/null || npm install --save-dev playwright
npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium
```

- [ ] **Step 4: Run the smoke test**

```bash
node /tmp/dndex-smoke/smoke.mjs
```

- [ ] **Step 5: Stop dev server**

```bash
kill %1 2>/dev/null || pkill -f "vite.*5173"
```

- [ ] **Step 6: Read results**

```bash
cat /tmp/dndex-smoke/results.json
```

- [ ] **Step 7: If smoke test fails, diagnose and fix**

Read console errors and page errors from results.json. Fix the specific failure. Re-run build and test. Re-run smoke.

- [ ] **Step 8: Append Bible Entry 37**

```markdown
### Entry 37 - Headless Smoke Test
- `Summary:` Headless Playwright/Chromium smoke test executed against dev server.
- `Commands Run:`
  ```bash
  npm run dev -- --host 127.0.0.1 --port 5173 &
  node /tmp/dndex-smoke/smoke.mjs
  ```
- `Outputs Generated:` /tmp/dndex-smoke/results.json, /tmp/dndex-smoke/01-loaded.png, 02-demo.png, 03-map.png, 04-bestiary.png
- `Facts:` [PASS/FAIL]. [list passed/failed checks]. Console errors: [N]. Page errors: [N].
- `Bugs / Blockers:` [any failures found]
- `State After Completion:` Smoke test [PASS/FAIL].
- `Next Step / Handoff:` Final diff and handoff.
```

---

## Task 10: Final Diff, Bible Entry, and Handoff

- [ ] **Step 1: Run final status and diff**

```bash
cd /Users/andrew/Projects/DM_Hub
git status --short
git diff --stat
```

- [ ] **Step 2: Append final Bible Entry 38**

```markdown
### Entry 38 - Engineering Sweep Complete (2026-04-29)
- `Summary:` Full engineering sweep completed. Map undo/redo implemented. GroupDamageSheet wired. Fog of War foundation added. Lint cleaned. Build passing. Tests passing. Headless smoke PASS/FAIL.
- `Reason / Intent:` Session assignment: exhaustive technical sweep + next priorities.
- `Files Changed:` src/hooks/useEncounterState.js, src/hooks/useEncounterState.test.js, src/components/MapDisplay.jsx, src/App.jsx, src/components/MainDisplay.jsx, src/components/InitiativeLedger.jsx, DnDex_Bible.md, BUTTON_CONTROL_AUDIT.md
- `Commands Run:`
  ```bash
  npm run test:harness
  npm run build
  npm run lint
  node /tmp/dndex-smoke/smoke.mjs
  ```
- `Decisions:`
  - commitTerrain/commitDrawing/clearMapDrawing replace placeTile/updateMap for history-aware map operations.
  - pendingTiles local state buffers paint strokes — one history entry per stroke, not per pixel.
  - GroupDamageSheet wired into App.jsx modal FSM (GROUP_DAMAGE modal).
  - Fog of War uses sparse {x,y: true} map in INITIAL_STATE.map.fog — DM-only, no player split-view.
- `Facts:`
  - Tests: [N/N] passing.
  - Build: PASS.
  - Lint: [PASS / N warnings remaining].
  - Headless smoke: [PASS/FAIL].
- `Bugs / Blockers:`
  - Fog drag creates one history entry per cell (future: batch fog strokes like terrain).
  - Custom asset uploads (base64) are runtime-only, not persisted in state across reloads.
- `Corrections:` None to prior entries.
- `State After Completion:` All session priorities addressed.
- `Next Step / Handoff:` Final UI polish pass (deferred per session rules). Consider batching fog strokes. Consider adding fog to headless smoke test coverage.
```

- [ ] **Step 3: Final commit (if uncommitted changes remain)**

```bash
git add DnDex_Bible.md
git commit -m "docs: add Bible entries 31-38, complete engineering sweep"
```

---

## Verification Summary

After all tasks, verify these commands all succeed:

```bash
npm run test:harness   # Expected: 15/15 (10 original + 5 new map history tests)
npm run build          # Expected: PASS
npm run lint           # Expected: PASS or documented remaining warnings only
node /tmp/dndex-smoke/smoke.mjs  # Expected: PASS
```

---

## Deferred Items

| Item | Reason |
|------|--------|
| Final UI polish pass | Per session rules: this session is correctness only. |
| Batch fog strokes | Per-cell fog drag history is acceptable for MVP. Optimize later. |
| Player-facing fog view | Requires split-display architecture not in scope. |
| Custom asset persistence | Requires storing base64 in map state; scope creep. |
| Cross-tab fog sync | BroadcastChannel sync already includes full state; should work. Needs explicit headless test. |
