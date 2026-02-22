# Rain Weather (Planning Only - Do Not Implement Yet)

Goal: add a Rain day that feels helpful and flavorful, with a real tradeoff that does not punish players for "not watering" and does not create wait/AFK incentives.

## Core Constraints

- Day/state based only (no real-time timers).
- Rain should be immediately understandable.
- Rain should help with watering.
- Downside should change decisions, not feel like random tax.

## Rain - Core Effect (MVP)

- Daily weather roll can produce `rain`.
- On Rain day start:
  - all planted crops on eligible farm(s) are set to watered.
- Optional extension (later):
  - newly planted crops on Rain day start unwatered as normal (simpler), or
  - rain also auto-waters newly planted crops after placement (stronger fantasy, more code complexity).

Recommended first pass:
- Auto-water existing planted crops at day start only.
- Keep behavior simple and highly visible.

## Rain Downside Ideas (Better Tradeoffs)

Avoid:
- "You need to water more" (conflicts with rain fantasy and can feel annoying).
- Pure flat market price penalty (can feel disconnected).

### Best Fit Candidates (non-punitive, decision-shaping)

- **Muddy Ground (Action Friction)**
  - Positive: crops are watered for free.
  - Negative: mining actions cost +1 energy (or give slightly less yield) that day.
  - Why it works: thematic, readable, and shifts player toward farming/harvesting.
  - Why it avoids frustration: does not negate the watering benefit or punish inability to water.

- **Low Sunlight (Growth Tradeoff)**
  - Positive: free watering.
  - Negative: crop growth progression gains are reduced/slower that day.
  - Why it works: very understandable ("rainy/cloudy slows growth"), especially if growth is a same-day update system.
  - Risk: if growth pacing is already tight, this may feel invisible or frustrating.

- **Slippery Handling (Harvest/Sell Friction)**
  - Positive: free watering.
  - Negative: reduced harvest efficiency in a different lane (e.g., no rare bonus rolls that day, or lower XP from harvest actions).
  - Why it works: preserves watering value while making Rain not a pure upside.
  - Risk: can feel arbitrary if not communicated clearly.

- **Shop Traffic Shift (Store Tradeoff)**
  - Positive: free watering.
  - Negative: shop prices/availability are slightly worse that day (buy-side only, not sell-side).
  - Why it works: avoids punishing crop earnings directly and creates a "farm day" identity.
  - Risk: weaker if players are not shopping often.

## Recommended Downside for First Prototype

Choose one:

- **Primary recommendation: Muddy Ground**
  - Rain auto-waters crops.
  - Mining is less efficient that day (`+1` energy OR reduced ore yield).
  - Creates a clear "focus on crops today" decision.

Fallback if mining interaction feels too niche:
- **Shop Traffic Shift (buy-side friction only)** for a softer tradeoff.

## Rain Visual Ideas (Over the Grid)

Goal: make Rain feel visible and satisfying without obscuring crop readability or click targets.

### Option A (Recommended): Screen-Space Rain Overlay + Wet Grid Tint

- Add a rain particle layer above the farm grid (falling diagonal streaks).
- Add a subtle cool/darker tint to farm tiles while Rain is active.
- Add small occasional splash particles on grid cells.

Pros:
- Strong weather readability.
- Minimal dependency on tile content/state.
- Easy to disable/reduce for performance.

Cons:
- Needs careful layering so selection highlights/cursors remain visible.

### Option B: Per-Cell Rain FX

- Animate droplets/splashes directly on each visible grid cell.
- Add "wet sheen" highlight on watered cells.

Pros:
- Tightly tied to the grid.
- Can reinforce which crops are watered.

Cons:
- Heavier and more complex.
- More DOM/canvas work if many cells animate independently.

### Option C: Background/Atmosphere + Minimal Grid FX

- Cloudy overlay / dimmer ambient lighting.
- Occasional lightning-free rain streaks in the scene background.
- Very light grid splash accents only.

Pros:
- Lowest visual noise.
- Good if UI readability is top priority.

Cons:
- Rain may feel too subtle, especially on mobile.

## Visual Direction Recommendation (First Pass)

Use a hybrid of A + C:

- Rain streak overlay (light density)
- Subtle wet/cool tint on farm area
- Sparse splash accents on random grid cells
- Keep tile contents, rarity indicators, and pointer target states fully readable

This should sell the weather fantasy without forcing deep per-cell FX logic.

## UX / Messaging

- Day-start message example:
  - "Rain today: your planted crops are watered. Muddy ground makes mining harder."
- Add small weather label/icon in HUD or farm header while active.
- If possible, include a short tooltip/legend for the downside.

## Open Questions (for Feel Testing)

- Rain should apply to all farms or active farm only?
- Should rain auto-water only at day start, or also affect newly planted crops on that day?
- For `Muddy Ground`, is `+1 energy mining cost` or `reduced mining yield` less frustrating?
- How visible should rain be on mobile (performance vs atmosphere)?

## Suggested Prototype Order (Later)

1. Implement Rain state + day roll + UI label.
2. Implement day-start auto-watering.
3. Implement one downside (`Muddy Ground`).
4. Add simple rain overlay visuals on farm grid.
5. Playtest readability/performance and tune visual intensity.

## Success Criteria

- Rain is immediately visible and understandable.
- Rain changes player priorities in a readable way.
- Downside feels thematic, not punitive.
- No AFK/waiting exploit incentives.
