# Game Feel Polish Plan ("Crunchy" Pass)

## Goal
Add visual/sensory feedback that makes actions feel satisfying, readable, and playful without hurting performance.

## Design Direction
- Keep the retro/98.css style, but add modern juice in short bursts.
- Tie polish to meaningful player actions (mine, water, plant, harvest, buy, sell, next day).
- Favor tiny effects layered together over one giant effect.

## Priority 1: High-Impact, Low-Risk

### 1) Mining Hit Feedback
- On each pickaxe hit:
- Small screen-space "chip" particles burst from tile center.
- Tile image does micro-shake (`translateX/Y` random 1-3px for 120ms).
- Pickaxe cursor briefly scales up/down (hit impulse).
- On final clear:
- Larger dust burst + brighter flash ring.
- Slight camera nudge on grid container (2-4px spring back).

### 2) Watering Splash Feedback
- On watering:
- 6-12 droplet particles arc and fall with gravity.
- Quick blue ripple ring on tile.
- Water overlay icon does a soft "pop" scale animation.
- For already-watered / grown:
- Short "no-op wobble" on tile (not harsh shake), so invalid action still feels responsive.

### 3) Planting + Harvest Feedback
- Planting:
- Seed icon falls into tile with bounce.
- Tiny soil puff particles.
- Harvest:
- Crop icon pops upward with squash/stretch.
- Coin sparkle burst (gold/yellow particles).
- Floating value text (`+$12.40`) that rises/fades.

### 4) Purchase/Harvest Cash Crunch 
- Purchase (on placement): 
- Cash HUD briefly pulses red/down. 
- Few coin particles fly from HUD cash to placed tile. 
- Sell (on harvest): 
- Cash HUD pulses green/up. 
- Coin particles fly from harvested tile to cash HUD. 

### 5) Next Day Transition
- Short wipe/flash overlay (150-250ms).
- Farm panel tint shifts slightly based on new "time of day" placeholder (morning/noon/evening feel).
- Summary card enters with slide + fade.

## Priority 2: Interaction Polish

### 6) Hover/Press States
- Grid tiles: subtle hover lift (1px) + inset shadow deepen.
- Tool buttons: press-in animation tied to action dispatch.
- Market rows: quick highlight pulse when selected.

### 7) Rarity Presentation
- Rare:
- Gold shimmer sweep across tile frame every ~3s.
- Mythic:
- Existing holo + occasional prism sparkle particles.
- Rare/mythic harvest:
- Distinct burst color sets and larger floating text.

### 8) Message/Chat Motion
- New message entry: 120ms fade+slide.
- Replaced progress message: "flip" or pulse update so replacement is visible.
- Unread chip: soft pulse when count increases.

## Priority 3: Extra Delight (Optional)

### 9) Idle Ambient Effects
- Very subtle drifting dust motes over farm panel.
- Occasional cloud shadow pass (low opacity gradient).

### 10) Combo/Streak Effects
- Consecutive same-action streak (e.g. 5 mines quickly):
- Show streak text and slightly stronger particles.

### 11) Tool Personality
- Pickaxe: tiny angular hit sparks.
- Watering can: droplet trail + splash sound cue hook placeholder.
- Glove: gentle pickup "pop" when moving items.

## Technical Implementation Notes

### Particle System
- Use a lightweight pooled particle system (object pool).
- Render option:
- A single absolutely-positioned canvas over `#farm-panel` for particles.
- Keep `pointer-events: none`.
- Cap active particles (e.g. 200-300 max).

### Animation Strategy
- Use CSS classes for common micro-animations (pop, shake, pulse, wobble).
- Use JS only to trigger classes and remove them on `animationend`.
- Prefer `transform` + `opacity` only (avoid layout thrash).

### Performance Guardrails
- Respect reduced motion:
- If `prefers-reduced-motion`, disable non-essential effects.
- Mobile fallback:
- Lower particle counts and disable expensive blur/glow.
- Frame budget target:
- Effects should not noticeably drop below 50-60fps on normal interactions.

