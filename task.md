# Pre-Commit Review: Messages Feature

## Review Summary
The feature is in good shape overall. Core anti-spam behavior is working (filters, replace keys, per-day summary + clear, unread chip, priority bypass).

## Findings and Recommendations

### 1) Summary Detail Regression (High)
Current `nextDay()` summary now runs at the correct time (before next-day mutations), but this also means summary currently gets:
- `priceMoves = []`
- `goalsCompletedToday = 0`

Impact:
- Economy swings / goals-completed lines in summary are effectively disabled.

Recommended plan:
1. Decide if summary should include only day-local state deltas (cash/net worth/ready/unlocked), or also economy/goals detail.
2. If including economy/goals, track explicit day activity counters during the day and consume them in summary.
3. Reset those counters at start of each day.

### 2) Dead Latest-Status Hooks (Medium)
"Latest Status" UI was removed, but message code still calls `setLatestStatus(...)`.

Recommended plan:
1. Remove `setLatestStatus` and its call sites, or
2. Keep intentionally with a comment if planned for reuse.

### 3) Unused CSS (Low)
`.messages-status-row` style block appears unused now.

Recommended plan:
1. Remove unused styles to keep the stylesheet clean.

### 4) Filter Mapping Ambiguity (Medium)
Current filter logic maps categories like `goal` and `system` under `progress` visibility by default.

Impact:
- Turning off Progress may hide normal-priority goal/system messages unexpectedly.

Recommended plan:
1. Decide explicit behavior:
- Option A: keep mapping and document it ("Progress/System").
- Option B: add explicit category handling (or a Goals toggle later).

### 5) Summary Retention Policy (Low)
Global cap (150) includes summaries.

Impact:
- Long-running saves may lose older summaries.

Recommended plan:
1. Confirm desired retention:
- keep global cap as-is, or
- preserve summaries with separate cap.

### 6) Toggle Confirmation Noise (Low)
Filter toggles currently emit high-priority chat confirmations (good for clarity), but rapid toggling can spam.

Recommended plan:
1. Keep as-is for now.
2. Optional follow-up: replace-key confirmations per filter/day so only latest state remains.

## Suggested Cleanup Before Commit
1. Remove dead latest-status JS hooks and unused CSS.
2. Confirm and document filter-category mapping (especially `goal`/`system`).
3. Decide whether summary should stay state-delta-only, or restore economy/goals details via day counters.

## Optional Follow-Up Ticket
`messages-v2: add day activity counters for richer summaries without next-day coupling`
