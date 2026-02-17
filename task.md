
# Task Plan: Keep Current Reel, Add Blur-Speed Emit Flow

## Goal
Keep the existing reel UI and end-stop behavior, but make high roll counts feel fast and satisfying:
- reel ramps into blur speed
- emits item + `+/- %` as particles during spin
- chips keep a live running total per item
- reel still lands on the final item at the end

## Product Direction
- Do not replace with a wheel; keep current reel structure.
- Total sequence target: about `5000ms` regardless of roll count.
- Emission cadence scales by roll count:
  - `emitIntervalMs = 5000 / rollCount`
  - at 20 rolls => 250ms per emitted hit
- Continue using consolidated chips as final scoreboard.
- Merge day summary into the same roll modal, displayed above the reel, so players do not click through a second modal each day.

## Roll Count Model (for this feature)
- Requested progression:
  - `1-4 => 1 roll`
  - `5-9 => 2 rolls`
  - `10-14 => 3 rolls`
  - ...
  - `95-99 => 20 rolls`
- Formula:
  - `if level <= 4 => 1`
  - else `Math.min(20, Math.floor((level - 5) / 5) + 2)`

## Technical Approach

### 1) Roll Generation Count
- Add/route `rollCount` from player level into daily roll generation.
- Replace hardcoded 3 picks with dynamic pick count.
- Keep existing duplicate stacking logic (same item in same day stacks correctly).

### 2) Reel Animation (Keep Existing Reel)
- Refactor `showDailyMarketRollModalAction` into timeline phases on same reel:
  - accel into blur
  - sustain blur while emitting hits
  - decel to final item
- While blur is active:
  - emit current pick hit at interval
  - play two lightweight particles near reel:
    - item sprite burst
    - floating signed percentage (`+5%`, `-10%`, etc.)
  - update one consolidated chip per item (already upserted behavior)
- End sequence by rendering final pick in reel center (same landing intent as now).

### 3) Particle/FX Layer for Roll Emits
- Reuse local modal DOM effects (no heavy new system required):
  - add temporary `img` particle nodes for item burst
  - add temporary text nodes for signed percent burst
  - auto-remove on animation end
- Color percent particle by trend:
  - positive green
  - negative red

### 4) Chip Behavior
- Keep current chip consolidation:
  - one chip per item
  - live total % and live stack `xN`
- Keep current readability tweaks:
  - `x2` slightly larger chip
  - `x3+` larger chip
- stack color matches positive/negative trend

### 5) Combined Day Summary + Roll Modal
- Render day summary block at top of daily roll modal (above fatigue/reel section).
- Summary fields kept:
  - items sold
  - sales total
- Summary fields removed:
  - cash delta
  - top sale
  - next opportunity
- Style `sales total` value in green emphasis (reuse prior positive-tone treatment used for cash delta readability).
- Single modal flow:
  - open modal with day summary visible
  - play roll animation
  - show final accumulated chips
  - one confirm action to close and continue
- Remove/retire separate day-summary modal invocation in next-day flow.

### 6) Accessibility + Safety
- `prefers-reduced-motion`:
  - reduce particle count and movement distance
  - keep short, readable transitions
- Keep modal focus/ARIA behavior intact.
- Add explicit skip/confirm interaction:
  - During spin: any key press or click skips animation and reveals full final results instantly.
  - After skip (or natural completion): require confirm to advance (`Continue` button or `Space` key).
  - Ignore accidental repeat input in the same frame with a simple input lock/debounce.

## Files Likely Touched
- `js/sim/daily_roll.js`
- `js/ui/daily_roll_modal.js`
- `index.html` (reel blur + particle CSS)
- Optional: `js/sim/constants.js` for timing tunables

## Implementation Steps
1. Add dynamic roll count by level in roll generation.
2. Convert modal roll playback from per-stop loop to timeline emit loop on current reel.
3. Add item + signed-percent particle emit helpers in modal runtime.
4. Integrate day summary panel into daily roll modal layout above the reel.
5. Update next-day controller flow to stop opening a second day-summary modal.
6. Keep final reel landing on last pick.
7. Add input-state handling for skip-then-confirm flow.
8. Tune timings/particle counts for 1, 5, 10, 20 roll scenarios.
9. Validate desktop/mobile and reduced-motion behavior.

## Acceptance Criteria
- High levels can process up to 20 rolls within ~5 seconds.
- Reel visibly ramps to blur, emits continuously, then lands on last item.
- Each emitted hit shows item and signed percent particle feedback.
- Chips show accurate accumulated totals and stack count.
- Duplicate item rolls stack correctly (no same-item cancellation bug).
- UI remains readable on desktop/mobile.
- Pressing any key or clicking during spin skips to full results.
- After results are fully shown, only `Continue` click or `Space` proceeds to next modal/state.
- Day summary appears in the same modal above the roll section.
- End-of-day requires only one modal confirm, not two separate modal dismissals.
