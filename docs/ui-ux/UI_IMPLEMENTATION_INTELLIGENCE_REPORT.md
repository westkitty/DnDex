# UI Implementation Intelligence Report
Generated for: DnDex / DM Hub UI/UX planning pass
Repository: `/Users/andrew/Projects/DM_Hub`
Generated at: 2026-04-30

## 1. Project Architecture Relevant to UI/UX
- Fact: Framework is React 19.2.4 with Vite 6.4.2 (`/Users/andrew/Projects/DM_Hub/package.json`).
- Fact: Styling is Tailwind CSS 3.4.19 plus app-level CSS token layers (`/Users/andrew/Projects/DM_Hub/tailwind.config.js`, `/Users/andrew/Projects/DM_Hub/src/index.css`).
- Fact: Motion system is Framer Motion 12.38.0 and is used pervasively in layout/view transitions, drawers, alerts, token animations (`/Users/andrew/Projects/DM_Hub/package.json`, multiple component files).
- Fact: App entry is `main.jsx -> <App/>`, and `App` wraps `<ToastProvider>` inside an `AppErrorBoundary` (`/Users/andrew/Projects/DM_Hub/src/main.jsx`, `/Users/andrew/Projects/DM_Hub/src/App.jsx`).
- Fact: Single source of truth is `useEncounterState()` in `AppContent`; state/actions are passed downward (`/Users/andrew/Projects/DM_Hub/src/App.jsx`, `/Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js`).
- Fact: Top-level view model is `UI_VIEWS = { list, map, battlemaster }` with local React state in `AppContent` (`/Users/andrew/Projects/DM_Hub/src/App.jsx`).
- Fact: Modal/drawer routing model is `UI_MODALS = { none, bestiary, rules, snapshots, command }`; only one active modal value at a time (`/Users/andrew/Projects/DM_Hub/src/App.jsx`).
- Fact: Deployment base path is `/DnDex/` (GitHub Pages subdirectory constraint), so path-sensitive assets must use `import.meta.env.BASE_URL` patterns (`/Users/andrew/Projects/DM_Hub/vite.config.js`, `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx`).
- Fact: Vite PWA plugin is enabled; UI assets and manifest metadata are bundled as installable app data (`/Users/andrew/Projects/DM_Hub/vite.config.js`).
- Inferred: UI rewrites that hardcode root `/` asset paths risk breakage under subdirectory deploy.
- Unknown: Any active production service worker cache invalidation issue was not reproducible from static source inspection alone.

Routing/state ownership model:
- Fact: `TopBar` owns view switching UI and calls `setView` from `App`.
- Fact: `MainDisplay` handles `list` and `map` views; `BattlemasterLayout` handles `battlemaster`.
- Fact: Encounter mutation actions are not colocated in view components; they all call hook actions.
- Inferred: Future UI should preserve this ownership split to avoid hidden state forks.

## 2. UI Component Inventory
The machine-readable inventory is in:
- `/Users/andrew/Projects/DM_Hub/docs/ui-ux/UI_COMPONENT_INVENTORY.json`

