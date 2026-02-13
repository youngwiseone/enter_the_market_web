# Daily Roll + Market Fatigue Plan (Planning Only)

Goal: improve the Rest/day-roll experience so it is exciting, clearly communicated, and story-rich, while keeping anti-skip behavior intuitive.

## Scope
- Planning only for this update.
- Do not implement code changes in this step.

## Locked Direction
1. Keep **Market Fatigue** (no cash fee).
2. Keep **news/story articles** visible under roll outcomes.
3. Use **item harvest icons** (not seed icons) in the roll UI.
4. Upgrade roll presentation with stronger reel animation and duplicate-hit celebration effects.

## Market Fatigue (Energy-Based)

### Rules
- Market Fatigue is driven by **remaining energy percent at Rest**.
- Formula direction:
  - `energyRatio = energy / energyMax` at end of day.
  - roll impact multiplier becomes `1 - energyRatio`.
- Example:
  - `5 / 10` energy left => `50%` less roll impact.
  - `0 / 10` energy left => full roll impact (no stagnation).
  - `10 / 10` energy left => `100%` stagnation (no roll impact change).
- Important behavior:
  - This does **not** force negative outcomes.
  - It dampens both positive and negative effects equally (more stagnant market).

### Communication Requirements
- Must always show the computed stagnation in the modal:
  - badge: `Market Fatigue: XX% Stagnation`
  - subtext: `Higher leftover energy reduces both upside and downside movement.`
- Must log a clear chat line on rest with exact value:
  - `Market fatigue applied: XX% reduced roll impact from leftover energy.`

### Optional Streak Variant (if needed)
- Not required for current direction.
- Player mastery/abuse at later levels is acceptable by design.

## News Story Layer (Required)

### Requirement
- Keep/restore story text under roll results so market changes feel narrative, not purely mechanical.

### Format
- Under each rolled item, show:
  - headline (short)
  - 1 sentence article/body
  - impact summary (`+12%`, `-8%`, stacked note if applicable)

### Source
- Use existing news templates/data where possible, mapped to rolled items.
- If same item is rolled multiple times, article can mention compounding pressure.

## Roll UI Content (Icon + Text)

### Visual Content Per Reel
- Harvest item icon (from `harvestImage` path).
- Item name.
- Impact direction/value.

### Why
- Faster recognition than text-only.
- More exciting result reveal.

## Roll Animation Upgrade

### Reel Motion
- Show vertical reel illusion with items visible above and below center.
- Reel should decelerate into final result (not instant swap text).

### Duplicate-Hit Feedback
- If same item appears multiple times:
  - final result cards shake briefly.
  - burst/sparkle effect triggers.
  - stacked indicator appears (`x2`/`x3 stacked`).

### Priority
- Motion must remain readable on desktop and mobile.
- Respect reduced-motion preference with simplified fallback.

## Data/State Planning
- Add/track:
  - `lastRollFatiguePercent` (derived from end-of-day energy ratio).
  - `lastRollImpactMultiplier` (e.g. `0.5` when 50% stagnation).
  - rolled item presentation data:
    - `itemId`, `itemName`, `harvestImage`, `impactPct`, `stackCount`, `storyHeadline`, `storyBody`

## Acceptance Criteria (Planning)
1. Market Fatigue is computed from end-of-day energy percent and clearly shown to player.
2. Roll modal includes narrative news text for each result.
3. Reels display harvest icons and not seed icons.
4. Reel animation clearly shows scrolling items above/below center.
5. Duplicate rolls produce distinct shake/effect/stack feedback.
