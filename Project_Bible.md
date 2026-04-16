# Project Bible: DM Hub Encounter Manager

## Project Overview
DM Hub is a stateful, real-time interaction-heavy application for managing tabletop RPG encounters. It features initiative tracking, health management, condition monitoring, and an automated action ledger.

## Architecture
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Custom hook `useEncounterState` with built-in history (undo/redo) and audit logging.
- **Persistence**: IndexedDB via `idb-keyval`.
- **UI Components**: Atomic React components for cards, ledgers, and panels.

## State Model Summary
- `round`: Current encounter round.
- `turnIndex`: Index of the currently active entity.
- `entities`: Array of interactive actors (HP, AC, Initiative, Conditions, etc.).
- `logs`: Chronological audit trail of all actions.
- `history`: Undo/redo stack (capped at 50).
- `alerts`: Temporary UI banners for triggers (Concentration, Lair Actions).

## Core Flows
1. **Encounter Setup**: Adding players/creatures, setting initiative.
2. **Combat Execution**: Advancing turns, applying damage/healing, tracking effects.
3. **Audit & Review**: Monitoring the Action Ledger, using Undo/Redo to correct mistakes.

## Commands
### Discovery
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.

### Harness (Proposed)
- `npm run test:harness`: Custom script for headless browser validation (Playwright or similar).

## Harness Discovery Results
- **Existing Tests**: None found.
- **Coverage Gaps**: Total. No automated validation for state transitions, history integrity, or persistence.

## Risk Areas
- **State Integrity**: Turn advancement logic involving effect ticking.
- **History Corruption**: Undo/redo pointer management during rapid interaction.
- **Persistence Sync**: Potential race conditions between state updates and IndexedDB writes.
- **Grouped Actions**: Damage application across multiple entities in a group.

## Baseline Validation Results (Initial)
- Runtime: Success (Builds and runs).
- Actions: Manual verification shows basic HP and Turn updates work.
- History: Manual verification shows Undo/Redo works for basic actions.

---

## [2026-04-16] Loop 1 Init
**Objective**: Baseline Discovery & Harness Establishment
**Improvements**: Establishment of Project Bible and Minimal Harness.
**Harness Plan**: Create a Playwright/Browser-based validation suite for core state flows.

## [2026-04-16] Loop 1: Stabilization & Ledger Polish
**Objective**: Resolve critical state engine bugs, establish automated verification, and overhaul the Action Ledger UI.
**Reasoning**: Discovery revealed scope errors that would crash the app during combat. The Action Ledger lacked the high-fidelity feedback required for a premium interaction-heavy app.

