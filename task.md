# Goal Expansion Plan (Planning Only)

Goal: add a second progression layer that shapes playstyle after tier unlocks, without implementing any code changes yet.

## Scope
- This document is planning only.
- No changes to `main.js`, `data/goals.json`, or `data/items.json` in this step.

## Feature Direction
- Keep existing tier-unlock goals as the core progression spine.
- Add complementary goals that reward:
  - crop variety
  - expansion pacing
  - premium milestone completion
- Prioritize reward styles:
  - cash rewards (`cashBonus`, planned schema addition)
  - hybrid rewards (cash + an existing reward shape)
- Existing reward shapes still used in hybrids:
  - `freePurchases`
  - `grantCosmetic`
  - `setFlag`
- Explicitly out of scope for this phase:
  - temporary price-stability effects
  - one-time farm-tile unlock rewards

## Proposed Goal Pack (Phase 1)
1. `diversified-grower`
- Intent: teach variety early.
- Condition direction: harvest at least 1 crop from 4 different starter crop IDs.
- Reward direction: hybrid reward (`cashBonus` + small `freePurchases` seed bundle).
- Planning target: `$50` cash + 2 free starter seeds.

2. `steady-expander`
- Intent: encourage measured farm growth.
- Condition direction: reach a day milestone and a farm-tile unlock milestone together.
- Reward direction: cash reward (no extra effect).
- Planning target: `$150` cash.

3. `premium-first-harvest`
- Intent: make elite progression feel meaningful.
- Condition direction: first harvest of the premium-tier crop.
- Reward direction: hybrid reward (`cashBonus` + prestige cosmetic/flag).
- Planning target: `$500` cash + high-status cosmetic (optional `setFlag`).

## Candidate Goals (Later Phases)
1. `tier2-operator`
- Mid-game consistency milestone after Tier 2 access.

2. `cash-buffer`
- Efficiency milestone tied to cash pacing.

3. `market-marathon`
- Long-run milestone for post-Tier-4 engagement.

## Rollout Plan
1. Add only the Phase 1 goals first.
2. Keep thresholds conservative to avoid balance shock.
3. Run 2-3 playtest passes and record:
- average day each goal is completed
- whether rewards feel noticeable but not mandatory
- whether any goal competes with tier unlock pacing
4. Tune thresholds/rewards once before considering later-phase goals.

## Data Planning Notes
- Target file for eventual goal entries: `data/goals.json`.
- Keep IDs stable and descriptive.
- Add `cashBonus` reward support as a small, isolated schema extension before wiring goal entries.
- Keep all non-cash reward pieces on existing shapes (`freePurchases`, `grantCosmetic`, `setFlag`).
- If new condition operators are needed later, treat that as a separate engine task.

## Acceptance Criteria for Planning Phase
1. A clear, implementation-ready goal set exists for the next build step.
2. Goals are ordered by rollout priority (Phase 1 first).
3. Reward and condition choices stay within current system capabilities.
4. No implementation is performed in this planning step.
