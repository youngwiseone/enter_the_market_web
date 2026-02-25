# Fertiliser Feature Plan (Planning Only)

## Summary

Add gameplay support for the 3 fertiliser items already in `data/items.json`:

- Water Retention Fertiliser (`id: 33`)
- Speed Grow Fertiliser (`id: 34`)
- Quality Fertiliser (`id: 35`)

This is a plan only. Do not implement yet.

## Player-Facing Rules (Finalized)

- Fertiliser can only be applied to an already placed plant.
- Fertiliser cannot be placed on an empty tile.
- Different fertiliser types can coexist on the same plant.
- The same fertiliser type can stack on the same plant.
- Stacks are additive only (never multiplicative).
- Clicking a fertilised plant shows current fertiliser effects in the info/insight panel.
- Fertiliser data does not persist beyond the plant lifecycle (once harvested/sold/removed with plant).

## Effect Rules (Finalized)

### Speed Grow Fertiliser

- Effect: `-1` growth day per stack.
- Stacking: linear (`x2 = -2 days`, etc.).
- Cap: cannot reduce beyond the useful limit for that plant.
- Maxed behavior: block adding more fertiliser.
- Required message: `Plant grows tomorrow!`

### Water Retention Fertiliser

- Effect: `+1` day staying watered per stack.
- Stacking: linear (`x2 = +2 days`, etc.).
- Cap: cannot outlast the plant's remaining growth lifecycle.
- Maxed behavior: block adding more fertiliser.
- Message: player-style copy TBD.

### Quality Fertiliser

- Effect: shifts rarity weighting upward by `5%` per stack.
- Remove weight from lower tiers in order: `common` -> `uncommon` -> `rare`.
- Reallocate that weight to higher tiers only.
- While `common` still has weight, `uncommon`, `rare`, and `mythic` all become more likely.
- After `common` is exhausted, continue removing from `uncommon`, then `rare`.
- Cap: maximum is `100% mythic`.
- Maxed behavior: block adding more fertiliser.
- Required message: `Already max rarity!`

### Quality Weighting Constraints

- Per stack, remove `5%` total from the lowest available buckets in order.
- Reallocate the same `5%` upward only.
- Total probability must remain `100%`.
- Clamp each rarity bucket to `[0%, 100%]`.
- Apply as a transform to the base rarity table (do not mutate canonical base values).

## Invalid/Maxed Feedback (Finalized)

### Messages (required)

- Empty tile target: `Can only fertilise plants already placed`
- Speed Grow maxed: `Plant grows tomorrow!`
- Quality maxed: `Already max rarity!`
- Water Retention maxed: player-style copy TBD

### Visual Feedback (required)

- Invalid target or maxed fertiliser attempts should show a clear tile-level visual tell.
- Suggested implementation: grid cell shake (`fx` class or similar).

## Data / State Plan

### Storage location

Store plant fertiliser state in `gridPlacedMeta[cellIndex]` (extend existing per-tile metadata).

Reasons:

- `gridPlacedMeta` already persists.
- It is already cleared in harvest/sell/remove flows.
- It avoids adding a new top-level grid array.

### Proposed meta shape (conceptual)

```js
{
  fertiliser: {
    stacks: {
      waterRetention: 0,
      speedGrow: 0,
      quality: 0
    }
  },
  // existing infrastructure meta remains supported (e.g. sprinkler)
}
```

Guidelines:

- Store stack counts only.
- Compute resolved effects at runtime.
- Extend normalizers to support legacy sprinkler meta + new fertiliser meta together.

## Technical Plan (Implementation Targets)

### 1. Fertiliser Helper Module (single source of truth)

Create a small helper/controller module (likely under `js/controllers/`) to handle:

- fertiliser item identification (`id` -> fertiliser type key)
- fertiliser meta normalization
- stack application to plant meta
- cap validation before spending cash/energy/consuming inventory
- resolved effect summary for UI + simulation
- quality rarity-weight transform

Suggested helper functions:

- `getPlantFertiliserStacks(state, cellIndex)`
- `getPlantFertiliserEffectsSummary(state, cellIndex)`
- `canApplyFertiliserToPlant(...)`
- `applyFertiliserToPlant(...)`
- `transformRarityWeightsForQualityFertiliser(...)`

### 2. Placement / Apply Flow Changes

#### `js/controllers/grid_controller.js` (shop purchase + apply)

Add fertiliser-specific behavior:

- If selected item is fertiliser and target tile has a plant:
  - validate cap first
  - if valid: spend resources and apply stack
  - if invalid/maxed: do not spend resources, show message + visual feedback
- If selected item is fertiliser and target tile is empty:
  - reject with `Can only fertilise plants already placed`
  - play visual feedback

#### `js/controllers/grid_slot_controller.js` (`placeItemOnGridAction`) (inventory apply)

Mirror the same fertiliser rules when applying from inventory:

- apply only to existing plants
- validate cap before consuming inventory
- reject empty tile target
- reject maxed attempts

#### `js/controllers/grid_interaction_controller.js` (pointer routing)

Update interaction routing so fertiliser uses the apply path:

- Occupied plant + selected fertiliser -> route to apply action (not just select tile)
- Empty tile + selected fertiliser -> route to invalid-target feedback
- Preserve current behavior for non-fertiliser items

## UI Plan (Info / Insight Panel)

Target modules:

- `js/ui/market_insight_data.js`
- `js/ui/render_market_insight.js`

Changes:

- Include fertiliser stacks/effects in `getSelectedGridItemInsightDataAction(...)` for plant tiles.
- Show fertiliser info only while the tile contains a plant/crop.
- Do not carry fertiliser info into harvested inventory items.

Suggested display content:

- summary chip: `Fertiliser: Water Retention x2, Speed Grow x1`
- effect chips/rows:
  - `Stays watered: +2 days`
  - `Growth reduction: -1 day`
  - quality summary (e.g. transformed rarity weights or concise bonus text)

## Simulation Hook Plan (Phase-In)

### Water Retention

Likely integration points:

- `js/controllers/farm_actions.js`
- `js/controllers/day_controller.js`

Goal:

- respect extra watered duration from fertiliser stacks.

### Speed Grow

Likely integration points:

- `js/controllers/growth_runtime_controller.js`
- possibly `js/controllers/farm_actions.js`

Goal:

- reduce effective growth time / remaining days using additive stacks.

### Quality

Likely integration points:

- `js/controllers/growth_runtime_controller.js`
- and/or `js/sim/rarity.js`

Goal:

- apply rarity-weight transform before final rarity roll.

## Persistence / Compatibility Plan

Main work:

- extend farm meta normalization to support fertiliser metadata in `gridPlacedMeta`
- preserve compatibility with legacy saves (`null` and existing sprinkler meta)
- allow mixed meta objects

Files to check:

- `js/state/farm_state.js`
- `js/state/state_initializer.js`
- `js/content/fallbacks/default_data.js` (only if default assumptions change)

## Cleanup Behavior (Verify During Implementation)

Existing flows already clear `gridPlacedMeta[cellIndex]` in harvest/sell/remove paths.

Expected outcome:

- fertiliser state is removed with the plant
- no fertiliser data survives into harvested items

## Messaging / Content Plan

Add message IDs (preferred) in `data/messages.json` and align fallback defaults if needed for:

- fertiliser applied
- fertiliser stacked
- invalid fertiliser target
- speed maxed
- water retention maxed
- quality maxed

Keep player-style wording aligned with existing messaging tone.

## Implementation Sequence (Recommended)

1. Add fertiliser helper module + item/type mapping + cap validation logic.
2. Update `grid_interaction_controller` to route fertiliser use correctly.
3. Update `grid_controller` and `grid_slot_controller` apply flows (including invalid/maxed feedback without spending resources).
4. Add UI insight data + rendering for fertiliser effects on plants.
5. Add messages + visual feedback hook (cell shake).
6. Add gameplay effect hooks (water retention, speed grow, quality), one at a time.
7. Smoke test + save/reload verification.

## Validation Checklist (When Implementing)

1. Attempt fertiliser on empty tile -> blocked with `Can only fertilise plants already placed` + visual feedback.
2. Apply fertiliser to growing plant -> stack added, insight panel updates.
3. Apply same fertiliser again -> additive stack increase only.
4. Apply different fertiliser type -> coexistence works.
5. Attempt Speed Grow beyond useful cap -> blocked with `Plant grows tomorrow!` + visual feedback.
6. Attempt Water Retention beyond useful cap -> blocked with water-max message + visual feedback.
7. Attempt Quality beyond `100% mythic` -> blocked with `Already max rarity!` + visual feedback.
8. Harvest/sell fertilised plant -> fertiliser info cleared with plant.
9. Save/reload with stacked fertilised plants -> state remains correct.
10. Non-fertiliser placement/selection/bulk sell behavior remains unchanged.

## Open Decisions

- Water Retention maxed message copy (player-style).
- Quality redistribution split for the shifted `5%` (e.g. proportional vs fixed shares across higher tiers).
- Whether fertiliser can be applied to fully grown crops before harvest (recommended: yes, but confirm quality timing vs rarity assignment).
- Whether fertiliser can be applied to non-produce placed items (recommended: no, show warning).

## Progression / Pricing Proposal (Utilities)

## Goal

Reduce early-game menu overload by delaying utility unlocks, while making fertiliser affordable enough to encourage experimentation and stacking.

## Current Utility Prices (for reference)

- Sprinkler: `$120`
- Water Retention Fertiliser: `$45`
- Speed Grow Fertiliser: `$55`
- Quality Fertiliser: `$65`