Component notes (compressed human summary):
- `TopBar.jsx`: Primary global controls (view switch, round nav, undo/redo, add, tools, export/import/reset/wipe). High-risk control surface. Recommendation: `enhance`, not remove.
- `MainDisplay.jsx`: Wrapper for list/map modes and inline alert stack. Recommendation: `preserve` layout role; simplify if future shell unifies views.
- `BattlemasterLayout.jsx`: Map-centric tri-panel with independent draggable widths and collapse state. Recommendation: `preserve + enhance`; avoid rewriting drag logic casually.
- `BattlemasterQuickActions.jsx`: Fast numeric damage/heal for active actor. Recommendation: `preserve`; may be visually compressed.
- `NowActingPanel.jsx`: Focused active-turn command center with HP/status/legendary + advance turn. Recommendation: `enhance`; keep primary live-combat prominence.
- `InitiativeLedger.jsx`: Reorderable roster + group damage + lair marker + quick setup. Recommendation: `enhance`; maintain reorder and group damage access.
- `EntityCard.jsx` and `entity-card/*`: Rich unit card system with compact/full modes, conditions, calculator, legendary/lair toggles, reference drawer. Recommendation: `enhance/split` carefully; do not regress action plumbing.
- `MapDisplay.jsx`: Tactical canvas+DOM hybrid engine, toolbars, palette, layer controls, pan/zoom, token drag. Recommendation: `investigate` and extract seams incrementally; avoid monolithic rewrite.
- `ActionLedger.jsx`: Log timeline with filtering and icon semantics. Recommendation: `preserve/enhance`.
- `TacticalAlertStack.jsx`: Concentration/warning actionable alerts. Recommendation: `preserve`; critical in combat safety.
- `BestiaryDrawer.jsx`: Not currently mounted from `App`; legacy/alternate bestiary shell. Recommendation: `investigate`.
- `BestiaryModal.jsx`: Currently active bestiary entry point from App modal FSM. Recommendation: `enhance`.
- `RulesPanel.jsx`: Drawer with tabs for rules library and action log. Recommendation: `preserve` behavior.
- `SnapshotDrawer.jsx`: Snapshot management UI. Recommendation: `preserve`.
- `DamageCalculator.jsx`: Reusable damage math micro-panel used by `EntityActions`. Recommendation: `preserve`.
- `GroupDamageSheet.jsx`: Multi-target damage transaction UI controlled by InitiativeLedger. Recommendation: `preserve`; high-value combat workflow.
- `CommandPalette.jsx`: Command-K multimodal search/action launcher. Recommendation: `enhance`.
- `ConditionPalette.jsx`: Condition toggle primitives. Recommendation: `preserve`.
- `ToastProvider.jsx`: Global toast transport and presentation. Recommendation: `preserve`.

## 3. UI-Relevant State and Action Map

Top-level state shape (`useEncounterState.js`):
- Fact: `state = { round, turnIndex, entities[], alerts[], logs[], history[], historyPointer, lastUpdated, map, snapshots[], isHydrated }`.
- Fact: `map = { drawing[], tokens{}, view{x,y,zoom}, terrain{}, objects[], fog{}, background{dataUrl,opacity,visible}, config{gridVisible,gridSize,width,height,baseTile} }`.
- Fact: `history` snapshots are capped to 50 entries; logs capped to 100 entries.

Key action table:

