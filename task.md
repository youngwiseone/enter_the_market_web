
## Multi-Sell FX Follow-Up Plan (No Implementation Yet)

### Goals
- Fix missing particle FX during bulk/multi-sell.
- Increase per-item sell cadence (faster one-after-another).
- Make each item sell feel like a single-sale event:
  - tile disappears,
  - item travel animation runs,
  - particle FX plays in the same moment window.

### Current Problems To Address
- Bulk flow currently performs per-item steps, but sell particles are not reliably firing for each item in multi-sell.
- Per-item delay stack is too high (travel duration + extra stagger), causing bulk sell to feel sluggish.
- Visual events are not tightly synchronized enough to read as one coherent “individual sale hit.”

### Implementation Plan
1. Restore per-item particle FX in bulk path
- In `js/controllers/harvest_controller.js`, for each sold cell in `sellBulkSelectedGridItemsAction(...)`:
  - get tile center before mutation,
  - trigger per-item particle burst/ring/floating value text consistent with single-sell style,
  - keep rarity-aware styling where applicable (or define consistent bulk defaults if rarity not available).
- Ensure FX trigger happens for every successful sold cell, not only summary-level completion.

2. Tighten event ordering per item (single-sale feel)
- For each item in bulk loop, enforce this order:
  1. capture tile center + sale value context,
  2. start travel animation toward market target,
  3. clear sold tile state (item disappears),
  4. trigger particle burst/impact + coin travel,
  5. lightweight visual refresh.
- Keep this strictly per-item before advancing to next index.

3. Speed up sequence timings
- Reduce sell travel duration and inter-item stagger in `js/fx/fx_controller.js`:
  - shorten travel animation duration,
  - lower stagger delay between items,
  - preserve readability (do not overlap so much that sequence looks like one blob).
- Add target timing budget for bulk sell:
  - 5 items should finish noticeably faster than current feel while still clearly sequential.

4. Keep FX resilient to rerender/button loss
- Preserve fallback targeting when sell button reference becomes stale (market table fallback).
- Confirm particle/impact FX still fire when UI rerenders between items.

5. Maintain data correctness and non-FX behavior
- No changes to sell totals/profit/xp semantics.
- Keep one summary message at end (no per-item message spam).
- Keep reduced-motion behavior safe (skip/limit motion cleanly).

### Validation Checklist
- Bulk sell 5+ items:
  - each item visibly sells one-by-one,
  - each item shows particle FX (not just first/last),
  - each item clears from grid during its own sale step,
  - each item shows travel toward market target.
- Timing:
  - sequence is clearly faster than current behavior.
- FX reliability:
  - works from both desktop insight sell button and mobile farm action sell button.
- Regression:
  - single-item sell still matches expected particle + cash-travel behavior.
  - totals/profit/xp/goal stats remain correct.

### Risks / Notes
- Too much speed reduction can visually collapse sequence into a bulk-looking blur.
- Additional per-item FX can increase visual noise/perf cost; tune particle counts conservatively for bulk chains.

## Mobile Sell UX / FX Plan (No Implementation Yet)

### Current Mobile Status (Assessment)
- Mobile sell uses `#farm-action-button` (bottom dock) when farm panel is visible.
- Sell button is marked with `data-sell-action-button="true"` and routed into the same sell runtime as desktop.
- Pointer drag selection is handled via pointer events and currently supports bulk selection.
- Core click-clear guard already excludes sell-action buttons, which helps prevent immediate selection loss on tap.

### Mobile Gaps To Address
- During per-item rerenders, mobile action dock/button identity may change; FX target fallback works, but perceived destination can feel unstable.
- Mobile touch taps can re-trigger sell while batch is in flight unless explicitly guarded.
- Particle density and timing tuned for desktop may feel noisy or heavy on lower-end mobile GPUs.
- Animation path should remain readable when farm dock and market table are partially off-screen in portrait layouts.

### Mobile Implementation Plan
1. Add in-flight sell lock for touch UX
- Introduce a runtime `isSellBatchInFlight` guard.
- While active:
  - disable `#farm-action-button`,
  - ignore additional sell taps from both dock and insight buttons,
  - keep one active batch only.
- Re-enable controls after batch completion/failure.

2. Stabilize mobile animation target
- Prefer a stable target element priority on mobile:
  1. `#farm-action-button` if visible and enabled,
  2. market table container,
  3. fallback center of visible farm panel header/action region.
- Ensure target lookup is refreshed per item (resilient to rerender).

3. Mobile FX tuning profile
- Add mobile-specific FX tuning (when `body.mobile-layout` or coarse pointer):
  - slightly lower burst counts for bulk chains,
  - shorter/cleaner coin travel count caps for performance,
  - maintain readable one-by-one sequencing.
- Keep reduced-motion behavior unchanged and authoritative.

4. Preserve selection and dock continuity
- Ensure per-item rerender does not cause flicker/hide of `#farm-action-dock` while bulk sell is running.
- Keep button label/state stable during in-flight batch (e.g. “Selling... (n left)” optional).

5. Viewport-aware behavior
- If market target is off-screen on mobile, route destination to nearest visible fallback target to avoid “flying to nowhere” perception.
- Confirm behavior in both portrait and landscape.

6. QA instrumentation (temporary)
- Add temporary debug counters/log hooks for:
  - items sold in batch,
  - per-item animation completions,
  - dropped/skipped target lookups.
- Remove after verification.

### Mobile Validation Checklist
- iOS Safari + Android Chrome manual passes:
  - single sell via dock,
  - bulk sell via drag select + dock tap,
  - rapid repeated taps do not duplicate batch.
- Per-item sequence remains visible and smooth on mobile.
- Particles + coin travel fire per item without major frame drops.
- Sell destination remains visually understandable even if market table is not prominent onscreen.
- No regressions in desktop behavior.
