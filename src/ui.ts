import { strToU8, zipSync } from "fflate";

type Receipt = { preset: string; nodes: number; screens: number; components: number; images: number; svgCandidates: number };
type ReasonCode = "EMPTY_SELECTION" | "INVALID_SELECTION" | "EMPTY_PAGE";
type ScopeSummary = {
  valid: boolean;
  name?: string;
  nodeType?: string;
  rootCount?: number;
  screenCount?: number;
  componentCount?: number;
  reasonCode?: ReasonCode;
};

type PluginMessage =
  | { type: "initialize"; locale: Locale | null; selection: ScopeSummary; page: ScopeSummary }
  | { type: "selection"; selection: ScopeSummary; page: ScopeSummary }
  | { type: "export-start"; total: number }
  | { type: "export-file"; path: string; bytes: Uint8Array | number[] }
  | { type: "export-progress"; completed: number; total: number; label: string }
  | { type: "export-complete"; filename: string; summary: string; receipt: Receipt }
  | { type: "export-error"; message: string };

type Preset = "developer" | "review" | "archive" | "custom";
type Locale = "zh" | "en";
type ScopeMode = "selection" | "page";

const copy = {
  en: {
    tagline: "Pack design, assets, and implementation context into one inspectable handoff.",
    "local-only": "LOCAL ONLY",
    "purpose-label": "What will this package be used for?",
    "scope-label": "Export scope",
    "scope-selection-title": "Current selection",
    "scope-selection-copy": "One node or multiple selected frames, sections, and components.",
    "scope-page-title": "Current Page",
    "scope-page-copy": "Export visible top-level content without wrapping it in another frame.",
    "developer-title": "Development or AI",
    "developer-copy": "Previews, geometry, original images, smart SVGs, and a browsable index.html.",
    recommended: "RECOMMENDED",
    "review-title": "Visual review",
    "review-copy": "Page and component previews plus a local browser. The smallest package.",
    "archive-title": "Complete archive",
    "archive-copy": "Adds Figma REST V1 data for debugging and long-term preservation.",
    "custom-summary": "Customize contents",
    "node-index-label": "Implementation node index<small>Relative and absolute geometry, type, colors, effects, components, and variables.</small>",
    "screenshots-label": "Screen and component 2× PNGs<small>Full surfaces go to screens; small top-level fragments go to components.</small>",
    "images-label": "Original bitmap assets<small>Preserves image-fill bytes instead of recropping preview screenshots.</small>",
    "svg-label": "Smart SVG assets<small>Exports visible icon compositions while skipping hidden layers and duplicates.</small>",
    "viewer-label": "Local browser and handoff guide<small>Review the package without special tools and explain it to developers and agents.</small>",
    "rest-label": "Figma REST V1 structure<small>Complete but usually redundant. Recommended only for full archives.</small>",
    export: "Export handoff package",
    loading: "Reading selection…",
    emptySelectionTitle: "Select one or more design nodes",
    emptyPageTitle: "Nothing exportable on this Page",
    emptySelectionReason: "Select a frame, section, component, or other exportable design node.",
    invalidSelectionReason: "The selection contains a node that Figma cannot export.",
    emptyPageReason: "This Page has no visible top-level design content.",
    preparing: "Preparing export…",
    exportingTitle: "Building your handoff package",
    completeTitle: "Handoff package download started",
    errorTitle: "Export did not finish",
    compressing: "Compressing handoff package…",
    downloadStarted: "Download started",
    downloadHint: "Find it in Downloads or your browser's chosen download location. If a save dialog appeared, use the folder you selected.",
    downloadAgain: "Download again",
    done: "Done",
    zipFailed: "ZIP creation failed",
  },
  zh: {
    tagline: "把设计、素材和实现上下文装进一个可检查的本地交付包。",
    "local-only": "仅本机",
    "purpose-label": "这份包将用来做什么？",
    "scope-label": "导出范围",
    "scope-selection-title": "当前选择",
    "scope-selection-copy": "支持单个节点，也支持多选多个 Frame、Section 或组件。",
    "scope-page-title": "当前 Page",
    "scope-page-copy": "无需手工套外层 Frame，导出当前 Page 内所有可见顶层内容。",
    "developer-title": "交给开发或 AI",
    "developer-copy": "页面预览、坐标样式、原始图片、精简 SVG，以及可直接浏览的 index.html。",
    recommended: "推荐",
    "review-title": "只做视觉评审",
    "review-copy": "仅导出页面与组件预览，加一份本地浏览页；体积最小。",
    "archive-title": "完整归档",
    "archive-copy": "在开发包基础上加入 Figma REST V1 原始结构，适合排查与长期留存。",
    "custom-summary": "自定义内容",
    "node-index-label": "开发坐标索引<small>相对/绝对坐标、字体、颜色、效果、组件和变量引用。</small>",
    "screenshots-label": "页面与组件 2× PNG<small>自动把完整页面放入 screens，小型顶层素材放入 components。</small>",
    "images-label": "原始位图<small>保留图片填充的原始字节，不从预览截图二次裁切。</small>",
    "svg-label": "精简 SVG<small>导出可见的完整图标组合，跳过隐藏层、内部路径和重复文件。</small>",
    "viewer-label": "本地浏览页与交付说明<small>无需安装工具即可查看页面清单，并告诉开发者或 AI 如何使用包内文件。</small>",
    "rest-label": "Figma REST V1 原始结构<small>信息完整但通常与坐标索引重复，默认仅用于完整归档。</small>",
    export: "导出交付包",
    loading: "正在读取选择…",
    emptySelectionTitle: "请选择一个或多个设计节点",
    emptyPageTitle: "当前 Page 无可导出内容",
    emptySelectionReason: "请选择 Frame、Section、组件或其他可导出的设计节点。",
    invalidSelectionReason: "当前选择中包含 Figma 无法导出的节点。",
    emptyPageReason: "当前 Page 没有可见的顶层设计内容。",
    preparing: "准备导出…",
    exportingTitle: "正在生成交付包",
    completeTitle: "交付包已开始下载",
    errorTitle: "导出未完成",
    compressing: "正在压缩交付包…",
    downloadStarted: "下载已开始",
    downloadHint: "请到系统“下载”文件夹或浏览器设置的下载位置查找；如果刚才出现保存窗口，则以你选择的位置为准。",
    downloadAgain: "再次下载",
    done: "完成",
    zipFailed: "ZIP 生成失败",
  },
} as const;