| Action / State Field | File | Signature / Shape | Used By | History Behavior | UI/UX Relevance | Risk Notes |
|---|---|---|---|---|---|---|
| `updateState` | `src/hooks/useEncounterState.js` | `(updater, logMessage?, options?)` | All hook actions | Default history-on; `skipHistory` opt-out | Central mutation contract | Bypassing it breaks undo/log/sync invariants |
| `updateMap` | `src/hooks/useEncounterState.js` | `(updates)` | `MapDisplay` pan/zoom | `skipHistory: true` | View-only map transforms | Must not be repurposed for content edits |
| `updateToken` | `src/hooks/useEncounterState.js` | `(entityId, pos, isFinal=true)` | `MapDisplay` token drag | interim moves skip; final move records | Token movement UX + undo final placement | Wrong `isFinal` usage floods history |
| `commitTerrain` | `src/hooks/useEncounterState.js` | `(terrainUpdates)` | `MapDisplay` paint tool | history-on | Bulk stroke commit | Preserve batched commit model |
| `commitDrawing` | `src/hooks/useEncounterState.js` | `(path)` | `MapDisplay` pencil/eraser | history-on | Tactical annotations | Per-mousemove commits would destroy undo usability |
| `clearMapDrawing` | `src/hooks/useEncounterState.js` | `()` | `MapDisplay` purge sketches | history-on | Sketch cleanup | Confirm dialog currently in UI only |
| `placeObject` | `src/hooks/useEncounterState.js` | `(assetId,x,y,scale=1,rotation=0)` | `MapDisplay` stamp | history-on | Prop/object placement | No object edit UI beyond add/remove |
| `removeObject` | `src/hooks/useEncounterState.js` | `(objectId)` | map/action consumers | history-on | Object cleanup | Not wired prominently in map UI |
| `applyTemplate` | `src/hooks/useEncounterState.js` | `(template)` | `MapDisplay` templates | history-on | Fast scene setup | Resets terrain + rewrites objects/config |
| `clearMap` | `src/hooks/useEncounterState.js` | `()` | `MapDisplay` clear battlefield | history-on | Hard reset of map content | Destructive, needs obvious confirmation |
| `setFogCell` | `src/hooks/useEncounterState.js` | `(x,y,hidden)` | `MapDisplay` fog brush | history-on (per call) | Fog hide/reveal | Drag fog currently issues many history entries |
| `clearFog` | `src/hooks/useEncounterState.js` | `()` | `MapDisplay` | history-on | Global reveal | High-impact tactical control |
| `setMapBackground` | `src/hooks/useEncounterState.js` | `(dataUrl)` | `MapDisplay` upload | history-on | Battlemap ingestion | DataURL persistence can bloat state |
| `clearMapBackground` | `src/hooks/useEncounterState.js` | `()` | `MapDisplay` | history-on | Remove battlemap | Resets opacity/visible too |
| `setBackgroundOpacity` | `src/hooks/useEncounterState.js` | `(opacity)` | `MapDisplay` slider | `skipHistory: true` | Presentation-only control | Correctly excluded from undo |
| `setBackgroundVisible` | `src/hooks/useEncounterState.js` | `(visible)` | `MapDisplay` layer toggles | `skipHistory: true` | Presentation-only control | Should remain non-destructive |
| `applyDamage` | `src/hooks/useEncounterState.js` | `(id,amount,type,toGroup=false)` | NowActing, EntityCard, QuickActions | history-on | Core combat transaction + alert side effects | Generates concentration alerts; keep centralized |
| `applyHealing` | `src/hooks/useEncounterState.js` | `(id,amount,toGroup=false)` | same | history-on | Core recovery flow | Group healing path tied to `groupId` |
| `advanceTurn` | `src/hooks/useEncounterState.js` | `(direction=1)` | TopBar, NowActing, Map HUD, CommandPalette | history-on | Initiative progression | Also ticks effects and legendary resets via engine |
| `undo` / `redo` | `src/hooks/useEncounterState.js` | `()` -> note string | TopBar, CommandPalette | pointer movement | Recovery/safety | UI relies on returned note for toast messaging |
| `saveSnapshot` | `src/hooks/useEncounterState.js` | `(name?)` | SnapshotDrawer | history-on | Prep safety, branch points | Capped to 10 snapshots |
| `loadSnapshot` (`restoreSnapshot` equivalent) | `src/hooks/useEncounterState.js` | `(id)` | SnapshotDrawer | history-on | Full state rewind | Preserves snapshot list while restoring state |
| `importState` | `src/hooks/useEncounterState.js` | `(imported)->boolean` | TopBar upload | history-on | Session restore | Requires `entities` array; snapshots preserved from current state |
| `exportState` | `src/hooks/useEncounterState.js` | `()` | TopBar archive export | n/a | Campaign export | Browser download side effect |

Additional behavior extraction:
- Fact: Concentration alerts are generated in both `applyDamage` and `applyBulkDamage` for concentrating entities, DC = `max(10, floor(amount/2))`.
- Fact: `combatEngine.advanceTurn` decrements timed effects (`tickOn: start/end`) and resets monster legendary actions at start of their turn.
- Inferred: UI controls should call hook actions only; direct entity mutations in component state would silently bypass logs/history/sync.
- Unknown: No dedicated type guard/schema validation exists for imported map objects beyond `entities` presence check.

## 4. Current View Map

### List view
- Files: `App.jsx -> MainDisplay.jsx -> NowActingPanel + InitiativeLedger`.
- Component tree: TopBar + content stack; list view does not render map in center.
- Tools: active actor controls, entity cards, reorder, group damage modal, bestiary access, lair action trigger marker.
- Workflow: add/deploy entities -> reorder initiative -> run per-entity damage/heal/conditions/resources.
- Opportunity: reduce vertical density and unify duplicate damage entry points.
- Risk: hiding critical controls in collapsibles can slow live combat.

