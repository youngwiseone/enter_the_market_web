Plan: Overview of the task we are implementing.

Pre-check
- confirm the change is actually needed in current code (identify existing logic that already covers it).

Current state (main.js)
- Items are defined in `DEFAULT_DATA.items` and loaded from `data/items.json` without any rarity metadata.
- Grid rendering uses plant stage images and a single overlay image (water/cracks). No rarity border or holo effect exists on grown plants.
- Harvest currently sells at a flat 1.25x of shop price, regardless of any item metadata.

Goal
- Add a rarity field to item definitions (common/uncommon/rare/mythic).
- When a plant is fully grown, randomly assign a rarity and render a 1px border around the plant based on rarity color.
- Border colors: common = white, uncommon = silver, rare = gold, mythic = purple effect.
- Rarity affects sell price when harvesting a fully grown plant.
- Implement a �holo�/purple effect for mythic similar to Balatro or Minecraft enchanted items.
- Ensure items without rarity default cleanly to common.

Proposed design
1) Data + defaults
   - Extend item schema with a `rarity` string (base/default for the item type).
   - Update `DEFAULT_DATA.items` and `data/items.json` with `rarity` for existing items.
   - Normalize missing/unknown rarity to `common` during load.
2) Rarity assignment (runtime)
   - When a plant reaches fully grown, assign a rarity roll and persist it per grid cell (new `gridRarity` array keyed by cell index).
   - Use configured probability weights to pick rarity.
3) Visuals (grid)
   - Apply a 1px border around fully grown plants using rarity color.
   - For mythic, add a purple holo overlay (animated gradient + shimmer) layered above the plant sprite.
4) Pricing
   - Add rarity multipliers for harvest sell price.
   - Apply multiplier on harvest only when plant is fully grown and has a rolled rarity.

Implementation steps
1) Update `data/items.json` and `DEFAULT_DATA.items` to include `rarity`.
2) Add a rarity normalization helper and use it in item loading/merging.
3) Add `gridRarity` state to persist per-cell rarity and migrate defaults.
4) Assign rarity when a plant becomes fully grown (store in `gridRarity`).
5) Update grid render logic to add rarity border/overlay on fully grown plants.
6) Add CSS rules in `index.html` for rarity colors and the mythic purple holo effect.
7) Update `harvestPlant()` to apply rarity multiplier to sell price.
8) Bump `main.js` cache-bust query string in `index.html`.

Question around implementation - provide questions, user will provide answers:
1) What are the roll chances for each rarity (common/uncommon/rare/mythic)? Answer: common 50%, uncommon 30%, rare 15%, mythic 5%
2) Confirm rarity multipliers for sell price (values or formula)? Answer: common 1.2x, uncommon 1.5x, rare 2x, mythic 3x
