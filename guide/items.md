# Items Guide

This guide describes item authoring in `data/items.json`.

## File format
```json
{
  "items": []
}
```

## Item schema
```json
{
  "id": 3,
  "name": "Corn Seeds",
  "description": "Corn seeds.",
  "price": 8,
  "rarity": "common",
  "image": "seeds/corn_seeds.png",
  "seedImage": "seeds/corn_seeds.png",
  "harvestImage": "items/corn.png",
  "growDays": 6,
  "plantStages": 6
}
```

## Core fields (expected)
- `id` (number, unique)
- `name`
- `description`
- `price`
- `image` / `seedImage`
- `harvestImage`
- `growDays`
- `plantStages`

## Optional fields
- `plantStageImages`: explicit per-stage plant art.
- `goalLocked`: legacy field from older progression. Current runtime unlocks items by level and does not require this flag.

Notes:
- Runtime normalizers can backfill some asset fields from fallback defaults, but new/edited content should still include complete fields to avoid visual gaps.

## Paths
- Paths are relative to `resources/`:
  - `seeds/*.png`
  - `plants/*.png`
  - `items/*.png`

## Current progression notes
- Item unlocks are level-based:
  - Level 1: first item unlocked
  - Level 2: second item unlocked
  - ...
  - Level `N`: first `N` items unlocked (ordered by `id`)
- If level exceeds item count, no additional item unlock is applied, but leveling still continues.
- Locked items are excluded from market/news simulation until unlocked.

## Authoring checklist
1. IDs are unique and stable.
2. All image files exist in `resources/`.
3. Price and growth values are positive.
4. Item order by `id` matches intended level unlock order.
5. Item appears and behaves correctly after unlock.
