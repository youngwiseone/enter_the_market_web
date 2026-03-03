IMPORTANT NOTE:

These are tasks I am still planning, do not work on unless instructed.

# Tasks
- Add more items to buy
- Fix themes in game to all be more readable.
- Show all days of week, highlighting current and include icons.
- Add animals.
- Add other tabs you unlock by helping villagers to reopen their stores (and replace the farmer and dodgy merchant) planned stores are software cosmetics, furniture shop, landscaping, crafting, maybe pet store. Have stories you need to complete to unlock each of these store tabs.
- Add recipes into the game you can craft that will regain energy, can be use as compost on plants to make them more profitable/increase rare chance, gain exp, etc. Click then click on another product to combine.
- Buy more grid/farms + icone to purchase new ones (added 1 but more and tabs for them would be nicer)
- Player avatar frames unlocked with levels (found in shop)
- Select and combine items with each other to produce cooked food, or into a pot/saucepan to cook items to sell for higher prices (avg the rarity of items used to get cooked food rarity). Store the crafted items back on grid.
- add fishing which gives items you can't sell but that affect the market e.g. x2 effect on a plant you are farming. But the physical items take space on grid.
- Introduce rotating market “featured crop” bonuses (daily/weekly) to create short-term goals and variety in planting decisions.
- give a hint at what the next unlock will give the player (what seed is next)
- maybe add prestige for over lvl 99?
- Add events like festivals, metorite landing, thunderstorm, items switching etc. Random days. Exciting gameplay.

# Bigger Tasks

# Late-Game Energy Sink Roadmap (Level 25-50+)

## Problem Statement
Players reach a stable state around Level 30:
- Both farms are fully planted.
- Crops are grown and often held (not sold) due to weak sell incentives.
- Energy spend drops sharply.
- `dayEnergySpent` stays low, so daily market roll strength flattens.

Goal: add repeatable, fun, energy-consuming actions that remain valuable even with full farms, while preserving current architecture (controllers/sim/ui split) and existing progression style.

## Design Targets (Based on Current Runtime)
1. Every new system must consume energy in small repeatable actions (1-5 energy chunks).
2. New actions should produce at least one of:
   - Immediate cash
   - Crop value multipliers
   - Inventory conversion/upgrades
   - Progression unlocks or collection goals
3. Systems should connect to existing market and day roll logic so `nextDay` remains meaningful.
4. First implementation should minimize save-shape risk and reuse existing loops (`grid`, `items`, `goals`, `messages`, `day summary`, `renderAll` path).

## Recommended Implementation Order

## 1) NPC Trade Network (Recommended First)
Why first:
- Best effort-to-impact ratio.
- Reuses current crop inventory and market context.
- Strong energy sink with low animation/interaction complexity.
- Can be introduced as a new tab/panel without heavy minigame framework.

Core loop:
1. Player spends 1 energy to perform a trade attempt.
2. Trade consumes one crop stack/input and returns a different crop, utility item, or short buff.
3. Trade offers rotate daily/weekly and can be influenced by market state/news.
4. Optional reroll button costs energy or cash.

Fun layers to add:
- NPC personalities with bias:
  - Broker: high risk/high reward swaps.
  - Chef: converts bulk low-tier crops into cooking ingredients/buffs.
  - Collector: asks for specific rarity and rewards premium crates.
- Reputation per NPC:
  - Trade streaks unlock better offers.
  - Failed/ignored days reduce quality slightly.
- Contract trades:
  - "Deliver 10 Corn in 3 days" for guaranteed payout + market influence.

Market roll integration:
- Successful trades add to `dayEnergySpent`.
- Some trades create pressure tags (example: "tomato demand spike") that bias next market drift.
- Rare "insider info" trade reward previews a likely featured crop next day.

Technical fit notes:
- New controller candidate: `js/controllers/trade_controller.js`.
- UI candidate: `js/ui/render_trade.js` + tab wiring.
- Data file candidate: `data/traders.json` (NPC profiles + offer pools + weights).
- State additions:
  - `traders.reputation`
  - `traders.dailyOffers`
  - `traders.lastRefreshDay`
- Goals/messages can be extended with new IDs; avoid breaking existing IDs.

Risks:
- Offer quality can accidentally dominate planting economy.
- Need strict guardrails against "infinite conversion loops" (A->B->A profit cycle).

MVP scope:
- 2 NPCs.
- 3-5 daily offers each.
- 1 energy per trade.
- Basic reputation tiers (0-3).

---

