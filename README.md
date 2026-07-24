# Pergola Builder

A client-side web app that designs a freestanding pergola from your dimensions, renders it in 3D, and produces a cut list, cost estimate, hardware list, and printable plan sheet. All lumber is pressure-treated in common sizes (6x6 posts, doubled 2x10 beams, 2x8/2x10 rafters, 2x4 slats, 4x4 braces) and common stock lengths (8/10/12/16 ft).

> Visualization tool only — not engineering advice. Verify spans, footings, and code requirements locally.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm test         # engine unit tests (vitest)
npm run build    # type-check + production build → dist/
npm run preview  # serve the production build
```

## How it works

- `src/engine/` — pure TypeScript, no React/three imports. `designPergola(config)` produces a list of typed members (id, role, size, cut length, position, rotation) plus warnings and metadata. Everything else — the 3D view, cut list, bin-packed shopping list, hardware counts, cost estimate, and print diagrams — derives from that one output.
- Units: the engine works in inches; the three.js scene uses 1 unit = 1 foot; UI inputs are feet.
- Design rules of thumb: 6x6 posts (middle posts added past a 14-ft beam span), doubled 2x10 beams, rafters sized by span, even redistribution of rafter/slat spacing, 45° knee braces, optional embedded posts (embedment added to cut lengths only).
- Options: front tilt (shed slope — front posts cut shorter, rafter lengths grow by 1/cos of the pitch, low-clearance warning), decorative rafter tails (square, chamfer, bullnose, cove), and a 1-1/2" rafter bite — level seat notches cut over each beam assembly so rafters lock over the headers even when the roof is sloped. Tails and notches render as extruded side profiles in the 3D view.
- `src/engine/cutlist.ts` packs cuts onto purchasable boards with first-fit-decreasing + 1/8" kerf, then shrinks each board to the smallest stock length that fits. A "longest board" transport cap (8/10/12/16 ft) constrains packing, with warnings for one-piece cuts that physically need longer boards; the Cost tab compares lumber totals under every cap.
- Rafter size is auto by span (2x8, upgrading to 2x10) or forced to 2x4/2x6/2x8/2x10 with rule-of-thumb span warnings; the bite notch depth clamps to a third of shallow rafters.
- Prices in the Cost tab are editable and persist to localStorage.
- The plan sheet captures the 3D canvas (`preserveDrawingBuffer`), draws dimensioned plan/elevation SVGs, and prints with letter-size print CSS.

## Stack

Vite · React 19 · TypeScript · three.js via @react-three/fiber + drei · zustand · vitest
