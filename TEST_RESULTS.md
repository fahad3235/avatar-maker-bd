# Avatar Maker BD — test results (run #273, 2026-11-08)

## Unit tests — 89/89 pass

`node tests/logic.test.js` — defaults + per-field validation (face, skin,
hair style/colour, eyes, mouth, glasses, accessory, shirt, bg, name ≤ 30);
name rules (trim, empty, 31 chars, non-string); shade() exact values
(#ffffff −255 → #000000, #0e7490 −25 → #005b77); starPoints (10 vertices,
starts at top); Bengali digits (123 → ১২৩); SVG output for every option
value with distinctness asserted for all 10 groups (3 faces, 7 hair
styles, 5 eyes, 5 mouths, 4 glasses, 4 accessories, 6 skins, 6 hair
colours, 8 shirts, 8 backgrounds); hijab hides hair + ears; cap brim;
long/curly/bun/spiky hair shapes; star/happy/wink/sleepy eyes; grin/flat/
open/tongue mouths; round/square/sunglasses; determinism (same config →
identical SVG); seeded random (deterministic, validates, seeds differ);
combo count 19,353,600; gallery-payload validation (ok / wrong app /
bad version / bad item / 13 items / empty / non-array).

Repairs: 2 test-side fixes (starPoints needed a default `points = 5`;
sequential LCG seeds correlate on first draw, so the coverage test now
mixes seeds) + 1 real app fix found by smoke (see below). 0 remaining
failures.

## Headless-Chrome smoke — 54/54 pass, 0 console/page errors

`node tests/smoke.js` (raw CDP against Playwright `headless_shell-1187`,
`/opt/meta-chromium/chrome` refuses raw launches in this VM — "Hatch
WebGL domain policy is required for browser startup" — documented in the
smoke script). Verified: title, stage SVG (viewBox 240), all 10 option
groups with exact counts (3/6/7/6/5/5/4/4/8/8), combo line 19353600,
oval face → ellipse in SVG, selected-chip marking, round glasses, hijab
renders with ears hidden, reset restores defaults, randomize changes the
avatar, real PNG data URL (`data:image/png;base64,iVBOR…`, > 5000 chars),
save rejected with empty name (error toast shown), named save → 1 gallery
card with mini SVG, duplicate name rejected, gallery + avatar name persist
across reload, load restores saved face, delete removes the card, export
payload is avatar-maker-bd v1, erase-all clears, valid import restores,
wrong-app import rejected with data intact, BN toggle (title অ্যাভাটার
মেকার বিডি, Bengali digits, face label মুখের আকৃতি) + reload persistence,
390px no horizontal overflow (before and after an option change), zero
non-file network requests.

Repairs: 1 real app bug fixed + re-verified (save() never synced the
typed name into the live config, so the name field emptied on reload;
now `state.config.name` is set on save). 0 remaining failures.

## Visual check

Hand-verified screenshot (headless_shell, 1280×900): clean two-column
layout, avatar renders correctly (round face, short black hair, round
eyes, smile, teal shirt, cream background), all option groups render
with selected states visible, Bengali toggle button renders.
