# Items Guide

This guide explains how to add new items using `data/items.json`.

## 1. File location
- Edit: `data/items.json`
- Top-level format:
```json
{
  "items": []
}
```

## 2. Item entry format
Each item is one object inside `items`:
```json
{
  "id": 3,
  "name": "Corn Seeds",
  "description": "Corn seeds.",
  "price": 12,
  "rarity": "common",
  "image": "seeds/corn_seeds.png",
  "seedImage": "seeds/corn_seeds.png",
  "harvestImage": "items/corn.png",
  "growDays": 6,
  "plantStages": 6
}
```

## 3. Required fields
- `id`: unique numeric id.
- `name`: item display name.
- `description`: short player-facing text.
- `price`: base shop price.
- `image` and `seedImage`: seed image path.
- `harvestImage`: harvested item image path.
- `growDays`: watered-day requirement to harvest.
- `plantStages`: number of plant growth stages.

## 4. Image paths and folders
- Seed images: `resources/seeds/...`
- Plant stage images: `resources/plants/...`
- Harvest images: `resources/items/...`

In JSON, paths are written without `resources/` prefix:
- `seeds/corn_seeds.png`
- `plants/corn_plant1.png`
- `items/corn.png`

## 5. Plant stage behavior
You have two options:

1. Explicit stage images:
```json
"plantStageImages": [
  "plants/corn_plant1.png",
  "plants/corn_plant2.png",
  "plants/corn_plant3.png",
  "plants/corn_plant4.png",
  "plants/corn_plant5.png",
  "plants/corn_plant6.png"
]
```

2. No stage images (fallback):
- If `plantStageImages` is missing for a multi-stage plant, the game uses:
  - `plants/plant1.png` ... `plants/plant6.png` (global fallback).

## 6. Authoring rules
- Keep `id` stable forever.
- Do not reuse ids.
- Use consistent file naming (`*_seeds.png`, `*_plantN.png`, harvest item file).
- Ensure every referenced image exists in `resources/`.
- Keep `growDays` and `plantStages` as positive numbers for growable crops.

## 7. Example: add a crop with explicit stages
```json
{
  "id": 4,
  "name": "Carrot Seeds",
  "description": "Carrot seeds.",
  "price": 9,
  "rarity": "common",
  "image": "seeds/carrot_seeds.png",
  "seedImage": "seeds/carrot_seeds.png",
  "plantStageImages": [
    "plants/carrot_plant1.png",
    "plants/carrot_plant2.png",
    "plants/carrot_plant3.png",
    "plants/carrot_plant4.png",
    "plants/carrot_plant5.png",
    "plants/carrot_plant6.png"
  ],
  "harvestImage": "items/carrot.png",
  "growDays": 6,
  "plantStages": 6
}
```

## 8. Validation checklist
1. JSON is valid.
2. New `id` is unique.
3. All image files exist in `resources/`.
4. Item appears in market/shop (unless goal-locked).
5. Plant grows, shows stages, and can be harvested.
6. Harvested sell value behaves as expected.

## 9. Recommended test flow
1. Add item JSON + image files.
2. Reset save or reload game.
3. Confirm item appears and can be purchased.
4. Plant and water over days.
5. Confirm growth, harvest, and sale flow.
