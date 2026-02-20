
# Seed Packet Auto-Compose Plan

## Goal
- Replace per-item prebuilt seed packet images (`resources/seeds/*_seeds.png`) with runtime-generated visuals:
  - Base packet: `resources/seeds/seeds.png`
  - Overlay icon: crop icon (centered), scaled to 50% of its source size
- Keep normal shop rendering as a single attached visual.
- Add an unlock celebration animation where icon and packet can animate independently.

## Current State (Observed)
- Market list images use `getSeedImagePath(item)` inside `js/ui/render_market.js`.
- `getSeedImagePath` currently resolves `item.seedImage || item.image` in `js/content/resource_paths.js`.
- Unlock celebration image for level-up item unlock currently uses one `imageSrc` string from `main.js` + `js/controllers/player_progress_controller.js` + `js/ui/goal_celebration_controller.js`.
- Item icons already exist under `resources/items/*.png`.
- Base blank seed packet exists at `resources/seeds/seeds.png`.

## Proposed Approach

### 1. Add a seed-composition helper (DOM-side utility)
- Create `js/ui/seed_packet_image_factory.js` (name tentative).
- Responsibilities:
  - Build composed seed packet image via `canvas`:
    - Draw base packet full-size.
    - Draw icon centered at 50% source dimensions.
  - Return a reusable image URL (object URL or data URL).
  - Cache per item/icon path to avoid repeated work every render.
  - Graceful fallback:
    - If compose fails, use existing `getSeedImagePath(item)` behavior.

### 2. Integrate composed images into market render
- Update `js/ui/render_market.js` dependency contract to receive a `getShopSeedVisualPath(item)` (or similar) that can return composed output.
- Keep existing dimensions (`48x48`) unless updated by design.
- Ensure no behavioral changes to selection, pricing, or unlock logic.

### 3. Keep data compatibility, add optional explicit icon mapping
- Keep existing `data/items.json` fields unchanged for save/data compatibility.
- Resolve icon path from existing item data using deterministic rule:
  - Preferred: `item.harvestImage` if present
  - Else derive from seed basename -> `resources/items/<base>.png`
- Optional follow-up: add `seedIconImage` field only if needed for non-standard names.

### 4. Unlock animation with separated packet + icon
- Extend goal celebration payload model to optionally support:
  - `compositeImage`: existing single image behavior
  - or `seedPacketImage` + `seedOverlayIconImage`
- In `js/ui/goal_celebration_controller.js`:
  - Render layered wrapper (packet + icon).
  - Add CSS class toggles for unlock animation where icon bounces independently.
- In `index.html` styles:
  - Add keyframes + classes for independent icon bounce.
  - Preserve current goal celebration fallback behavior.

### 5. Fallback/default-data alignment
- Ensure `js/content/fallbacks/default_data.js` remains compatible:
  - No required schema changes.
  - Optional fields guarded if introduced.

## Delivery Steps
1. Implement seed packet compose utility + cache + fallback.
2. Wire market render to use composed visuals.
3. Extend unlock celebration payload + renderer for split animation.
4. Add CSS animation classes and verify desktop/mobile behavior.
5. Run syntax validation on all JS files.
6. Smoke test core gameplay loops (plant/water/harvest/rest day/store unlock).

## Validation Checklist
- Shop shows all unlocked seeds with composed packet+icon images.
- Composition is visually centered and icon appears at 50% size.
- No broken images when icon missing; fallback still renders.
- Level unlock celebration supports icon bounce independent of packet.
- Existing non-unlock celebrations still render as before.
- No JS syntax errors (`node --check` sweep).

## Risks / Edge Cases
- Pixel-art scaling may look blurry without nearest-neighbor handling in canvas/CSS.
- Object URL lifetime management to avoid memory leaks.
- Some crop names may not map 1:1 to `resources/items/*.png` in future content.
- Frequent full `renderAll()` calls could recreate assets without caching.

## Open Questions (Need Your Input Before Build)
1. Should composed seed visuals be used only in the market/shop list, or also anywhere else that currently shows seed packet images (for example unlock cards/messages)? Just the shop and the cursor when selecting from the shop.
2. For icon scale, do you want exactly `50%` of the original icon size even if it overflows the packet, or should we clamp to a max box inside the packet area? 50% should work well.
3. For pixel art quality, should we force nearest-neighbor rendering (`imageSmoothingEnabled = false`) for icon scaling? Yes.
4. For unlock animation, should this apply only to level-up unlock celebration, or any unlock source (goals/rewards/free purchase unlocks)? Just when you first unlock the new item/seed into the market by leveling up.
5. Do you want to keep existing per-item `resources/seeds/*_seeds.png` files as fallback assets, or fully stop referencing them after rollout? No I want to stop referencing them.