### Tactical Map view
- Files: `App.jsx -> MainDisplay.jsx(view='map') -> MapDisplay.jsx`.
- Tools: move/pan, terrain paint, object stamp, sketch, fog (hide/reveal), grid toggle, clear drawing/map/fog, templates, asset palette, background upload/visibility/opacity.
- Workflow: prep map layers then run token movement and turn progression via HUD/TopBar.
- Opportunity: toolbar + palette ergonomics and clearer tool grouping.
- Risk: MapDisplay is monolith; careless edits risk pan/zoom, history, or token alignment regressions.

### Battlemaster view
- Files: `App.jsx -> BattlemasterLayout.jsx`.
- Composition: left resizable panel (`NowActingPanel + BattlemasterQuickActions`), center `MapDisplay`, right resizable `InitiativeLedger`.
- Adaptive behavior: left auto-open >=700px, right auto-open >=900px (initial only), user control thereafter.
- Workflow: simultaneous map + active turn + unit roster for high-tempo combat.
- Opportunity: stronger visual hierarchy and clearer low-frequency vs high-frequency controls.
- Risk: drag resize and collapse states are easy to break if converted to CSS-only or refactored without global listeners.

### Drawers/modals
- Bestiary: `BestiaryModal` (active), `BestiaryDrawer` (present but currently not mounted in App flow).
- Rules + combat log: `RulesPanel` tabbed shell with `ActionLedger`.
- Snapshots: `SnapshotDrawer`.
- Command tools: `CommandPalette`.
- Export/import/tools: TopBar gear dropdown.
- Risk: feature discoverability is spread between TopBar menus and modal surfaces.

## 5. Tactical Map Engine UI Intelligence
- Fact: Rendering model is hybrid: canvas for map layers, DOM motion-div tokens for units (`MapDisplay.jsx`).
- Fact: Layer order is explicit in draw effect:
  1) background image
  2) base tiled terrain pattern
  3) grid
  4) terrain overrides
  5) pending paint tiles
  6) objects
  7) sketches + current stroke
  8) fog overlay
  9) DOM tokens (same transformed parent)
- Fact: Pan/zoom uses a transformed wrapper div (`translate(x,y) scale(zoom)`), not camera matrix math in canvas.
- Fact: Token drag converts screen coords to world coords using current zoom/view offset, then snaps to 50px grid.
- Fact: `updateToken(..., false)` is called during drag, `updateToken(..., true)` on mouseup for final undoable commit.
- Fact: Asset registry uses `BASE_URL` and injects Kenney tile ids (`kenney_000`..`kenney_228`) dynamically.
- Fact: Custom uploaded assets are inserted into module-level `ASSETS` and local `assetCache`, not persisted in encounter state.
- Inferred: Reloading after custom asset upload likely leaves map objects pointing to missing asset IDs unless assets are reintroduced.
- Fact: Palette has sections: Battle Map, Layer Visibility, Scene Templates, Tactical Assets, Custom Asset upload.
- Fact: `showGrid`, `sketchesVisible`, `fogVisible`, `paletteOpen`, `tool`, `activeAsset`, `fogMode` are local UI state (mostly non-persistent).
- Fact: Background image DataURL is persisted in encounter map state and redrawn when `bgImage` loads.
- Fact: Map content mutations are mostly history-aware except view/background-presentational values.

Safest extraction seams for next pass:
- Extract `MapToolbar` (tool mode controls, destructive controls).
- Extract `MapPaletteSidebar` (sections already naturally segmented).
- Extract `MapCanvasRenderer` hook or module (draw pipeline only).
- Extract `TokenLayer` and `Token` interaction logic into dedicated file.
- Keep `MapDisplay` as orchestrator while preserving current action calls.

High-risk breakpoints:
- Token coordinate conversion (zoom + offset math).
- Distinguishing `skipHistory` vs history-on calls.
- Fog painting currently writes per-cell history; changing behavior can alter undo expectations.
- Any attempt to move tokens onto canvas would require complete hit-test/drag rewrite.