## Integration Map (Where to Hook)
- `mineGridTile()`:
- hit particles, shake, clear burst.
- `waterGridTile()`:
- splash/ripple, invalid wobble.
- `purchaseAndPlaceSelected()` + `placeItemOnGrid()`: 
- seed drop + soil puff. 
- `harvestPlant()`: 
- pop, coin burst, floating money text. 
- `purchaseAndPlaceSelected()` / `harvestPlant()`: 
- cash HUD pulse + travel particles (treat placement as purchase, harvest as sell). 
- `nextDay()`:
- transition wipe + summary entrance.
- `emitMessage()`:
- entry/replacement animations.

## Proposed Rollout 
1. Build shared animation utility + particle canvas + pooling. 
2. Implement mining/watering effects first. 
3. Implement planting/harvest + cash HUD pulses on placement/harvest. 
4. Implement next-day transition + summary card entrance. 
5. Add rarity and chat polish. 
6. Tune intensities and mobile/reduced-motion behavior. 

## Implementation Plan (Detailed Steps)
### Step 0: Pre-work Checklist
- Confirm `#farm-panel` exists and is positioned relative (already true in `index.html`).
- Decide how to handle duplicated HUD IDs (`hud-day`, `hud-cash`, `hud-networth`) in `index.html`.
- Decide whether pulses should target the header HUD only or both header and market stats HUD.

### Step 1: Add CSS Animation Primitives (index.html)
Add reusable animation classes and keyframes:
- `.fx-pop`, `.fx-shake`, `.fx-wobble`, `.fx-pulse-up`, `.fx-pulse-down`, `.fx-fade-up`
- Keyframes for `pop`, `shake`, `wobble`, `pulseUp`, `pulseDown`, `fadeUp`
- Utility classes for glow, tint, and subtle blur (optional, but keep to `transform` + `opacity` as default)
- Add `@media (prefers-reduced-motion: reduce)` to disable heavy animations and set particle counts to 0 in JS

### Step 2: Create Particle System (main.js)
Add a small particle system:
- Create a single canvas overlay in JS:
  - `const fxCanvas = document.createElement('canvas')`
  - Append to `#farm-panel` and set `position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;`
  - Resize canvas to match `#farm-panel` on load and on resize
- Build a particle pool (array of objects) with a hard cap (200-300)
- Each particle supports:
  - `x, y, vx, vy, life, maxLife, size, img, rotation, rotationSpeed, alpha`
- Render loop via `requestAnimationFrame`
- Per-frame update:
  - Apply gravity for droplets
  - Fade out by life
  - Draw to canvas (use `globalAlpha`)
- Provide spawn helpers:
  - `spawnBurst({x, y, count, imgList, speedRange, sizeRange, gravity, lifeRange})`
  - `spawnRing({x, y, radius, color, life})` (use canvas stroke)

### Step 3: Hook Effects to Actions (main.js)
For each action function, insert calls after successful action:
- `mineGridTile(index)`
  - On hit: micro-shake class on tile element + rock chip burst
  - On clear (10 hits): dust burst + flash ring + grid container nudge
- `waterGridTile(index)`
  - On successful watering: splash burst + ripple ring + water overlay pop
  - On already-watered / grown: wobble class on tile
- `purchaseAndPlaceSelected(cellIndex)` and `placeItemOnGrid(itemId, cellIndex)`
  - Seed drop effect + soil puff
  - Purchase pulse on cash HUD + coin travel from HUD to tile
- `harvestPlant(cellIndex)`
  - Crop pop + sparkle burst
  - Floating value text `+$X.XX`
  - Sell pulse on cash HUD + coin travel from tile to HUD
- `nextDay()`
  - Add short overlay wipe/flash (CSS animation on a temporary div)
  - Apply subtle panel tint transition and remove after animation
- `emitMessage()`
  - New entry: add `.fx-fade-up`
  - Replaced entry: add a quick `.fx-pulse-up` to make replacement visible

### Step 4: Create DOM Effect Helpers (main.js)
Implement DOM helpers for positioning and animation:
- `getTileCenter(index)`:
  - Use `#grid` and cell element bounding rect to compute center
- `pulseHud(type)`:
  - Add class to HUD element(s), remove on `animationend`
