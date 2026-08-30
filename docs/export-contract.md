# FrameParcel export contract

This document defines the tool-neutral package that FrameParcel gives to a developer or coding agent. Consumers should feature-detect optional files and should not depend on directory ordering.

## Required root files

- `assets/manifest.json` — selected roots, preset, scope, preview inventory, image inventory, and SVG inventory.
- `EXPORT_SUMMARY.txt` — compact human-readable export receipt.

The standard development, visual review, and archive presets also include:

- `index.html` — self-contained local visual browser;
- `HANDOFF.md` — instructions and validation boundaries for humans and agents.

## Optional directories

- `screens/` — 2× previews of full-size screen surfaces and, when appropriate, a selected-container overview.
- `components/` — previews of smaller top-level fragments that are useful for implementation but are not full screens.
- `design/node-index.json` — implementation-focused node data including paths, parent IDs, geometry, typography, paints, effects, Auto Layout, components, and variable references.
- `design/rest-v1.json` — raw Figma REST V1 output in the archive preset.
- `assets/images/` — original bytes referenced by image fills.
- `assets/svg/` — visible vector compositions, deduplicated by content.

## Scope semantics

`selection` exports the selected exportable roots and their descendants. Mixed invalid selections fail instead of silently dropping unknown roots.

`page` exports every visible exportable top-level node on the current Page. It does not require an artificial wrapper frame and it does not include hidden top-level roots.

Nodes that merely look nearby on the canvas are not included unless they are inside an exported root or are themselves an exported Page root.

## Consumer guidance

1. Open `index.html` or inspect `screens/` first for visual intent.
2. Use `design/node-index.json` for implementation measurements and node relationships.
3. Reuse the exact files in `assets/`; do not redraw supplied artwork.
4. Treat missing font files as an explicit boundary: names and styles are metadata, not redistribution permission.
5. Read errors in `assets/manifest.json`. A package can exist while an individual original image or SVG candidate failed.

## Compatibility

The contract is independent of any one coding agent. Codex, Claude Code, Cursor, Copilot, scripts, and human developers can all consume the same extracted folder.

Additive fields and directories may appear in minor versions. Removing or changing the meaning of an existing required field requires a contract-version change and a migration note.
