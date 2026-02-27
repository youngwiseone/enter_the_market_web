
# Theme Readability + Visual Upgrade Proposal (Suggestions Only)

## Goal
Use `theme-marble` as the readability benchmark and bring all other themes up to a similar text/background clarity level while giving each one a stronger visual identity.

## Global Readability Rules (apply to every theme)
1. Define shared theme tokens and use them consistently:
   - `--theme-bg`
   - `--theme-surface`
   - `--theme-text`
   - `--theme-text-muted`
   - `--theme-border`
   - `--theme-accent`
   - `--theme-control-bg`
   - `--theme-control-text`
   - `--theme-control-border`
   - `--theme-control-active-bg`
   - `--theme-control-active-text`
   - `--theme-progress-track`
   - `--theme-progress-fill`
   - `--theme-table-header-bg`
   - `--theme-table-header-text`
   - `--theme-table-border`
2. Minimum contrast targets:
   - Body text on panel/background: WCAG AA (4.5:1+).
   - Large headings/buttons: 3:1+.
3. Add subtle text support where needed:
   - Light themes: very soft dark text-shadow or stronger font-weight.
   - Dark themes: 1px low-opacity glow only on accent text, not all text.
4. Separate layers more clearly:
   - Page background darkest/lightest layer.
   - Panel surfaces one clear step different from background.
   - Interactive controls one clear step different from panels.
5. Unify table readability:
   - Give every theme explicit zebra row colors and a guaranteed readable `--theme-table-text`.

## Full Theming Coverage (Critical)
The theme must style all major interactive and data surfaces, not just page/panel background:
1. Rest button.
2. Energy container and energy progress bar fill.
3. Level container/card.
4. Goals buttons.
5. Tool buttons (`glove`, `watering`, `pickaxe` and any future tools).
6. Top tab buttons (`Market`, `Goal`, `Review`).
7. Market sub-tab buttons (`Produce`, `Utility`, `Decor`, `Cosmetics`).
8. All market/store/goals tables:
   - table header
   - row background (odd/even)
   - border lines
   - hover/selected row state
   - text color

Current issue to eliminate: default gray/blue control styles remaining active under non-default themes, causing contrast conflicts with theme text colors.

## Per-Theme Suggestions

### Default (`theme-default`)
- Keep classic 98.css look, but increase panel/background separation slightly.
- Add mild bevel/scanline paper texture so it feels intentional, not flat.
- Ensure button labels stay pure black on lighter controls.

### Monochrome Green (`theme-mono`)
- Readability:
  - Reduce neon saturation for normal text (keep neon for accents only).
  - Use deeper panel black-green to separate content from background.
- Visual upgrade (hacker/matrix):
  - Add faint vertical matrix rain effect in the page background.
  - Add occasional horizontal CRT sweep animation at very low opacity.
  - Use monospace accent for headings/market ticker only.
  - Keep animations subtle to avoid hurting legibility.

### Aquatic Blue (`theme-aqua`)
- Readability:
  - Brighten text toward icy cyan/white and darken panel surface a bit.
  - Increase border contrast so cards/sections are clearly outlined.
- Visual upgrade (ocean):
  - Add layered animated wave gradients in the background.
  - Add soft caustic light pattern on panel titles.
  - Use bubble-like glow accents on key values (cash/net worth).

### Flame Vixen (`theme-flame`)
- Readability:
  - Move body text from orange to warm off-white; reserve orange for highlights.
  - Darken panel background to increase contrast with text and controls.
- Visual upgrade:
  - Add ember speckle layer drifting slowly upward.
  - Add heat-glow edge treatment on active tabs/buttons.

### Coder Black (`theme-coder`)
- Readability:
  - Slightly reduce pure green text for long-form readability.
  - Lift panel background from near-black to dark charcoal for separation.
- Visual upgrade:
  - Terminal grid pattern background (very faint).
  - Blinking cursor effect on selected panel titles / active HUD label.
  - Optional subtle “boot sequence” shimmer on initial theme apply.

### Hotdog Stand (`theme-hotdog`)
- Readability:
  - Current yellow/red combo is high energy but fatiguing; reduce saturation.
  - Use cream/yellow surface + deep red accents instead of red panel bodies.
  - Keep text dark charcoal, not pure black, for better comfort.
- Visual upgrade:
  - Retro diner stripe motif and soft poster-grain texture.
  - Ketchup/mustard accent lines for active controls.

### Teal Breeze (`theme-teal`)
- Readability:
  - Improve panel/text contrast by darkening surface and brightening text.
  - Add clearer border contrast for tabs and data rows.
- Visual upgrade:
  - Wind/ripple gradient motion in the page background.
  - Frosted glass-like panel sheen for a modern “breeze” feel.

### Sophisticated (`theme-sophisticated`)
- Readability:
  - Mostly strong already; just increase muted text contrast slightly.
  - Ensure secondary text/icons don’t fall below AA on darker panels.
- Visual upgrade:
  - Refine with subtle brushed-metal/noise texture.
  - Add restrained gold accent pulse on major stat deltas only.

### Marble Luxe (`theme-marble`)
- Keep as baseline reference.
- Minor upgrade only:
  - Add ultra-subtle marble vein motion/parallax at very low opacity.
  - Preserve current text contrast exactly as the quality target.

### Gold Dynasty (`theme-gold`)
- Readability:
  - Keep dark luxury base, but lighten default text a touch more.
  - Reserve strong gold for highlights; avoid gold-on-gold text collisions.
- Visual upgrade:
  - Brushed gold shimmer pass on headers.
  - Rare sparkle particles around milestone values.

### Diamond Apex (`theme-diamond`)
- Readability:
  - Slightly increase contrast between panel surface and body text.
  - Ensure light-blue accents are not reused as normal body text.
- Visual upgrade:
  - Prism gradient shimmer and crystalline facet overlays.
  - Subtle refractive glint animation on selected controls.

## Rollout Recommendation
1. Pass 1: readability-only token tuning for all themes.
2. Pass 2: add visual effects per theme with low default intensity.
3. Pass 3: add reduced-motion support / disable heavy effects when preferred.

## Acceptance Checks
1. No theme has “hard to read” body text on panels.
2. Store/goals/market tables remain readable in every theme.
3. Animated effects do not distract from gameplay interactions.
4. Theme identity is clearly recognizable at a glance.
5. No core controls remain default gray/blue when a non-default theme is active.