**Files Modified**:
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Fixed scope bugs in `advanceTurn`, refactored `updateState` to support functional log messages.
- [ActionLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/ActionLedger.jsx): Complete UI redesign with semantic icons (Flame, Brain, Heart), spring animations, and auto-scroll.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Cleaned up unused props and state references.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Prop consistency cleanup.
- [package.json](file:///Users/andrew/Projects/DM_Hub/package.json): Added `vitest` and `test:harness` script.

**Harness Execution**:
- Commands Run: `npm run test:harness`
- Results: 5/5 Tests Passed.
    - Initial Hydration: OK
    - Entity Management: OK
    - Damage/Healing Logic: OK
    - Turn Advancement & Effects: OK
    - History Integrity: OK

**Bugs Found & Fixed**:
- CRITICAL: `newIndex` and `newRound` were accessed outside the updater scope in `advanceTurn`, preventing turn advancement from working at runtime.
- LINT: 21 problems (unused variables, props, and imports) resolved across the codebase.

**UI/UX Improvements**:
- Added semantic color-coding and icons for logs (e.g., Pink Brain for Psychic damage).
- Implemented spring-based entry/exit animations for log entries.
- Added auto-scroll to latest log activity.

**Validation**:
- Automated: Vitest suite (headless).
- Manual: Browser validation of damage icons and round increment transitions.

**Commit Snapshot**: [Loop 1 Final]

## [2026-04-16] Loop 2: Entity Card UX Overhaul
**Objective**: Modernize the Entity Card layout and implement tactile visual feedback for combat actions.
**Reasoning**: Users needed clearer confirmation when applying damage/healing. The "Bloodied" and "Dead" states were previously too subtle for a high-density encounter.

**Files Modified**:
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Refactored Layout, Added Framer Motion shake/flash animations, implemented advanced visual states (Bloodied pulse, Dead desaturation).

**Harness Execution**:
- Commands Run: `npm run test:harness`
- Results: 5/5 Tests Passed. Refactoring did not break state machine logic.

**Visual Improvements**:
- Stat Blocks: Grouped AC/DC with icons in a clear "stat pill".
- Tactical Feedback: Card shakes sideways and flashes red when damage is taken.
- Status Presence: Concentration tag now pulses/rotates to maintain DM awareness.
- Health Archetypes: Crimson inner glow for "Bloodied" entities; monochrome desaturation for "Dead" entities.

**Validation**:
- Automated: Vitest suite.
- Manual: Browser verification of all dynamic states and animations.

**Commit Snapshot**: [Loop 2 Final]

## [2026-04-16] Loop 3: Initiative Reordering Polish
**Objective**: Implement seamless, state-synced drag-and-drop reordering for the initiative ledger.
**Reasoning**: Manual reordering is a common requirement in D&D (e.g., held actions, initiative ties). The previous implementation was a placeholder that didn't sync with the state machine.

**Files Modified**:
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Replaced `reorderEntities` with `setEntitiesOrder` for bulk updates; added turn-index recalculation logic.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Integrated `Reorder.Group` and `InitiativeItem` component with granular controls.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Implemented `dragControls` to restrict reordering triggers to the grip handle.
- [useEncounterState.test.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.test.js): Added test case for turn-index stability during reordering.

**Harness Execution**:
- Commands Run: `npm run test:harness`
- Results: 6/6 Tests Passed.

**Tactical Improvements**:
- Stable Turns: Moving the active entity in the list no longer causes the "active turn" to jump to a different participant.
- Precise Controls: Dragging is strictly limited to the grip handle, allowing name and HP edits without accidental reorders.
- Visual Smoothness: List items use spring-based layout transitions during reordering.

**Validation**:
- Automated: Vitest suite (verified turn index stability).
- Manual: Browser verified drag handle constraints and active indicator persistence.

**Commit Snapshot**: [Loop 3 Final]

## [2026-04-16] Loop 4: Undo/Redo Visual Feedback & Stabilization
**Objective**: Provide tactile feedback for history operations and resolve critical stability regressions.
**Reasoning**: Undo/Redo actions were previously silent and prone to crashing the UI when entities were removed while animations were still active.

**Files Modified**:
- [ToastProvider.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/ToastProvider.jsx): [NEW] Framework for tactical notifications.
- [App.jsx](file:///Users/andrew/Projects/DM_Hub/src/App.jsx): Integrated notification context.
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Refactored history stack to store action notes; converted all updaters to functional form for race-condition protection.
- [TopBar.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx): Connected history actions to the Toast system.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Added defensive guards for state-sync stability.
- [useEncounterState.test.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.test.js): Added history-sync verification for damage actions.

**Harness Execution**:
- Commands Run: `npm run test:harness`
- Results: 7/7 Tests Passed.

**Stabilization Results**:
- Error Resilience: Zero "black screen" crashes during rapid undo/redo cycles.
- History Integrity: Every action (Damage, Healing, Renaming, Reordering) now generates a persistent history entry with a descriptive toast.
- UI Polish: High-fidelity toasts with blurred backgrounds and semantic icons.

**Validation**:
- Automated: Vitest history integrity suite.
- Manual: Browser verified toast accuracy and application robustness.

**Commit Snapshot**: [Loop 4 Final]
