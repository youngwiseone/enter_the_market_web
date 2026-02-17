# Goals Guide

This guide describes the goal schema used by `data/goals.json`.

## File format
```json
{
  "goals": []
}
```

## Goal object (single-condition)
```json
{
  "id": "day-2-watering",
  "name": "Early Riser",
  "description": "Reach Day 2 to gain watering can",
  "type": "feature",
  "goal": { "metric": "day", "operator": ">=", "value": 2 },
  "reward": { "unlockTool": "watering" },
  "message": "Goal complete: Watering Can is now available."
}
```

## Goal object (multi-condition)
```json
{
  "id": "unlock-tier2-first-expansion",
  "name": "Growth Contract",
  "description": "Reach Day 3 and $220 cash",
  "type": "economy",
  "goal": {
    "all": [
      { "metric": "day", "operator": ">=", "value": 3 },
      { "metric": "cash", "operator": ">=", "value": 220 }
    ]
  },
  "reward": { "cashBonus": 180 },
  "message": "Goal complete: Growth contract paid out ($180)."
}
```

## Supported metrics
- `day`
- `cash`
- `netWorth`
- `harvestCount`
- `gridUnlockedCount`
- `itemsHarvested.<itemId>`

## Supported operators
- `>=`
- `>`
- `==`
- `<=`
- `<`

## Supported rewards
- `unlockTool`: unlock gameplay tool id.
- `cashBonus`: grants cash immediately.
- `freePurchases`: `{ "itemId": number, "count": number }`
- `grantCosmetic`: unlock cosmetic/theme id.
- `setFlag`: sets a goal flag string in save state.

## Item unlock progression
- Shop item unlocks are now level-based, not goal-based.
- Rule: `playerLevel = N` unlocks the first `N` items (ordered by item id).
- Level-up UI shows the unlocked item image/name when available.
- If player level exceeds available item count, level still increases and the generic level-up image is shown.

## Authoring rules
- Keep goal `id` stable forever (used by save data).
- IDs must be unique.
- Keep `message` short and explicit.
- Use `enabled: false` to keep a draft goal in data without activating it.

## Validation checklist
1. JSON is valid.
2. Every goal has unique `id`.
3. All metric names are supported.
4. Reward payload matches one of the supported shapes.
5. Goal progress appears in the Goals tab.
6. Reward applies once and persists after reload.
