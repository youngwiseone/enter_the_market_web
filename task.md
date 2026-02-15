
# Playtest Feedback Plan - Round 1 (Planning Only)

## Context
- Session: `32m28s`, reached `Day 108`, `6/13` goals.
- Player sentiment: positive core loop (`money growth`, `get rich`) and high feature ratings (`4-5/5`).
- Main friction: "so much clicking" (stopped because tired).
- Confusion: "above average / below average" meaning is unclear.
- Requested vibe: "more colour".

## Design Goal For Next Pass
Keep the satisfying money/progression loop, while reducing repetitive input and making market signals instantly understandable.

## Priority Tracks

## Track 1 - Reduce Click Fatigue (Highest Priority)
### Why
Click load is currently the #1 churn risk, even for a player who enjoyed the game.

### Plan
1. Batch farm actions:
- Add drag-to-water and drag-to-harvest across tiles while a tool is selected.
- Support click-and-hold paint behavior for the current tool.
- Add click-and-hold planting while a seed/item is selected (plant continuously across valid tiles).
- Add drag-to-plant sweep mode (same behavior pattern as water/harvest).
2. Faster selling flow:
- Keep current per-item sell, and add optional quick actions:
  - `Sell Selected Stack`
  - `Sell All Grown`
  - `Sell All of Type`
  - `Sell All (Confirm)` for end-of-day cleanup.
3. Day transition pacing:
- Keep `Rest` as the same core action, but reduce total taps during day-end result flow.
- Allow one-tap dismiss of roll/messages (already partly in place) and ensure it is consistent everywhere.
4. Fewer tool-switch clicks:
- Optional auto-tool swap when context is obvious:
  - Empty tile + seed selected -> plant
  - Mature crop tapped -> harvest
- Keep manual mode available for players who want precision.
5. Bulk intent actions:
- Add optional `Water All Dry` (costs energy) and `Harvest All Ready` (costs energy) buttons.
- Gate these by early progression unlock so first-time players still learn base loop.
6. Input shortcuts + defaults:
- Preserve desktop hotkeys and add mobile-friendly equivalents (press-and-hold gestures / larger hit areas).
- Auto-keep last tool selected after action (unless player changes).
- Add repeat-action mode toggle for mobile (single tap enables "continuous tool" until cancelled).

### Acceptance Criteria
1. Average actions needed for a normal day reduced by at least ~30%.
2. No loss of control for players who prefer manual precision.
3. Mobile play feels less fatiguing over a 15+ minute session.
4. Planting a full field can be done by hold/drag instead of single-tap per tile.

## Track 2 - Market Clarity (High Priority)
### Why
Price guidance language is currently understandable to us but not instantly clear to first-time players.

### Plan
1. Replace abstract wording:
- Move from "above/below average" phrasing to plain language:
  - `Great Deal`, `Fair Price`, `Overpriced`
2. Add hover/tap explanation:
- Keep short label visible.
- On hover (desktop) / tap info (mobile), show detailed explanation including baseline/average meaning.
3. Align with color semantics:
- Good buy = green family
- Risky/high price = red family
- Neutral = amber/gray
4. Keep explanation near the decision point:
- Place the signal directly under price (already aligned in UI direction), and ensure it remains visible and legible.

### Acceptance Criteria
1. New players can explain what the label means after first day.
2. No ambiguity between buy-value signals and rarity/profit signals.

## Track 3 - More Colour + Juice (Medium Priority)
### Why
Core loop is fun; visual juice can amplify retention without changing mechanics.

### Plan
1. Stronger color identity by game state:
- Better day-state palette shifts (morning/midday/night style groundwork).
- More saturated but readable accent colors for economy states.
2. Zone-based color coding:
- Farm area: warmer/natural greens and browns.
- Shop/market area: stronger economic accent colors (green/red/amber).
- Goals/progression area: celebratory gold/cyan accents.
3. Reward feedback polish:
- Stronger positive feedback for profitable actions (cash pop, subtle burst, short sound-ready hooks).
- Keep failures/suboptimal actions readable but not punishing.
3. Visual hierarchy cleanup:
- Make key numbers (cash delta, profit, value signals) stand out first.
- Reduce visual noise in secondary text.
4. Crop and rarity visual differentiation:
- Increase hue separation per crop type so icons are easier to scan quickly.
- Add subtle rarity tint frame/glow that is readable but not overwhelming.
5. Dynamic background + lighting:
- Apply subtle gradient/lighting shifts by time-of-day and weather state.
- Keep contrast checks so text remains legible on mobile.
6. Feedback color language consistency:
- Profit/success always use one green family.
- Loss/risk always use one red family.
- Neutral/info always use one amber/blue-gray family.

### Quick Wins (Low Effort, High Impact)
1. Refresh panel backgrounds with soft gradients instead of flat fills.
2. Increase saturation of action states (`selected`, `ready`, `completed`).
3. Add colored row highlights in item/goal tables for important states.
4. Add color pulse on profitable sell events.

### Acceptance Criteria
1. UI feels more alive without reducing readability.
2. Critical gameplay text remains legible on mobile.

## Track 4 - Onboarding Through Natural Unlocks (Medium Priority)
### Why
Player understood "get rich", but clarity can improve by revealing complexity gradually.

### Plan
1. First-session ramp:
- Day 1-3: basic buy/grow/sell only.
- Introduce advanced info signals and shortcuts after first success moments.
2. Contextual micro-tips:
- One-line tips tied to player action, not long tutorial blocks.
3. Goal language refresh:
- Keep goals short, concrete, reward-focused.

### Acceptance Criteria
1. First 5 minutes feel obvious and low-friction.
2. Experienced players can still move fast.

## Execution Order Recommendation
1. Track 1 (click-fatigue fixes)
2. Track 2 (clarity rewrite for pricing signals)
3. Track 3 (color/juice pass)
4. Track 4 (unlock/onboarding refinement)

## Click-Load Micro-Roadmap (Recommended)
1. Phase A: Hold/drag parity for plant + water + harvest.
2. Phase B: Sell quick-actions + repeat-action mode.
3. Phase C: Optional bulk actions (`Water All Dry`, `Harvest All Ready`) as unlocks.
4. Phase D: Smart auto-tool context (with toggle in settings).

## Colour Pass Micro-Roadmap (Recommended)
1. Phase A: Define unified color tokens for success/risk/neutral.
2. Phase B: Apply tokens to market labels, profit readouts, and goal states.
3. Phase C: Add day-state lighting and subtle panel gradients.
4. Phase D: Add crop/rarity differentiation polish.

## Validation Plan (Next Playtest)
1. Ask the same tester to do a 20-30 minute replay after Track 1+2.
2. Capture:
- "Did clicking feel better?" (yes/no + why)
- "Do you understand price signals immediately?" (yes/no)
- "Where did friction remain?"
3. Success target:
- Keep enjoyment at `>=4/5`
- Reduce chore/click complaints as primary negative feedback.

## Notes
- This file is planning only.
- Do not implement from this plan until explicitly instructed.
