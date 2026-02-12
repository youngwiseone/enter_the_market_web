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
  "article": "Merchants report increased demand for sku.",
  "impact": 20,
  "duration": 5
}
```

## Fields
- `headline`: shown in message feed.
- `article`: optional descriptive text.
- `impact`: percent effect to affected item price.
- `duration`: in-game days effect remains active.

## `sku` placeholder
- Use `sku` in `headline` and/or `article`.
- On generation, the game replaces `sku` with a random **unlocked** item name.

## Runtime behavior
- News generation runs weekly (Thursday in game loop).
- Up to 3 templates are sampled and converted into active events.
- Events store `affects`, `impact`, `duration`, `daysLeft`.
- Locked items are not selected for new news events.

## Authoring guidelines
- Keep impact in a balanced range (commonly `-30` to `+30`).
- Keep durations moderate (commonly `2` to `7` days).
- Mix positive and negative events for healthier volatility.
- Avoid repetitive headlines.

## Validation checklist
1. JSON is valid.
2. Every entry has `headline`, `impact`, `duration`.
3. `impact` and `duration` are numbers.
4. Events appear in messages on weekly generation day.
5. Prices shift while active and normalize as events expire.
