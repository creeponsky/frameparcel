# FrameParcel — Figma Community listing

## Name

FrameParcel

## Tagline

Export Figma designs as local, browsable handoff packages for developers and AI.

## Category

Software development

## Short description

FrameParcel turns one selected design area into a structured ZIP with visual previews, implementation geometry, original images, clean SVGs, and a local browser. Export once, then hand it to a developer, coding agent, archive, or review workflow without repeatedly reconnecting to the source file.

## Full description

Screenshots lose structure. Raw JSON loses visual context and original assets. FrameParcel keeps both in one portable, inspectable package.

Choose what you need:

- **Ready for development** — pages, component previews, node geometry, styles, original images, smart SVGs, and a local `index.html` browser.
- **Visual review** — a compact offline gallery for product and design review.
- **Complete archive** — everything in the development package plus Figma REST V1 data.
- **Customize** — every item has a plain-language explanation, so you never have to guess which boxes matter.

Built for real handoff work:

- separates full screens from small top-level design fragments;
- preserves original image fills instead of cropping them from screenshots;
- exports visible icon compositions and deduplicates repeated SVGs;
- records relative and absolute geometry, typography, effects, Auto Layout, components, and variable references;
- generates a handoff guide that tells humans and coding agents which files are authoritative;
- adapts to Figma Light and Dark Mode.

Private by design: FrameParcel has no network access, analytics, account, API token, hosted connector, or metered calls. Your design stays in Figma until the ZIP is downloaded directly to your computer.

FrameParcel packages design context. It does not generate production code, copy licensed font files, or access anything outside the selected node.

## Release tagline

Export once. Hand off anywhere.

## Security disclosure notes

- Network access: none
- User accounts: none
- Analytics/telemetry: none
- External storage: none
- Data leaves Figma only through the user-triggered local ZIP download

## Submission checklist

- [ ] Verify the latest build in Figma Desktop in both Light and Dark Mode
- [ ] Export all three presets from a real multi-screen selection
- [ ] Validate the resulting ZIPs with `npm run validate-export`
- [ ] Confirm icon at 128 × 128
- [ ] Confirm thumbnail at 1920 × 1080
- [ ] Add a real support contact in the Figma publishing form
- [ ] Confirm two-factor authentication on the publishing account
- [ ] Review and submit from Figma Desktop

