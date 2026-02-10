# Goals Guide

This guide explains how to add new goals using `data/goals.json`.

## 1. File location
- Edit: `data/goals.json`
- Top-level format:
```json
{
  "goals": []
}
```

## 2. Goal entry format
Each goal is one object inside `goals`:
```json
{
  "id": "unique-id",
  "name": "Player-visible name",
  "description": "What the player must do",
  "type": "feature",
  "goal": { "metric": "day", "operator": ">=", "value": 2 },
  "reward": { "unlockTool": "watering" },
  "message": "Unlocked Watering Can.",
  "enabled": true
}
```

## 3. Required fields
- `id`: unique string, never reuse.
- `name`: short title.
- `description`: clear requirement text.
- `goal`: condition object.
- `reward`: reward object.

## 4. Supported goal metrics (current plan)
- `day`
- `cash`
- `netWorth`
- `gridUnlockedCount`
- `harvestCount`
- `itemsHarvested.<itemId>` (example: `itemsHarvested.2`)

## 5. Supported operators
- `>=` (recommended default)
- `>`
- `==`

## 6. Supported rewards (current plan)
- `unlockTool`: make a gameplay tool available.
  - Example: `{ "unlockTool": "watering" }`
- `unlockShopItem`: allow an item to be purchased.
  - Example: `{ "unlockShopItem": 2 }`
- `freePurchases`: next N purchases of an item are free.
  - Example: `{ "freePurchases": { "itemId": 2, "count": 2 } }`
- `grantCosmetic`: award cosmetic/theme.
  - Example: `{ "grantCosmetic": "theme-mono" }`
- `setFlag`: feature toggle for future systems.

## 7. Quick examples
```json
{
  "goals": [
    {
      "id": "day-2-watering",
      "name": "Early Riser",
      "description": "Reach Day 2 to gain watering can",
      "type": "feature",
      "goal": { "metric": "day", "operator": ">=", "value": 2 },
      "reward": { "unlockTool": "watering" },
      "message": "Unlocked Watering Can."
    },
    {
      "id": "tomatoe-first-harvest",
      "name": "Tomatoe Starter",
      "description": "Harvest 1 Tomatoe",
      "type": "economy",
      "goal": { "metric": "itemsHarvested.2", "operator": ">=", "value": 1 },
      "reward": { "freePurchases": { "itemId": 2, "count": 2 } },
      "message": "Next 2 Tomatoe Seeds are free."
    }
  ]
}
```

## 8. Authoring rules
- Keep `id` stable forever (used by save data).
- Prefer one clear reward per goal in early versions.
- Use low thresholds first for testing, then raise later.
- Keep `message` short and specific.
- Set `"enabled": false` to keep a draft goal in file without activating it.

## 9. Validation checklist
1. JSON is valid (no trailing commas).
2. IDs are unique.
3. Metric exists and value is numeric.
4. Reward payload matches expected shape.
5. Goal appears in Goals tab with correct progress text.
6. Reward grants only once and persists after reload.

## 10. Recommended test flow
1. Start from a fresh save.
2. Trigger one easy goal (for example day 2).
3. Confirm goal completion message appears.
4. Confirm reward behavior works (tool/shop/free purchase).
5. Reload page and confirm goal remains completed.

