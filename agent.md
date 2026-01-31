# Enter The Market (Web) - Project Audit (Current)

## Overview
- Single-page browser game: `index.html` + inline CSS + `main.js`.
- 98.css provides the Windows 98 styling; no JS framework or build tooling.
- State persists in `localStorage` (player, shop, items, inventory, news, grid).
- UI has two tabs: Farmer's Market and Store; messages log shows game events.
- Farm toolbar includes tool buttons (glove, watering can, pickaxe) and an inline energy bar.

## Current Gameplay Flow (High-Level)
- `main()` loads JSON data, initializes state, attaches handlers, then shows Market.
- Player clicks a market row to select a seed (cursor changes to the seed icon).
- Farm tools: glove (default) for planting/harvesting, watering can to water tiles, pickaxe to mine locked tiles.
- Clicking an unlocked empty farm tile with glove selected buys and plants the selected seed.
- Plants grow only on days they are watered; watering consumes energy per tile.
- Clicking a fully grown plant with glove selected harvests and sells it for 1.25x current market price.
- Player may wait for better prices before harvesting.
- `nextDay()` advances time, updates prices, generates Thursday news, and logs tips.

## Files and Structure
- `index.html`
  - Inline CSS for layout, 98.css theming, grid visuals.
  - HUD: day, cash, net worth (storage header removed).
  - Farmer's Market panel: 9x9 farm (600x600), simplified market table, messages log.
  - Farm toolbar above grid: tool buttons + inline energy bar (no header/text).
  - Store panel: cosmetics and crafting tabs + reset button.
- `main.js`
  - All game logic: state, rendering, pricing, news, planting/growth/harvest.
- `data/items.json`
  - Currently only one item (Pumpkin Seeds) with growth metadata.
- `data/news.json`
  - News templates used for weekly Thursday events.
- `resources/`
  - `pumpkin_seeds.png` for market/cursor icon.
  - Growth sprites: `pumpkin_plant_1.png` .. `pumpkin_plant_8.png`.
  - Tool assets in `resources/tools/` (glove, watering_can, pickaxe, water overlay, crack1-10).

## Core Modules (by responsibility)

### Data + State
- `DEFAULT_DATA` seeds player, items, shop, inventory, news, store.
- `loadJSONData()` loads `data/items.json` and `data/news.json`.
- `initialiseState()` loads from localStorage and re-seeds items/shop if mismatched.
- Grid persistence:
  - `gridUnlocked`: which cells are unlocked.
  - `gridItems`: item id in each cell.
  - `gridPlantedDay`: day index each seed was planted.
  - `gridWateredDay`: day index last watered (per tile).
  - `gridWateredCount`: watered-day count used for growth progress.
  - `gridMiningHits`: mining progress (0-10) for locked tiles.
  - `activeTool`: current tool mode (glove, watering, pickaxe).

### UI Rendering
- `renderHUD()`: day, cash, net worth.
- `renderMarket()`: market table (Img, Item, Avg, Price) and farm.
- `renderStore()`: cosmetics + crafting tabs.
- `renderAll()`: always re-renders market; store only when visible.
- `renderEnergyBar()`: updates inline toolbar energy bar segments.
- `addMessage()`: message log with timestamp and day-of-week.

### Farmer's Market + Selection
- Market rows are clickable and selectable:
  - `selectShopItem(itemId)` toggles selection and sets cursor to the seed image.
  - Switching to watering/pickaxe clears the selected shop item.
- Purchase and plant:
  - `purchaseAndPlaceSelected(cellIndex)` buys one unit and plants it.

### Farm + Planting/Growth/Harvest
- `mineGridTile(index)`: pickaxe action consumes 1 energy per hit; 10 hits unlocks a cell.
- `waterGridTile(index)`: watering action consumes 1 energy per click and marks the tile watered for the day.
- `gridWateredCount` determines growth progress (only advances on watered days).
- Growth stages:
  - `plantStages` and `growDays` per item determine sprite stage and timing.
  - Sprite path: `resources/pumpkin_plant_<stage>.png`.
- Visual overlays:
  - `water.png` for watered tiles.
  - `crack1.png`..`crack10.png` for mining progress on locked tiles.
- Hover:
  - Shows days to grow or harvest price (1.25x current price).
- Harvest:
  - `harvestPlant(cellIndex)` sells at 1.25x price and clears the cell.

### Pricing + News
- `nextDay()`:
  - Advances day/week/year.
  - Price fluctuates +/- 5% daily.
  - Thursday generates news via `generateNewsEvents()`.
  - News events impact prices by item id.
- `generateDailyTip()` posts a daily message; Thursday shows news.

### Store
- Cosmetics: buy/select themes.
- Crafting: still present but items are simplified; recipes may not make sense until updated.

## Current Items
- Pumpkin Seeds only.
  - `image`: `pumpkin_seeds.png`
  - `growDays`: 7
  - `plantStages`: 8

## Notes / Known Legacy
- `purchaseGridSlot()` and `getGridUnlockCost()` remain but are no longer used for unlocking tiles.
- `buyItem()` / `sellItem()` remain but UI no longer exposes those controls.
- Crafting logic still exists from older mechanics and may need alignment with the new single-item setup.

## External Dependencies
- 98.css via CDN: `https://unpkg.com/98.css@0.1.16/dist/98.css`