## 6. Combat Workflow UI Intelligence
Current flow:
- Active actor = `state.entities[state.turnIndex]` computed in `App` and passed to NowActing/Battlemaster controls.
- Initiative order = `InitiativeLedger` reorder group (`Reorder.Group`) wired to `setEntitiesOrder`.
- Turn advancement = `advanceTurn(1/-1)` from TopBar, NowActing button, Map HUD next-turn, CommandPalette.
- HP changes:
  - Quick single-target: `NowActingPanel`, `EntityHP`, `BattlemasterQuickActions`.
  - Group/area: `GroupDamageSheet -> applyBulkDamage`.
- Concentration alerts:
  - Generated when concentrating target takes damage.
  - Resolved in `TacticalAlertStack` pass/fail buttons, which mutate concentration state.
- Legendary resources:
  - Display/spend in `NowActingPanel` and `EntityLegendaryResources`.
  - Reset logic in `combatEngine.advanceTurn` for non-player legendary actors.
- Action logs:
  - Appends via `updateState` log mechanism.
  - Viewed/filtered in `ActionLedger` inside `RulesPanel` ledger tab.

Fast live combat needs:
- Keep `Next Action`, `Undo/Redo`, active HP damage/heal, concentration alerts, and initiative order visible without drawer hunting.

Prep/setup needs:
- Bestiary import, map templates/assets/background, snapshot creation, and encounter import/export.

Reference/stat-block needs:
- Bestiary modal details + `EntityReference` inline action/trait reference.

High-risk controls that must remain obvious:
- `advanceTurn`, `undo/redo`, concentration resolution, group damage apply, wipe/reset actions (with confirmations).

Controls that can be secondary/drawer:
- Rules library browsing, archive/player export, custom asset upload, some maintenance actions (clone/purge entity).

Redundancy observations:
- Damage/heal entry appears in NowActingPanel, EntityHP, BattlemasterQuickActions, and GroupDamageSheet.
- Inferred: Future pass should define one primary per context and downplay duplicates to reduce operator error.

## 7. Design System and Visual Language
- Fact: Tokenized dark palette uses CSS vars in `index.css` (`--color-obsidian-*`, `--color-ether-*`, `--color-crimson-*`, semantic health/warning).
- Fact: Shared component classes: `.glass`, `.glass-dark`, `.interactive-glass`, `.text-gradient-ether`, `.scrollbar-none`, `.scrollbar-custom`, `.mask-fade-edge`.
- Fact: Tailwind theme extends colors (`dragon`, `health`, `damage`, `player`, `warning`), fonts (Inter/Crimson Pro/JetBrains Mono), shadow (`glass`), bg image (`glass-gradient`).
- Fact: Typography pattern: heavy uppercase micro-labels + serif hero headings + mono numerics.
- Fact: Status color semantics:
  - health: emerald
  - bloodied/damage: rose
  - warning/concentration: amber
  - player/system accent: indigo
- Fact: Token HP strip semantics: green >50%, amber >25%, rose <=25%.
- Fact: Motion pattern: frequent spring/opacity/scale transitions; panel width animations in Battlemaster; micro pulses for active states/alerts.
- Inferred: New UI should remain glass-dark + high-contrast accents and avoid introducing a conflicting light theme without full token remap.

## 8. Feature and Control Access Audit

