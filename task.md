# Enter The Market - Simplification + Juice Plan (Current Scope)

## Goal
Make the game easy to understand in under 60 seconds, while feeling rewarding and lively within the first 3 minutes.

## Scope Rules For This Pass
- No sound work yet.
- Exclude all previously "move later" features from this plan.
- Treat work as two separate tracks in strict order.
1. Bug fixes first.
2. Upgrades second.

## Locked UX Clarifications
- During gameplay, hide persistent bottom message panel on both desktop and mobile.
- Show compact message preview in the market header area (left side).
- Compact preview content: small profile icon + single-line latest message text.
- Profile icon remains visible at all times during gameplay and reflects latest speaker emotion.
- Compact text auto-hides after `3s`; icon stays visible.
- Full message history open method: tap the compact profile icon in header.
- Opening message history replaces the main market/shop content area with message history view.
- Preserve the previously active tab (Market/Store/Goals) while history is open, and restore it on close.
- Full message history close methods:
1. Tap explicit close control.
2. Tap overlay backdrop.
- Show unread count badge next to the icon.
- Unread definition: messages received since the last time the icon was tapped to open full history.
- Unread resets immediately when history is opened.
- Move `Rest` into the market header tab row and style it like `Market`, `Store`, and `Goals`.
- Apply the same message/history/header interaction model to desktop and mobile.

## Product Principles
- One clear objective at a time.
- Fewer systems visible early.
- Every key action should give immediate visual feedback.
- Reduce reading load with short labels and guided prompts.

## Core Problems To Solve
- Mobile layout blocks core actions (grid/messages interfering with Market/Store tabs).
- Desktop HUD overlap bug (levels hidden under profile icon).
- New players still need clearer guidance and stronger moment-to-moment feedback.

## Implementation Order

## Track 1 - Bug Fixes (Do First)

### Bug-1: Desktop level text hidden under profile icon
- Priority: P0
- File targets: `index.html` (HUD/messages panel layout + CSS), `main.js` (`renderPlayerLevelStatus` + resize flow)
- Implementation checklist:
1. Inspect current `chat-profile-column` constraints and level/xp text clipping conditions.
2. Reserve dedicated non-overlapping space for `#player-level-label`, `#player-xp-bar`, and `#player-xp-text`.
3. Ensure profile avatar scales without covering level/xp block.
4. Keep selector/id compatibility so existing HUD updates continue to work.
- Acceptance criteria:
1. At 1280x720, 1366x768, 1440x900, and 1920x1080 the level text is fully visible.
2. Profile avatar and level/xp text never overlap at 100% browser zoom.
3. No regressions to day/cash/net worth HUD readability.

### Bug-2: Mobile grid too dominant and blocking core controls
- Priority: P0
- File targets: `index.html` (responsive CSS + layout rules), `main.js` (`updateGridSize`, resize observers)
- Implementation checklist:
1. Cap mobile grid size using viewport-based max that preserves access to Market/Store/Goals and header controls.
2. Rebalance vertical allocation between grid, header controls, and content area.
3. Rework `--grid-size`, `--messages-height`, and `--bottom-bar-height` logic after removing bottom persistent messages panel.
4. Re-run sizing after tab switches, orientation changes, and message mode transitions.
- Acceptance criteria:
1. On 360x800 and 390x844, Market/Store/Goals/Rest remain tappable during normal play.
2. Grid remains playable and readable without overlapping top controls.
3. No horizontal overflow on mobile portrait.

### Bug-3: Message UX and history flow cleanup
- Priority: P0
- File targets: `index.html` (header markup/CSS + message history panel), `main.js` (`addMessage`, message UI state/timers, tab/content toggle handlers)
- Implementation checklist:
1. Remove always-visible bottom messages panel from gameplay layout on desktop and mobile.
2. Add compact header preview on the left side of market header with small profile icon + newest line.
3. Keep icon always visible during gameplay; update icon emotion with each newest message.
4. Auto-hide only the compact text line after `3s` when no newer message arrives.
5. Open full history by tapping the compact profile icon.
6. Route full history into the main content region by replacing market/shop content view.
7. Add clear close control to return from history view to previous market/store context.
8. Allow backdrop tap to dismiss overlay flows where overlays are used.
9. Add unread counter badge beside the compact icon.
10. Reset unread counter immediately when history is opened via icon tap.
11. Preserve message history and scroll position across compact/history toggles.
- Acceptance criteria:
1. New message text appears in compact preview and auto-hides in ~3s.
2. Compact profile icon remains visible throughout gameplay.
3. Full history opens when tapping the compact profile icon.
4. Opening history replaces market/shop content area as planned.
5. Full history closes reliably and returns to prior play context.
6. Backdrop tap closes full history reliably where overlay mode is active.
7. Unread badge increments for new messages and resets immediately on history open.
8. Compact header preview no longer blocks Market/Store/Goals/Rest controls.

### Bug-4: Header navigation consistency and Rest relocation
- Priority: P1
- File targets: `index.html` (market header/tab row markup), `main.js` (tab wiring and rest handler bindings), CSS in `index.html`
- Implementation checklist:
1. Move `Rest` action from bottom bar into market header controls.
2. Style `Rest` consistently with existing tab-style controls.
3. Ensure control ordering is stable across desktop and mobile.
4. Ensure click/tap targets remain accessible and non-overlapping at small widths.
- Acceptance criteria:
1. `Rest` is in header on desktop and mobile.
2. `Rest` visual style matches Market/Store/Goals interaction language.
3. No loss of functionality for day advance flow.
4. Header controls remain usable without overlap/truncation in mobile portrait.

