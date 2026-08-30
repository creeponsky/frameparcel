# Community asset guide

## Production files

- `icon.svg` / `icon.png` — 128×128 FrameParcel icon.
- `thumbnail.svg` / `thumbnail.png` — 1920×1080 English Community cover.
- `thumbnail-zh.svg` / `thumbnail-zh.png` — Chinese cover.
- `carousel-01-scopes.*` — supported export scopes.
- `carousel-02-package.*` — package contents and local browser.
- `carousel-03-private.*` — privacy and network boundary.
- Files ending in `-zh` are the Chinese versions.
- `vendor-marks/` contains the unmodified third-party compatibility marks used by the cover diagram, together with source and trademark notes.

## Product mark

The production `icon.*` uses a pair of design frames and a zipper/download rail. Its color palette hints at Figma workflows without copying Figma's official mark.

## Regeneration

After changing English carousel copy, run:

```bash
npm run assets:i18n
```

This regenerates the Chinese SVGs from the translation map in `scripts/generate-community-assets.mjs`.

After changing either cover or a compatibility mark, run:

```bash
npm run assets:thumbnails
```

The renderer embeds the local third-party PNGs before passing each SVG to macOS `sips`; this avoids missing relative-image references in the release PNGs. Release PNGs must still be visually inspected for font fallback, clipping, line length, and correct marks.

## Brand boundary

The Community cover names Figma, Codex, Claude Code, and Cursor to explain an input/output workflow. The three coding-agent marks are unmodified files from Figma's official MCP client catalog. They are not part of the FrameParcel logo and do not imply an official partnership or endorsement.
