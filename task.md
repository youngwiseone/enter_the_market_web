
# Sprinkler Tank Model Change Plan (Day-Based Capacity)

## Goal
Change sprinkler behavior so tank units represent **full watering days**, not per-crop water units.

Example target behavior:
- `2/4` means the sprinkler can run for **2 more dawns**.
- On each dawn it should water all eligible adjacent crops (per sprinkler radius rules).
- If it successfully runs that dawn, it consumes `1` day from tank.

## Current Behavior (baseline to replace)
- Tank currently consumes per crop watered (`sprinklerWaterPerCrop`, currently 1).
- Refill adds variable units based on watering can level (`getInfrastructureRefillUnitsPerUse`).
- Dawn summary reports `waterUnitsConsumed` and rain refill reports `waterUnitsAdded`.

## Proposed Design
1. Interpret `tankCurrent` and `sprinklerCapacity` as `daysRemaining` and `maxDays`.
2. Dawn sprinkler pass:
   - If no eligible adjacent crops, do not consume tank day.
   - If there is at least one eligible adjacent crop and tank has at least 1 day:
     - water all eligible adjacent crops (subject to existing radius and growth checks),
     - consume exactly 1 tank day.
   - If there are eligible crops and tank is 0, count as empty-at-dawn.
3. Manual watering-can refill for placed sprinkler:
   - Refill should top up to full in one use (unless clarified otherwise).
   - Message remains tank style (`current/capacity`) but interpreted as days.
4. Rain refill:
   - Continue refilling sprinklers to full.
   - Summary variable can still use existing key names unless we rename text to days.

## Files / Areas Likely Impacted
- `js/controllers/watering_infrastructure.js`
  - `getSprinklerPlacementConfig`
  - `refillRefillablePlacedItem`
  - `applyDawnSprinklersToFarm`
  - `refillSprinklersForRainToFull`
- `js/controllers/day_controller.js`
  - dawn + rain summary message variables (`waterUnitsConsumed`, `waterUnitsAdded`)
- `js/controllers/farm_actions.js`
  - refill feedback message values
- `js/controllers/grid_interaction_controller.js`
  - low tank warning thresholds (currently unit-based)
- `js/ui/render_market.js`
  - tank badge tooltip wording (optional text update to "days")
- `data/messages.json`
- `js/content/fallbacks/default_data.js`
  - keep fallback messages in sync with catalog

## Save/Migration Considerations
- Existing saves likely store sprinkler tank as old per-crop units.
- Migration choice needed:
  - A) soft migration: clamp existing `tankCurrent` into `[0, capacity]` and treat as day-count as-is.
  - B) reset migration: set all existing sprinkler tanks to full on load after update.
  - C) proportional conversion formula (if future levels introduce non-1 `waterPerCrop`).

## Validation Plan
1. Syntax check all JS files.
2. Message catalog validation (`node js/dev/validate_messages.cjs`).
3. Manual smoke:
   - Place sprinkler with crops in range.
   - Confirm dawn waters all eligible adjacent crops and consumes 1 day only once.
   - Confirm `0/x` shows empty-at-dawn messaging when crops are eligible.
   - Confirm no day consumed when no eligible adjacent crops.
   - Confirm refill behavior and messages.
   - Confirm rain refill behavior and message values.

## Clarifications Needed Before Implementation
1. Refill rule: should one watering-can click always fill sprinkler to full, or still add partial days?
2. Consumption rule: should sprinkler consume 1 day only if it waters at least 1 crop, or every dawn regardless?
3. Scope rule: for radius > 1 future levels, should one consumed day still water all eligible in radius?
4. Messaging: should UI text explicitly say "days" instead of "water" for tank/refill/dawn summaries?
5. Migration preference for existing saves: A (clamp), B (set full), or C (formula)?
6. Low tank warning threshold: keep current ratio logic (<=25%) or use explicit "1 day left" warning?
