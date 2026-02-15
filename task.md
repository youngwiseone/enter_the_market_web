# Enter The Market - Track 2 Juice + Simplification Plan

## Goal
Make new players understand the loop in under 60 seconds and feel satisfying feedback within the first 2-3 actions.

## Scope Rules
- Track 1 is complete and intentionally out of this document.
- Planning only. No implementation in this pass.
- Locked decisions for this track:
1. Onboarding uses guided flow via natural progression unlocks (not hard lockouts).
2. Juice intensity target is medium.
3. Mobile primary baseline is 390x844 (with 360x800 as secondary verification).
- Every task must improve one or both:
1. Clarity (faster understanding, less reading, less decision friction).
2. Juice (stronger visual payoff, better action feel, better momentum).
- If a feature adds complexity without immediate loop value, move it to backlog.

## Design Pillars (Track 2)
- One obvious thing to do now.
- One obvious reason it is a good idea.
- One immediate visual reward when the action completes.
- Keep text short; let visuals do most of the teaching.

## Current Baseline (Already In Game)
- Core tab flow exists (Market, Store, Goals).
- Message history flow exists.
- Buy/sell feedback foundation exists (coin particles, floating text, FX canvas).
- Daily roll modal exists.
- Energy already influences day transition logic.

## Track 2 Roadmap (Refocused)

### T2-1: 60-Second Onboarding + Guided First Profit
- Priority: P0
- Why: This is the highest impact simplification work.
- Outcome: First-time player reaches first profitable sale quickly with minimal reading.
- File targets: `main.js`, `index.html`, optional `data/` goal metadata.
- Plan:
1. Add a strict early-game objective ladder (3-5 micro-steps max).
2. Keep one active objective visible at all times.
3. Add one-line "Do this now" hint that updates after each key action.
4. Gate advanced hints and tabs behind natural progression unlocks until first profitable loop completes.
- Acceptance criteria:
1. Player can complete first profit loop without opening extra panels.
2. Only one objective is active on-screen at any time.
3. Hint text changes immediately after buy/place/sell/rest.
4. Unlock flow feels organic (new options appear as rewards, not forced lock screens).

### T2-2: Profit Readability at Decision Time
- Priority: P0
- Why: Players should instantly know if an action is smart.
- Outcome: Every item decision communicates expected outcome before commit.
- File targets: `main.js`, `index.html` (+ CSS).
- Plan:
1. On item select, show buy cost, current value, projected delta, and margin.
2. Use consistent color semantics (loss red, neutral gray, profit green).
3. Add lightweight outcome chips/icons so meaning is visible at a glance.
4. Keep touch and desktop interactions behaviorally identical.
- Acceptance criteria:
1. Selected item always displays projected gain/loss.
2. No ambiguous states where the player cannot tell expected result.
3. Data remains readable at mobile widths.

### T2-3: Action Juice Pass (Buy/Sell/Place/Harvest)
- Priority: P0
- Why: Immediate payoff is the fastest way to reinforce the loop.
- Outcome: Key actions feel punchy and responsive without becoming noisy.
- File targets: `main.js` FX pipeline, `index.html` CSS animation tuning.
- Plan:
1. Standardize action feedback bundles per action (visual pulse + float value + particle burst).
2. Tune effect duration and amplitude to medium intensity (snappy, readable, non-blocking).
3. Increase positive feedback intensity for successful profit events.
4. Add reduced-motion-safe fallback behavior.
- Acceptance criteria:
1. Buy/sell/place/harvest all have clear, distinct feedback.
2. Effects never block input or obscure critical UI.
3. Reduced-motion mode preserves information without motion overload.
4. FX style is noticeable and rewarding but not visually noisy over repeated loops.

