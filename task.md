Plan: Adjust the Energy panel layout to sit beside the tool buttons without widening the grid, remove header and "remaining" text.

Pre-check
- Locate the current Energy panel markup and styles in `index.html`.
- Verify where the farm toolbar lives and its width constraints so Energy can align to the right of the pickaxe without expanding the grid container.

Current state (index.html)
- Energy panel is a separate panel below the market panel with a title ("Energy") and the text `Energy: X/Y`.
- Tool buttons live above the grid; there is no inline energy UI near the tools.
- Grid container width is fixed (600px), so any new inline elements must not widen it.

Goal
- Move/resize the energy indicator so it sits to the right of the pickaxe button, visually aligned with the tool bar.
- Remove the Energy panel header and the "Energy: X/Y" text (keep only the visual indicator).
- Ensure the grid container width stays 600px and the toolbar row does not push the grid wider.

Proposed design
1) Layout change
   - Wrap the tool buttons and the energy indicator in a single flex row above the grid.
   - Constrain the row to the same width as the grid container and prevent overflow from expanding layout.
2) Energy indicator style
   - Reuse the existing bar markup but reduce height and width to fit inline with 30x30 tool buttons.
   - Hide or remove the title and text elements; keep only the bar.
3) Rendering updates
   - Ensure `renderEnergyBar()` still targets the bar element and does not rely on the removed text.
   - Confirm the energy panel is not shown/hidden as a separate panel anymore.

Implementation steps
1) Update `index.html`:
   - Move the energy bar markup into the farm toolbar row (to the right of the pickaxe).
   - Remove the energy header/title and text node.
2) Update CSS in `index.html`:
   - Add inline-toolbar layout styles so the energy bar fits to the right and does not stretch the grid width.
   - Reduce bar height to align with tool buttons.
3) Update `main.js`:
   - Adjust `renderEnergyBar()` to handle the missing text element gracefully.
   - Remove logic that toggles the standalone energy panel visibility if it's no longer a separate panel.

Question around implementation - provide questions, user will provide answers:
1) Should the energy bar show a numeric tooltip on hover (e.g., via `title`) now that the text is removed? No
2) Should the energy bar be fixed width or flex-grow within the toolbar row? flex-grow to remaining width (but don't want it wider then remaining space (e.g. has to fit over grid nicely))