type CopyKey = keyof typeof copy.en;

const app = document.querySelector<HTMLDivElement>("#app")!;
const selectionName = document.querySelector<HTMLDivElement>("#selection-name")!;
const selectionMeta = document.querySelector<HTMLDivElement>("#selection-meta")!;
const exportButton = document.querySelector<HTMLButtonElement>("#export")!;
const exportOverlay = document.querySelector<HTMLDivElement>("#export-overlay")!;
const exportDialogTitle = document.querySelector<HTMLElement>("#export-dialog-title")!;
const progressBar = document.querySelector<HTMLDivElement>("#bar")!;
const status = document.querySelector<HTMLDivElement>("#status")!;
const downloadFilename = document.querySelector<HTMLSpanElement>("#download-filename")!;
const downloadHint = document.querySelector<HTMLSpanElement>("#download-hint")!;
const downloadAgain = document.querySelector<HTMLButtonElement>("#download-again")!;
const dialogClose = document.querySelector<HTMLButtonElement>("#dialog-close")!;
const files: Record<string, Uint8Array> = {};
let lastDownload: { url: string; filename: string } | null = null;
let locale: Locale = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
let initialized = false;
let currentPreset: Preset = "developer";
let currentScope: ScopeMode = "selection";
let latestScopes: Record<ScopeMode, ScopeSummary> = {
  selection: { valid: false, reasonCode: "EMPTY_SELECTION" },
  page: { valid: false, reasonCode: "EMPTY_PAGE" },
};

const optionIds = ["node-index", "rest-json", "screenshots", "images", "svg", "viewer"] as const;

function t(key: CopyKey): string {
  return copy[locale][key];
}

function reveal(): void {
  initialized = true;
  app.classList.add("ready");
  app.setAttribute("aria-busy", "false");
}

function checked(id: typeof optionIds[number]): boolean {
  return document.querySelector<HTMLInputElement>(`#${id}`)!.checked;
}

