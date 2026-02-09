# Layout + Mobile Plan

## Goal
Keep the farm grid pinned to the top and keep messages pinned to the bottom as a persistent overlay, while the market/store area is scrollable behind them. Ensure this behavior works in mobile portrait on both iPhone and Android, with readable but compact font sizing.

## 1) Restructure layout behavior (CSS first)
1. Convert `body` into a viewport-bounded container:
   - `min-height: 100dvh;`
   - `overflow: hidden;`
   - Add safe-area padding support using `env(safe-area-inset-*)`.
2. Keep `#market-layout` as the root app surface and set it to:
   - `height: calc(100dvh - safe-area paddings);`
   - `position: relative;`
3. Pin top and bottom surfaces:
   - `#farm-panel`: `position: sticky; top: 0; z-index: 20;`
   - `#messages-panel`: `position: sticky; bottom: 0; z-index: 30;`
   - `#next-day`: keep visually attached to bottom zone (same row as messages on desktop, stacked near messages on mobile).
4. Make center content scroll independently:
   - `#market` becomes the vertical scrolling region.
   - `#market-table-container` keeps `overflow-y: auto` with a max height derived from viewport minus sticky regions.
   - When Store tab is active, `#store` gets the same scroll behavior as market table.

## 2) Mobile-first grid + message persistence
1. Replace current mobile detection (`window.innerWidth < window.innerHeight`) with layout breakpoints + coarse pointer checks.
2. Mobile portrait (`@media (max-width: 900px)`) behavior:
   - Grid stays at top and remains visible.
   - Messages remain fixed/sticky at bottom with a stable minimum height.
   - Market/store becomes the only scrolling block between top and bottom sticky zones.
3. Ensure overlays do not hide content:
   - Add bottom padding to scrollable market/store equal to messages height.
   - Add top spacing equal to farm panel height if needed.

## 3) Font sizing strategy (iPhone + Android)
1. Remove oversized coarse-pointer values currently set in `@media (hover: none) and (pointer: coarse)` (for example: `2.4rem`, `3.0rem`, `150px` controls).
2. Introduce scale tokens in `:root`:
   - `--font-ui`, `--font-table`, `--font-title`, `--font-button`.
3. Use `clamp()` for stable cross-device sizing:
   - Example ranges:
     - Body/UI: `clamp(13px, 1.8vw, 16px)`
     - Table: `clamp(12px, 1.6vw, 15px)`
     - Titles: `clamp(14px, 2.2vw, 18px)`
     - Primary action: `clamp(14px, 2.4vw, 20px)`
4. Apply to:
   - `.panel-title`, `.market-stats`, `.zebra-table th/td`, `#next-day`, `.tab-button`, `.tool-button`.
5. Keep touch targets accessible:
   - Minimum 44px control hit size.
   - Scale icons independently from text (do not force giant font size to get touchability).

## 4) JS updates required
1. Update `updateGridSize()` in `main.js`:
   - Calculate available height using actual sticky heights (`#farm-panel`, `#messages-panel`, `#next-day`) and safe-area offsets.
   - Avoid early return that sets grid only from `window.innerWidth`.
   - Grid should be bounded by both width and remaining height between sticky top/bottom zones.
2. Re-run sizing on:
   - `resize`
   - `orientationchange`
   - tab changes between Market/Store
   - after message panel height changes (new message/avatar swap).

## 5) Device compatibility checks
1. Add viewport meta if missing:
   - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
2. Test matrix:
   - iPhone Safari portrait + landscape
   - Android Chrome portrait + landscape
   - Narrow desktop responsive mode (~360px to 430px widths)
3. Verify:
   - Grid always visible at top without being pushed off.
   - Messages always visible at bottom.
   - Market/store can fully scroll and no controls are hidden behind overlays.
   - Fonts are readable without oversized UI.

## 6) Acceptance criteria
1. In mobile portrait, user always sees farm tools/grid at top and messages at bottom.
2. Store/market content scrolls between those fixed regions.
3. No overlap blocks interaction with table rows, tabs, or Next Day button.
4. Font sizes are consistent and legible on both iPhone and Android without giant scaling.
