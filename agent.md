# Enter The Market (Web) - Current Project Snapshot

## Architecture
- Single-page browser game: `index.html` + inline CSS + `main.js`.
- No framework/build step; game logic runs directly in the browser.
- 98.css is loaded from CDN for base Win98-style controls.
- Persistent save data is stored in `localStorage`.

## Core Gameplay (Current)
- Tabs: `Market`, `Store`, `Goals`.
- 9x9 farm grid with tool-based interaction:
  - `glove`: plant/harvest
  - `watering`: advance plant growth (one watered day per tile/day)
  - `pickaxe`: unlock locked grid tiles (mining hits)
- Daily loop (`nextDay()`):
  - advances day/week
  - applies market price movement to unlocked items
  - applies active news modifiers
  - emits economy alerts/tips
  - evaluates goals and rewards

## Progression Systems
- **Goals**:
  - single-condition goals (`goal.metric/operator/value`)
  - multi-condition goals (`goal.all: []`)
  - milestone progress messages and completion celebrations
- **Plant unlock tiers**:
  - some items are `goalLocked`
  - unlocks happen through goal rewards (`unlockShopItem` / `unlockShopItems`)
  - locked items are excluded from market/news simulation until unlocked
- **Cosmetics/themes**:
  - store themes plus high-end milestone themes:
    - `theme-sophisticated`
    - `theme-marble`
    - `theme-gold`
    - `theme-diamond`

## Data Files
- `data/items.json`: item definitions, prices, growth, optional `goalLocked`.
- `data/goals.json`: goal list and rewards.
- `data/news.json`: news template pool (`headline`, `article`, `impact`, `duration`).

## Save Data Notes
- Important persisted keys include:
  - `player`, `items`, `shop`, `inventory`
  - `goals`, `goalsClaimed`, `goalFlags`, `goalStats`
  - `unlockedShopItems`, `unlockedTools`, `freePurchasesByItem`
  - grid state arrays (`gridUnlocked`, `gridItems`, etc.)
- Initialization includes merge/migration helpers so new defaults can roll into existing saves.

## Known Constraints
- `BUILD_VERSION` is static (`Web v0.1`).
- Game balance is currently data-driven but still manual (no external balancing tool).
- Visual/audio polish is in progress; logic-first implementation is prioritized.
