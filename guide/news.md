# News Guide

This guide explains how to add market news events using `data/news.json`.

## 1. File location
- Edit: `data/news.json`
- Top-level format:
```json
{
  "news": []
}
```

## 2. News entry format
Each event is one object inside `news`:
```json
{
  "headline": "Surging demand for sku leads to price hike",
  "article": "Merchants report increased demand for sku.",
  "impact": 20,
  "duration": 5
}
```

## 3. Required fields
- `headline`: short title shown in messages.
- `article`: optional detail text.
- `impact`: percent price effect (positive or negative).
- `duration`: number of days the event remains active.

## 4. `sku` placeholder
- Use `sku` in `headline` and/or `article`.
- The game replaces `sku` with a random item name when generating weekly events.

Examples:
- `"Abundant harvest floods market with sku"`
- `"Demand for sku is weakening after new substitutes."`

## 5. Impact rules
- Positive `impact` increases prices.
  - Example: `20` means +20%.
- Negative `impact` decreases prices.
  - Example: `-15` means -15%.
- Keep values reasonable for balance:
  - Suggested range: `-30` to `+30`.

## 6. Duration rules
- `duration` is in in-game days.
- Suggested range: `2` to `7`.
- Very long durations can dominate price behavior.

## 7. Authoring tips
- Keep headline concise and readable in message feed.
- Mix positive and negative impacts for variety.
- Avoid duplicate event wording.
- Use broad language because affected item is selected dynamically.

## 8. Example entries
```json
{
  "news": [
    {
      "headline": "Festival demand boosts sku sales",
      "article": "A local food festival caused a sharp rise in demand for sku.",
      "impact": 18,
      "duration": 4
    },
    {
      "headline": "Oversupply pushes down sku prices",
      "article": "A bumper season flooded the market with sku inventory.",
      "impact": -12,
      "duration": 5
    }
  ]
}
```

## 9. Validation checklist
1. JSON is valid.
2. Every entry has `headline`, `impact`, and `duration`.
3. `impact` and `duration` are numbers.
4. News appears on schedule in game messages (weekly generation day).
5. Price movement is visible and returns to normal after duration ends.

## 10. Recommended test flow
1. Add one strong positive and one strong negative event.
2. Reset/reload game.
3. Advance days until news generation day.
4. Confirm message output includes generated events.
5. Check market prices change in expected direction.
