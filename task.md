
# Mobile Touch Blue Flash Investigation

## Symptom
- On mobile touch, tapping farm grid cells causes a noticeable blue flash across the farm area.
- In the market tab, tapping to unselect/reselect items also shows a blue flash (less intense than farm).
- Desktop does not show this behavior.

## Likely Cause
- Default mobile browser touch highlight is active (`-webkit-tap-highlight-color` fallback).
- The farm interaction is bound at the `#grid` level (`pointerdown` in `js/ui/farm_pointer_bindings.js`), so the highlight can appear over most/all of the grid area.
- Market rows are dynamically clickable `<tr>` elements (`click` handlers in `js/ui/render_market.js`) and can also receive native tap highlight feedback.
- No explicit tap-highlight suppression is currently defined in `index.html` styles.

## Why This Matches The Bug
- The issue is touch-only and not reproducible on desktop pointer input.
- The highlight color described is browser-default blue.
- It appears strongest where the tappable target area is largest (farm grid).

## Proposed Fix (Do Not Implement Yet)
1. Add mobile-safe tap-highlight suppression CSS for interactive surfaces:
   - `#grid`, `.grid-cell`, `.market-row`, `.tool-button`, `.tab-button`, `.button`, `button`
   - Set `-webkit-tap-highlight-color: transparent;`
2. Add `touch-action` rules tuned by surface:
   - Farm grid interaction surface: `touch-action: none;` (prevents browser gesture feedback from competing with pointer-driven gameplay interactions).
   - Scrollable market container keeps `touch-action: pan-y;` (already present) so vertical scrolling remains natural.
3. Optionally add a scoped `user-select: none;` for tappable row surfaces if any text-selection flash remains during rapid taps.

## Validation Plan After Fix
- Mobile farm tab:
  - Tap, drag, and repeated taps on grid cells: no blue flash.
  - Mining/watering/selection behavior unchanged.
- Mobile market tab:
  - Tap item rows to select/unselect: no blue flash.
  - Vertical scrolling in market/store/goals still works.
- Desktop:
  - No interaction regressions.

## Target Files For Later Patch
- `index.html` (primary CSS changes)
- (No JS behavior change expected unless follow-up is needed)

---

# Mobile Touch Hold + Drag Investigation

## Symptom
- On mobile, drag workflows appear unreliable or non-functional:
  - Drag-planting multiple seeds
  - Drag-watering multiple tiles
  - Drag-selecting multiple grown crops for bulk sell

## Current Interaction Design (What Code Is Doing)
- Drag behavior is implemented via Pointer Events, not dedicated Touch Events:
  - `pointerdown` on `#grid` starts interaction and applies first action.
  - `pointermove` on `document` applies actions for newly crossed cells.
  - `pointerup`/`pointercancel` ends drag.
- Relevant files:
  - `js/ui/farm_pointer_bindings.js`
  - `js/controllers/grid_interaction_controller.js`

## Likely Cause
- The farm grid currently has no explicit `touch-action` override.
- On mobile, browser gesture handling (scroll/pan/selection) can compete with Pointer Event streams and trigger early `pointercancel`, which terminates drag processing.
- This aligns with the separate blue-flash symptom (both are native touch feedback/gesture defaults leaking through).

## Secondary Risk
- Runtime currently depends on Pointer Events only for drag.
- If a specific mobile browser/webview has partial Pointer Event behavior, drag can degrade without fallback.

## Proposed Fix Plan (Do Not Implement Yet)
1. Apply CSS interaction guards on the farm grid surface:
   - `#grid { touch-action: none; }`
   - `#grid`, `.grid-cell`, `.market-row`, and tappable controls get `-webkit-tap-highlight-color: transparent;`
2. Re-test drag flows on mobile:
   - Plant drag across multiple empty unlocked cells
   - Water drag across multiple planted unlocked cells
   - Glove drag across multiple sellable crops to form bulk selection
3. If drag is still unreliable on target device/browser:
   - Add a scoped fallback path for touch streams when Pointer Events are unavailable or unstable (`touchstart`/`touchmove`/`touchend`), mapped to existing `applyGridActionForIndex(...)`.
   - Keep fallback isolated to farm grid bindings to avoid controller duplication.

## Validation Checklist After Fix
- No blue flash on tap in farm/market.
- No accidental page/section panning while dragging over farm grid.
- Drag actions process each crossed tile once per drag gesture.
- Bulk selection drag works with glove when no shop item is selected.
- Normal tap behavior still works.
