# Enter The Market (Web)

Browser farming + trading game focused on progression, market timing, and day-by-day decision making.

Play here: https://youngwiseone.github.io/enter_the_market_web/

## Current Gameplay

- 7x7 farm grid with tool-based interaction:
  - `glove`: plant and harvest
  - `watering`: advance growth
  - `pickaxe`: mine/clear locked tiles
- Daily rest loop (`nextDay`) updates:
  - prices and market pressure
  - daily market roll
  - day summary and tips
  - goal evaluation and rewards
- Progression:
  - crop unlock tiers via goals (`goalLocked`)
  - tool unlocks and free purchase rewards
  - second farm unlock after fully unlocking Farm 1
  - cosmetic themes from milestones

## Architecture Snapshot

- No framework and no build step.
- Single page app with native ES modules:
  - `index.html` for UI shell and CSS
  - `main.js` for runtime composition/wiring entrypoint
  - `js/` for feature modules:
    - `js/app/` startup orchestration + bootstrap dependency builders
    - `js/controllers/` gameplay/domain controllers (no direct DOM access)
    - `js/state/` persistence, normalization, runtime state helpers
    - `js/ui/` rendering, tabs, modals, bindings, notifications, DOM adapters
    - `js/sim/` market/news/rarity/day-roll simulation logic
    - `js/content/` JSON loading, normalization, fallback defaults
    - `js/fx/` particles and FX runtime
    - `js/core/` shared utilities (storage, clone)
- Data-first content files:
  - `data/items.json`
  - `data/goals.json`
  - `data/news.json`
- Save system: browser `localStorage` with migration logic in `js/state/state_initializer.js`.

## Local Run

Use a local server (recommended and expected for current ES module setup).

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

Note: direct `file://` launch (double-clicking `index.html`) is not a supported dev path because native ES module imports are browser-restricted in that context.

## Content Editing

When editing progression/content, keep IDs stable:

- `item.id`
- `goal.id`
- cosmetic IDs (`theme-*`, etc.)

Important: the game uses both JSON data files and fallback defaults in `js/content/fallbacks/default_data.js`. If you change progression rules, keep both aligned.

Authoring guides:

- `guide/items.md`
- `guide/goals.md`
- `guide/news.md`

## Dev Notes

- Runtime entry: `main()` in `main.js` (bootstrap/wiring layer).
- Primary modules for behavior edits:
  - Startup/bootstrap:
    - `js/app/bootstrap.js`
    - `js/app/bootstrap/session.js`
    - `js/app/bootstrap/farm.js`
    - `js/app/bootstrap/market.js`
  - State init/save: `js/state/state_initializer.js`, `js/state/state_runtime_controller.js`
  - Day progression: `js/controllers/day_controller.js`, `js/controllers/day_market_runtime_controller.js`
  - Farm actions: `js/controllers/farm_actions.js`, `js/controllers/grid_controller.js`, `js/controllers/harvest_controller.js`
  - Shop/store: `js/controllers/shop_controller.js`, `js/controllers/store_cosmetics.js`
  - Root render orchestration: `js/ui/render_root.js`
  - DOM adapters (controller boundary): `js/ui/farm_ui_dom.js`, `js/ui/grid_fx_targets.js`, `js/ui/pointer_dom.js`, `js/ui/theme_dom.js`, `js/ui/render_guidance.js`

Boundary rule for new code:

- `js/sim/*` stays pure simulation/state math.
- `js/controllers/*` should not call `document`, `window`, `alert`, or `confirm` directly.
- DOM interaction belongs in `js/ui/*` and should be injected into controllers/runtime via dependencies.

Basic validation after edits:

```powershell
$files = Get-ChildItem -Recurse -File -Include *.js; foreach ($f in $files) { node --check $f.FullName }
```

## License and AI Usage

- License: `LICENSE.md`
- AI/automation policy: `llms.txt`

Short version:

- Derivative projects are allowed.
- Rehosting this project unchanged is not allowed without permission.
