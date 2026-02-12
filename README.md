# Enter The Market (Web)

Welcome, market legend in the making.

<img src="resources/profiles/player_excited.png" alt="Excited Player" width="84">

This is a browser farming + trading game where you mine, plant, water, harvest, and try to outsmart the market one day at a time.

## Why This Is Fun

<img src="resources/profiles/player_money.png" alt="Money Mood" width="84">

- Grow crops on a 9x9 farm.
- Watch prices shift daily.
- React to weekly news events.
- Complete goals for tools, crop unlocks, and flashy cosmetics.
- Climb from humble seeds to luxury-tier progression.

## Core Features

<img src="resources/profiles/player_goal_unlocked.png" alt="Goal Unlocked" width="84">

- Tools: glove, watering can, pickaxe.
- Goals: single-condition and multi-condition goals.
- Progression: tier-locked crops (`goalLocked`) unlocked through goals.
- Market simulation: only unlocked crops are affected by daily pricing/news.
- Cosmetics: multiple themes, including high-end milestone themes.

## Quick Start

<img src="resources/profiles/player.png" alt="Player Ready" width="84">

If you just want to play, use the hosted version: https://youngwiseone.github.io/enter_the_market_web/

Double-click `index.html` to launch the game locally in your browser.

If you want to host it with a local server instead, that works too.

Example:

```bash
python -m http.server 8000
```

## Project Map

<img src="resources/profiles/farmer.png" alt="Farmer" width="84">

- `index.html`: UI shell + CSS
- `main.js`: game logic/state/rendering
- `data/items.json`: item definitions + prices + locks
- `data/goals.json`: goals + rewards
- `data/news.json`: market news templates
- `guide/`: content authoring guides

## Save Data

<img src="resources/profiles/merchant.png" alt="Merchant" width="84">

- Saves are stored in browser `localStorage`.
- Use the in-game reset when you want a fresh run.

## License

<img src="resources/profiles/player_wrong.png" alt="License Rules" width="84">

This project uses a custom license in `LICENSE.md`.
For AI/automation-specific guidance, see `llms.txt`.

Short version:
- You can use the code to build your own project (including commercial).
- You cannot rehost this game unchanged (including bot-driven scrape/clone/re-upload mirrors).
- If you want to host this exact game as-is, ask for written permission first.

## If You Edit Content

<img src="resources/profiles/player_watering.png" alt="Focused Player" width="84">

- Keep IDs stable (`item.id`, `goal.id`, cosmetic ids).
- Update both JSON data and fallback defaults in `main.js` when changing progression.
- Validate after edits:
```bash
node --check main.js
```

Now go break the market (responsibly).