### T2-4: Day-End Payoff That Teaches the Loop
- Priority: P1
- Why: Rest should close the loop with clear cause/effect.
- Outcome: End-of-day screen explains what happened and what to do next.
- File targets: `main.js`, `index.html` summary UI.
- Plan:
1. Keep daily roll modal and add concise summary step after it.
2. Show only high-value info: sold count, day profit, top win, notable market shift.
3. Add "next day opportunities" strip (arrivals/unlocks/highlighted chance).
4. Make summary skippable and quick to dismiss.
- Acceptance criteria:
1. Player can explain why day outcome changed.
2. Player sees at least one actionable next-day suggestion.
3. Flow never traps input after close.

### T2-5: Energy as Readable World Mood (Not Just a Number)
- Priority: P1
- Why: Ambient state supports juice and communicates pacing.
- Outcome: Morning/midday/night state shifts based on energy bands.
- File targets: `main.js` state mapping, `index.html` CSS.
- Plan:
1. Map energy bands to time-of-day visuals.
2. Apply subtle global styling shifts with safe contrast.
3. Keep transitions smooth and minimal.
4. Ensure HUD/table readability in all states.
- Acceptance criteria:
1. Visual state changes predictably with energy.
2. No readability regression in any band.
3. No harsh flashes during transitions.

### T2-6: Mobile Clarity + Comfort Pass
- Priority: P1
- Why: New players on small screens are most sensitive to friction.
- Outcome: Core loop remains easy on common mobile resolutions.
- File targets: `index.html` responsive CSS, `main.js` resize hooks if required.
- Plan:
1. Raise minimum legible type and spacing for key actions/HUD.
2. Add grid zoom option where density is high.
3. Preserve scroll behavior for market content while keeping primary actions visible.
4. Validate tap targets on 390/412 first, then verify 360/375 for fallback stability.
- Acceptance criteria:
1. No clipped critical labels on target widths (starting with 390x844 baseline).
2. No blocked primary actions during normal play.
3. No horizontal overflow in core loop screens.

### T2-7: Post-Core Content Expansion
- Priority: P2
- Why: More content should come after clarity and juice are stable.
- Outcome: Adds depth without undermining onboarding.
- File targets: `main.js`, `data/`, `index.html` labels.
- Plan:
1. Add more items with balanced early-game ranges.
2. Add day-of-week display with clear current-day highlight and icon.
3. Expand unlockable store roadmap with milestone-gated progression.
4. Keep new systems hidden until players finish core onboarding loop.
- Acceptance criteria:
1. Economy pacing remains stable after item expansion.
2. Day/week context is always understandable at a glance.
3. Unlock states are explicit and motivating.

## Deferred Backlog (Not in This Track 2 Cycle)
- Weather system.
- Animals.
- Deep crafting/recipes and combine systems.
- Drag-and-drop sell/reorganize/cook workflows.
- Advanced cosmetic progression extensions.

## Success Metrics (Updated)
- First profitable loop completion target: under 90 seconds for new players.
- Time-to-understand core loop target: under 60 seconds.
- Every core action produces immediate readable feedback.
- Day transition leaves player with a clear next action.
- Mobile users can complete full loop without layout friction.

## QA Checklist (Juice + Simplicity)
- New player can follow onboarding without opening secondary UI.
- Only one primary objective/hint is visible at any moment.
- Early progression unlocks feel natural and rewarding, not restrictive.
- Item decision view clearly shows expected result before action.
- Buy/sell/place/harvest each feel distinct and responsive.
- Action FX remains medium intensity over repeated play (clear but not overwhelming).
- Day-end summary clearly states: results + next opportunity.
- Energy mood shifts are visible and readable.
- Mobile 390x844 passes readability and tap-access checks first; 360x800 also passes secondary checks.
- No console errors during repeated action loops and day transitions.

## Build Sequence
1. T2-1 60-second onboarding and guided first profit.
2. T2-2 profit readability at decision time.
3. T2-3 action juice pass.
4. T2-4 day-end payoff teaching loop.
5. T2-5 energy mood visuals.
6. T2-6 mobile clarity and comfort.
7. T2-7 post-core content expansion.
