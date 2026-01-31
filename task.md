Plan: Update the UI layout for desktop/mobile, reposition HUD elements, and make the grid responsive.

Pre-check
- Review current layout structure in `index.html` (HUD, tabs, market/store panels, messages).
- Identify where the Farmer's Market header and messages live in the DOM.
- Confirm grid sizing logic and inline styles used for the farm container.

Current state (index.html / main.js)
- HUD (day/cash/net worth + tab buttons + next day) is at the top of the page.
- Farmer's Market header sits above the grid and table; messages below the market panel.
- Tabs are standard buttons and currently hide/show panels; grid/messages are hidden when Store is active.
- Grid container is fixed at 600x600 pixels and does not respond to viewport size.

Goal
- Move day/cash/net worth under the Farmer's Market header.
- Replace Farm/Store buttons with 98.css-style tabs below the header + stats.
- Keep the farm grid and messages visible even when Store tab is active (Store replaces farmer's market items, just see store buttons instead).
- Relocate Next Day to a larger button at the bottom-right, matching the messages height, and aligned to the right of messages.
- Make the grid responsive:
  - Desktop (width > height): grid size = viewport height minus messages area and padding.
  - Mobile (width < height): grid size = viewport width; market table wraps under the grid; messages below.

Proposed design
1) Layout restructuring
   - Create a new "Market header" section containing:
     - Title: Farmer's Market
     - Stats row: Day, Cash, Net Worth
     - Tab row: Farmer's Market / Store (98.css tab styling)
   - Move Next Day button into a bottom-right "action column" next to Messages.
2) Panels & visibility
   - Keep farm grid + messages always visible.
   - Store content should appear in its own panel section without hiding the farm grid/messages.
   - Market table should remain visible in market view; in store view, either remain or be reduced per layout needs (confirm).
3) Responsive behavior
   - Desktop: two columns (left: grid + messages; right: market table + store panel + next day).
   - Mobile: single column with grid (square width), then market table, then messages + next day.
   - Use CSS media query based on `aspect-ratio` or `width < height`.
4) Grid sizing
   - Replace fixed `600px` inline size with CSS variables.
   - Compute grid size via CSS for mobile; for desktop, JS computes based on viewport height and messages height.
   - Keep grid square and avoid overflow.

Implementation steps
1) Update `index.html` to restructure header/stats/tabs and reposition Next Day.
2) Update CSS in `index.html`:
   - New layout containers (desktop + mobile).
   - 98.css-style tabs for Farmer's Market / Store.
   - Responsive grid sizing rules.
3) Update `main.js`:
   - Adjust tab switching to not hide farm/messages; only toggles store content area.
   - Add a resize handler to compute grid size for desktop based on viewport height and messages area.
4) Verify layout in both aspect ratios (mobile vs desktop).

Question around implementation - provide questions, user will provide answers:
1) In Store view, should the Market table remain visible or collapse to give Store more space? Collapse, store should replace it (just show store elements when in store tab, then just market in market tab)
2) Should Next Day be disabled/hidden when Store tab is active, or always visible? Always visible
3) On mobile, should Messages + Next Day stack (Next Day below messages) or be side-by-side? Side by side
