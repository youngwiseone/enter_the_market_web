# goals.json Planning (No Implementation Yet)

## Goal
Add a new data file `data/goals.json` to define goal rewards triggered by player milestones, with a structure that is easy to extend and safe to load even if malformed entries exist.

## Scope for the First Version
1. Data-driven goal definitions only (JSON-controlled).
2. Runtime evaluation of goals and awarding goal rewards.
3. Persistent tracking so each goal reward is granted once.
4. Message feedback when an goal is completed.
5. No UI redesign in v1 beyond existing message/feed output.

## Proposed File: `data/goals.json`
Top-level shape:
- `goals`: array of goal definitions.

Each goal definition:
- `id` (string, unique): stable identifier (used for persistence).
- `name` (string): display name.
- `description` (string): short player-facing text.
- `type` (string): goal category (`cosmetic`, `feature`, `economy`, `shop`, etc.).
- `goal` (object): milestone condition.
- `reward` (object): granted effect.
- `message` (string, optional): custom goal completion message.
- `enabled` (boolean, optional, default `true`).

Goal object (v1 set):
- `metric` (string): what to measure, e.g. `cash`, `netWorth`, `day`, `harvestCount`, `itemsHarvested.<itemId>`, `gridUnlockedCount`.
- `operator` (string): `>=`, `>`, `==` (start with `>=` support first).
- `value` (number): threshold.

Reward object (v1 set):
- `grantCosmetic` (string, optional): cosmetic id to award.
- `unlockTool` (string, optional): make a gameplay tool available (example: `watering`).
- `unlockShopItem` (number, optional): make an item purchasable in market/shop.
- `freePurchases` (object, optional): `{ itemId, count }` free next purchases for a specific item.
- `setFlag` (string, optional): feature flag marker for future functionality.

## Example Definitions (Planning)
1. First profit milestone:
- Goal: `cash >= 500`
- Reward: `grantCosmetic: "theme-mono"`

2. Core mechanic goal:
- Goal: `day >= 7`
- Reward: `unlockTool: "watering"`

3. Crop-specific milestone:
- Goal: `itemsHarvested.2 >= 25` (tomatoe)
- Reward: `freePurchases: { itemId: 2, count: 2 }`

## Runtime Architecture Plan
1. Data loading
- Add `loadJSONData()` fetch for `data/goals.json`.
- Store loaded definitions in `DEFAULT_DATA.goals`.
- If load fails, default to empty array.

2. State/persistence
- Add `state.goalsClaimed` (array or set-like map of goal ids).
- Persist in localStorage (`goalsClaimed` key).
- Add optional `state.goalFlags` for future feature toggles.

3. Evaluation timing
- Run `evaluateGoals()` after events that can change goals:
  - end of day (`nextDay`)
  - buy/sell/harvest
  - net worth updates
  - grid tile purchase actions
- Keep evaluation cheap and idempotent.

4. Claim flow
- Skip disabled goals.
- Skip already-claimed ids.
- Evaluate goal condition against current state stats.
- If met:
  - apply reward atomically
  - mark as claimed
  - persist
  - emit message.

5. Safety/validation
- Validate required fields (`id`, `goal`, `reward`).
- Ignore invalid entries with console warning.
- Prevent duplicate id processing by first-seen wins.

## Data Dependencies to Add Before Implementation
1. Decide canonical metrics list for v1.
2. Decide if rewards can stack multiple effects in one goal.
3. Decide if goal rewards should be reversible (default: no).
4. Decide whether retroactive grant should occur on load if goals already met (recommended: yes).

## Implementation Order (When Approved)
1. Define `data/goals.json` schema and seed examples.
2. Extend `DEFAULT_DATA` and `loadJSONData()`.
3. Add persistence fields (`goalsClaimed`, optional stats map).
4. Implement `evaluateGoals()` and reward application.
5. Trigger evaluator at key gameplay mutation points.
6. Add minimal tests/checklist for goal reward correctness.

## Acceptance Criteria
1. Goal definitions can be added/edited via JSON only.
2. Goals are evaluated reliably and each goal reward grants once.
3. Goals and rewards survive reload/reset according to game reset rules.
4. Invalid goal entries do not break gameplay.
5. Players receive clear goal completion messages when rewards are granted.

## Goals Tab Planning (No Implementation Yet)

## Goal
Add a dedicated `Goals` tab that shows:
1. Each goal definition.
2. Current progress toward completion.
3. The reward granted when complete.
4. Status (`In Progress`, `Ready`, `Completed`).

## UX Scope (v1)
1. Add a new top tab button: `Goals`.
2. Keep existing `Farmer's Market` and `Store` behavior unchanged.
3. Goals tab content should be read-only in v1 (no manual claim button if auto-claim remains enabled).

