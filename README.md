# FrameParcel

**Export once. Hand off anywhere.**

FrameParcel is a local-only Figma plugin that turns selected design areas or an entire Page into a browsable handoff package for developers and AI coding agents.

Screenshots alone lose structure. Raw JSON loses visual context and original assets. FrameParcel keeps both—without an API token, hosted service, analytics, or design upload.

## What it exports

- a self-contained `index.html` visual browser;
- 2x page previews, separated from top-level component fragments;
- an implementation-focused node index with relative and absolute geometry;
- typography, paint, effect, Auto Layout, component, and variable references;
- original image-fill bytes;
- deduplicated SVG exports for visible icon compositions;
- a concise `HANDOFF.md` for humans and coding agents;
- optional Figma REST V1 JSON for full archives.

## Export presets

### Ready for development (recommended)

Exports the visual browser, page and component previews, node index, original images, smart SVGs, and handoff guide. This is the default for implementation and AI-assisted coding.

### Visual review

Exports only visual previews, the local browser, and the handoff guide. Use this for product review or sharing a compact offline reference.

### Complete archive

Adds Figma REST V1 JSON to the development package. Use it for debugging, preservation, or tooling that explicitly consumes the raw REST schema.

Every item is also available under **Customize** with a plain-language explanation.

## Export scopes

- **Current selection** — export one Frame, Section, Component, Instance, layer, or multiple selected design nodes.
- **Current Page** — export all visible top-level content on the current Page without first wrapping it in another Frame.
- **Container handoff** — select one large Frame or Section containing many screens; FrameParcel separates full-size screens from smaller component fragments.

## Package layout

```text
selection-handoff.zip
├── index.html
├── HANDOFF.md
├── EXPORT_SUMMARY.txt
├── design/
│   ├── node-index.json
│   └── rest-v1.json          # archive preset only
├── screens/
│   ├── 00-selection-overview.png
│   └── 01-screen.png
├── components/
│   └── 01-component.png
└── assets/
    ├── images/
    ├── svg/
    └── manifest.json
```

## Install from source

Local manifest imports require Figma Desktop.

For a published release, download and extract the GitHub source archive, then import `manifest.json` from Figma Desktop's development plugin menu. The compiled `dist/` files are included, so no build step is required.

For development:

```bash
npm ci
npm run check
npm run build
```

Then open a Figma Design file and import this repository's `manifest.json` from the development plugin menu. Select one or more exportable design nodes, or choose **Current Page** inside FrameParcel.

## Validate a package

The validator accepts either a ZIP or an extracted folder:

```bash
npm run validate-export -- /absolute/path/to/selection-handoff.zip
npm run validate-export -- /absolute/path/to/extracted-folder
```

Validation checks the selected preset's required files, node geometry, previews, asset read errors, SVG export errors, local viewer, and handoff guide.

## Privacy and security

- `networkAccess` is set to `none`.
- No analytics, telemetry, account, or API token.
- Design data and assets stay inside Figma until the plugin downloads the ZIP to your computer.
- The generated `index.html` is self-contained and does not load remote resources.

## Development

```bash
npm run check
npm run build
npm run test:sandbox
npm audit --audit-level=high
```

The sandbox smoke test deliberately omits `TextEncoder` and `TextDecoder`, matching the compatibility boundary that previously caused a real Figma runtime failure.

## Known boundaries

- Font names and styles are recorded, but licensed font files are never copied.
- A layer outside the selected node is not exported, even if it appears visually nearby on the canvas.
- Full-page detection uses top-level node type and dimensions. Smaller top-level items are preserved as component previews instead of being discarded.
- FrameParcel packages context for implementation; it does not generate production code or replace designer/developer review.

## License

MIT

---

## 中文说明

FrameParcel 是一个完全本地运行的 Figma 设计交付插件。它把选中的设计区域导出成一个可直接浏览的 ZIP，里面包含页面预览、坐标样式、原始图片、精简 SVG 和交付说明，适合交给开发者或代码 Agent。

默认“交给开发或 AI”已经包含通常真正需要的内容；完整 REST JSON 被放到“完整归档”，避免每次导出都产生重复数据。插件无网络权限，不需要 Figma Token，也不会上传设计文件。
