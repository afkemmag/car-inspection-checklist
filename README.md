# 峠 Touge Inspect

A pre-purchase used-car inspection checklist with a Japanese drift / night-touge look.
Built with [Astro](https://astro.build). All data is saved in your browser's `localStorage` — no backend, nothing leaves your device.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in ./dist
npm run preview  # serve the build
```

Requires Node 22.12+ (Astro 7).

## Using it

- **○ / × / —** mark each item OK, problem (NG) or not applicable. Tap the same mark again to clear it.
- **✎** adds a note (what you saw, repair quote, photo number).
- **要注意** items are likely deal-breakers. An NG on any of them flips the verdict to *撤退 Walk away*.
- **Filters:** section chips, status (All / To do / OK / NG / N/A), deal-breakers only, and free-text search. Your filter choice is remembered.
- **Multiple cars:** "＋ New car" starts a fresh checklist; switch between cars with the vehicle dropdown.
- **Export / Import JSON** to back up or move your data to another device (e.g. phone ↔ laptop). Import merges with existing cars.
- **Print** gives a clean paper copy.

## Inspection stages

| # | Section | When |
|---|---------|------|
| 01 | 書類 Paperwork & History | Before you go |
| 02 | 外装 Body & Paint | Daylight walk-around |
| 03 | 足回り Tires, Wheels & Brakes | Every corner |
| 04 | エンジン Under the Hood | Engine cold |
| 05 | 下回り Underbody & Suspension | Flashlight / lift |
| 06 | 内装 Interior & Cabin | Every seat |
| 07 | 電装 Electrical & Features | Key on, then running |
| 08 | 始動 Cold Start | First start of the day |
| 09 | 試乗 Test Drive | 20+ minutes, mixed roads |
| 10 | 決断 After the Drive & Deal | Before paying |

Edit or add items in `src/data/checklist.ts` — item `id`s are what the saved data is keyed on, so keep existing ids stable.

## Storage

Key: `touge-inspect:v1`. Shape:

```jsonc
{
  "version": 1,
  "activeId": "…",
  "vehicles": {
    "<id>": {
      "info": { "year": "", "make": "", "model": "", "vin": "", "mileage": "", "price": "", … },
      "items": { "eng-oil": { "s": "ok", "n": "clean, at full mark" } }
    }
  },
  "ui": { "section": "all", "status": "all", "critical": false, "q": "", "collapsed": {} }
}
```

> Not a substitute for an independent mechanic's pre-purchase inspection.
