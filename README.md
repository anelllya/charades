# Charades Free

A heads-up charades party game in a single HTML file. No ads, no packs, no paywall.

**Play:** https://anelllya.github.io/charades/

## Features

- English and Spanish word lists
- 30, 60 or 90 second rounds
- Tilt controls (phone on your forehead) or tap controls
- Kids mode with family-friendly categories
- "Mix it up" category and your own custom word list (saved on your device)
- Works offline once loaded; add it to your home screen to run full screen

## How to play

1. Pick a language, round length, controls and a category.
2. Hold the phone sideways on your forehead, screen facing your friends.
3. Tilt down (or tap right) for correct, tilt up (or tap left) to pass.

Tilt needs a motion sensor and an HTTPS page; on iOS, tap **Allow** when asked for motion access.

## Project layout

- `index.html`: page markup
- `style.css`: styles
- `app.js`: game logic
- `words.json`: categories and word lists (English `w_en`, Spanish `w_es`). Add words here.

## Run locally

No build step, but `words.json` is fetched, so serve the folder instead of opening the file directly:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.