| Feature | Visible Label | Component/File | Action/Function | Current Location | Access Level | Future Visibility Guidance | Risk |
|---|---|---|---|---|---|---|---|
| View switching | icons (list/map/battlemaster) | `TopBar.jsx` | `setView('list'|'map'|'battlemaster')` | TopBar | Primary | Keep primary | Low |
| Round nav prev/next | chevrons + `Next Action` | `TopBar.jsx` | `advanceTurn(-1/1)` | TopBar center | Primary | Keep primary | High if hidden |
| Advance turn (secondary) | `Finalize Action` / `Next Turn` | `NowActingPanel.jsx`, `MapDisplay.jsx` | `advanceTurn(1)` | panel + map HUD | Primary | Keep at least one always visible | High |
| Undo/Redo | icons | `TopBar.jsx` | `undo()`, `redo()` | TopBar right | Primary | Keep primary | High |
| Add entity hero/foe | Quick Add menu | `TopBar.jsx` | `addEntity(true/false)` | TopBar plus menu | Secondary | Keep quick access | Medium |
| Bestiary open | `From Bestiary`, `Bestiary` | `TopBar.jsx`, `InitiativeLedger.jsx` | modal toggles | menu + roster header | Secondary | Keep visible in prep mode | Medium |
| Rules panel | book icon | `TopBar.jsx` | toggle rules modal | TopBar tools | Secondary | Keep | Low |
| Snapshots | camera icon | `TopBar.jsx` | toggle snapshots | TopBar tools | Secondary | Keep | Medium |
| Archive export | `Archive Campaign` | `TopBar.jsx` | `exportState()` | Tools dropdown | Secondary | Keep in tools | Medium |
| Player handout | `Player Handout` | `TopBar.jsx` | local export transform | Tools dropdown | Secondary | Keep in tools | Medium |
| Session import | `Upload Session` | `TopBar.jsx` | `importState(parsed)` | Tools dropdown | Secondary | Keep; improve validation UX | Medium |
| Wipe encounter | `Wipe Encounter` | `TopBar.jsx` | `clearEncounter()` | Tools dropdown | Hidden-ish destructive | Keep but guarded | High |
| Reset battlefield | `Reset Battlefield` | `TopBar.jsx` | `resetMap()` | Tools dropdown | Hidden-ish destructive | Keep but guarded | High |
| Map pan/move | Move tool | `MapDisplay.jsx` | `updateMap(view)` | map toolbar | Primary in map | Keep obvious | High |
| Terrain paint | Terrain Painter | `MapDisplay.jsx` | `commitTerrain` | map toolbar/palette | Primary in map prep | Keep | Medium |
| Object stamp | Object Stamp | `MapDisplay.jsx` | `placeObject` | map toolbar/palette | Secondary | Keep in prep cluster | Medium |
| Sketch/drawing | Tactical Sketch | `MapDisplay.jsx` | `commitDrawing` | map toolbar | Secondary | Keep | Medium |
| Eraser | (tool supported; no dedicated button currently) | `MapDisplay.jsx` | `commitDrawing` w eraser style | tool state only | Awkward | Add explicit control | Medium |
| Fog hide/reveal | Fog tool + mode toggle | `MapDisplay.jsx` | `setFogCell` | toolbar | Primary map control | Keep obvious | High |
| Lift all fog | `Lift All Fog` | `MapDisplay.jsx` | `clearFog()` | toolbar secondary block | Secondary | Keep | Medium |
| Background upload/remove | upload zone, X remove | `MapDisplay.jsx` | `setMapBackground` / `clearMapBackground` | palette section | Secondary | Keep in prep drawer | Medium |
| Background opacity/visibility | slider + eye | `MapDisplay.jsx` | `setBackgroundOpacity`, `setBackgroundVisible` | palette | Secondary | Keep | Low |
| Layer toggles | Fog/Sketch/Grid/Background | `MapDisplay.jsx` | local toggles + background visible | palette | Secondary | Keep grouped | Low |
| Template apply | Scene Templates | `MapDisplay.jsx` | `applyTemplate` | palette | Secondary | Keep | Medium |
| Clear map | `Clear Battlefield` | `MapDisplay.jsx` | `clearMap()` | toolbar destructive | Secondary | Keep with confirmation | High |
| Token drag | direct drag on token | `MapDisplay.jsx` Token | `updateToken` | map canvas | Primary | Keep | High |
| Token HP visibility | persistent strip | `MapDisplay.jsx` Token | derived hp pct | map tokens | Primary | Keep | Medium |
| Quick damage/heal active | Quick Strike | `BattlemasterQuickActions.jsx` | `applyDamage/applyHealing` | Battlemaster left footer | Primary in battlemaster | Keep | Medium |
| Full per-entity damage/heal | buttons in EntityHP/NowActing | `EntityHP.jsx`, `NowActingPanel.jsx` | `applyDamage/applyHealing` | cards/panel | Primary | Keep one clear primary per context | Medium |
| Group damage | `Area Damage` / `Apply Area Damage` | `InitiativeLedger.jsx` + `GroupDamageSheet.jsx` | `applyBulkDamage` | ledger header + modal | Secondary but critical | Keep discoverable | High |
| Conditions toggles | Condition palette | `EntityConditions.jsx`, `ConditionPalette.jsx` | `updateEntity({conditions})` | expanded entity/now acting | Secondary | Keep | Medium |
| Legendary resources | pips/buttons | `NowActingPanel.jsx`, `EntityLegendaryResources.jsx` | `spendLegendaryAction/Resistance` | acting + expanded card | Primary for boss fights | Keep | High |
| Concentration resolve | Pass/Fail Save | `TacticalAlertStack.jsx` | `resolveConcentration` | top bar alert dropdown | Primary | Keep top-level | High |
| Lair action alert trigger | `Trigger Lair Action` | `InitiativeLedger.jsx` | `triggerLairAction` | inline marker near init 20 boundary | Secondary | Keep visible during rounds | Medium |
| Action/combat log | Combat Ledger tab | `RulesPanel.jsx` + `ActionLedger.jsx` | reads `state.logs`; `clearLogs` | Rules drawer | Secondary | Keep | Low |
| Command palette | Cmd/Ctrl+K overlay | `CommandPalette.jsx` | various | global modal | Secondary power-user | Keep | Low |

