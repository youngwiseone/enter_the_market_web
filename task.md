# Plant Unlock Goal Plan (Progressive Market Access)

Goal: gate higher-value plants behind milestones so progression feels earned, while preventing locked plants from being affected by market simulation.

## Pricing + Tiering Direction
- Current seed prices are tightly clustered (`$7-$10`), so "higher average cost" progression will not feel strong without rebalance.
- Reprice by tiers before/with goal rollout:
  - Tier 1 (starter): `$6-$8`
  - Tier 2 (mid): `$9-$12`
  - Tier 3 (advanced): `$13-$17`
  - Tier 4 (premium): `$18-$24`
- Keep only Tier 1 unlocked at game start; all higher tiers marked `goalLocked: true`.

## Proposed Unlock Goals
1. `unlock-tier2-first-expansion`
- Condition: reach Day 4 and at least `$300` cash.
- Reward: unlock Tier 2 plants.
- Message: "Goal complete: New crop contracts unlocked (Tier 2)."

2. `unlock-tier3-growth`
- Condition: harvest at least `30` total crops and reach `$2,500` cash.
- Reward: unlock Tier 3 plants.
- Message: "Goal complete: Advanced crop supply unlocked (Tier 3)."

3. `unlock-tier4-elite`
- Condition: reach `$15,000` cash and own at least `10` planted slots.
- Reward: unlock Tier 4 plants.
- Message: "Goal complete: Elite crop futures unlocked (Tier 4)."

## Suggested Plant Grouping (by IDs)
- Tier 1 starter (unlocked initially): `2, 4, 5, 6, 12, 14, 15`
- Tier 2 mid: `3, 7, 9, 10, 17`
- Tier 3 advanced: `1, 11, 13, 16`
- Tier 4 premium: `8` (and future high-tier crops)

## Data and Goal Wiring
- In item data (`data/items.json` + fallback in `main.js`), set `goalLocked: true` on Tier 2/3/4.
- Add goal entries in `data/goals.json` and fallback goals in `main.js`.
- Use one of:
  - multiple `unlockShopItem` goals (one per item), or
  - new reward shape `unlockShopItems: [id, ...]` (recommended to reduce goal spam).

## Market Isolation Rules (Critical)
- Locked plants must be excluded from all daily market systems until unlocked:
  - daily price randomization
  - news impact modifiers
  - average price tracking (`priceSum`, `daysCount`)
  - economy alerts and suggestion tips
- Implementation rule:
  - in daily loops over `state.shop`, skip entries where `!isShopItemUnlocked(entry.itemId)`.
- News generation rule:
  - only pick from unlocked item pool when substituting `sku` target.

## Migration / Save Compatibility
- For existing saves:
  - ensure `unlockedShopItems` gets backfilled for all current item IDs.
  - force-lock the new tiered IDs unless player already owns/has used them (decide migration policy once).
- Keep goal claims map intact (`goalsClaimed`) and only append new goals.

## Acceptance Criteria
1. Locked plants do not appear in market table or buy flows.
2. Locked plants receive no price movement and no news effects.
3. On unlocking, plant first appears with base price history (`daysCount=0`, `priceSum=0` behavior preserved).
4. Goal progression clearly communicates new plant tiers.
