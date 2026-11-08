# Avatar Maker BD

Design your own flat-style avatar — no sign-up, no uploads, fully offline.
Bilingual (English / বাংলা), works on phone and desktop.

## Problem

Free avatar makers are usually English-only, ad-laden, and need an account
or an internet connection. A Bangladeshi student who wants a profile picture,
a sticker, or a class-project character deserves a clean, offline tool in
their own language that just works — and lets them keep the result as a
real PNG or SVG file.

## Features

- **Live SVG avatar** built from 10 option groups: face shape (3), skin tone
  (6), hair style (7: short, curly, long, buzz, bun, spiky, bald), hair
  colour (6), eyes (5: round, happy, wink, sleepy, star), expression (5),
  glasses (4), accessory (4: none, cap, hijab, headband), shirt (8),
  background (8) — **19,353,600 combinations**.
- **🎲 Random** button for instant inspiration, **↺ Reset** to the default.
- **Download PNG** (480×480, rasterised from the SVG in-browser) and
  **Download SVG** (vector source), plus **Copy SVG** for pasting into
  other tools.
- **Gallery** — name and save up to 12 avatars in this browser, load or
  delete each one; gallery persists across reloads.
- **Export / import** the gallery as JSON (strict validation, wrong-app
  files rejected), **Erase all** behind a typed-DELETE confirmation.
- **EN / বাংলা toggle** persisted, Bengali digits in BN mode, 390px mobile
  layout, zero network requests.

## Stack

Vanilla HTML / CSS / JavaScript. No build step, no dependencies, no
framework. `logic.js` holds the pure, testable avatar geometry (SVG
builder, validation, gallery payload); `app.js` holds the DOM, storage
and downloads.

## Run it

Open `index.html` in any modern browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server 8000
```

Note: on `file://` pages localStorage works in Chromium; if your browser
blocks it, serve over `http://localhost` instead. PNG download needs the
browser to load the SVG as an image — it works offline, no network call.

## Testing

```sh
node tests/logic.test.js   # 89 unit tests, no dependencies
node tests/smoke.js        # 54 headless-Chrome (CDP) smoke checks
```

Unit tests cover: defaults + validation of every field, name rules,
colour shading, star geometry, Bengali digits, SVG output for every
option value (each option changes the SVG — distinctness asserted for
all 10 groups), hijab hiding hair/ears, determinism, seeded random,
the 19,353,600 combination count, and gallery-payload validation.

Smoke checks cover: all 10 option groups render with the right counts,
option changes rewrite the stage SVG (oval face, round glasses, hijab),
randomize + reset, real PNG data-URL output (`data:image/png;base64,iVBOR…`),
save validation (empty name, duplicate name), gallery persistence across
reload, load/delete, export/import round-trip + wrong-app rejection,
erase-all, EN ⇄ বাংলা toggle with Bengali digits + reload persistence,
390px no-overflow, and zero non-file network requests.

## Limitations

- Avatars are flat-style illustrations drawn from fixed parts, not photos
  or AI generation — the same 10 groups for everyone.
- The gallery lives in this browser's localStorage only (max 12 avatars);
  clearing browser data deletes it — export a JSON backup first.
- PNG export is 480×480; for larger print sizes use the SVG download.
- Hijab and cap colours follow the shirt colour by design, so the outfit
  always matches.

## Status

Complete MVP — factory run #273, 2026-11-08. Published and verified:
repo + GitHub Pages live. No known bugs.