## 9. Responsive and Adaptive Layout Notes
- Fact: Battlemaster panels are width-clamped [240,420], independently resizable with drag handles.
- Fact: Battlemaster initial auto-collapse thresholds: left <700px, right <900px.
- Fact: `MainDisplay` map mode removes outer padding; list mode keeps `p-6 md:p-12`.
- Fact: `TopBar` stacks vertically on small screens (`flex-col md:flex-row`) and hides tactical alert stack on sub-`lg` (`hidden lg:flex`).
- Fact: Map canvas is fixed `2500x2500`; usability at small viewports relies on pan/zoom.
- Inferred: Small viewport users may lose quick alert visibility because topbar alert panel is hidden at lower breakpoints.

Guidance for future layout instructions:
- Desktop wide: keep Battlemaster tri-panel default with map center dominance.
- Medium laptop: allow one side panel collapsed by default but keep quick turn controls pinned.
- Narrow browser widths: shift non-critical tools (rules/log/snapshots/export) into drawers or command palette.
- Small viewport fallback: prioritize active turn + initiative + basic map controls; reduce always-open ornamentation.
- Map minimum usable size: preserve at least ~55% horizontal space for map in battlemaster when both panels open.
- Drawers vs fixed panels: use drawers for prep/reference, fixed for live-combat core controls.
- Bottom dock overflow: ensure quick actions and persistent HUD elements do not overlap on shorter viewport heights.

## 10. Headless Visual Capture Results
- Attempted: not run in this extraction cycle.
- Reason: no preconfigured Playwright screenshot harness was present in repository scripts, and this pass focused on source-grounded architectural extraction without adding non-required test tooling.
- Unknown: no new screenshot artifacts were produced under `docs/ui-ux/screenshots/`.

## 11. UI/UX Implementation Guardrails
- Fact: Do not break `useEncounterState` as single source of truth.
- Fact: Do not bypass history-aware actions for content mutations.
- Fact: Do not mutate `state.map` directly in components.
- Fact: Do not treat pan/zoom/background-visibility/opacity as undoable content changes.
- Fact: Do not remove access to any currently reachable tool in the audit table.
- Fact: Do not bury `advanceTurn`, `undo/redo`, concentration resolution, and active damage/heal behind deep drawers.
- Fact: Do not rewrite `MapDisplay.jsx` in one pass; extract by seams.
- Fact: Do not break token pan/zoom alignment math.
- Fact: Do not change `GroupDamageSheet` ownership/invocation flow unless there is explicit workflow rationale.
- Fact: Do not remove export/import/snapshot functionality.
- Fact: Do not add dependencies unless existing stack cannot satisfy requirement.
- Fact: Do not perform broad lint/style cleanup as part of UI pass.
- Fact: Do not treat this extraction report as implementation authorization.

