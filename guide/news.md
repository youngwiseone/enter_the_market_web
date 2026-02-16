# News Guide

This guide describes market news templates in `data/news.json`.

## File format
```json
{
  "news": []
}
```

## Template schema
```json
{
  "headline": "Surging demand for sku leads to price hike",
  "article": "Merchants report increased demand for sku."
}
```

## Fields
- `headline`: used as story text for daily market roll events.
- `article`: optional supporting story text.

## `sku` placeholder
- Use `sku` in `headline` and/or `article`.
- On generation, the game replaces `sku` with a random **unlocked** item name.

## Runtime behavior
- On each day roll, templates are sampled and attached as story text to roll picks.
- Roll magnitude/sign is determined by daily roll logic (fatigue + market bias), not template impact fields.
- Locked items are excluded because roll picks use unlocked items only.

## Authoring guidelines
- Mix positive and negative events for healthier volatility.
- Avoid repetitive headlines.
- Keep copy concise; headlines should still read naturally after `sku` replacement.

## Validation checklist
1. JSON is valid.
2. Every entry has a usable `headline`.
3. `headline`/`article` read correctly with `sku` replaced by a crop name.
4. Daily roll modal/messages show varied story text across days.
