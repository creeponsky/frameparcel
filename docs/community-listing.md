# FrameParcel — Figma Community listing

## Name

FrameParcel

## Tagline

Export Figma context into a local package any coding agent can inspect.

## Category

Software development

## Short description

FrameParcel turns selected Figma designs—or an entire Page—into a structured ZIP with visual previews, implementation geometry, original images, clean SVGs, and a local browser. Export once, then hand it to a developer, coding agent, archive, or review workflow without repeatedly reconnecting to the source file.

## Full description

Screenshots lose structure. Raw JSON loses visual context and original assets. FrameParcel keeps both in one portable, inspectable package.

Choose what you need:

- **Ready for development** — pages, component previews, node geometry, styles, original images, smart SVGs, and a local `index.html` browser.
- **Visual review** — a compact offline gallery for product and design review.
- **Complete archive** — everything in the development package plus Figma REST V1 data.
- **Customize** — every item has a plain-language explanation, so you never have to guess which boxes matter.

Built for real handoff work:

- exports a single node, multiple selected nodes, a screen container, or the current Page;
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

## 中文商店文案

### 名称

FrameParcel

### 一句话介绍

把 Figma 设计上下文导出成本地交付包，直接交给开发者或 Coding Agent。

### 简介

只给 AI 一张截图，它看得到样子，却看不到真实层级、间距、字体和素材；直接导出原始 JSON，信息又太多，很难找到真正有用的部分。

FrameParcel 把两者整理到同一个本地 ZIP：页面和组件预览、实现坐标、字体与效果、原始图片、精简 SVG、可直接打开的 `index.html`，以及一份告诉开发者和 Coding Agent 如何使用这些文件的交付说明。

你可以导出：

- 单个 Frame、Section、组件或其他可导出节点；
- 一次多选的多个页面或组件；
- 包含多个页面的大容器；
- 当前 Page 的全部可见顶层内容，无需先手工套一层 Frame。

默认的“交给开发或 AI”已经包含实现通常需要的内容；“只做视觉评审”会生成更小的离线浏览包；“完整归档”才会额外加入 Figma REST V1 原始结构。每个自定义选项都有用途解释。

FrameParcel 完全在本机运行：无账号、无 API Token、无统计分析、无网络权限、无托管存储。设计内容只会在你主动下载 ZIP 时离开 Figma。

它负责整理设计上下文，不会生成生产代码，也不会复制受许可限制的字体文件。

### 发布短句

导出一次，交给任何 Coding Agent。

## Support

https://github.com/creeponsky/frameparcel/issues

## Privacy policy

https://github.com/creeponsky/frameparcel/blob/main/PRIVACY.md

## Version 1.0.0 release notes

FrameParcel now exports a single selected node, multiple selected nodes, a multi-screen container, or the entire current Page. This release also includes Light and Dark Mode support, local visual browsing, original image and deduplicated SVG export, implementation geometry, clearer presets, and sandbox coverage for Figma's plugin runtime.

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
- [x] Confirm icon at 128 × 128
- [x] Confirm thumbnail at 1920 × 1080
- [x] Prepare a real support contact for the Figma publishing form
- [ ] Confirm two-factor authentication on the publishing account
- [ ] Review and submit from Figma Desktop

## Community media inventory

- `icon.png` — selected 128×128 production icon.
- `thumbnail.png` / `thumbnail-zh.png` — English and Chinese 1920×1080 covers.
- `carousel-01-scopes.png` / `carousel-01-scopes-zh.png` — export scopes.
- `carousel-02-package.png` / `carousel-02-package-zh.png` — package contents.
- `carousel-03-private.png` / `carousel-03-private-zh.png` — local-only privacy boundary.

The Community listing can use the English set. The Chinese set is prepared for Chinese social posts, README material, and future localized listing surfaces. Figma, Codex, Claude Code, and Cursor are referenced only to describe input and compatible consumption workflows; no endorsement is implied.
