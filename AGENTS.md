# FrameParcel agent guide

This file is the canonical repository guide for Codex, Claude Code, Cursor, Copilot, and other coding agents. Do not duplicate these rules in tool-specific files; point those files here.

## Product boundary

FrameParcel is a local-only Figma plugin. It packages selected Figma nodes or the visible top-level content of the current Page into an inspectable ZIP for humans and file-reading coding agents.

It does not generate production code, upload designs, require an account, call a hosted API, copy licensed font files, or inspect nodes outside the user-selected scope.

## Authoritative files

- `src/code.ts`: Figma main-sandbox logic, scope resolution, node and asset extraction, export package contract.
- `src/ui.ts`: locale state, presets, progress, browser-side ZIP creation and download.
- `src/ui.html`: semantic Light/Dark UI shell.
- `manifest.json`: runtime permissions. `networkAccess.allowedDomains` must remain `['none']` unless a separately reviewed product change explicitly requires otherwise.
- `scripts/sandbox-smoke.mjs`: Figma runtime regression coverage. Its missing `TextEncoder`/`TextDecoder` globals are intentional.
- `scripts/validate-export.mjs`: structural validation for a real exported ZIP or extracted folder.
- `docs/export-contract.md`: stable handoff package contract.
- `docs/community-listing.md`: source of truth for Community metadata.

`dist/` is generated but committed because local Figma installation and release archives must work without a build step. Never edit it by hand; run `npm run build`.

## Required checks

Run these after code changes:

```bash
npm ci
npm run check
npm run build
npm run test:sandbox
npm audit --audit-level=high
```

For changes to export behavior, also validate at least one real package when Figma Desktop is available:

```bash
npm run validate-export -- /absolute/path/to/export.zip
```

Generating a ZIP in a synthetic sandbox does not prove Figma Desktop rendering, downloaded browser behavior, or a real file's asset coverage.

## Invariants

1. Keep the main Figma sandbox compatible with environments that do not expose browser encoding globals.
2. Keep the generated `index.html` self-contained and free of remote resources.
3. Preserve original image-fill bytes; do not substitute crops taken from preview screenshots.
4. Export a complete visible icon composition when possible; avoid dumping every internal vector path as a separate SVG.
5. A Page export includes visible exportable top-level nodes. A selection export includes only valid selected roots and their descendants.
6. Hidden roots and nodes outside the selected tree must not leak into the package.
7. User-facing UI must render in one complete locale. Chinese and English selection, progress, errors, presets, and receipts must never be mixed.
8. The default development preset should be useful without asking users to understand the raw REST schema. REST V1 remains an archive/debug option.
9. Keep agent guidance tool-neutral: name authoritative files and boundaries instead of prescribing generated code.

## Change workflow

- Diagnose from the source files and tests before editing generated output.
- Add or update a regression test for runtime, scope, or package-contract bugs.
- Run the required checks and state exactly which checks were synthetic versus real-Figma validation.
- Do not publish a Figma Community release, push a social post, or submit a public listing without the account owner's explicit final confirmation.

## Community assets

- English SVGs are canonical.
- Run `npm run assets:i18n` after changing carousel copy to regenerate Chinese SVGs.
- PNGs are release artifacts rendered from the SVGs at 1920×1080; the plugin icon is 128×128.
- The FrameParcel icon uses Figma-inspired colors but must remain visually distinct from Figma's official mark.
- Product names such as Codex, Claude Code, Cursor, and Figma describe compatible workflows and do not imply endorsement.
