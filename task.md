# Messages UI Simplification Plan (Today / Past Tabs)

## Objective
Replace the current message filtering and summary system with a simple two-tab message view:
- `Today`: all messages from the current day, shown as normal chat entries.
- `Past`: all messages from previous days.

No category filters, no grouped summaries, no collapsible day summaries.

## Requested Behavior
1. Messages panel has two tabs only: `Today` and `Past`.
2. New messages generated during the current day appear in `Today`.
3. Messages from earlier days appear in `Past`.
4. Messages are not grouped or collapsed.
5. Existing profile image behavior and chat entry style should continue to work.

## Scope of Change

### Remove
- Category filter controls (`Progress`, `Economy`, `Goals`, `Tips`) and their state persistence.
- Message filtering logic by category.
- Summary grouping/collapse behavior (including per-day summary replacement logic).

### Add
- Messages tab controls (`Today`, `Past`) in the Messages panel header.
- Active tab state (runtime + optional persistence).
- Rendering logic that hides/shows entries by day boundary:
  - `entry.dayIndex === currentDay` => `Today`
  - `entry.dayIndex < currentDay` => `Past`

## Technical Plan
1. **UI update in `index.html`**
- Replace filter checkbox row with a compact tab bar:
  - `button#messages-tab-today`
  - `button#messages-tab-past`
- Keep unread chip placement consistent with current layout.

2. **State model update in `main.js`**
- Remove `MESSAGE_FILTERS_DEFAULT` and `messageFilters`.
- Introduce `activeMessagesTab` with values: `'today' | 'past'`.
- Optional persistence key: `messagesTab`.

3. **Visibility logic refactor**
- Replace `isMessageVisibleByFilters(payload)` with `isMessageVisibleByTab(payload)`.
- Base visibility strictly on `payload.dayIndex` compared to current day.
- Keep unread logic compatible with active tab.

4. **Message emission path cleanup**
- Keep `emitMessage()` entry creation/timestamp behavior.
- Remove category-based visibility decisions.
- Preserve row dataset metadata used for day checks.

5. **Remove summary system**
- Remove summary generation/update functions and calls used for grouped day output.
- Ensure day transitions do not convert messages into grouped blocks.
- Keep all historical entries as plain message rows.

6. **Event handlers**
- Remove filter toggle listeners.
- Add listeners for today/past tab buttons.
- Re-run visibility refresh on:
  - tab change
  - new message
  - day change

7. **Styling**
- Reuse existing tab button styling patterns for consistency.
- Add active/inactive styles for message tabs.

## Data / Migration Notes
- Existing saved message filter settings become obsolete; safe to ignore.
- Existing chat log entries should continue to display based on stored `dayIndex`.
- No destructive migration needed.

## Acceptance Criteria
1. Messages panel shows only `Today` and `Past` tabs (no category filters).
2. `Today` shows all messages for current day only.
3. `Past` shows all older messages.
4. No grouped summary blocks appear.
5. New messages appear immediately in the active tab if relevant.
6. Switching tabs updates visible entries instantly.
7. No console errors from removed filter/summary code paths.

## Implementation Checklist (Next Step)
- [ ] Replace Messages controls UI with Today/Past tabs.
- [ ] Refactor message visibility logic to day-based tabs.
- [ ] Remove filter state and filter handlers.
- [ ] Remove summary/grouping behaviors and related functions.
- [ ] Wire tab events + optional persistence.
- [ ] Validate unread behavior still makes sense with tabbed view.
- [ ] Test day rollover and historic message visibility.