## 12. Recommended UI/UX Direction for Next Pass
Ideal default layout recommendation:
- Inferred: Make Battlemaster layout the default combat surface, with clear mode switching between `Combat` and `Prep` tool emphasis.
- Inferred: Keep map center primary, left for active actor/actions, right for initiative/units; move lower-frequency tools to contextual drawers.

Reusable components to retain:
- `NowActingPanel`, `InitiativeLedger`, `GroupDamageSheet`, `TacticalAlertStack`, `MapDisplay` (with extraction), `TopBar` action contract, `SnapshotDrawer`, `RulesPanel`, `CommandPalette`.

Reorganization targets:
- Split map shell into toolbar/palette/canvas/token layer subcomponents.
- Consolidate duplicate damage entry patterns into one dominant per context.
- Promote critical controls; demote maintenance/export controls.

Priority list:
1. Must do
- Preserve all action wiring and accessibility from Section 8 while improving layout hierarchy.
- Stabilize map UI structure via extraction seams without changing behavior.
- Keep live combat controls continuously visible in battlemaster.
2. Should do
- Add explicit eraser control exposure in map toolbar.
- Clarify prep vs combat tool groupings (background/templates/assets vs turn/HP actions).
- Reduce duplication of damage inputs and standardize language labels.
3. Could do
- Improve condition/resource density visuals and compact card readability.
- Add persistent quick links for snapshots and rules based on mode.
- Introduce optional low-distraction map-only overlay mode.
4. Defer
- Large dependency or rendering engine migrations.
- Full token/canvas architecture rewrite.
- Non-essential polish-only animation passes before workflow clarity is solved.

Questions for Andrew/DexGPT before implementation:
- Should battlemaster become default initial view, or remain opt-in?
- Should map prep tools be hidden during active combat rounds by default?
- Is custom asset persistence across reloads required in next pass?
- Should `BestiaryDrawer` be deleted/merged, or intentionally retained as alternative shell?
- Should mobile/tablet support be first-class or desktop-first in this cycle?

Information still missing, if any:
- Unknown: desired visual target references (“ideal concept images”) were not present in this repository extraction context.
- Unknown: product decision on long-term handling of custom uploaded tile assets.

## 13. Final Handoff Summary
Current UI architecture:
- React + custom hook state machine with modal FSM and three top-level views (`list`, `map`, `battlemaster`).
- Tactical map is a canvas+DOM hybrid with strong action/history coupling.

What can safely be changed:
- Layout composition, component extraction, visual hierarchy, control grouping, and styling refinements.
- Drawer/modal ergonomics and discoverability.

What must not be broken:
- Hook action pathways, history semantics, pan/zoom-token alignment, concentration/turn workflows, and full feature accessibility.

Where current features are located:
- Global controls: `TopBar.jsx`.
- Combat center: `NowActingPanel.jsx`, `InitiativeLedger.jsx`, `EntityCard.jsx` + subcomponents.
- Tactical map + prep controls: `MapDisplay.jsx`.
- Support systems: `RulesPanel.jsx`, `SnapshotDrawer.jsx`, `BestiaryModal.jsx`, `CommandPalette.jsx`, `TacticalAlertStack.jsx`.

Best next UI/UX implementation target:
- Start with battlemaster-first shell refinement plus `MapDisplay` seam extraction and control-priority cleanup, while preserving all existing encounter actions and tools.

Files the next implementation prompt should focus on:
- `/Users/andrew/Projects/DM_Hub/src/App.jsx`
- `/Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx`
- `/Users/andrew/Projects/DM_Hub/src/components/BattlemasterLayout.jsx`
- `/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx`
- `/Users/andrew/Projects/DM_Hub/src/components/NowActingPanel.jsx`
- `/Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx`
- `/Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx`
- `/Users/andrew/Projects/DM_Hub/src/components/entity-card/*.jsx`
