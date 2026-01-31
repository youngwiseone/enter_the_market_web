Plan: Add profile icons to messages with context-aware avatars and player emotions.

Pre-check
- Inspect `addMessage()` usage and message rendering in `main.js`.
- Review `#chat-log` structure and styles in `index.html`.
- Verify available profile assets under `resources/profiles/` (80x80).

Current state (main.js / index.html)
- Messages are appended as text lines into `#chat-log`.
- No per-message metadata (speaker/context/emotion) exists.
- Chat log uses monospace styling and a simple scroll container.

Goal
- Add an 80x80 profile image to the left of each message line.
- Profile image changes by context (farmer, player, merchant) with player-only emotions.
- Keep the existing text log intact; add image next to text under the Messages header.

Proposed design
1) Message metadata + routing
   - Extend `addMessage()` to accept optional metadata `{ speaker, context, emotion }`.
   - Add a helper to infer defaults from message text or call sites (e.g., energy warning -> player/tired).
2) Message layout
   - Render each message as a row with a fixed 80x80 image on the left and the existing text on the right.
   - Preserve the monospace feel for the text.
3) Icon assets
   - Use `resources/profiles/` images (80x80).
   - Map profiles by speaker and emotion (player emotions only for now).
4) Context & emotion rules
   - Farmer: market-related tips/messages.
   - Merchant: store/cosmetic/crafting purchase messages.
   - Player: general system/energy/inventory notices.
   - Player emotions: e.g., out of energy -> tired; otherwise neutral.

Implementation steps
1) Define message metadata model and profile lookup table in `main.js`.
2) Add `getMessageProfile()` helper to resolve image path from metadata or defaults.
3) Update `addMessage()` to render a row with image + text.
4) Update key `addMessage()` call sites to pass context/emotion where clear.
5) Update `#chat-log` styles to support row layout (image + text) without breaking width.

Question around implementation - provide questions, user will provide answers:
1) Intended profile size? Note will have to scale as current images are 800x800 (I might manually scale later to clean up images)
2) Replace text-only log or keep text with image? Keep text; add image to the left. 
3) Message grouping? We will group together during implementation with your guidance; emotions only for player (farmer/merchant stay neutral).
