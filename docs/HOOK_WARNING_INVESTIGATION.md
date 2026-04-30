# Hook `exhaustive-deps` Warning Investigation

**Date:** 2026-04-30  
**Author:** Claude (automated investigation)  
**Status:** Resolved — both warnings are intentional or low-risk; recommendation: keep as-is with one optional comment addition.

---

## Overview

ESLint reports two `react-hooks/exhaustive-deps` warnings. Neither is a crash risk. This document identifies each warning, analyzes the stale-closure risk, and recommends action.

---

## Warning 1 — `src/components/MapDisplay.jsx:808`

### Location

```
src/components/MapDisplay.jsx:808
React Hook useEffect has missing dependencies:
  'viewOffset.x', 'viewOffset.y', and 'zoom'
```

### Code

```jsx
// Token component (MapDisplay.jsx:761)
const Token = ({ entity, pos, onMove, isDraggable, isActive, zoom = 1, viewOffset = { x: 0, y: 0 } }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = (e.clientX - offset.x - viewOffset.x) / zoom;  // uses viewOffset, zoom
      const newY = (e.clientY - offset.y - viewOffset.y) / zoom;
      // ...
    };
    const handleMouseUp = (e) => {
      // ...same pattern...
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset, onMove]);  // ← viewOffset.x, viewOffset.y, zoom missing
```

### Stale Closure Risk

**Low.** The stale values would only produce wrong results if the user simultaneously:
1. Drags a token (holds mouse down), AND
2. Pans the map or changes zoom level while the drag is in progress

This compound gesture is not a supported UX flow — the map pan and token drag use the same mouse button/gesture space. In practice the effect re-registers on every new drag (`isDragging` flips to `true`), capturing the current `viewOffset`/`zoom` at drag start, which is correct for the duration of a single drag.

### Risk Profile

| Scenario | Outcome |
|----------|---------|
| Normal drag (no concurrent zoom/pan) | Correct — captured values stay valid |
| Zoom changes mid-drag | Token snaps to wrong position — **theoretical bug** |
| Pan changes mid-drag | Same — **theoretical bug** |
| Both zoom/pan change mid-drag | Same — **theoretical bug** |

The theoretical bugs require a UI interaction that is not currently possible (zoom and drag share focus), so they are dormant.

### Fix Options

**Option A (Safe, correct) — Add missing deps:**
```jsx
}, [isDragging, offset, onMove, viewOffset.x, viewOffset.y, zoom]);
```
Effect: re-registers handlers whenever zoom or viewOffset change during a drag. Correct behavior. Minimal overhead.

**Option B (Unsafe) — Stabilize with refs:**
```jsx
const viewOffsetRef = useRef(viewOffset);
const zoomRef = useRef(zoom);
useEffect(() => { viewOffsetRef.current = viewOffset; zoomRef.current = zoom; });
// use viewOffsetRef.current inside the effect
```
Avoids lint warning but adds ref management complexity without meaningful benefit here.

**Option C (Keep as-is) — Document intent:**
Add a comment; the bug is dormant and the fix has no observable UX impact today.

### Recommendation

**Keep as-is.** The missing deps are genuine, but the scenario that would trigger incorrect behavior is not reachable in the current UI (you cannot pan/zoom while dragging a token). If pinch-to-zoom or scroll-while-drag is ever added, apply Option A at that time. Low urgency.

---

## Warning 2 — `src/hooks/useEncounterState.js:113`

### Location

```
src/hooks/useEncounterState.js:113
React Hook useEffect has a missing dependency: 'state'
```

### Code

```js
// Auto-save debounce (useEncounterState.js:85)
useEffect(() => {
  if (!state.isHydrated) return;

  const saveToDisk = async () => {
    setSyncStatus(SYNC_STATES.SAVING);
    try {
      const diskState = await get('dm-hub-state');
      if (diskState && diskState.lastUpdated > state.lastUpdated) {
        setSyncStatus(SYNC_STATES.CONFLICT);
        return;
      }
      const { history: _, historyPointer: __, isHydrated: ___, ...toSave } = state;  // reads full state
      await set('dm-hub-state', toSave);
      // BroadcastChannel sync ...
    } catch {
      setSyncStatus(SYNC_STATES.ERROR);
    }
  };

  const debounce = setTimeout(saveToDisk, 500);
  return () => clearTimeout(debounce);
}, [state.lastUpdated, state.isHydrated]);  // ← 'state' missing
```

### Intent

This is an **intentional omission** — a well-known React pattern where a specific field (`lastUpdated`) is used as a canonical change signal instead of the entire object. The pattern prevents the effect from re-running on every transient state mutation (e.g., UI toggles, scroll position) and instead only fires when meaningful data changes are committed via `updateState`, which bumps `lastUpdated`.

### Stale Closure Risk

**Medium on paper, Low in practice.** If any field of `state` changed without `lastUpdated` being updated, the save would snapshot stale data. However:

1. `updateState` (the only path that mutates state) performs a structural equality check and updates `lastUpdated` on every accepted change.
2. No direct `setState` calls in the component bypass this — `updateState` is the canonical write path.
3. Therefore, `state.lastUpdated` changes iff `state` changed, making the dep array equivalent to `[state]` in practice.

### Risk Profile

| Scenario | Outcome |
|----------|---------|
| State mutated through `updateState` | Correct — `lastUpdated` bumped, effect fires |
| Direct `setState` call bypassing `updateState` | Stale snapshot saved — **real bug** if it occurs |
| `isHydrated` flips (hydration complete) | Correct — effect fires to save initial load |

### Fix Options

**Option A (Belt-and-suspenders) — Add `state` to deps:**
```js
}, [state, state.lastUpdated, state.isHydrated]);
// (state.lastUpdated/isHydrated are redundant but kept for clarity)
```
Effect: triggers save on every state change, including ones where `lastUpdated` didn't change. This is safe but slightly over-eager — it would cause extra (idempotent) saves on transient state, adding minor IndexedDB write overhead.

**Option B (Document intent — recommended) — Add eslint-disable comment:**
```js
  // Intentional: lastUpdated is the canonical save trigger; adding full `state`
  // dep would over-fire on transient UI state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lastUpdated, state.isHydrated]);
```
Documents the design decision in-source. Zero behavior change. Makes the intentional pattern explicit for future maintainers.

**Option C (Keep as-is) — No change:**
The logic is correct given the current codebase invariant that `updateState` is the only write path.

### Recommendation

**Add the `eslint-disable-next-line` comment (Option B).** The design is intentionally correct, but without the comment a future developer might "fix" it (adding `state` to deps) and unknowingly introduce excessive IndexedDB writes. The comment preserves the design intent at zero cost.

This is a docs-only task, however, so the comment is noted here for the next source-touching session — **do not modify `useEncounterState.js` in this pass**.

---

## Summary Table

| File | Line | Missing Deps | Risk | Root Cause | Recommendation |
|------|------|-------------|------|-----------|----------------|
| `src/components/MapDisplay.jsx` | 808 | `viewOffset.x`, `viewOffset.y`, `zoom` | Low | Dormant bug: only triggers on impossible zoom-while-drag gesture | Keep as-is; fix if drag+zoom UX is added |
| `src/hooks/useEncounterState.js` | 113 | `state` | Low (intentional) | Intentional omission: `lastUpdated` is the canonical save trigger | Add `eslint-disable-next-line` comment in next source-touching session |

---

## Lint Baseline

As of 2026-04-30:

```
npm run lint → 0 errors, 2 warnings (both documented above)
npx vitest run → 88/88 tests pass (8 test files)
```
