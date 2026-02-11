# Playtest Feedback System (Simplified Plan)

## What we will add
- Client-only feedback modal that shows a single-line summary and a Copy button.
- Active playtime tracking (pauses when tab hidden).
- Helpers: `formatPlaytime(ms)`, `formatMoney(n)`.
- Build version string at top of `main.js`.
- Feedback button behavior:
  - On click: auto-copy the formatted string, open the Google Form in a new tab, and show the modal on the game page (so it’s there if they return).

## Mappings found in `main.js`
- Day: `state.player.day`
- Money: `state.player.cash`
- Goals completed / total: `Object.keys(state.goalsClaimed).length` / `state.goals.length`
- Plants count: `state.gridItems` contains placed items; count only growable crops (e.g., item data has `growDays > 0`).

## Steps
1. Add `const BUILD_VERSION = "Web v0.1";` near top of `main.js`.
2. Add global `playtestStats` + active playtime timer (visibility-aware).
3. Add `formatPlaytime(ms)` and `formatMoney(n)`.
4. Add feedback modal HTML + minimal CSS (hidden by default).
5. Wire `#feedbackButton` to open modal and populate the string:
   `EnterTheMarket ${BUILD_VERSION} | Played: ... | Day: ... | Money: ... | Plants: ... | Goals: ...`
   - If any stat missing, show `n/a` and add a TODO in code.
6. On feedback button click:
   - Auto-copy the string.
   - Open the Google Form in a new tab.
   - Show the modal on the current page.
7. Copy button:
   - `navigator.clipboard.writeText()`, fallback to `execCommand('copy')`.
   - Show "Copied!" for ~1.5s.

## Open question
- None.
