# assets/ — drop sprite sheets here

Nothing in this folder is fetched from the network. Everything here is hand-placed
by Jackson and processed locally at build time.

## What to drop

PNG sheets, one file per source pack. Keep the pack's own licence file next to it
(`<packname>.LICENSE.txt`) so provenance is never lost, even though this game is
never sold and never published.

    assets/
      lpc_body_male.png
      lpc_body_male.LICENSE.txt
      lpc_suit_blue.png
      ...

## Licences that are safe here

- **CC0 / public domain** — no strings at all. Prefer this.
- **CC-BY** — fine, but the attribution must land in `CREDITS.md`.
- **OGA-BY / CC-BY-SA** — fine for a private build; adds share-alike obligations
  if it ever leaves the machine.
- **GPL-only art** — avoid. It is free but the terms are a poor fit for art.

## Where to find sheets

- Universal LPC Spritesheet Character Generator — build a character in the
  browser, hit download, get a full 8-direction walk sheet.
  https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/
- OpenGameArt, filtered to CC0: https://opengameart.org/art-search-advanced
- itch.io free asset packs: https://itch.io/game-assets/free/tag-pixel-art
- Kenney (all CC0): https://kenney.nl/assets

## Sheet layout

Alongside each PNG, describe its grid in `assets/sheets.json`:

    {
      "hero": {
        "file": "lpc_body_male.png",
        "frameW": 64, "frameH": 64,
        "rows": { "walkUp": 8, "walkLeft": 9, "walkDown": 10, "walkRight": 11 },
        "frames": 9,
        "anchorX": 32, "anchorY": 62,
        "trim": true
      }
    }

`anchorX`/`anchorY` are the point that sits on the character's feet, so sprites
line up with the oblique ground plane. `trim` crops transparent margins at build
time to keep `dist/rhubarb.html` small.

The build inlines each sheet as a data URI, so the single-file artifact keeps
working with no external hosts.

---

## Generator exports (`assets/chars/`)

The Universal LPC generator's "save/export" button produces a JSON file that
already carries every layer's resolved sprite path and z-order. Drop it in
`assets/chars/<name>.json` and run:

    node tools/lpc.js assets/chars/<name>.json walk idle sit

That composites the layers, applies the palette recolours, trims every frame to
one shared box so nothing shifts between poses, and writes:

    <name>.walk.png  <name>.idle.png  <name>.sit.png
    <name>.frames.json     frame size + row order
    <name>.CREDITS.md      attribution, which most of these licences require

It needs a local checkout of the generator repo (for the sheets and palettes):

    git clone --filter=blob:none --sparse --depth 1 \
      https://github.com/LiberatedPixelCup/universal-lpc-spritesheet-character-generator \
      ~/liberatedpixelcup/universal-lpc-spritesheet-character-generator

then `git sparse-checkout add --no-cone 'sheet_definitions/**' 'palette_definitions/**'`
plus the `spritesheets/...` paths the character uses. Point `LPC_REPO` at it if
you keep it somewhere else. Nothing is fetched while building the game itself.

Previews: `node tools/lpcsheet.js` (zoomed walk cycle),
`node tools/lpcscale.js` (dropped into the real curb scene at 1:1).
