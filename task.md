
# Mobile UI Stabilization Plan (No Implementation Yet)

## Problem Summary
- On smaller/taller mobile screens, content is either scaled too small or cut off.
- Confirmed risk areas in current implementation:
  - `js/ui/layout_controller.js` reserves a fixed mobile side area (`mobileSideReserve`) that can over-shrink the grid on certain viewports.
  - `index.html` mobile layout still uses a mixed grid/side structure that is not optimized for narrow portrait devices.
  - Messages are currently a separate panel/tab and not persistently positioned near primary gameplay on mobile.

## Recommended Direction
- Use a mobile-first single-column flow with a fixed bottom tab bar.
- On mobile, treat major sections as pages/tabs:
  - `Farm` (new mobile tab)
  - `Market`
  - `Shop`
  - `Goals`
- Keep messages visible on mobile above the farm grid (compact feed), not side-by-side.
- Keep desktop/tablet-large layout behavior unchanged.

## Why This Approach
- Eliminates side-panel competition for vertical space on narrow devices.
- Makes primary interaction (farm grid + message context) continuously accessible.
- Avoids fragile “fit everything at once” behavior that fails on edge aspect ratios.

## Scope (Planned)

### Phase 1: Mobile Layout Foundation
- Add mobile-specific layout mode (`body.mobile-layout` class) driven by viewport conditions.
- Move to single-column stack on mobile:
  - HUD/top stats
  - compact messages strip
  - active tab content
  - fixed bottom nav
- Keep existing desktop CSS and structure as default.

### Phase 2: Navigation Model for Mobile
- Extend main tab model for mobile with `farm` tab.
- Keep existing `market/store/goals/messages` logic for desktop.
- On mobile:
  - show `farm`, `market`, `store`, `goals` in bottom nav
  - hide standalone messages tab
  - keep feedback/review action separate from nav tabs

### Phase 3: Messages Placement on Mobile
- Add/repurpose a compact messages container directly above grid when mobile + farm tab.
- Reuse existing chat log source/state; render a recent subset in compact mode.
- Keep full message history panel available from profile tap or optional “expand” affordance.

### Phase 4: Responsive Grid Sizing Fix
- Replace current mobile reserve heuristic in `updateGridSizeAction` with deterministic sizing:
  - derive available height from actual visible container space
  - account for fixed bottom nav + safe-area insets
  - enforce min/max grid sizes without forcing tiny scale
- Preserve square grid and interaction hit area.

### Phase 5: Shop/Goals Mobile Readability
- Convert store internals away from float-based layout on mobile (`#store-tabs` / `#store-content`).
- Ensure each tab page scrolls independently with stable height and no clipping.

## Files Expected to Change (When Implementing)
- `index.html` (tab controls, mobile nav container, optional compact messages block)
- `js/ui/tab_controller.js` (mobile tab behavior and visibility rules)
- `js/ui/layout_controller.js` (grid sizing and viewport mode handling)
- `js/ui/render_root.js` (conditional mobile render orchestration if needed)
- `js/ui/messages_controller.js` (compact feed support)
- CSS in `index.html` (mobile media rules, bottom nav, spacing/safe-area)

## Target Device Classes / Viewports
- Small phone portrait (Galaxy S8 class): ~`360x740` CSS px
- Fold narrow portrait: ~`320-360` width class
- Fold open portrait/tablet-narrow: ~`600-900` width class
- Landscape phone: ~`640x360` class (degrade gracefully, no cutoff)

## Acceptance Criteria
1. No horizontal overflow on target mobile viewports.
2. No clipped primary controls (farm tools, rest button, bottom tabs).
3. Farm grid remains playable (tap targets usable, no excessive downscaling).
4. Messages are visible above grid on mobile farm view.
5. Market/Shop/Goals each fully usable via mobile tabs with scrollable content.
6. Desktop behavior remains functionally unchanged.

## Rollout / Risk Control
- Implement behind a mobile-layout feature flag/class first.
- Ship in small commits by phase.
- Manual smoke test after each phase:
  - plant/water/mine/harvest
  - rest/day modal flows
  - shop/goals navigation
  - message visibility and history access

## Out of Scope (For This Pass)
- Visual redesign of desktop layout.
- New gameplay systems.
- Data/content schema changes.
