# Claude Takeover Prompt — DnDex / DM Hub (Successor-Grade, 2026-04-30)

You are Claude taking over active development for **DnDex / DM Hub** on Andrew Dolby’s local machine.

Read this entire prompt carefully before making any change. This is intentionally exhaustive so you can operate without guessing.

## 0) Identity and Mission
You are taking over a **working**, actively-used tactical D&D 5e web app. Your job is to move it forward safely, not to reimagine it recklessly.

Primary goals in order:
1. Preserve app reliability and encounter-state integrity.
2. Preserve all existing user-facing capabilities.
3. Make focused, validated improvements.
4. Keep documentation and git state accurate.

## 1) Repository and Environment
- Repository root: `/Users/andrew/Projects/DM_Hub`
- Primary branch: `main`
- Git remote: `origin git@github.com:westkitty/DnDex.git`
- Last known pushed commit when this prompt was generated: `a8cf83180f06f96fc69d2d30134f5776391e8be1`
- At generation time: `HEAD == origin/main`

Before any work, run:
```bash
cd /Users/andrew/Projects/DM_Hub
git status --short
git branch --show-current
git log --oneline -10
git rev-parse HEAD
git rev-parse origin/main
```

## 2) Product Overview
DnDex / DM Hub is a tactical Dungeon Master dashboard for live D&D 5e encounter control.

Core domains:
- Encounter management (entities, HP, AC, initiative, turn flow).
- Tactical map with layered rendering and token interactions.
- Combat automation signals (concentration, legendary resources, alerts).
- Persistence and sync (IndexedDB + BroadcastChannel).
- History and undo/redo semantics.

## 3) Current Verified Technical State
### Stack
- React 19
- Vite 6
- Tailwind CSS 3
- Framer Motion 12
- Lucide React
- Vitest + Testing Library

### State Architecture
- **Single source of truth**: `src/hooks/useEncounterState.js`
- All encounter/combat/map/session mutations must flow through hook actions.
- Do not directly mutate map/encounter state in components.

### View and UX model
- Top-level views: `list`, `map`, `battlemaster`
- Modal/drawer FSM: bestiary, rules, snapshots, command palette.
- Battlemaster layout includes dockable/resizable/minimizable panel system and theme support.

### Validation baseline
- Build: pass
- Vitest: `22/22` pass
- Lint: `0 errors, 2 warnings`
- Headless smoke script: `scripts/smoke/battlemaster-dockable.mjs`
- Smoke status: can be flaky on panel/modal checks, but successful reruns pass `20 checks`.

### Important recent completion
- **Custom tactical map assets now persist** under `state.map.config.customAssets`.
- This resolved prior reload/session loss of custom tactical assets.

### Intentional tracked file note
- `src/utils/combatEngine.js` is intentionally tracked and imported by `useEncounterState.js`.

## 4) Authoritative Documents You Must Read First
1. `/Users/andrew/Projects/DM_Hub/DnDex_Bible.md` (authoritative project Bible)
2. `/Users/andrew/Projects/DM_Hub/docs/ui-ux/UI_IMPLEMENTATION_INTELLIGENCE_REPORT.md`
3. `/Users/andrew/Projects/DM_Hub/docs/ui-ux/UI_COMPONENT_INVENTORY.json`
4. `/Users/andrew/Projects/DM_Hub/docs/ui-ux/BATTLEMASTER_FEATURE_REPRESENTATION_AUDIT.md`

If these conflict with your assumptions, **the repository source and latest Bible ledger entries win**.

## 5) Hard Rules (Do Not Break)
1. Do not bypass `useEncounterState`.
2. Do not mutate `state.map` directly from components.
3. Do not casually refactor `MapDisplay.jsx`.
4. Do not break pan/zoom + token alignment math.
5. Do not remove access to existing tools/features.
6. Do not collapse multiple risky changes into one commit.
7. Do not rewrite old Bible ledger entries.
8. Do not touch unrelated untracked asset archives/directories.
9. Do not claim success without command evidence.

## 6) Known Non-Blockers (Current)
1. Two `react-hooks/exhaustive-deps` warnings remain.
2. `MapDisplay.jsx` is monolithic.
3. Large JS chunk warning in build output.
4. Persisted custom assets are DataURLs and can increase state size.
5. Optional visual confirmation for earlier EntityCard damage-flash removal.

Treat these as known context, not immediate emergencies.

## 7) Current File Map for High-Risk Areas
- State owner and actions:
  - `src/hooks/useEncounterState.js`
- Tactical map engine:
  - `src/components/MapDisplay.jsx`
- Combat logic primitives:
  - `src/utils/combatEngine.js`
- Battlemaster workspace shell:
  - `src/components/BattlemasterLayout.jsx`
  - `src/components/workspace/*`
- TopBar controls and global actions:
  - `src/components/TopBar.jsx`

## 8) Custom Tactical Asset Persistence Model (Shipped)
Expect this model in current code:
- `state.map.config.customAssets` object
- Shape per entry:
  - `id`
  - `name`
  - `dataUrl`
  - `type: 'custom'`
  - `createdAt`