### Bug-5: Regression and stability pass for bug fixes
- Priority: P1
- File targets: `main.js` (event listeners, resize flow, tab switching), `index.html` (final responsive polish)
- Implementation checklist:
1. Validate resize behavior when rotating mobile portrait/landscape.
2. Validate tab switching with message UI closed/open states.
3. Validate no duplicated listeners/timers after repeated history toggles.
4. Validate level/HUD updates after day advance and level-up events.
- Acceptance criteria:
1. No console errors during tab switching, resizing, or message/history toggling.
2. No stuck history state and no blocked gameplay input after close.
3. Desktop and mobile layouts remain stable after 5+ consecutive resize/orientation cycles.

### Bug-6: Duplicate HUD IDs in `index.html` cause invalid DOM mapping
- Priority: P1
- Findings from review:
1. Duplicate IDs detected for `hud-day`, `hud-cash`, and `hud-networth`.
2. Hidden + visible duplicates can create brittle selector behavior and debugging confusion.
- File targets: `index.html` (market header markup), `main.js` (`renderHUD` selectors if needed)
- Implementation checklist:
1. Remove duplicate hidden stat spans from `#market-header` or convert to class-based elements.
2. Keep a single authoritative element per HUD ID.
3. Update selectors only if structural changes require it.
- Acceptance criteria:
1. DOM has no duplicate IDs for HUD stats.
2. HUD updates render exactly once per stat update cycle.
3. No visual regression in market header.

### Bug-7: Text encoding artifacts (mojibake) in HTML/CSS strings
- Priority: P2
- Findings from review:
1. Artifacts like `WindowsÂ 98`, `9Ã—9`, and `DayÂ 1` appear in source text.
2. Some are hidden now but can leak into visible UI depending on layout/state.
- File targets: `index.html` (visible labels/comments where relevant)
- Implementation checklist:
1. Replace mojibake in user-facing text with clean ASCII/UTF-8-safe text.
2. Keep comments readable and consistent.
3. Validate no weird glyphs appear in live UI.
- Acceptance criteria:
1. No visible mojibake in HUD, tabs, panel titles, or default labels.
2. UI text remains stable across desktop/mobile.

### Track 1 Definition of Done
1. All P0 acceptance criteria pass.
2. P1 bugs (including duplicate HUD IDs) are resolved in the same pass.
3. Manual QA pass completed on desktop + mobile viewport emulation.
4. No functional regression to buy/place/sell/day loop.
5. Ready for Track 2 without known blocker bugs.

## Track 2 - Upgrades (After Bug Fixes)
1. Simplify loop clarity.
- Add one daily objective shown in HUD.
- Add "next best action" guidance.
- Add short dismissible onboarding prompts.

2. Improve item decision clarity.
- On select/hover show buy price, expected sell value, projected profit.
- Use color coding for loss/neutral/profit.

3. Add visual juice (no audio).
- Buy/sell visual feedback: coin particles + quick floating value changes.
- Keep effects short and readable.

4. Improve day transition payoff.
- End-of-day summary: sold items, total profit, notable events.
- Highlight next-day arrivals or unlock progress.

5. World feedback from energy.
- Time-of-day visual shift based on energy (morning/midday/night).

6. Mobile readability pass.
- Increase minimum font readability on small devices.
- Keep critical HUD elements visible without covering action tabs.

## Success Metrics
- Level/profile overlap bug is fully resolved on desktop.
- On mobile, Market/Store/Goals/Rest are always accessible during normal play.
- New message compact/history behavior works from compact icon tap and close controls.
- Message history reliably replaces market/shop content and returns cleanly.
- Header controls (including `Rest`) remain usable on desktop and mobile.
- New player completes first profitable sell cycle in < 90 seconds.

## QA Checklist
- Desktop: Is level/xp info always visible and not obscured by profile UI?
- Mobile: Can player access Market/Store/Goals/Rest tabs without fighting layout?
- Mobile/Desktop: Does compact newest-message text auto-hide at ~3s while icon stays visible?
- Mobile/Desktop: Can message history be opened from compact profile icon tap?
- Mobile/Desktop: Does opening history replace market/shop content as intended?
- Mobile/Desktop: Can message history be closed reliably?
- Mobile/Desktop: Does unread count increment on new messages and reset immediately on icon-tap open?
- Mobile/Desktop: Is `Rest` in header and styled like tab controls?
- DOM: Are HUD IDs unique (`hud-day`, `hud-cash`, `hud-networth`)?
- Gameplay: Is there always an obvious next action?
- Feedback: Do key actions feel responsive without relying on sound?

## Build Sequence (Actionable)
1. Fix desktop level/profile overlap.
2. Fix mobile grid/message/tab blocking issues.
3. Replace bottom persistent messages panel with compact header preview + history content view toggle.
4. Move `Rest` into header and align tab-style interaction on desktop/mobile.
5. Remove duplicate HUD IDs and stabilize header stat mapping.
6. Run regression checks on desktop/mobile layouts.
7. Implement simplification upgrades (objective/hints/item clarity).
8. Implement visual juice upgrades (particles/floaters, no audio).
9. Implement end-of-day summary + energy-based time-of-day visuals.