function setChecked(id: typeof optionIds[number], value: boolean): void {
  document.querySelector<HTMLInputElement>(`#${id}`)!.checked = value;
}

function scopeReason(summary: ScopeSummary): string {
  switch (summary.reasonCode) {
    case "INVALID_SELECTION": return t("invalidSelectionReason");
    case "EMPTY_PAGE": return t("emptyPageReason");
    case "EMPTY_SELECTION":
    default: return t("emptySelectionReason");
  }
}

function renderScope(): void {
  const summary = latestScopes[currentScope];
  if (summary.valid) {
    selectionName.textContent = summary.nodeType === "SELECTION"
      ? (locale === "zh" ? `已选择 ${summary.rootCount ?? 0} 个节点` : `${summary.rootCount ?? 0} selected nodes`)
      : (summary.name ?? (currentScope === "page" ? "Current Page" : "Selection"));
    selectionMeta.textContent = locale === "zh"
      ? `${summary.nodeType} · ${summary.rootCount ?? 0} 个顶层节点 · 识别 ${summary.screenCount ?? 0} 个页面 / ${summary.componentCount ?? 0} 个组件`
      : `${summary.nodeType} · ${summary.rootCount ?? 0} top-level nodes · ${summary.screenCount ?? 0} screens / ${summary.componentCount ?? 0} components`;
    exportButton.disabled = false;
  } else {
    selectionName.textContent = currentScope === "page" ? t("emptyPageTitle") : t("emptySelectionTitle");
    selectionMeta.textContent = scopeReason(summary);
    exportButton.disabled = true;
  }
}

function applyLocale(next: Locale, persist = false): void {
  locale = next;
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  for (const [id, value] of Object.entries(copy[locale])) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = value;
  }
  document.querySelectorAll<HTMLButtonElement>("[data-locale]").forEach((button) => {
    const active = button.dataset.locale === locale;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  downloadHint.textContent = t("downloadHint");
  downloadAgain.textContent = t("downloadAgain");
  dialogClose.textContent = t("done");
  renderScope();
  if (persist) parent.postMessage({ pluginMessage: { type: "set-locale", locale } }, "*");
}

function applyPreset(preset: Exclude<Preset, "custom">): void {
  const values = preset === "review"
    ? { "node-index": false, "rest-json": false, screenshots: true, images: false, svg: false, viewer: true }
    : { "node-index": true, "rest-json": preset === "archive", screenshots: true, images: true, svg: true, viewer: true };
  optionIds.forEach((id) => setChecked(id, values[id]));
  currentPreset = preset;
}

function markCustom(): void {
  currentPreset = "custom";
  document.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach((input) => { input.checked = false; });
}

document.querySelectorAll<HTMLButtonElement>("[data-locale]").forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.dataset.locale;
    if (next === "zh" || next === "en") applyLocale(next, true);
  });
});

document.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) applyPreset(input.value as Exclude<Preset, "custom">);
  });
});
optionIds.forEach((id) => document.querySelector<HTMLInputElement>(`#${id}`)!.addEventListener("change", markCustom));

document.querySelectorAll<HTMLInputElement>('input[name="scope"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    currentScope = input.value as ScopeMode;
    renderScope();
  });
});

function updateScopes(selection: ScopeSummary, page: ScopeSummary): void {
  latestScopes = { selection, page };
  renderScope();
}

function selectScope(scope: ScopeMode): void {
  currentScope = scope;
  const input = document.querySelector<HTMLInputElement>(`input[name="scope"][value="${scope}"]`);
  if (input) input.checked = true;
  renderScope();
}

function showExportDialog(): void {
  exportOverlay.className = "export-overlay visible";
  exportOverlay.setAttribute("aria-hidden", "false");
  exportDialogTitle.textContent = t("exportingTitle");
  app.inert = true;
}

function finishExportDialog(state: "complete" | "failed", title: string): void {
  exportOverlay.classList.add(state);
  exportDialogTitle.textContent = title;
  dialogClose.focus();
}

function closeExportDialog(): void {
  dialogClose.blur();
  exportOverlay.className = "export-overlay";
  exportOverlay.setAttribute("aria-hidden", "true");
  app.inert = false;
  exportButton.focus();
}

