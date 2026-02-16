# Enter The Market (Web) - Agent Guide

## Purpose

This file is the fast-start context for contributors and coding agents working in this repo.

## Quick Overview Path

- Reading this file helps with contributor workflow and code-area mapping, but it is not the fastest architecture-first overview.
- For a quick understanding of how the game is structured right now, read in this order:
  1. `README.md` (architecture snapshot and runtime map)
  2. `js/app/bootstrap.js` (startup sequence in one place)
  3. `js/app/bootstrap/session.js`, `js/app/bootstrap/farm.js`, `js/app/bootstrap/market.js` (wiring builders by domain)
  4. `main.js` (composition layer consuming builders)
  5. `guide/refactor_baseline.md` (current refactor status and validation baseline)

If short on time, start with `README.md` first.

## Current Architecture

- Runtime stack: plain browser JavaScript, no bundler.
- Main files:
  - `index.html`: structure + CSS + UI panels
  - `main.js`: runtime wiring/composition
  - `data/*.json`: content definitions
  - `js/` modules:
    - `js/app/`: startup orchestration + dependency builder modules
    - `js/controllers/`: gameplay and domain flow (no direct DOM access)
    - `js/state/`: persistence/load/save/migration/runtime state
    - `js/ui/`: renderers, tabs, bindings, modals, feedback, notifications, DOM adapters
    - `js/sim/`: daily roll, market pressure, rarity, news simulation
    - `js/content/`: JSON loading, normalization, resource path helpers, fallbacks
    - `js/fx/`: particle + FX runtime
    - `js/core/`: low-level shared helpers
- Theme base styles come from 98.css CDN.
- Persistent state is stored in browser `localStorage`.

## Runtime Notes

- Use a local server for development (for example `python -m http.server 8000`).
- Direct `file://` launch is not supported with the native ES module setup.
- Expected local-only console noise (non-blocking):
  - `favicon.ico` 404 when no favicon file is present.
  - Cloudflare analytics (`beacon.min.js` / `cdn-cgi/rum`) CORS errors on localhost origins.
  - These do not block gameplay and should not be treated as core runtime regressions.

## Gameplay Systems Implemented

- Farm loop:
  - 7x7 grid
  - planting, watering, mining, harvesting
  - active tool controls (`glove`, `watering`, `pickaxe`)
  - second farm unlock progression
- Economy loop:
  - daily market roll and random drift
  - market pressure from behavior
  - crash/recovery logic
- Progression:
  - goals with single and multi-condition checks
  - rewards: tools, crop unlocks, cosmetics, flags, cash, free purchases
- UX systems:
  - guidance panel
  - day summary modal
  - goal celebration modal
  - particle FX layer

## High-Impact Code Areas

- Startup and wiring: `main.js`, `js/app/bootstrap.js`, `js/app/bootstrap/session.js`, `js/app/bootstrap/farm.js`, `js/app/bootstrap/market.js`
- Save and migration: `js/state/state_initializer.js`, `js/state/state_runtime_controller.js`
- Game-day simulation: `js/controllers/day_controller.js`, `js/controllers/day_market_runtime_controller.js`
- Grid actions: `js/controllers/grid_controller.js`, `js/controllers/farm_actions.js`, `js/controllers/harvest_controller.js`, `js/controllers/grid_interaction_controller.js`
- Player progression/rewards: `js/controllers/player_progress_controller.js`, `js/controllers/goals_controller.js`
- Render path: `js/ui/render_root.js`, `js/ui/render_market.js`, `js/ui/render_store.js`, `js/ui/render_goals.js`, `js/ui/render_player.js`

## Module Breakdown (Refactor Map)

- App bootstrap:
  - `js/app/bootstrap.js`: startup orchestration and initial runtime boot flow.
  - `js/app/bootstrap/session.js`: session/celebration runtime dependency builders.
  - `js/app/bootstrap/farm.js`: farm pointer/UI runtime dependency builders.
  - `js/app/bootstrap/market.js`: market render/UI runtime dependency builders.
- Core/shared:
  - `js/core/storage.js`: clone/load/save helpers used across runtime.
- Content:
  - `js/content/fallbacks/default_data.js`: fallback canonical content/state defaults.
  - `js/content/json_loader.js`: `data/*.json` loading.
  - `js/content/normalizers.js`: merge + normalization for items/goals/store defaults.
  - `js/content/resource_paths.js`: resource/image path helpers.
- State:
  - `js/state/state_initializer.js`: load/migration/bootstrap orchestration.
  - `js/state/state_runtime_controller.js`: state init/save runtime wrappers.
  - `js/state/persistence.js`: full-state persistence helpers.
  - `js/state/reset_persistence.js`: reset-state persistence helpers.
  - `js/state/farm_state.js`: farm state shape + normalization.
  - `js/state/farm_runtime.js`: farm runtime access/apply/count utilities.
  - `js/state/day_sales_state.js`: day sales hydration/normalization.
  - `js/state/goal_state.js`: goal state shape normalization.
- Simulation:
  - `js/sim/constants.js`: game/sim constants.
  - `js/sim/rarity.js`: rarity normalization + multipliers + rolls.
  - `js/sim/daily_roll.js`: daily roll generation/apply/summary helpers.
  - `js/sim/market_pressure.js`: sell/hold pressure modeling.
  - `js/sim/news_events.js`: weekly news generation.
