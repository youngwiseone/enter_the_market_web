
## Suggestions: Make The Game Feel More Alive (No Implementation Yet)

### Interaction / Juice (High impact, low-medium effort)

- Add tiny hover feedback on grid cells and market rows (subtle scale/brightness) so the UI feels more responsive before click.
- Add context-specific placement previews for utilities/fertilisers (valid target glow vs invalid target tint) while an item is selected.
- Add a short fertiliser application burst (color-tinted by fertiliser type) so stacked applications feel satisfying.
- Add a small day-start banner/toast with weather + one market highlight (e.g. "Rain today" / "Tomato is discounted") to make each day feel distinct.
- Add ambient farm motion details (occasional leaf sway, sparkle on grown crops, sprinkler drip idle animation when selected) using low-frequency animation only.
- Add richer harvest sell feedback chains (e.g. combo text for sequential sells or "great timing" when selling into premium prices).
- Add more NPC chatter variation tied to actual state (low cash, many ready crops, first fertiliser use, first sprinkler day, etc.) so messaging feels reactive.

### UX / Clarity Improvements (nice-to-play)

- Add a small legend/help chip for rarity colors and fertiliser effects in the insight panel or guidance panel.
- Show utility unlock countdown in the disabled Utility tab tooltip (e.g. "Unlocks at Level 10").
- Show quick inline reason on blocked actions near the tile/cursor (not just chat strip), especially for fertiliser caps and locked utilities.
- Add optional compact action history in day summary (planted/watered/harvested/fertilised counts) to reinforce progress.
- Add a "newly unlocked" highlight pulse on utility rows the first time the player opens the Utility tab after level unlock.

### Progression / Systems (small additions that add life)

- First-use tutorials for each fertiliser type (one-time tooltip/message) explaining what each does in plain terms.
- Tiny cosmetic progression rewards tied to system mastery (e.g. use fertiliser X times, refill sprinkler Y times) for soft goals beyond cash.
- Add occasional micro-events in day summary ("Best crop today", "Most profitable harvest", "Water saver"), purely informational but rewarding.
- Add weather-specific ambient changes beyond rain (windy visual sweep, clear-day sun shimmer) with minimal gameplay changes.

## Quick Win Performance Enhancements (No Implementation Yet)

### Render Path / DOM (highest value)

- Reduce full `renderAll()` calls after small actions where possible (fertiliser apply, selection changes, some utility purchases) and use targeted panel/grid refreshes.
- Batch DOM writes in heavy render paths (`render_market.js`) using `DocumentFragment` for large table/grid updates where not already used.
- Avoid rebuilding unchanged market subtab tables every render when only grid state changed (cache active market table view render inputs and skip table re-render if unchanged).
- Throttle/debounce expensive resize/layout recalculations during rapid interactions or window resizing.

### Data Access / Computation

- Pre-index `state.items` by `id` (e.g. `Map`) for hot paths to avoid repeated `find(...)` calls throughout render/controllers.
- Pre-index `state.shop` entries by `itemId` during render/controller cycles that repeatedly look them up.
- Reuse computed growth/insight data within a single render pass instead of recalculating per cell + per panel where possible.
- Cache rarity-weight transforms for quality fertiliser by stack count (`0..N`) during a session to avoid repeated recomputation.

### FX / Animation

- Gate non-essential effects more aggressively on mobile / reduced-motion / low-perf mode (fewer particles, shorter lifetimes).
- Add a simple runtime perf mode toggle (Normal / Reduced FX) for users with slower machines.
- Cap simultaneous transient particles/bursts during bulk sell sequences to avoid spikes.

### Persistence / Save Frequency

- Coalesce multiple immediate `saveState()` calls during tightly grouped actions (where safe) into one save at the end of the action sequence.
- For UI-only state changes (selection, panel toggles), ensure no persistence writes are triggered.

## What I Would Prioritise First (Recommended Order)

1. Utility/placement target preview glow + invalid tint (big feel improvement).
2. More targeted renders (fewer `renderAll()` calls on simple actions).
3. Item/shop lookup maps for hot paths.
4. Day-start banner (weather + market highlight).
5. New unlock highlight pulse in Utility tab.
6. Optional reduced-FX mode toggle.