function triggerDownload(download: { url: string; filename: string }): void {
  const anchor = document.createElement("a");
  anchor.href = download.url;
  anchor.download = download.filename;
  anchor.click();
}

function setStatus(message: string, error = false): void {
  status.textContent = message;
  status.classList.toggle("error", error);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

exportButton.addEventListener("click", () => {
  exportButton.disabled = true;
  showExportDialog();
  progressBar.style.width = "0%";
  setStatus(t("preparing"));
  for (const key of Object.keys(files)) delete files[key];
  parent.postMessage({
    pluginMessage: {
      type: "export",
      options: {
        preset: currentPreset,
        locale,
        scope: currentScope,
        includeNodeIndex: checked("node-index"),
        includeRestJson: checked("rest-json"),
        includeScreenshots: checked("screenshots"),
        includeImages: checked("images"),
        includeSvg: checked("svg"),
        includeViewer: checked("viewer"),
        screenshotScale: 2,
      },
    },
  }, "*");
});

window.onmessage = (event: MessageEvent<{ pluginMessage: PluginMessage }>) => {
  const message = event.data.pluginMessage;
  if (!message) return;

  if (message.type === "initialize") {
    updateScopes(message.selection, message.page);
    selectScope(message.selection.valid ? "selection" : "page");
    applyLocale(message.locale ?? locale);
    reveal();
    return;
  }

  if (message.type === "selection") {
    updateScopes(message.selection, message.page);
    selectScope(message.selection.valid ? "selection" : "page");
    if (!initialized) {
      applyLocale(locale);
      reveal();
    }
    return;
  }

  if (message.type === "export-start") {
    setStatus(locale === "zh" ? `开始处理，预计 ${message.total} 个步骤…` : `Starting ${message.total} export steps…`);
    return;
  }

  if (message.type === "export-file") {
    files[message.path] = message.bytes instanceof Uint8Array ? message.bytes : new Uint8Array(message.bytes);
    return;
  }

  if (message.type === "export-progress") {
    const ratio = message.total > 0 ? message.completed / message.total : 0;
    progressBar.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
    setStatus(message.label);
    return;
  }

  if (message.type === "export-complete") {
    setStatus(t("compressing"));
    try {
      files["EXPORT_SUMMARY.txt"] = strToU8(message.summary);
      const archive = zipSync(files, { level: 6 });
      const blob = new Blob([archive], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      if (lastDownload) URL.revokeObjectURL(lastDownload.url);
      lastDownload = { url, filename: message.filename };
      triggerDownload(lastDownload);
      progressBar.style.width = "100%";
      setStatus(locale === "zh"
        ? `${message.receipt.screens} 个页面、${message.receipt.components} 个组件、${message.receipt.images} 张原图 · ${Object.keys(files).length} 个文件 · ${formatBytes(archive.byteLength)}`
        : `${message.receipt.screens} screens, ${message.receipt.components} components, ${message.receipt.images} original images · ${Object.keys(files).length} files · ${formatBytes(archive.byteLength)}`);
      downloadFilename.textContent = message.filename;
      downloadHint.textContent = t("downloadHint");
      finishExportDialog("complete", t("completeTitle"));
    } catch (error) {
      setStatus(`${t("zipFailed")}: ${error instanceof Error ? error.message : String(error)}`, true);
      finishExportDialog("failed", t("errorTitle"));
    } finally {
      exportButton.disabled = false;
    }
    return;
  }

  if (message.type === "export-error") {
    setStatus(message.message, true);
    exportButton.disabled = false;
    finishExportDialog("failed", t("errorTitle"));
  }
};

downloadAgain.addEventListener("click", () => {
  if (lastDownload) triggerDownload(lastDownload);
});

dialogClose.addEventListener("click", closeExportDialog);

// The main sandbox normally initializes immediately. This fallback keeps the
// standalone UI preview useful without exposing a half-translated interface.
setTimeout(() => {
  if (!initialized) {
    applyLocale(locale);
    selectionName.textContent = t("loading");
    selectionMeta.textContent = "";
    reveal();
  }
}, 250);
