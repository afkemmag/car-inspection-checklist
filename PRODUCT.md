# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner, as a personal tool for their own used-car hunts. Other people may end up using it, but the owner's workflow decides what gets built. The owner inspects private-sale and dealer cars in person, often enthusiast/JDM models (the in-app examples use a 1998 Nissan 240SX), and may track several candidate cars at once.

## Product Purpose

Touge Inspect is a pre-purchase used-car inspection checklist: about 99 items in 10 stages that follow the real order of an inspection, from paperwork before the visit, through the daylight walk-around, the cold start and the test drive, to the deal. Each item is marked OK (○), problem/NG (×) or not applicable (—), with an optional note. The app turns those marks into a verdict: 待機 ready, 点検中 in progress, 注意 issues so far, 交渉 negotiate, 合格 passed, or 撤退 walk away whenever a deal-breaker (要注意) item fails.

Success means the owner never forgets a check at the car, can tell on the spot whether a car is a walk-away, and leaves with notes good enough to negotiate.

It is explicitly not a substitute for an independent mechanic's pre-purchase inspection, and the app says so.

## Positioning

A checklist built around the decision rather than the inventory: deal-breaker items override everything else, so one failed 要注意 check flips the verdict to 撤退 / walk away, however clean the rest of the car is. It follows the order you actually inspect a car in (paperwork before you go, engine cold before the first start, 20+ minute test drive), and it's styled as a night-touge drift tool rather than a generic form.

## Operating Context

- Used standing at the car on a phone, usually one-handed: outdoors in daylight for the walk-around, in shade or with a flashlight for the engine bay and underbody, and before and after the test drive.
- The 夜 Night look is the default identity. The 昼 Day mode is an opt-in for reading in direct sun (decided 2026-11-15).
- Desktop or laptop for research beforehand (history report, recalls, known model problems) and for reviewing or printing afterwards.
- Several cars can be tracked side by side and switched with the vehicle selector. Each car carries year, make, model, VIN, mileage, asking price, seller, location and notes.
- Printing produces a paper copy of the whole checklist with marks and notes.

## Capabilities and Constraints

- **Deploy target:** GitHub Pages (confirmed). The site must stay a static build. Asset and link paths must work under a GitHub Pages project base path.
- **Free, no monetization (confirmed):** no paywall, ads, affiliate links or dealer partnerships.
- **Stack (existing):** Astro 7, a single static page, client-side TypeScript, no framework runtime. Node 22.12+.
- **Storage (current implementation, not declared a fixed constraint):** everything lives in the browser's localStorage under `touge-inspect:v1`, with no backend, accounts or analytics. JSON export/import moves data between devices, and import merges cars rather than replacing them. The 夜/昼 display choice is a per-device setting (`touge-inspect:mode`) and is deliberately left out of exports.
- **Stable item IDs (technical requirement from the README):** saved and exported data is keyed on checklist item `id`s in `src/data/checklist.ts`. Existing ids must not change, or saved inspections lose their marks.
- **Market (current content, not declared a goal):** the checks are US-specific (Carfax/AutoCheck, NHTSA recall lookup, title brands such as salvage, rebuilt, flood and lemon, plus `$` and miles). Whether to support other markets is undecided.
- **Terminology:** OK / NG / N/A; 要注意 = deal-breaker; the verdict states listed above; "car" and "vehicle" are used for one inspected candidate.

## Brand Commitments

- **Name:** 峠 Touge Inspect. Binding.
- **Bilingual Japanese/English voice:** binding identity. Japanese marks sit next to English: section names (書類, 外装, 足回り …), verdicts (待機, 点検中, 注意, 交渉, 合格, 撤退), the 要注意 deal-breaker badge, and the 夜/昼 switch. English always carries the meaning for screen readers and for anyone who doesn't read Japanese.
- **The ○ × — marks (maru / batsu / dash):** binding. They are the product's marking language, not stand-in icons.
- **Night-touge drift identity:** this is the established look and night is the default. How it looks is recorded in code and, if written, in DESIGN.md, not here.

## Evidence on Hand

- The checklist content: 10 stages, about 99 items, 18 marked deal-breakers, in `src/data/checklist.ts`.
- The README describes how to use the app, the stages, and the storage format.
- No testimonials, users, metrics or third-party endorsements exist. Future work must not invent any.

## Product Principles

1. **The verdict comes first.** Everything serves the question "do I walk away, negotiate, or buy?" Deal-breakers outrank volume.
2. **It has to work at the car.** One hand, sunlight, a dirty finger, no signal. If it only works at a desk, it isn't done.
3. **The data belongs to the owner.** No account and no lock-in. The owner can always export, print, and take their inspections elsewhere.
4. **Follow the real order of an inspection.** Stages and items follow how a careful buyer actually inspects a car, not an alphabetical or system-based taxonomy.
5. **Be honest about the limits.** It's a checklist, not a mechanic. Never overstate what a "合格" means.

## Accessibility & Inclusion

- WCAG 2.2 AA is the floor. Work already done covers named result buttons, a live verdict, keyboard-reachable import, a skip link, and focus handoff when filters hide the focused item.
- Outdoor legibility: the 昼 Day mode keeps body text at 7:1 or better and every accent at AA or better on paper.
- Touch screens: controls are at least 44px, and the result buttons span the full width on phones.
- Reduced motion is respected, including scrolling triggered from code.
- Japanese text is tagged `lang="ja"` and hidden from screen readers where English sits right next to it.
