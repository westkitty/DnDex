# Battlemaster Feature Representation Audit

Generated: 2026-04-30  
Repository: `/Users/andrew/Projects/DM_Hub`

## Scope
`Fact:` This audit verifies that critical Battlemaster combat/prep controls remain represented after the dockable workspace hardening pass.

## Control Audit Table

| Control | Visible Label/Title | Component/File | Action/Function | Combat Mode | Prep Mode | Accessibility Note | Risk if Hidden | Status |
|---|---|---|---|---|---|---|---|---|
| Next Action / advance turn | `Next Action` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/NowActingPanel.jsx` | `encounter.advanceTurn(1)` | Visible | Visible | Button label visible | High (turn flow blocked) | OK |
| Undo / redo | icon buttons (undo/redo), toast history copy | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx` | `encounter.undo()`, `encounter.redo()` | Visible | Visible | Explicit `title` and `aria-label` coverage verified (`Undo`, `Redo`) | High (history recovery lost) | OK |
| Active damage/heal | Quick Strike + entity HP controls | `/Users/andrew/Projects/DM_Hub/src/components/BattlemasterQuickActions.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/entity-card/EntityHP.jsx` | `encounter.applyDamage`, `encounter.applyHealing` | Visible (active entity) | Reachable | Inputs/buttons | High | OK |
| Concentration alert resolution | Tactical alerts actions | `/Users/andrew/Projects/DM_Hub/src/components/TacticalAlertStack.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx` | `resolveConcentration`, `clearAlert` | Visible | Visible | Action buttons in alert stack | High | OK |
| Initiative ordering | Initiative panel | `/Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx` | reorder + encounter updates | Visible | Visible | List interactions | High | OK |
| Group damage | `Area Damage` | `/Users/andrew/Projects/DM_Hub/src/components/GroupDamageSheet.jsx` (owned by InitiativeLedger) | group apply damage | Reachable in initiative workspace | Reachable | Named controls | High | OK |
| Bestiary access | `Bestiary` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/BattlemasterContextDock.jsx` | modal toggle | Visible | Visible | Labeled button | Medium | OK |
| Rules access | `Rules` / `Rules Reference` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/BattlemasterContextDock.jsx` | modal toggle | Visible | Visible | Labeled button | Medium | OK |
| Snapshots access | `Snapshots` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/BattlemasterContextDock.jsx` | modal toggle | Visible | Visible | Labeled button | Medium | OK |
| Archive export | `Archive Campaign` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/BattlemasterContextDock.jsx` | `encounter.exportState` | Visible | Visible | Labeled | Medium | OK |
| Upload/import | `Upload Session` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/BattlemasterContextDock.jsx` | `encounter.importState` | Visible | Visible | File input via button/label, now with toasts | High | OK |
| Wipe encounter | `Wipe Encounter` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx` | `encounter.clearEncounter()` | Visible | Visible | Confirm prompt | High | OK |
| Reset battlefield | `Reset Battlefield` | `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx` | `encounter.resetMap()` | Visible | Visible | Confirm prompt | High | OK |
| Map move/pan | Move tool | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `updateMap({ view })` | Visible | Visible | Tool button + drag | High | OK |
| Terrain paint | Paint tool | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `commitTerrain` | Visible | Visible | Tool buttons | High | OK |
| Object stamp | Stamp tool | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `placeObject`/`removeObject` | Visible | Visible | Tool buttons | High | OK |
| Sketch | Pencil tool | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `commitDrawing` | Visible | Visible | Tool buttons | Medium | OK |
| Eraser | Eraser tool | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | sketch erase path | Visible | Visible | Tool button | Medium | OK |
| Fog hide/reveal | Fog tool + mode | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `setFogCell` | Visible | Visible | Tool + mode controls | High | OK |
| Lift all fog | `Lift All Fog` | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `clearFog` | Visible | Visible | Button label | High | OK |
| Background upload/remove | battle map upload/remove | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `setMapBackground`, `clearMapBackground` | Visible | Visible | Labeled controls | Medium | OK |
| Background opacity/visibility | slider + eye toggle | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `setBackgroundOpacity`, `setBackgroundVisible` | Visible | Visible | Slider + toggle | Medium | OK |
| Layer toggles | `Layer Visibility` | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | local visibility + background visibility action | Visible | Visible | Toggle controls | Medium | OK |
| Scene templates | `Scene Templates` | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `applyTemplate` | Visible | Visible | Template buttons | Medium | OK |
| Token drag | token elements | `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx` | `updateToken` | Visible | Visible | Pointer drag | High | OK |
| Command palette | `Meta/Ctrl+K` | `/Users/andrew/Projects/DM_Hub/src/App.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/CommandPalette.jsx` | modal toggle + action dispatch | Visible | Visible | Keyboard shortcut; ignores editable targets | Medium | OK |
| Layout lock/unlock | `Lock Layout` / `Unlock Layout` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/LayoutControls.jsx` | workspace UI state | Visible | Visible | Text buttons + aria | Medium | OK |
| Reset layout | `Reset Layout` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/LayoutControls.jsx` | workspace UI reset | Visible | Visible | Text button + confirmation | High | OK |
| Collapse/expand panel | `Collapse Panel` / `Expand Panel` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/DockablePanel.jsx` | panel local state | Visible | Visible | aria-label/title present | Medium | OK |
| Minimize/restore panel | `Minimize Panel` / `Restore Panel` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/DockablePanel.jsx`, `/Users/andrew/Projects/DM_Hub/src/components/AppToolRail.jsx` | panel local state | Visible | Visible | restore from rail, labeled | Medium | OK |
| Undock/redock panel | `Undock Panel` / `Redock Panel` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/DockablePanel.jsx` | panel local state | Visible | Visible | aria-label/title present | Medium | OK |
| Reset position | `Reset Position` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/DockablePanel.jsx` | panel local state | Visible | Visible | aria-label/title present | Medium | OK |
| Floating preset sizes | `Compact`, `Standard`, `Large` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/DockablePanel.jsx` | panel local state | Visible when floating | Visible when floating | text buttons keyboard reachable | Low | OK |
| Floating nudges | `Nudge Up/Down/Left/Right` | `/Users/andrew/Projects/DM_Hub/src/components/workspace/DockablePanel.jsx` | panel local state | Visible when floating | Visible when floating | aria-label present | Low | OK |

## Findings
- `Fact:` All required major combat/prep/map/layout controls remain represented somewhere in the Battlemaster UI.
- `Fact:` Layout controls remain UI-only and separate from encounter history actions.
- `Fact:` Undo/redo icon buttons include explicit `title`/`aria-label` coverage (`Undo`, `Redo`).
- `Unknown:` Dedicated Notes editing panel is not implemented in this pass; current dock tile is informational.

## Small Safe Fixes Applied During Audit
- `Fact:` No additional feature-access code patch was required in Phase 6.

## Deferred
- `Deferred:` Any broader IA or visual reorganization remains out of scope for this hardening pass.
