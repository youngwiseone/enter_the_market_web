# Player Level + XP Plan (Planning Only)

Goal: add player progression through XP/levels earned by normal play actions (planting, mining, harvesting, goals), with a clear UI indicator and meaningful but controlled gameplay rewards.

## Scope
- Planning only.
- No implementation changes in this step.

## UX Direction
- Place the level display in the Messages panel area:
  - under the messages banner (`C:\MARKET\MESSAGES>`)
  - above the player profile image
  - left side of the chat row
- Slightly shrink profile avatar so there is room for:
  - `Level: X`
  - optional small XP progress bar

## Core Progression Model

### Data Model (planned)
- `playerLevel`: integer, starts at `1`
- `playerXp`: integer, starts at `0`
- `playerXpToNext`: derived from level curve
- optional telemetry:
  - `totalXpEarned`
  - `xpGainedToday`

### XP Sources (planned baseline)
- Plant seed: `+2 XP`
- Water action: `+1 XP`
- Harvest crop: `+6 XP`
- Mine tile/resource: `+4 XP`
- Complete goal: `+20 XP`

### Level Curve Options
1. Linear
- `xpToNext = 30 + (level - 1) * 10`
- Easy to tune and explain.

2. Light exponential (recommended)
- `xpToNext = round(30 * 1.18^(level - 1))`
- Feels progressive without becoming grindy too early.

3. Milestone bands
- Levels 1-5 fast, 6-10 medium, 11+ slower.
- Best for hand-tuned pacing but more maintenance.

Recommended: start with light exponential.

## What Leveling Affects

### Primary Effect (recommended)
- Increase daily energy cap as player levels.
- Start energy at `5` instead of `10`.
- On level-up: fully refill energy to current max.

Planned mapping:
- Level 1: `5` max energy
- Level 2: `6`
- Level 4: `7`
- Level 6: `8`
- Level 8: `9`
- Level 10+: `10` cap

This gives clear growth while preserving late-game balance.

Level cap:
- Cap player level at `20` for now.
- At cap, XP gain can stop or be ignored (implementation choice), but level must not exceed 20.

### Optional Secondary Effects (later phases)
- Small passive sell bonus (e.g. `+1%` at certain milestones, capped low).
- Reduced energy cost for one action type at high levels.
- Player cosmetic unlocks tied to level milestones (deferred to later phase).

Not recommended for first release:
- direct cash per level (inflation risk)
- large market price modifiers (can break economy feel)

## Anti-Exploit Rules (Planning)
- Cap XP per action type per day if needed (especially watering/mining loops).
- No XP for failed actions.
- If adding XP for water, only grant on valid growth-impacting water.

## UI Plan
- In Messages panel left column:
  - line 1: `Level: X`
  - line 2: compact XP bar + `current / next`
  - line 3: player avatar (slightly smaller)
- On level-up:
  - add high-priority message in chat log
  - show a modal using the same presentation style/pattern as `Goal Unlocked`
  - modal image: `resources/profiles/player_level_up.png`
  - modal title: `Level Up`
  - modal body should include:
    - new level reached (example: `Level 6 reached`)
    - short description of changes granted by this level (example: `Max energy increased to 8` or `Energy fully refilled`)
  - use `resources/profiles/player_level_up.png` as the profile image/emotion for the level-up message
- On XP gain:
  - show floating/feedback XP gain similar to cash gain feedback on harvest
  - use `resources/effects/xp_01.png` and `resources/effects/xp_02.png`

## Save / Migration Plan
- Existing saves:
  - if no XP fields exist, initialize to:
    - `playerLevel = 1`
    - `playerXp = 0`
- Recompute current max energy from level on load.
- Preserve current energy by clamping to new max.

## Rollout Phases
1. Phase 1 (MVP)
- XP gain on plant/water/mine/harvest/goal.
- Level + XP UI in Messages panel.
- Energy cap progression by level.
- Full energy refill on level-up.
- Level cap enforcement at 20.

2. Phase 2
- Tune XP values after playtesting.
- Add level-based player cosmetic unlocks.

3. Phase 3
- Consider one additional low-impact gameplay perk if needed.

## Tuning Targets
- Reach Level 2 within first 1-2 in-game days.
- Reach Level 5 around early-mid progression.
- Reach Level 10 around Tier 3/4 transition.
- Players should feel stronger, not overpowered.

## Locked Decisions
1. Watering grants XP.
2. Level-up grants a full energy refill.
3. Level cap is 20 (for now).
4. Level-based cosmetics are deferred to a later phase (not in MVP).

## Acceptance Criteria (Planning Phase)
1. A clear MVP leveling design exists with XP sources and a level curve.
2. Energy progression is defined from Level 1 to Level 10 cap.
3. UI placement is specified relative to current Messages panel.
4. Level-up flow uses a Goal-Unlocked-style modal with `player_level_up.png`, new level text, and change summary.
5. XP gain visuals use `xp_01.png`/`xp_02.png`.
6. Migration/tuning risks are identified before implementation.
