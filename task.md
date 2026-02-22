
## Refactor Opportunities After Recent Changes (Plan Only)

### Assessment
There are meaningful refactors worth doing. None are mandatory for correctness right now, but they would reduce regression risk and speed up future iteration in sell/FX/energy systems.

### Priority Refactor Plan

1. Extract a dedicated sell pipeline module
- Problem:
  - `sellBulkSelectedGridItemsAction(...)` now owns animation sequencing, state mutation, summary aggregation, FX triggers, and UI refresh timing.
  - This is powerful but dense and harder to reason about.
- Refactor:
  - Create `js/controllers/sell_sequence_controller.js` (or similar) to handle:
    - per-cell sell step orchestration,
    - ordering and in-flight state,
    - summary aggregation.
  - Keep `harvest_controller` as high-level entry point only.
- Benefit:
  - Easier to tune sequence behavior without touching business logic.

2. Centralize sell FX contract
- Problem:
  - Single sell and bulk sell now duplicate parts of the FX event pattern (burst/ring/text/coins/hud pulses).
- Refactor:
  - Create a single helper (controller-level, DOM-free via deps) like `emitSellFx(...)` used by both single and bulk flows.
  - Inputs: `center`, `rarity`, `saleValue`, `xpGain`, `hudTarget`.
- Benefit:
  - Prevents drift between single/bulk sell feel.

3. Introduce explicit “sell batch in flight” runtime state
- Problem:
  - Multiple guards now rely on event-level behavior and button availability.
- Refactor:
  - Add `state.runtimeFlags.isSellBatchInFlight` (or module-local runtime flag).
  - Gate sell triggers and selection-clearing behavior through one source of truth.
- Benefit:
  - Reduces race-condition bugs from rapid input or rerender timing.

4. Decouple targeted tile refresh from full `renderAll()`
- Problem:
  - Bulk per-item sequence currently calls `renderAll()` to show tile disappearance immediately.
- Refactor:
  - Add lightweight grid refresh API (e.g. `renderGridCells(indices)` or `renderGridCell(index)`).
  - Keep one final `renderAll()` at batch end.
- Benefit:
  - Cleaner event timing and lower render cost as batch sizes grow.

5. Consolidate day energy accounting into a small state adapter
- Problem:
  - `dayEnergySpent` is now used for roll strength and touched in multiple places (consume, next day, init, persistence, reset).
- Refactor:
  - Add small `day_energy_state.js` utility with:
    - `incrementDayEnergySpent(cost)`,
    - `resetDayEnergySpent()`,
    - `getDayEnergySpent()`.
  - Use from economy/day controllers.
- Benefit:
  - Less chance of missing a reset/persistence path when extending the system.

6. Add save-shape consistency validator for farm rarity
- Problem:
  - Rarity mismatch between legacy and farm snapshots required migration logic.
- Refactor:
  - Add one validator during init that checks farm arrays (`gridItems`, `gridRarity`, etc.) consistency and reports/fixes in one place.
- Benefit:
  - Future save migrations become safer and easier to audit.

### Suggested Order (If Implemented Later)
1. Sell batch in-flight flag
2. Sell FX helper extraction
3. Sell sequence controller extraction
4. Targeted grid refresh path
5. Day energy state adapter
6. Save-shape validator hardening

### What Not To Refactor Right Now
- No major architectural rewrites (`main.js` decomposition beyond touched areas) unless behavior work is paused.
- No UI redesign changes tied to these refactors.
