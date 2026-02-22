# Messages Guide

This guide describes message authoring in `data/messages.json`.

## File format
```json
{
  "version": 1,
  "messages": []
}
```

## Message schema
```json
{
  "id": "tip.day1.mine_pickaxe",
  "type": "tip",
  "icon": "pickaxe",
  "speaker": "player",
  "emotion": "mining",
  "category": "tips",
  "priority": "normal",
  "cooldownMs": 90000,
  "maxPerDay": 0,
  "replaceKey": "tip:mine-pickaxe",
  "replaceScope": "global",
  "template": "Tip: Click the pickaxe button, then click a farm tile to mine."
}
```

## Core fields (expected)
- `id` (string, unique, stable)
- `type` (e.g. `tip`, `progress`, `economy`, `idle`, `goal`)
- `icon` (logical icon id used for categorization/theme intent)
- `speaker` (`player`, `farmer`, `merchant`)
- `emotion` (image variant selector under the speaker)
- `category` (chat entry category metadata)
- `priority` (`low`, `normal`, `high`)
- `template` (message text, supports `{vars}`)

## Optional fields
- `cooldownMs`: minimum delay before same message id can emit again.
- `maxPerDay`: per-day cap for this id.
- `replaceKey`: dedupe key for replacing previous message entries.
- `replaceScope`: `day` or `global` for dedupe scope.

## Template variables
- Use `{varName}` placeholders in `template`.
- Pass values at emit time via:
```js
addMessage({
  id: 'commerce.bought_item',
  vars: { quantity: 2, itemName: 'Tomato', totalCost: '4.00' }
});
```

## Runtime wiring
- Content source: `data/messages.json`
- JSON load path: `js/content/json_loader.js`
- Fallback catalog: `js/content/fallbacks/default_data.js` (`DEFAULT_DATA.messages`)
- Message rendering/runtime: `js/ui/messages_controller.js`
- Runtime orchestrator (stuck tips + idle scheduling): `js/controllers/message_runtime_controller.js`

## Validator

Run:
```bash
node js/dev/validate_messages.cjs
```

Checks include:
- required message fields
- duplicate IDs
- valid `priority`/`replaceScope`
- `speaker`/`emotion` compatibility with `PROFILE_IMAGES`

## Important: icon vs image mapping

Current behavior:
- `icon` is metadata only (classification/theme), not directly used to choose profile image.
- Profile image is chosen by `speaker + emotion`.

Image mapping source:
- `js/ui/profile_chat_controller.js`
- `PROFILE_IMAGES` constant maps speaker/emotion to files under `resources/profiles/`.

Example:
```js
const PROFILE_IMAGES = {
  player: {
    neutral: 'resources/profiles/player.png',
    excited: 'resources/profiles/player_excited.png'
  }
};
```

## Adding new profile images
1. Add image file to `resources/profiles/`.
2. Add emotion mapping in `js/ui/profile_chat_controller.js` under the target speaker.
3. Use that `emotion` value in message definitions.

Example:
```js
player: {
  hype: 'resources/profiles/player_hype.png'
}
```
Then in `data/messages.json`:
```json
{
  "id": "idle.new_hype_line",
  "type": "idle",
  "icon": "sparkle",
  "speaker": "player",
  "emotion": "hype",
  "category": "idle",
  "priority": "low",
  "template": "Let us gooo~ your farm is shining today!"
}
```

## If you want icon-driven image selection

By default, this is not implemented. To make icon pick images:
1. Add an icon-to-emotion map in `js/ui/messages_controller.js` (inside `emitMessageById`).
2. Apply map only when `emotion` is missing in definition/override.
3. Keep `speaker` explicit in message entries.

Suggested rule:
- `resolvedEmotion = metadata.emotion || definition.emotion || ICON_TO_EMOTION[definition.icon] || 'neutral'`

## Authoring rules
- Keep `id` stable forever (save/runtime references depend on it).
- Keep copy concise for single-line desktop/mobile strip.
- Use `replaceKey` for noisy progress updates (`mining`, `watering`, etc.).
- Use cooldowns on idle/tip content to prevent spam.
- Keep personality lines fun but short.
- Keep `data/messages.json` and `DEFAULT_DATA.messages` aligned when changing catalog shape/critical defaults.

## Validation checklist
1. JSON is valid.
2. Every message `id` is unique.
3. All referenced `speaker`/`emotion` combinations exist in `PROFILE_IMAGES` (or safely fallback).
4. Templates render correctly with provided vars.
5. Desktop and mobile single-line strips show expected latest text.
6. Messages panel history shows correct timestamps/categories.
7. `node js/dev/validate_messages.cjs` passes.

## Smoke test (message flow)
1. Start a new game and confirm welcome + Day 1 guidance appears.
2. Mine, plant, water, and harvest once each and confirm progress lines replace correctly (`replaceKey` behavior).
3. Rest day and confirm economy/day-roll messages appear.
4. Leave game idle for 60-120 seconds and confirm idle messages rotate without spam.
5. Check desktop and mobile single-line latest-message strips match.