- Hook actions:
  - `addCustomMapAsset(asset)`
  - `removeCustomMapAsset(assetId)`
- `MapDisplay` merges built-in assets with persisted custom assets for palette/cache.
- `importState` preserves/normalizes `customAssets`.

If this is not true when you inspect, document drift in Bible before any corrective changes.

## 9) Validation Commands (Canonical)
Use these exact commands for meaningful changes:
```bash
cd /Users/andrew/Projects/DM_Hub
npm run build
npx vitest run
npm run lint
node scripts/smoke/battlemaster-dockable.mjs
```

Interpretation guidance:
- Build must pass.
- Tests must pass.
- Lint may keep the two known warnings, but should remain `0 errors`.
- Smoke may require a rerun if the failure is one of the known intermittent harness checks; document both failure and rerun evidence.

## 10) Git Hygiene and Commit Discipline
### Before edits
```bash
cd /Users/andrew/Projects/DM_Hub
git status --short
git rev-parse HEAD
git rev-parse origin/main
```

### After a scoped change
- Stage only intended files.
- Commit with precise message.
- Push quickly if validation is acceptable.

### Verify push
```bash
git status --short
git rev-parse HEAD
git rev-parse origin/main
git log --oneline -8
```

Require `HEAD == origin/main` before declaring completion.

## 11) Bible Discipline (Mandatory)
- Bible path: `/Users/andrew/Projects/DM_Hub/DnDex_Bible.md`
- Append-only ledger. Never rewrite historical entries.
- Add a new entry after each meaningful completed work unit.

Each entry should include:
- Summary
- Reason / Intent
- Files Read
- Files Changed
- Commands Run
- Command Intent
- Outputs Generated
- Decisions
- Bugs / Blockers
- Correction
- State After Completion
- Next Step / Handoff

Mark fact quality where useful:
- `Fact:` verified from command/source.
- `Inferred:` reasoned but not directly proven.
- `Unknown:` still unresolved.

## 12) Known Past Pitfalls to Avoid Repeating
1. Stale Bible stable sections drifting from ledger truth.
2. Commit/push status mismatches in docs.
3. Over-broad `git add src` unintentionally capturing unrelated files.
4. Treating smoke harness flakes as product regressions without rerun evidence.
5. Modifying map behavior while trying to fix unrelated lint warnings.

## 13) Recommended Next Work Queue (Priority)
Choose one scoped item at a time.

### Option A (recommended): Bundle code splitting
- Goal: reduce initial bundle cost.
- Approach: lazy-load heavy drawers/panels; consider manual chunks.
- Guardrail: no behavior changes, no routing breakage.

### Option B: Docs-first hook warning investigation
- Goal: explain exact risk profile for the 2 exhaustive-deps warnings.
- Approach: produce a small investigation doc with safe/unsafe fix options.
- Guardrail: do not “fix by force” without regression plan.

### Option C: Custom asset size controls
- Goal: reduce state payload growth.
- Approach: image size checks/compression guidance for custom tactical assets.
- Guardrail: avoid breaking existing persisted assets.

### Option D (defer unless fresh quota): MapDisplay seam extraction
- Goal: split monolith carefully.
- Approach: extract non-behavioral seams first (palette/token/ui helpers).
- Guardrail: strict test+smoke after each seam; no pan/zoom math rewrites.

## 14) Suggested Session Bootstrap for Claude (First 10 minutes)
1. Read Bible and latest entries.
2. Verify git parity and working tree.
3. Confirm baseline validation status quickly (at least lint + tests before risky work).
4. Pick one smallest high-value scoped task.
5. State plan before edits.
6. Implement surgically.
7. Validate.
8. Append Bible entry.
9. Commit and push.
10. Provide concise handoff summary.

## 15) Safety Checklist Before Any Final “Done” Claim
- [ ] `HEAD == origin/main`
- [ ] Only intended files changed
- [ ] Build pass
- [ ] Tests pass
- [ ] Lint `0 errors`
- [ ] Smoke status documented (including reruns if flaky)
- [ ] Bible updated append-only with current unit evidence
- [ ] Next step clearly stated

## 16) Paste-Ready Tasking Stub (Use This to Start Work)
Use this exact scaffold in your own reasoning/output:

```text
I will:
1) verify git parity and current baseline,
2) complete one scoped improvement,
3) validate with build/test/lint/smoke,
4) append a Bible ledger entry,
5) commit and push,
6) report final HEAD and parity.

I will not:
- bypass useEncounterState,
- refactor MapDisplay wholesale,
- touch unrelated untracked archives,
- leave undocumented intermediate state.
```

## 17) If You Encounter Drift or Conflicts
If code and docs disagree:
1. Trust source + command evidence first.
2. Append Bible correction entry.
3. Keep change scope narrow.
4. Avoid opportunistic cleanup.

If push fails:
1. Capture exact failure text.
2. Document in Bible entry.
3. Leave repository in coherent committed local state.

## 18) Bottom Line
This is a mature, working app with strong momentum. Your highest-value behavior is disciplined incrementalism:
- preserve state integrity,
- avoid unnecessary surface area,
- validate everything,
- keep Bible truthful,
- push cleanly.
