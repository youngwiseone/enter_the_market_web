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

### 4) Buy/Sell Crunch
- Buy:
- Cash HUD briefly pulses red/down.
- Few coin particles fly from HUD cash to selected market row.
- Sell/harvest income:
- Cash HUD pulses green/up.
- Coin particles fly from tile/row to cash HUD.

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
- `buyItem()` / `sellItem()`:
- cash HUD pulse + travel particles.
- `nextDay()`:
- transition wipe + summary entrance.
- `emitMessage()`:
- entry/replacement animations.

## Proposed Rollout
1. Build shared animation utility + particle canvas + pooling.
2. Implement mining/watering effects first.
3. Implement planting/harvest + buy/sell cash pulses.
4. Implement next-day transition + summary card entrance.
5. Add rarity and chat polish.
6. Tune intensities and mobile/reduced-motion behavior.

## Acceptance Criteria
- Actions feel more responsive with immediate visual confirmation.
- No major readability loss in UI.
- Effects stay performant and degrade gracefully on mobile/reduced-motion.
- All effects are tied to gameplay events and do not feel random/noisy.

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
- `resources/effects/shimmer_streak_gold.png`
- `resources/effects/prism_sparkle_01.png`
- `resources/effects/prism_sparkle_02.png`

### Ambient / Transition
- `resources/effects/cloud_shadow_soft.png`
- `resources/effects/day_wipe_gradient.png`
- `resources/effects/screen_flash_soft.png`

## Optional (Can Be CSS-Only Instead of Images)
These can be done in CSS if you prefer fewer assets:
- hit flash ring
- ripple ring
- shimmer streak
- screen flash
- value pop background

## Existing Assets to Reuse (No New Files Needed)
- `resources/tools/crack1.png` ... `resources/tools/crack10.png`
- `resources/tools/water.png`
- Crop/seed/item images under:
- `resources/seeds/`
- `resources/plants/`
- `resources/items/`
