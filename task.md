# Tomatoe + Plant Image Fallback Plan

## Goal
1. Add `Tomatoe Seeds` as a purchasable market item.
2. Ensure plants without explicit stage image mappings default to `plants/plant1.png`, `plants/plant2.png`, etc.

## Implementation Steps
1. Data update (`data/items.json`)
- Add a new item with:
  - `id: 2`
  - `name: Tomatoe Seeds`
  - seed image `seeds/tomatoe_seeds.png`
  - harvest image `items/tomatoe.png`
  - `growDays: 6`, `plantStages: 6`
- Do not provide `plantStageImages` so fallback logic is exercised.

2. Runtime fallback update (`main.js`)
- Update `getPlantStageImagePath(item, stageIndex)`:
  - Keep existing explicit behavior for `plantStageImages` and `plantImageBase`.
  - If no explicit stage images are configured and the item is a multi-stage plant, return generic stage assets:
    - `resources/plants/plant1.png` ... `resources/plants/plant6.png`.

3. JS fallback seed data update (`main.js`)
- Add `Tomatoe Seeds` to `DEFAULT_DATA.items`.
- Add corresponding `DEFAULT_DATA.shop` entry so tomatoe remains purchasable even when JSON cannot be fetched.

## Validation Checklist
1. Start app and open Farmer's Market; verify `Tomatoe Seeds` appears in the table and can be selected/purchased.
2. Plant tomatoe seed on grid and water over days; verify growth stages display using generic `plant1..plant6` images.
3. Verify harvest sprite is `resources/items/tomatoe.png`.
4. Confirm pumpkin continues using its explicit stage images.
