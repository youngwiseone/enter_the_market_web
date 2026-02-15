# Daily Roll Modal Redesign Plan (Pre-Implementation)

## Goal
Make the market fatigue / daily roll UI feel more like a compact slot machine on both desktop and mobile, while keeping controls visible and the outcome easy to read.

## Problem
- Current mobile layout can become too tall and clip important controls/buttons.
- Three stacked reels on mobile read more like a list than a slot machine.
- Desktop and mobile currently present different reel patterns, which weakens consistency.

## Confirmed Direction
1. Keep `3` roll outcomes logically, but present them through one compact sequential reel viewport on both mobile and desktop.
2. Put all outcome explanation in a concise summary strip at the bottom.
3. Reduce total modal height and keep the continue button always visible.
4. Use medium spin speed pacing.
5. Add a small particle burst each time the reel lands.
6. Simplify fatigue wording in the main line and move detailed explanation to hover.

## UX Plan
1. Use a single reel stage for both mobile and desktop.
2. Animate 3 sequential spins in the same reel window at medium pacing:
   - Spin 1 settles -> quick flash/store result.
   - Spin 2 settles -> quick flash/store result.
   - Spin 3 settles -> quick flash/store result.
3. On each settle, trigger a brief landing burst effect in the reel area.
4. Show final result row at bottom as Option A chips/icons (e.g. `Tomato +8%`, `Corn -4%`, `Potato +12%`).
5. Keep fatigue text above summary with simplified wording (detail in hover).
6. Keep one `Continue` button pinned at bottom of panel.

## Layout Constraints
- Mobile modal max height target: `<= 82dvh`.
- Reel window target height: ~`120-140px`.
- Summary area target height: ~`48-72px`.
- Bottom action row always visible (no hidden continue button).
- Desktop should keep this same single-reel flow, scaled up in width only.

## Technical Plan
1. CSS (`index.html`):
   - Add mobile-first compact mode for `.daily-roll-panel`.
   - Replace stacked reel layout with one shared single reel viewport layout for all breakpoints.
   - Tighten paddings/gaps and set safe max-height.
2. JS (`main.js`):
   - Reuse existing roll data (`rollResult.picks`) but render into one mobile stage.
   - Sequence the 3 spins in one track for both mobile and desktop at medium speed.
   - Add a brief particle burst/effect on each settle.
   - Build bottom summary as Option A chips from final picks.
   - Simplify displayed fatigue copy; provide fuller text via hover (`title` / tooltip).
3. Accessibility:
   - Keep reduced-motion behavior (fast settle/no heavy animation).
   - Ensure keyboard continue still works.

## Acceptance Criteria
1. On `390x844` and `360x800`, full modal including Continue is visible without clipping.
2. Mobile and desktop both show one slot-machine style sequential reel view, not 3 stacked reels.
3. All 3 roll outcomes remain visible in bottom summary.
4. Each reel landing has a visible but brief burst effect.
5. Fatigue line is simplified, with detail discoverable on hover.