## 2) Farm Pet + Care/Training System (Recommended Second)
Why second:
- Strong retention and emotional attachment.
- Good long-term energy sink through care actions and training.
- More content design overhead than trading, but still architecture-friendly.

Core loop:
1. Player purchases or unlocks a pet.
2. Pet has Hunger, Mood, and Stamina.
3. Player spends energy to feed/train/play.
4. Pet grants time-limited farm assistance buffs.

Pet effect examples:
- Auto-water N random tiles at day start.
- +X% rare roll chance for next Y harvests.
- Small chance to duplicate harvested crop.
- Reduce energy cost of one farm action for a day.

Food/quest structure:
- Pet food crafted via specific crop combos.
- "Favorite food" rotates weekly for bonus affection.
- Care milestones unlock pet abilities and cosmetics.

Fun layers to add:
- Pet traits (Lazy, Curious, Greedy) alter buff tendencies.
- Mini errands:
  - Send pet to find trinkets; spends in-game time/day phase.
  - Returns with small market modifiers or rare utility items.
- Companion skill tree:
  - Watering branch
  - Harvest branch
  - Market branch

Market roll integration:
- Care/training actions consume energy and increase roll strength.
- Some pet abilities modify one market category volatility for next day.

Technical fit notes:
- New controller candidate: `js/controllers/pet_controller.js`.
- UI candidate: `js/ui/render_pet.js`.
- Data candidates:
  - `data/pets.json`
  - `data/pet_foods.json`
- State additions:
  - `pet.activePetId`
  - `pet.stats` (hunger/mood/level/xp)
  - `pet.buffsActive`

Risks:
- Passive automation can invalidate core farm actions if too strong.
- Needs careful buff caps and decay so player still engages manually.

MVP scope:
- 1 pet.
- 3 care actions (feed/play/train).
- 2 unlockable passive abilities.

---

## 3) Fishing Minigame (Recommended Third)
Why third:
- High potential for variety and "break from farming."
- Highest implementation cost and balancing complexity.
- Best after trade/pet loops stabilize baseline late-game economy.

Core loop option A (quick-action):
1. Spend energy to cast.
2. Short timing window determines catch quality.
3. Catch gives fish/resource/treasure outcomes.

Core loop option B (session minigame):
1. Spend energy to enter a short 30-60s fishing session.
2. Catch multiple items during session.
3. Session reward summary at end.

Reward design aligned to your note:
- Fish are mostly non-sellable utility items.
- Examples:
  - "Market Bait": doubles one crop's daily trend effect.
  - "Lure Oil": increases chance of favorable daily roll.
  - "Pearl Dust": one-time rarity upgrade on selected harvested stack.
- Some catches can be traded to NPCs for special offers.

Fun layers to add:
- Weather/time-of-day fish pools.
- Rod upgrades with hook modifiers.
- Collection book + museum milestones.

Market roll integration:
- Casting always consumes energy.
- Certain fish explicitly inject temporary multipliers into market pressure or featured crop systems.

Technical fit notes:
- New controller candidate: `js/controllers/fishing_controller.js`.
- UI candidate: `js/ui/render_fishing.js`.
- Potential lightweight loop can live in DOM/CSS/JS without canvas first.
- Data candidates:
  - `data/fish.json`
  - `data/fishing_loot_tables.json`

Risks:
- Can become disconnected side mode if rewards do not feed core economy.
- Tuning required so utility items feel powerful but not mandatory.

MVP scope:
- 1 location.
- 1 simple timing mechanic.
- 8-12 catchables.
- 3 utility consumables tied to market/farm.

---

## Additional Ideas That Fit Current Game

## A) Daily Work Orders Board
- Town requests posted each day ("Deliver 6 Wheat + 2 Rare Carrot").
- Accepting an order costs 1 energy.
- Completing orders gives cash + guaranteed market influence token.
- Very low scope and can be built from goals-like condition evaluation.

## B) Soil/Compost Management Loop
- Spend energy to fertilize or rehabilitate tiles.
- Effects:
  - Faster growth
  - Better rarity odds
  - Better sell price on next harvest cycle
- Adds meaningful energy sink on full farms without new map.

## C) Market Research Actions
- Spend energy to run "analysis" actions.
- Reveals tomorrow trend hints for selected crops.
- Optional gamble mechanic: spend more energy for stronger prediction certainty.

## D) Crop Processing Station
- Convert crops into higher-value goods (juice, preserves, feed, oils).
- Processing actions consume energy and time/day turns.
- Strong synergy with NPC trades and pet feeding.