## Recommended Unlock Schedule (My Recommendation)

### Level 10: Unlock all fertilisers

Reasoning:

- By level 10, players have learned the core loop (mine -> plant -> water -> harvest -> sell).
- Fertilisers add tactical choices, but still require manual play.
- Unlocking all 3 together keeps the utility section simple (one clear "new utilities" moment) instead of drip-feeding similar items.

### Level 20: Unlock sprinkler

Reasoning:

- Sprinkler introduces automation and changes the daily rhythm more than fertilisers do.
- Delaying it keeps early and mid-early gameplay focused on manual watering.
- Level 20 feels like a strong milestone for first automation.

## Alternative Unlock Schedules (Optional)

### Option A (staggered fertilisers)

- Level 8: Water Retention Fertiliser
- Level 10: Speed Grow Fertiliser
- Level 12: Quality Fertiliser
- Level 20: Sprinkler

Tradeoff:

- Better per-item introduction pacing
- More menu churn / unlock notifications

### Option B (everything together)

- Level 10: All utilities (fertilisers + sprinkler)

Tradeoff:

- Simplest unlock logic and messaging
- Higher risk of early automation reducing manual loop learning

## Recommended Prices (My Recommendation)

### Fertilisers (cheap, stackable, low-friction)

Recommended prices:

- Water Retention Fertiliser: `$10`
- Speed Grow Fertiliser: `$12`
- Quality Fertiliser: `$15`

Reasoning:

- Matches the intended design: small buffs that stack.
- Encourages experimentation without punishing mistakes.
- Keeps Quality slightly higher because its upside can become strong with stacking.

### Sprinkler (premium automation utility)

Recommended price:

- Sprinkler: `$100` (acceptable range `$90-$110`)

Reasoning:

- Still feels like a meaningful milestone purchase.
- Slightly cheaper than `$120` improves accessibility if it unlocks at level 20.
- Preserves a strong price gap vs consumable fertilisers.

## What I Would Implement (Recommended)

1. Unlock all 3 fertilisers at player level `10`.
2. Unlock sprinkler at player level `20`.
3. Set fertiliser prices to:
   - Water Retention `$10`
   - Speed Grow `$12`
   - Quality `$15`
4. Set sprinkler price to `$100`.

## Balance Watchouts (Post-Implementation)

- Quality fertiliser may become too efficient on high-value crops if too cheap.
- If needed later, keep Quality at the top of the band (`$15`) or increase slightly (`$18-$20`) without changing the other two.
- Existing fertiliser caps and energy costs already help prevent runaway scaling.

## Likely Implementation Touchpoints (Later)

- `data/items.json` (utility prices)
- Utility unlock logic (player-level gating), likely in shop/runtime wiring:
  - `main.js`
  - `js/controllers/shop_market_controller.js`
  - `js/controllers/fixed_price_store_controller.js`
  - existing unlock checks tied to `playerLevel` / `goalLocked`
- `js/ui/render_market.js` (verify utility rows hide/disable cleanly before unlock)

## Validation Checklist (When Implementing Progression/Pricing)

1. New game: fertilisers and sprinkler are hidden/locked early.
2. Level 10: all fertilisers unlock together.
3. Level 20: sprinkler unlocks.
4. Utility prices show updated values.
5. Utility purchases still use fixed-price behavior.
6. Existing saves above level thresholds unlock correctly after load.

## UX Addition Recommendation (Level-Up Messaging)

When utilities unlock via level milestones, include the unlocks in the level-up message/celebration so players immediately understand what changed.

### Recommended behavior

- If a level-up unlocks fertilisers or sprinkler, append an unlock summary to the level-up text.
- Prefer specific item names over generic wording.
- If multiple utilities unlock at once (e.g. all fertilisers at level 10), show all of them in one grouped message.

### Example copy (recommended style)

- Level 10:
  - `Level up! Reached Level 10. Unlocked utilities: Water Retention Fertiliser, Speed Grow Fertiliser, Quality Fertiliser.`
- Level 20:
  - `Level up! Reached Level 20. Unlocked utility: Sprinkler.`

### Icon / visual suggestion (recommended)

- Yes, include icons if possible (similar to seed unlock presentation).
- Show a compact row of item icons in the level-up/celebration UI for newly unlocked utilities.
- If icon-row support is too much for first pass:
  - include text first (must-have)
  - add icons/chips as a follow-up enhancement

### Likely implementation touchpoints

- level-up message composition (currently `progress.level_up`)
- level-up celebration modal payload/UI (if unlock icons are rendered there)
- item lookup helpers for unlocked item names + image paths

### Validation checklist (add-on)

1. Level 10 level-up text explicitly mentions all 3 fertilisers.
2. Level 20 level-up text explicitly mentions sprinkler.
3. If icons are implemented, correct utility icons display in the level-up UI.
4. No duplicate unlock text appears on later levels once already unlocked.
