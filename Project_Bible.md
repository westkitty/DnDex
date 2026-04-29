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

## [2026-04-16] Loop 5: Persistence Health Check & Collision Detection
**Objective**: Ensure 100% data reliability and real-time multi-tab synchronization.
**Reasoning**: Users often open multiple tabs of the same encounter. Without sync, they risk overwriting tactical data.

**Files Modified**:
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Integrated BroadcastChannel API and lastUpdated timestamps; implemented conflict detection logic.
- [App.jsx](file:///Users/andrew/Projects/DM_Hub/src/App.jsx): Replaced static persistence indicator with a dynamic, color-coded status pill with glassmorphism styling.
- [useEncounterState.test.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.test.js): Corrected history pointer expectations to match revised stacking logic.

**Technical Achievement**:
- **Multi-Tab Sync**: Real-time mirroring of state across tabs via BroadcastChannel.
- **Safe Save**: Debounced IndexedDB writes with timestamp-based conflict protection.
- **Visual Feedback**: Dynamic "Syncing..." animations and conflict resolution toasts.

**Validation**:
- Automated: 7/7 Tests Passed.
- Manual: Browser verified the sync transition and backdrop-blur styling.

**Commit Snapshot**: [Loop 5 Final]

## [2026-04-16] Loop 6: Tactical Quick-Damage Shortcuts
**Objective**: Accelerate combat math with one-click damage modifiers.
**Reasoning**: Resistance and vulnerability are high-frequency events in D&D. Manual calculation slows down the DM and introduces errors.

**Files Modified**:
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Added 1/2 and 2x shortcut buttons with math logic; refined console layout for density.

**Feature Summary**:
- **Resistance (1/2)**: Instantly halves the current 'Amt' value (Math.floor).
- **Vulnerability (2x)**: Instantly doubles the current 'Amt' value.
- **Tactile UI**: Modifier row positioned directly under the input field for minimal mouse movement.

**Validation**:
- Manual: Browser verified math correctness and layout stability. Verified that applying damage after modification works as expected.

**Commit Snapshot**: [Loop 6 Final]

## [2026-04-16] Loop 7: Concentration Save Automation
**Objective**: Automate spellcasting focus tracking and resolution.
**Reasoning**: Concentration is one of the most forgotten and mechanics-heavy aspects of D&D 5e combat. Automating the Save DC calculation and resolution reduces DM overhead.

**Files Modified**:
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Updated alert generation with tactical metadata; added resolveConcentration logic.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Propagated resolution handlers.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Implemented card-situated resolution UI.
- [TopBar.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx): Filtered marquee for tactical clarity.

**Automation Summary**:
- **Trigger**: Any damage to a concentrating creature automatically calculates the Save DC (min 10 or half damage).
- **Resolution**: Card-situated UI permits one-click 'Pass' or 'Fail'.
- **Outcome**: 'Fail' instantly strips the concentration status.

**Validation**:
- Automated: 8/8 Tests Passed.
- Manual: Browser verified end-to-end automation and stability.

**Commit Snapshot**: [Loop 7 Final]

## [2026-04-16] Loop 8: Lair & Legendary Action Refinement
**Objective**: Enhance high-level encounter management with dedicated resource tracking.
**Reasoning**: Legendary and Lair actions are central to high-stakes D&D combat but easy to forget. Automated replenishment and visual threshold markers reduce DM cognitive load.

**Files Modified**:
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Expanded schema with legendaryResistances; implemented automated turn-based replenishment.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Added spatial 'Lair Action (20)' threshold marker.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Implemented 'Legendary Hub' and configuration inputs.

**Feature Highlights**:
- **Lair Marker**: Persistent visual banner at Initiative 20.
- **Legendary Hub**: Interactive 'dots' for Actions and 'diamonds' for Resistances.
- **Auto-Reset**: Actions automatically refill when the creature's turn begins.

**Validation**:
- Automated: 8/8 Tests Passed.
- Manual: Browser verified replenishment logic and visual fidelity.

**Commit Snapshot**: [Loop 8 Final]

## [2026-04-16] Loop 9: Semantic Iconography for Actions
**Objective**: Transform the Action Ledger into a rich, metadata-driven audit trail.
**Reasoning**: Plain text logs are slow to read in high-pressure combat situations. Semantic icons and colors allow DMs to interpret the flow of battle via peripheral vision.

**Files Modified**:
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Updated logging pipeline to support the `subType` metadata field.
- [ActionLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/ActionLedger.jsx): Implemented a semantic mapping engine for icons (Fire, Psychic, Force, etc.) and color configurations.

**Visual Enhancements**:
- **Atomic Badges**: Each log entry now features a metadata tag (e.g., 'FIRE', 'LEGENDARY').
- **Damage Symbolism**: Icons like Flame, Brain, and Snowflake provide instant context for damage types.
- **Tactical Colors**: Crimson backgrounds for damage, emerald for healing, and indigo for legendary actions.

**Validation**:
- Automated: 8/8 Tests Passed.
- Manual: Browser verified rich visual feedback for multiple damage types and resource expenditures.

**Commit Snapshot**: [Loop 9 Final]

## [2026-04-16] Loop 10: Final Polish & Program Completion
**Objective**: Finalize the application and conduct the program-wide audit.
**Reasoning**: Iterative refinement requires a final sweep to ensure all systems (Sync, State, UI) harmonize for a production-ready experience.

**Final Polish Actions**:
- **Semantic Tuning**: Swapped 'Wind' for 'CloudLightning' to optimize 5e Thunder damage iconography.
- **Documentation**: Finalized the [Project Bible](file:///Users/andrew/Projects/DM_Hub/Project_Bible.md) and [Final Walkthrough](file:///Users/andrew/.gemini/antigravity/brain/ea8a8c21-c885-441b-8309-737feaeddeff/walkthrough.md).

**Program Audit**:
- **State Integrity**: 8/8 automated harness tests passing consistently.
- **Resilience**: Verified multi-tab sync and conflict-free IndexedDB persistence.
- **Aesthetic**: Locked the "Dragon" dark-glass theme across all 10 feature loops.

## [2026-04-28] Loop 11: Production Bestiary & Tactical Polish
**Objective**: Integrate full SRD bestiary and finalize production tactical UI.
**Reasoning**: A tactical manager is only as good as its data. Moving from placeholder entities to a 334-monster production bestiary required data normalization and UI propagation.

**Files Modified**:
- [bestiary.json](file:///Users/andrew/Projects/DM_Hub/src/data/bestiary.json): Ingested 334 SRD monsters; repaired legendary resistance data integrity.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Fixed critical prop-drilling regression for legendary resources.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Finalized Concentration resolution UI buttons.
- [TopBar.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx): Implemented Tactical Alert Marquee for header-level combat awareness.
- [vite.config.js](file:///Users/andrew/Projects/DM_Hub/vite.config.js): Corrected base path for GitHub Pages deployment.

**Production Deliverables**:
- **Bestiary**: 334 monsters with full stats, traits, and legendary actions.
- **Data Integrity**: Repaired all legendary creatures (e.g. Dragons, Solar) to have their correct `legendaryResistancesMax` pools.
- **UI Flow**: Concentration saves can now be resolved with one click from either the card or the header alert.
- **Deployment**: Live at [westkitty.github.io/DnDex/](https://westkitty.github.io/DnDex/).

**Validation**:
- Manual: Verified all 334 monsters load correctly; verified legendary spending buttons; verified concentration pass/fail logic.
- Deployment: Confirmed site is accessible and asset paths are correct.

**Commit Snapshot**: [Production Release v1.1]

## [2026-04-28] Loop 12: Build Stabilization & Shell Polish
**Objective**: Stabilize the production build environment and align app identity with the DnDex brand.

**Reasoning**: Establishing a green build and consistent branding is a prerequisite for the Phase 2 UI/UX overhaul.

**Files Modified**:
- [index.html](file:///Users/andrew/Projects/DM_Hub/index.html): Updated title and added meta tags for DnDex branding.
- [vite.config.js](file:///Users/andrew/Projects/DM_Hub/vite.config.js): Aligned PWA manifest name and short_name with DnDex identity.

**Implementation Summary**:
- Confirmed `npm run build` succeeds in the current environment.
- Updated shell metadata (Title, Description, Theme Color).
- Verified PWA manifest consistency.

**Validation**:
- `npm run build`: Success.
- `npm run lint`: 18 errors (primarily unused vars in components).
- Manual checks: Verified tab title and PWA configuration.

**Known Limitations / Follow-up**:
- Lint errors remain (unused variables in multiple components).
- Moving to Phase 2: Now Acting Command Panel.

## [2026-04-28] Loop 13: Now Acting Command Panel
**Objective**: Implement a dedicated, impossible-to-miss command center for the active actor.

**Reasoning**: DMs need immediate access to the current actor's stats and actions without hunting through a long list of cards.

**Files Modified**:
- [NowActingPanel.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/NowActingPanel.jsx): [NEW] High-fidelity panel for the active entity.
- [App.jsx](file:///Users/andrew/Projects/DM_Hub/src/App.jsx): Derived `activeEntity` and passed it down.
- [MainDisplay.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/MainDisplay.jsx): Integrated `NowActingPanel` into the initiative list view.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Fixed missing `ShieldAlert` import.

**Implementation Summary**:
- Created a glassmorphism-styled panel that reacts to the active entity's type (Indigo for players, Rose for monsters).
- Displayed core tactical data: Round, Name, Initiative, AC, DC, and HP.
- Integrated quick combat actions: Damage, Healing, and End Turn.
- Added visual support for Legendary Actions and Resistances.
- Used Framer Motion for smooth transitions on turn changes.

**Validation**:
- `npm run build`: Success.
- Manual checks: Verified active entity sync and action functionality.

**Known Limitations / Follow-up**:
- Damage calculator (Phase 2, Step 9) not yet integrated into the panel.
- Moving to Phase 2: Turn Transition Moment.

## [2026-04-28] Loop 14: Turn Transition Moment
**Objective**: Enhance legibility of turn advancement and initiative sequence.

**Reasoning**: Users need clear visual confirmation when the turn changes to avoid confusion during rapid combat.

**Files Modified**:
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Implemented automatic scroll-into-view for the active actor and added ARIA markers.
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Upgraded active actor styling with an ember border and amber glow to match the "Now Acting" identity.

**Implementation Summary**:
- Integrated `useEffect` and `useRef` to ensure the active combatant is always centered in the viewport.
- Enhanced the active item visual weight in the initiative list.
- Improved accessibility with `aria-current`.

**Validation**:
- Manual checks: Verified smooth scrolling to active actor on turn advance. Verified visual consistency between NowActingPanel and InitiativeLedger.

**Known Limitations / Follow-up**:
- Scrolling may be jarring if the user is manually inspecting another card; however, center-blocking is generally preferred for tactical focus.
- Moving to Phase 2: Tactical Alert Stack.

## [2026-04-28] Loop 15: Tactical Alert Stack
**Objective**: Replace the passive alert marquee with an actionable, high-priority alert center.

**Reasoning**: Alerts like Concentration saves or Lair Actions often get missed in a moving marquee. A dedicated stack ensures they are visible and immediately actionable.

**Files Modified**:
- [TacticalAlertStack.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/TacticalAlertStack.jsx): [NEW] Dropdown component for managing tactical alerts.
- [TopBar.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/TopBar.jsx): Integrated the Alert Stack and removed the old marquee.

**Implementation Summary**:
- Created a badge-based trigger in the TopBar that shows the count of active alerts.
- Implemented an actionable dropdown that allows clearing alerts or resolving Concentration saves directly from the header.
- Used distinct visual styles for Critical (amber) vs. Informational (indigo) alerts.

**Validation**:
- Manual checks: Verified that adding a Concentration alert (by taking damage while concentrating) correctly triggers the stack. Verified that resolving from the stack clears the alert.

**Known Limitations / Follow-up**:
- Future alerts (e.g., Lair Actions at Init 20) should be automatically injected into this stack.
- Moving to Phase 2: Action Ledger Grouping.

## [2026-04-28] Loop 16: Action Ledger Grouping
**Objective**: Improve combat log readability through logical grouping and filtering.

**Reasoning**: A flat list of logs becomes overwhelming in long encounters. Grouping by round provides a temporal anchor for the DM.

**Files Modified**:
- [ActionLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/ActionLedger.jsx): Rewritten to support grouping by round and filtering by action type.
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Added `round` metadata to log entries.

**Implementation Summary**:
- Implemented `useMemo` based grouping logic to aggregate logs by round number.
- Added a filter bar with categories: All, Damage, Healing, and Status.
- Enhanced the visual design with round separators and refined typography.
- Maintained smooth auto-scrolling to the latest entry.

**Validation**:
- Manual checks: Verified that logs generated in different rounds are correctly separated. Verified that filter chips accurately toggle visibility based on log types.

**Known Limitations / Follow-up**:
- Filter state is reset on component unmount; could be persisted to state if needed.
- Moving to Phase 2: Entity Card Density Modes.

## [2026-04-28] Loop 17: Entity Card Density Modes
**Objective**: Allow the DM to switch between detailed and compact views of the tactical list.

**Reasoning**: In large encounters with many units, detailed cards take up too much vertical space. A compact view allows seeing the whole battlefield at a glance.

**Files Modified**:
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Implemented a `isCompact` mode with a slim, row-based layout and quick-action dropdown.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Added a density toggle in the header and propagated the state to child components.

**Implementation Summary**:
- Created a high-performance "Compact Mode" for EntityCard that condenses HP, AC, and Name into a single line.
- Added a persistence-ready toggle in the Initiative Ledger header.
- Ensured that even in compact mode, critical information (Concentration, Conditions) is visible via icons.

**Validation**:
- Manual checks: Verified that toggling density modes works smoothly and preserves state. Verified that compact mode is still actionable via the expansion dropdown.

**Known Limitations / Follow-up**:
- Compact mode dropdown could be improved with more granular quick-actions.
- Moving to Phase 2: Boss Mode treatment.

## [2026-04-28] Loop 18: Boss Mode treatment
**Objective**: Visually distinguish Legendary creatures from standard combatants.

**Reasoning**: Legendary creatures are the centerpieces of major encounters. DMs need clear visual cues that legendary resources (actions/resistances) are available.

**Files Modified**:
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Added specific "Boss Mode" styling, including amber borders, internal glows, and a "Legendary" badge with animated sparkles.

**Implementation Summary**:
- Condition-based styling: If a creature has max legendary actions or resistances > 0, Boss Mode is activated.
- Visual enhancements: Added a persistent amber-tinted border and a decorative top-right badge.
- Maintained consistency with the "Now Acting" amber/gold palette.

**Validation**:
- Manual checks: Verified that creatures with legendary stats display the new visuals. Verified that standard creatures and players remain unaffected.

**Known Limitations / Follow-up**:
- Future iterations could include a unique "Boss Theme" sound effect or screen shake on turn start for legendary units.
- Moving to Phase 3: Tactical Infrastructure.

## [2026-04-28] Loop 19: Bestiary Drawer
**Objective**: Provide a searchable interface for deploying monsters from the 334-unit data set.

**Reasoning**: Manually typing monster stats is slow. A pre-indexed bestiary allows the DM to build encounters in seconds.

**Files Modified**:
- [BestiaryDrawer.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/BestiaryDrawer.jsx): Created a slide-out drawer with search, type-filtering, and "Deploy" functionality.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Integrated the drawer and added an entry point button.

**Implementation Summary**:
- Leveraged `src/data/bestiary.json` as the source of truth for 334 monsters.
- Implemented a performance-optimized list with a 50-item rendering cap during search.
- Added type-based quick filters (Dragon, Undead, etc.).
- Integrated with `addEntity` in the encounter state to pipe full monster objects into the combat list.

**Validation**:
- Manual checks: Verified that the drawer slides in correctly. Verified that searching for "Dragon" returns appropriate results. Verified that clicking "+" adds the monster with correct HP/AC to the initiative list.

**Known Limitations / Follow-up**:
- Future iterations could include multi-select for batch deployment.
- Moving to Phase 3: Demo Encounter Data.

## [2026-04-28] Loop 20: Demo Encounter Data
**Objective**: Enable a one-click deployment of a balanced encounter for testing and demonstration.

**Reasoning**: Setting up a test encounter from scratch is tedious. A "Quick-Start" demo allows users to immediately see the tactical value of the app.

**Files Modified**:
- [demoEncounter.js](file:///Users/andrew/Projects/DM_Hub/src/data/demoEncounter.js): Defined a sample encounter with an Adult Black Dragon and 3 Heroes.
- [useEncounterState.js](file:///Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js): Added `loadEncounter` action to bulk-load entities and reset the combat state.
- [InitiativeLedger.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/InitiativeLedger.jsx): Added a "Quick-Start Demo Encounter" button to the empty state.

**Implementation Summary**:
- Created a robust `loadEncounter` method that handles ID generation and state reset.
- Populated the demo with a diverse set of entities (Player vs. Boss) to showcase different UI treatments (Boss Mode, Action Ledger grouping).
- Integrated the entry point into the "Empty Battlefield" view for high discoverability.

**Validation**:
- Manual checks: Verified that clicking "Quick-Start" clears the empty state and populates the list with the dragon and heroes. Verified that initiative order is preserved.

**Known Limitations / Follow-up**:
- Future iterations could offer multiple demo scenarios (e.g., Horde vs. Boss).
- Moving to Phase 3: Damage Preview Calculator.

## [2026-04-28] Loop 21: Damage Preview Calculator
**Objective**: Provide visual feedback on the impact of damage or healing before applying it.

**Reasoning**: DMs often miscalculate resulting HP or forget resistances. A preview reduces errors and provides a "safety check" before committing changes to the state.

**Files Modified**:
- [EntityCard.jsx](file:///Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx): Added a reactive preview system in the HP section.

**Implementation Summary**:
- Implemented a "Ghost Bar" in the HP progress component that shows the projected health level.
- Added a numeric preview (Current HP -> Next HP) with color-coding (Rose for damage, Emerald for healing).
- Leveraged `framer-motion` for smooth entry/exit of the preview indicators.

**Validation**:
- Manual checks: Verified that typing "20" in the damage input of a 100 HP creature shows a ghost bar at 80% and a "-> 80" label. Verified that deleting the input removes the preview.

**Known Limitations / Follow-up**:
- Preview does not yet account for damage type resistances/vulnerabilities (calculated in the hook). Adding a "Type Selector" to the preview would be the next step.
- Moving to Phase 3: Final Handoff.
