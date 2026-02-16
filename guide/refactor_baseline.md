# Refactor Baseline Notes (Milestone 1)

This document defines the baseline capture flow before deeper refactor changes.

## Perf Counters

Runtime counters are exposed at:

- `window.__ETM_PERF.snapshot`
- `window.__ETM_PERF.reset()`

Tracked fields:

- `renders`: how many times `renderAll()` ran
- `saves`: how many times `saveState()` ran
- `actions.showTab`: timing samples for tab switches
- `actions.nextDay`: timing samples for day transition
- `actions.applyGridActionForIndex`: timing samples for grid interactions

## Baseline Capture Procedure

1. Open the game in browser.
2. Open DevTools console and run:
```js
window.__ETM_PERF.reset()
```
3. Perform the following sequence:
   - switch tabs 10 times
   - plant/water/mine/harvest interactions for ~30 actions
   - press `Rest` once
4. Capture snapshot:
```js
window.__ETM_PERF.snapshot
```
5. Save the snapshot output into implementation notes or PR description.

## Smoke Checklist (No Behavior Change)

- Start new session loads without JS errors.
- Existing save loads without data loss.
- Plant, water, mine, harvest still behave as before.
- Rest day still triggers market roll + summary flow.
- Goals still complete and rewards still unlock.
- Farm switching and tool switching still work.

## Baseline Results

Date:
- 2026-02-16

Environment:
- Local server: `python -m http.server 8000`
- URL: `http://localhost:8000`

Captured snapshot:

```js
{
  renders: 40,
  saves: 41,
  actions: {
    applyGridActionForIndex: { count: 42, totalMs: 526.4, averageMs: 12.533 },
    nextDay: { count: 4, totalMs: 54.6, averageMs: 13.65 },
    showTab: { count: 12, totalMs: 33.6, averageMs: 2.8 }
  }
}
```

Smoke checklist result:
- Start new session loads without JS errors: pass (after FX dust-puff path fix)
- Existing save loads without data loss: pass
- Plant, water, mine, harvest still behave as before: pass
- Rest day still triggers market roll + summary flow: pass
- Goals still complete and rewards still unlock: pass
- Farm switching and tool switching still work: pass

Notes:
- `favicon.ico` 404 on localhost is non-blocking.
- Cloudflare analytics/CORS warnings on localhost are non-blocking.
