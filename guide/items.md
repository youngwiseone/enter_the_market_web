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
  "plantStages": 6,
  "goalLocked": true
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
- `goalLocked`: `true` means the item starts locked until a goal reward unlocks it.

Notes:
- Runtime normalizers can backfill some asset fields from fallback defaults, but new/edited content should still include complete fields to avoid visual gaps.

## Paths
- Paths are relative to `resources/`:
  - `seeds/*.png`
  - `plants/*.png`
  - `items/*.png`

## Current progression notes
- Tiered pricing is currently used:
  - Tier 1: `1-5`
  - Tier 2: `4-12`
  - Tier 3: `15-25`
  - Tier 4: `22-40`
- Goal-locked items are hidden from purchase and excluded from market/news simulation until unlocked.

## Authoring checklist
1. IDs are unique and stable.
2. All image files exist in `resources/`.
3. Price and growth values are positive.
4. `goalLocked` matches intended progression.
5. Item appears and behaves correctly after unlock.
