# Goal Unlock Celebration Banner Plan

## Objective
Make goal completion feel highly rewarding with a full-screen celebration overlay that:
- Covers the game screen.
- Shows `resources/profiles/player_goal_unlocked.png` large at top-center.
- Shows goal title below.
- Shows unlocked reward text below title.
- Uses existing sparkle effects.
- Pops in with a strong entrance animation.
- Requires user click on a `Continue` button to dismiss.

## UX Flow
1. Player completes a goal.
2. Normal goal logic still applies immediately (reward granted, state saved).
3. Celebration overlay appears on top of all UI and pauses normal click interactions behind it.
4. Overlay plays:
- Backdrop fade-in.
- Panel pop-in (scale + slight upward settle).
- Sparkle burst + drifting sparkles.
5. Player reads unlock details.
6. Player clicks `Continue`.
7. Overlay fades out and gameplay input resumes.

## Visual / Motion Direction
- Backdrop: dark translucent layer to focus attention.
- Card/Panel: centered, bright, celebratory styling.
- Image: `player_goal_unlocked.png` prominently sized (desktop target ~220-280px wide, responsive on mobile).
- Title: goal name (large, bold, centered).
- Reward line: clear unlocked benefit text.
- Sparkles:
- Immediate burst on entry near image/panel center.
- Secondary ambient sparkles around edges for ~1.5-2.5s.
- Pop-in timing target:
- Backdrop: 120-180ms.
- Panel: 380-500ms spring-like ease.
- Sparkles start at ~120ms and overlap panel entrance.

## Technical Plan
1. Add a dedicated overlay renderer/state:
- `state.goalCelebrationQueue` (queue of pending celebrations).
- `state.activeGoalCelebration` (currently displayed celebration or null).
2. Hook goal completion pipeline:
- When a goal completes, push a celebration payload:
- `{ goalId, goalName, rewardText, messageText }`
- If no active celebration, open next from queue.
3. Create overlay DOM + lifecycle methods:
- `showGoalCelebration(payload)`
- `hideGoalCelebration()`
- `advanceGoalCelebrationQueue()`
4. Add sparkle emitter integration:
- Reuse existing sparkle effect assets/helpers already used in project.
- Trigger burst + timed ambient sparkles bound to overlay lifetime.
5. Input locking:
- While overlay active, block farm/market clicks and keyboard shortcuts behind modal.
6. Continue button:
- Primary button centered at bottom of panel.
- Click: dismiss current celebration and show next queued one (if any).
7. Responsive behavior:
- Maintain visual hierarchy on mobile (smaller image, tighter spacing).
- Keep button always visible without scrolling.

## Content Rules
- Title text: goal `name`.
- Unlock text: derive from reward type:
- `unlockTool` -> "Unlocked: Watering Can" (map tool id to label).
- `unlockShopItem` -> "Unlocked in shop: <Item Name>".
- `freePurchases` -> "Unlocked: Next N <Item Name> purchases are free".
- `grantCosmetic` -> "Unlocked cosmetic: <Cosmetic Name>".
- Fallback to goal `message` when reward mapping is unavailable.

## Queue / Edge Cases
- Multiple goals completed at once:
- Queue celebrations and show sequentially.
- Save/load safety:
- Queue should not replay already shown celebrations after reload unless intentionally pending.
- If goal data missing:
- Show safe fallback title/reward text and allow continue.

## Accessibility
- Focus should move to `Continue` button on open.
- `Enter`/`Space` activates continue.
- `Escape` optional (only if desired) to continue.
- Ensure contrast for title/reward text over backdrop.

## Acceptance Criteria
- Completing any goal always opens celebration overlay.
- Overlay blocks background interaction until dismissed.
- `player_goal_unlocked.png` is large and visually dominant.
- Goal title and unlock description are clearly visible.
- Sparkle effects play during entry and are noticeable.
- Pop-in animation feels energetic (not flat fade-only).
- `Continue` dismisses reliably and resumes gameplay.
- Back-to-back goal completions display all celebrations in order.
- Works on desktop and mobile layouts.

## Implementation Checklist (Next Step)
- [ ] Add celebration state + queue.
- [ ] Implement reward text formatter.
- [ ] Build overlay DOM/CSS + pop-in animation.
- [ ] Integrate sparkle effects into overlay lifecycle.
- [ ] Lock/unlock background input while active.
- [ ] Wire continue button + queue advancement.
- [ ] Test single goal, multi-goal chain, and reload behavior.
