# Task Plan: Cleaner Rest Day Market Roll UX (Planning Only)

## Objective
Refine the Rest Day market roll so it is fast to read and visually exciting:
- Bigger item images
- Remove long story text and duplicates
- Show concise impact tags like `+20%` / `-8%` beside each item icon
- Keep or increase animation juice while maintaining readability

No implementation in this task; planning only.

## Current Pain Points
- Modal currently shows both per-reel summaries and full story cards (`headline` + `article`), creating too much text.
- News templates can repeat wording and feel duplicated between reels.
- Important information (actual percent change) is diluted by paragraph text.

## Target UX (What "Better" Means)
- Primary focus is icon + impact number.
- Each reel resolves clearly, with energetic presentation.
- Text is minimal and non-redundant.
- Player can identify all 3 outcomes at a glance, even with richer animation.

## Proposed UI Direction
- Keep 3 reels, but simplify each result to:
  - Large item icon
  - Item name (short)
  - Impact chip: `+20%`, `-12%`, and optional stack marker `x2`
- Remove long story blocks from the modal body.
- Keep one short top-level line for fatigue only.
- Keep one short bottom summary line (optional), no full article text.
- Keep strong visual payoff: clearer settle effects, highlight pulses, and impact emphasis.

## Data/Logic Direction
- Keep underlying roll math unchanged for this pass (impact generation, stacking, fatigue scaling).
- Change display model only:
  - Stop rendering `storyHeadline`/`storyBody` in modal.
  - Use percent impact from existing `itemEffect.adjustedImpactPct`.
- If duplicates occur (same item rolled multiple times), show one clear stack indicator near impact.

## Planned Implementation Steps (Next Task)
1. `main.js`: simplify modal rendering
- Update `showDailyMarketRollModal(...)` to render concise result-only UI.
- Remove/disable `renderDailyRollStory(...)` usage in modal flow.
- Ensure final text per reel is short: `<Item> <+/-X%> [xN]`.

2. `index.html`: simplify modal structure
- Remove or hide `daily-roll-stories` section.
- Keep fatigue line + reels + continue button.
- Keep accessibility labels intact for dialog and button.

3. `index.html` CSS block: visual rebalance
- Increase reel item image size.
- Reduce visual weight of paragraph text elements.
- Add clear impact-chip style (positive/negative colors).
- Maintain responsive layout for mobile.

4. `main.js`: increase animation juice without text noise
- Keep current timing unless pacing feels slow after UI cleanup.
- Enhance settle/pulse/highlight moments so results feel impactful.
- Keep reduced-motion branch readable and less intense.

5. Optional (if still noisy): tighten message log output
- Shorten `addMessage("Market roll: ...")` format to avoid long chat spam.

## Acceptance Criteria
- Rest Day roll modal shows no paragraph story text.
- Each resolved reel prominently shows icon + `%` impact.
- Duplicate item rolls do not produce repeated long text; stack shown as compact marker.
- Animation feels at least as lively as current version, ideally richer.
- No change to economic calculations (only presentation and pacing).

## Risks / Watchouts
- Removing stories may reduce flavor; can reintroduce as optional tooltip later.
- Larger icons could overflow on small screens if reel sizing is not clamped.
- Extra effects can become noisy if not visually prioritized around final `%` result.

## QA Checklist (After Implementation)
- Trigger multiple rests and confirm short, readable outcomes each time.
- Validate positive/negative impact labels match actual applied price changes.
- Validate duplicate rolls show stack indicator and correct final impact.
- Check mobile width behavior for icon size and text wrapping.
- Check reduced-motion mode still works and remains clear with toned-down effects.