- `animateCoinTravel(from, to, count)`:
  - Use particle system with small coin sprites
- `spawnFloatingText({x, y, text, color})`:
  - Create a temporary absolutely positioned div inside `#farm-panel`
  - Add `.fx-fade-up` class and remove after `animationend`

### Step 5: Rarity Visuals (main.js + CSS)
- Add shimmer sweep to rare tiles via CSS:
  - Use `::after` pseudo element on tile with `animation: shimmer`
- Mythic:
  - Retain existing holo and add occasional prism sparkle via particles
- On harvest:
  - If rarity rare/mythic, emit distinct burst colors + larger floating text

### Step 6: Chat Motion (main.js + CSS)
- For new messages: apply `.fx-fade-up` on created element
- For replaced messages: apply `.fx-pulse-up` on existing element
- Unread chip: add `.fx-pulse` when count increases

### Step 7: Reduced Motion + Mobile Guardrails
- Add a global flag: `const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;`
- If `reduceMotion`, disable:
  - Particle spawns (or reduce to near-zero)
  - Camera nudge
  - Flash overlays
- On smaller screens:
  - Halve particle count
  - Disable blur/glow

### Step 8: Visual QA Checklist
- Verify each action triggers a visible cue within 50-100ms
- Ensure particles don’t exceed cap
- Verify FPS remains stable
- Confirm no layout shifts (transform/opacity only)
- Confirm reduced-motion path

## Acceptance Criteria
- Actions feel more responsive with immediate visual confirmation.
- No major readability loss in UI.
- Effects stay performant and degrade gracefully on mobile/reduced-motion.
- All effects are tied to gameplay events and do not feel random/noisy.
- Particle system stays within cap (200-300 active) and avoids layout thrash (transform/opacity only).
- Reduced motion path verified via `prefers-reduced-motion` (or app setting if it exists).

## Decisions / Answers
- Core gameplay functions are centralized in main.js.
- Particle canvas should be created dynamically in JS (overlay on #farm-panel).
- No existing animation utility or CSS animation class pattern to extend.
- Camera nudge should affect the grid container only.
- Audio cues are out of scope (keep placeholders non-functional).
- New effect images live in 
esources/effects/. Current sprites are 30x30px; scaling is acceptable.
- Buy/sell polish should align to current flow: placement counts as purchase, harvest counts as sell. Effects should originate at the placed/harvested tile and animate to/from the cash/net worth HUD.

## Asset Requirements (Add These Images)
Place all new polish images in:
- `resources/effects/`

Recommended file names:

### Mining
- `resources/effects/dust_puff_01.png`
- `resources/effects/dust_puff_02.png`
- `resources/effects/rock_chip_01.png`
- `resources/effects/rock_chip_02.png`
- `resources/effects/hit_flash_ring.png`
- `resources/effects/spark_shard_01.png`

### Watering
- `resources/effects/water_drop_01.png`
- `resources/effects/water_drop_02.png`
- `resources/effects/water_splash_01.png`
- `resources/effects/ripple_ring_blue.png`

### Planting / Soil
- `resources/effects/soil_puff_01.png`
- `resources/effects/soil_puff_02.png`
- `resources/effects/seed_trail_dot.png`

### Harvest / Economy
- `resources/effects/coin_particle_01.png`
- `resources/effects/coin_particle_02.png`
- `resources/effects/sparkle_gold_01.png`
- `resources/effects/sparkle_gold_02.png`
- `resources/effects/value_pop_bg.png` (optional backdrop for floating `+$` text)

### Rarity / Holo / Shine
- `resources/effects/prism_sparkle_01.png`
- `resources/effects/prism_sparkle_02.png`

## Some will Be CSS-Only Instead of Images
These will be done in CSS:
- day_wipe_gradient
- cloud shadow soft
- shimmer streak
- screen flash

## Existing Assets to Reuse (No New Files Needed)
- `resources/tools/crack1.png` ... `resources/tools/crack10.png`
- `resources/tools/water.png`
- Crop/seed/item images under:
- `resources/seeds/`
- `resources/plants/`
- `resources/items/`