- Controllers:
  - `js/controllers/day_controller.js`: `nextDay` orchestration.
  - `js/controllers/day_economy_controller.js`: day economy helpers (energy/snapshot/tips).
  - `js/controllers/day_market_runtime_controller.js`: day market runtime orchestration.
  - `js/controllers/grid_controller.js`: placement/purchase grid flows.
  - `js/controllers/grid_slot_controller.js`: slot unlock/place/remove helpers.
  - `js/controllers/grid_interaction_controller.js`: pointer/selection/bulk-action logic.
  - `js/controllers/farm_actions.js`: mine/water action logic.
  - `js/controllers/farm_ui_controller.js`: tool/toggle/cursor UI control.
  - `js/controllers/farm_ui_runtime_controller.js`: farm UI runtime orchestration.
  - `js/controllers/farm_pointer_runtime_controller.js`: pointer runtime wiring.
  - `js/controllers/growth_runtime_controller.js`: crop growth + rarity assignment.
  - `js/controllers/harvest_controller.js`: harvest + sell selected/bulk flows.
  - `js/controllers/shop_controller.js`: buy/sell shop flows.
  - `js/controllers/shop_market_controller.js`: market fields + price recovery + unlock sync.
  - `js/controllers/store_cosmetics.js`: cosmetic purchase/select/theme/crafting.
  - `js/controllers/resource_production.js`: production + inventory intake + news hooks.
  - `js/controllers/goals_controller.js`: goal condition/reward/evaluation logic.
  - `js/controllers/guided_controller.js`: guided unlock + guidance payload generation.
  - `js/controllers/player_progress_controller.js`: XP/level/energy/net-worth/tool unlock helpers.
  - `js/controllers/reset_controller.js`: reset-game orchestration.
  - `js/controllers/gameplay_runtime_controller.js`: gameplay runtime composition.
  - `js/controllers/session_runtime_controller.js`: session/feedback/modal/celebration runtime.
- UI:
  - `js/ui/render_root.js`: root render orchestration (`renderAll` path).
  - `js/ui/render_market.js`, `js/ui/render_market_insight.js`: market + insight rendering.
  - `js/ui/render_player.js`: HUD/energy/level/time-of-day rendering.
  - `js/ui/render_store.js`, `js/ui/render_goals.js`: store/goals rendering.
  - `js/ui/messages_controller.js`: chat history/typing/message emission flow.
  - `js/ui/daily_roll_modal.js`: daily roll + day summary modal flow.
  - `js/ui/goal_celebration_controller.js`: goal celebration modal queue + sparkles.
  - `js/ui/tab_controller.js`: tab switching and tab button state.
  - `js/ui/layout_controller.js`: grid/layout sizing + side panel scroll helpers.
  - `js/ui/feedback_controller.js`, `js/ui/feedback_build.js`: feedback modal + payload build.
  - `js/ui/notifications_controller.js`: badges/unlock notifications.
  - `js/ui/creator_license.js`, `js/ui/creator_visibility_controller.js`: creator/license visibility.
  - `js/ui/profile_chat_controller.js`: profile image/chat presentation helpers.
  - `js/ui/farm_pointer_bindings.js`, `js/ui/bindings/core_bindings.js`: DOM event wiring.
  - `js/ui/farm_ui_dom.js`, `js/ui/grid_fx_targets.js`, `js/ui/pointer_dom.js`, `js/ui/theme_dom.js`: DOM adapters for controller/runtime dependency injection.
  - `js/ui/render_guidance.js`: guidance panel DOM render helper.
  - `js/ui/ui_runtime_controller.js`: UI runtime orchestration.
- FX/dev:
  - `js/fx/particle_pool.js`, `js/fx/fx_controller.js`: particle and FX runtime.
  - `js/dev/perf_metrics.js`: baseline instrumentation helpers.

## Data Contracts

- Items: `data/items.json` (`id`, prices, growth, lock state)
- Goals: `data/goals.json` (`id`, conditions, rewards)
- News: `data/news.json` (template text with `sku` replacement)

Rules:

- Keep IDs stable forever.
- Keep `data/*.json` and `DEFAULT_DATA` fallbacks in `js/content/fallbacks/default_data.js` aligned when progression changes.

## Contributor Workflow

1. Make small isolated changes.
2. Keep save compatibility in mind before changing persisted shape.
3. Validate JS syntax:

```powershell
$files = Get-ChildItem -Recurse -File -Include *.js; foreach ($f in $files) { node --check $f.FullName }
```

4. Manually smoke test:
   - start game
   - plant/water/harvest
   - rest day
   - confirm goals and store unlock behavior

## Current Constraints

- `main.js` is reduced but still sizable, and remains a dense wiring layer.
- Many flows still converge into full `renderAll()` and immediate `saveState()`.
- Runtime behavior is split across modules, so dependency wiring mistakes can create missing symbol issues if imports/deps drift.

## Architecture Guardrails

- Keep `js/sim/*` pure (no DOM, no browser UI APIs).
- Keep `js/controllers/*` DOM-free; pass UI behavior through injected deps.
- Keep `js/ui/*` responsible for DOM/event/render concerns, and treat state mutation as runtime/controller-owned unless explicitly intentional.

Use this file as the canonical module map. Keep `task.md` for short-term planning only.