## Proposed Goals View Model
Each rendered row/card should include:
- `name`
- `description`
- `progressText` (example: `$320 / $500`, `12 / 25`)
- `progressPercent` (0-100, clamped)
- `rewardText` (example: `Reward: Monochrome Green theme`, `+5 Capacity`)
- `status`

Suggested statuses:
- `Locked` (not yet met)
- `Ready` (met but not yet processed, only if deferred-claim model is used later)
- `Completed` (reward already granted)

## Data + Logic Dependencies
1. Reuse goal definitions from `data/goals.json`.
2. Add a helper that maps each goal metric to current value:
- `cash`, `netWorth`, `day`, `gridUnlockedCount`, `harvestCount`, `itemsHarvested.<id>`.
3. Add formatter helpers:
- `formatGoalProgress(goal, currentValue)`
- `formatReward(goal.reward)`
- `getGoalStatus(goal)`.

## UI Structure Plan
1. Add a new container panel: `#goals-panel`.
2. Add a tab button: `#tab-goals`.
3. Extend `showTab(tabName)` to support:
- `market`
- `store`
- `goals`
4. Add `renderGoals()` to build rows/cards from goal definitions + live progress.

## Rendering Details (v1)
1. Layout:
- Reuse existing panel + table style (`.panel`, `.zebra-table`) for consistency.
2. Progress display:
- Text first (required).
- Optional simple bar if easy to add without changing current style language.
3. Sorting:
- In-progress first, then completed.
- Secondary sort by completion percent descending.

## Messaging/Feedback Plan
1. Keep goal completion messages in chat feed.
2. In Goals tab, show explicit completed marker so users can see what they already earned.

## Acceptance Criteria for Goals Tab
1. New `Goals` tab is visible and navigable.
2. Each goal shows clear progress and reward text.
3. Completed goals display completed state correctly.
4. Progress values update after relevant gameplay actions without requiring page reload.
5. Tab works on desktop and mobile layout without overlapping sticky farm/messages regions.

## Quick Test Goals (Examples)
Use these as starter entries in `data/goals.json` for fast validation.

1. Day 2 tool goal
- Goal: `day >= 2`
- Reward: `unlockTool: "watering"`
- Why useful: immediately grants a core mechanic and can be validated with one `Next Day` click.

2. First tomatoe grower
- Goal: `itemsHarvested.2 >= 1`
- Reward: `freePurchases: { itemId: 2, count: 2 }`
- Why useful: validates per-item harvest tracking plus “next N purchases are free” behavior.

3. Cash milestone
- Goal: `cash >= 150`
- Reward: `grantCosmetic: "theme-mono"`
- Why useful: easy to hit early and validates cosmetic reward flow.

4. Early product goal
- Goal: `gridUnlockedCount >= 2`
- Reward: `unlockShopItem: 2`
- Why useful: validates goal-driven item availability in the market/shop.

5. Net worth milestone
- Goal: `netWorth >= 250`
- Reward: `freePurchases: { itemId: 1, count: 1 }`
- Why useful: validates non-cash rewards without requiring inventory grant support.

## Example JSON Snippet (Planning)
```json
{
  "goals": [
    {
      "id": "day-2-watering",
      "name": "Early Riser",
      "description": "Reach Day 2 to gain watering can",
      "type": "feature",
      "goal": { "metric": "day", "operator": ">=", "value": 2 },
      "reward": { "unlockTool": "watering" },
      "message": "Goal complete: Watering Can is now available."
    },
    {
      "id": "tomatoe-first-harvest",
      "name": "Tomatoe Starter",
      "description": "Harvest 1 Tomatoe",
      "type": "economy",
      "goal": { "metric": "itemsHarvested.2", "operator": ">=", "value": 1 },
      "reward": { "freePurchases": { "itemId": 2, "count": 2 } },
      "message": "Goal complete: Next 2 Tomatoe Seeds bought are free."
    },
    {
      "id": "cash-150-theme",
      "name": "Pocket Profit",
      "description": "Reach $150 cash",
      "type": "cosmetic",
      "goal": { "metric": "cash", "operator": ">=", "value": 150 },
      "reward": { "grantCosmetic": "theme-mono" },
      "message": "Goal complete: Monochrome Green theme awarded."
    }
  ]
}
```

## Suggested Manual Test Sequence
1. Start a fresh save.
2. Advance to Day 2 and confirm `day-2-watering` goal appears and watering can becomes usable.
3. Plant/harvest tomatoe once and confirm `tomatoe-first-harvest` reward.
4. Buy tomatoe seeds twice after the goal is completed and confirm both purchases are free.
5. Sell enough items to reach $150 cash and confirm theme goal reward.

