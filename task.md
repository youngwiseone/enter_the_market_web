Plan: Add farm tools (watering can, pickaxe, gloves) with tool-specific interactions for watering crops, mining tiles, and default selection.

Pre-check
- Confirm where grid interactions happen today (`renderMarket` click handler in `main.js`) and how grid tiles are currently unlocked (purchase flow via `purchaseGridSlot` + `getGridUnlockCost`).
- Verify where assets live (`resources/tools/*.png`) and whether any existing UI area can host the tool buttons (likely in `index.html` near the farm/grid panel).

Current state (main.js / index.html)
- Grid tiles are locked/unlocked via purchase: clicking a locked cell calls `purchaseGridSlot`, which checks cash + energy and marks `state.gridUnlocked`.
- Crops grow based on day count (`gridPlantedDay` + `growDays`), regardless of watering; there is no water state in storage or render.
- Grid rendering lives in `renderMarket`; it creates the 9×9 cells, renders crop sprites, and handles click actions (purchase, plant, harvest).
- No tool UI or tool mode exists; selection is driven by selected shop item and cursor changes.
- Tool assets and crack sprites exist in `resources/tools/` (glove, pickaxe, watering can, water overlay, crack1-10).

Goal
- Replace grid tile purchasing with mining: pickaxe tool mines locked tiles, 10 hits to unlock 1 tile.
- Add watering: only watered crops progress/grow, and watering costs 1 energy per tile.
- Add gloves tool as the default selection mode (plant/harvest), and allow toggling between tools via square 30×30 buttons using the provided PNGs.

Proposed design
1) Tool state + persistence
   - Add `state.activeTool` (e.g., `"glove" | "watering" | "pickaxe"`) with `"glove"` default.
   - Add `state.gridWateredDay` (or boolean + day) to track which tiles are watered for the current day.
   - Add `state.gridMiningHits` (0–10) to track mining progress per locked tile.
2) UI for tools
   - Insert a small toolbar near the farm grid (likely in `index.html` under the Farm title) with three square buttons using `resources/tools/*.png`.
   - Visual state: selected tool button appears pressed/active; update cursor for tool (watering/pickaxe/glove).
3) Watering behavior
   - Watering tool: clicking a planted tile consumes 1 energy and marks watered for that tile/day.
   - Render `water.png` as a transparent overlay atop a planted tile when watered.
   - Growth logic: when computing plant stage, only advance days when watered (e.g., count watered days since planted or only increment a per-tile watered count).
   - Clear watering each new day (e.g., `gridWateredDay` vs current day).
4) Mining behavior
   - Replace `purchaseGridSlot` flow for locked tiles with mining: pickaxe clicks increment hits and show `crack1-10.png` overlay to reflect progress.
   - On hit 10, unlock the tile (`gridUnlocked[i] = true`), reset mining hits, and update UI.
   - Consume energy per hit.
5) Gloves/default behavior
   - Gloves tool uses current click logic: plant if unlocked + selected item, harvest if grown, otherwise show messages.
   - Locked tiles do nothing unless pickaxe is active.

Implementation steps
1) Add new state fields (`activeTool`, `gridWateredDay`, `gridMiningHits`) in `initialiseState`, `saveState`, and reset paths in `resetGame`.
2) Build tool toolbar UI in `index.html` and add styling rules in the existing `<style>` block for 30×30 tool buttons and active state.
3) Add tool selection handlers in `main.js`, including cursor updates and a helper to set active tool.
4) Update `renderMarket` to:
   - Render watering overlay and mining crack overlay based on new state arrays.
   - Branch click handling by `activeTool` (watering/mining/gloves).
5) Update crop growth calculation so only watered crops progress; add per-day watering reset in `nextDay` (or equivalent day-advance function).
6) Remove or deprecate purchase-related grid unlock logic and adjust messages to match mining/watering interactions.

Question around implementation - provide questions, user will provide answers:
1) Watering growth rule: should a crop advance only on days it was watered (e.g., require watering each day to advance 1 day), or should watering apply a one-time boost/flag until harvest? Crops only advance on days watered.
2) Mining energy cost: is it 1 energy per hit (10 total per tile) or 10 energy per tile in a single action? 1 energy per hit.
3) When the pickaxe is active, should clicks on unlocked tiles be ignored or fall back to gloves behavior? Ignore clicks on unlocked tiles.
4) Should watering be allowed on empty unlocked tiles, or only on tiles with a planted crop? Water should be allowed on empty unlocked tiles.
