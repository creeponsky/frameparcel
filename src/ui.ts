import { strToU8, zipSync } from "fflate";

type Receipt = { preset: string; nodes: number; screens: number; components: number; images: number; svgCandidates: number };

type PluginMessage =
  | { type: "selection"; valid: boolean; name?: string; nodeType?: string; width?: number; height?: number; childCount?: number; screenCount?: number; componentCount?: number; reason?: string }
  | { type: "export-start"; total: number }
  | { type: "export-file"; path: string; bytes: Uint8Array | number[] }
  | { type: "export-progress"; completed: number; total: number; label: string }
  | { type: "export-complete"; filename: string; summary: string; receipt: Receipt }
  | { type: "export-error"; message: string };

type Preset = "developer" | "review" | "archive" | "custom";
type Locale = "zh" | "en";

const locale: Locale = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
const copy = {
  zh: {
    tagline: "把设计、素材和实现上下文装进一个可检查的本地交付包。",
    "local-only": "仅本机",
    "purpose-label": "这份包将用来做什么？",
    "developer-title": "交给开发或 AI",
    "developer-copy": "页面预览、坐标样式、原始图片、精简 SVG，以及可直接浏览的 index.html。",
    recommended: "推荐",
    "review-title": "只做视觉评审",
    "review-copy": "仅导出页面与组件预览，加一份本地浏览页；体积最小。",
    "archive-title": "完整归档",
    "archive-copy": "在开发包基础上加入 Figma REST V1 原始结构，适合排查与长期留存。",
    "custom-summary": "自定义内容（选择后将切换到“自定义”）",
    "node-index-label": "开发坐标索引<small>相对/绝对坐标、字体、颜色、效果、组件和变量引用。</small>",
    "screenshots-label": "页面与组件 2× PNG<small>自动把完整页面放入 screens，小型顶层素材放入 components。</small>",
    "images-label": "原始位图<small>保留图片填充的原始字节，不从预览截图二次裁切。</small>",
    "svg-label": "精简 SVG<small>导出可见的完整图标组合，跳过隐藏层、内部路径和重复文件。</small>",
    "viewer-label": "本地浏览页与交付说明<small>无需安装工具即可查看页面清单，并告诉开发者如何使用包内文件。</small>",
    "rest-label": "Figma REST V1 原始结构<small>信息完整但通常与坐标索引重复，默认仅用于完整归档。</small>",
    export: "导出交付包",
    "receipt-title": "交付包已生成",
  },
} as const;

if (locale === "zh") {
  for (const [id, value] of Object.entries(copy.zh)) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = value;
  }
}
document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";

const selectionName = document.querySelector<HTMLDivElement>("#selection-name")!;
const selectionMeta = document.querySelector<HTMLDivElement>("#selection-meta")!;
const exportButton = document.querySelector<HTMLButtonElement>("#export")!;
const progress = document.querySelector<HTMLDivElement>("#progress")!;
const progressBar = document.querySelector<HTMLDivElement>("#bar")!;
const status = document.querySelector<HTMLDivElement>("#status")!;
const receipt = document.querySelector<HTMLDivElement>("#receipt")!;
const receiptCopy = document.querySelector<HTMLSpanElement>("#receipt-copy")!;
const files: Record<string, Uint8Array> = {};
let currentPreset: Preset = "developer";

const optionIds = ["node-index", "rest-json", "screenshots", "images", "svg", "viewer"] as const;

function checked(id: typeof optionIds[number]): boolean {
  return document.querySelector<HTMLInputElement>(`#${id}`)!.checked;
}

function setChecked(id: typeof optionIds[number], value: boolean): void {
  document.querySelector<HTMLInputElement>(`#${id}`)!.checked = value;
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

document.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) applyPreset(input.value as Exclude<Preset, "custom">);
  });
});
optionIds.forEach((id) => document.querySelector<HTMLInputElement>(`#${id}`)!.addEventListener("change", markCustom));

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
  progress.style.display = "block";
  receipt.style.display = "none";
  progressBar.style.width = "0%";
  setStatus(locale === "zh" ? "准备导出…" : "Preparing export…");
  for (const key of Object.keys(files)) delete files[key];
  parent.postMessage({
    pluginMessage: {
      type: "export",
      options: {
        preset: currentPreset,
        locale,
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

  if (message.type === "selection") {
    if (message.valid) {
      selectionName.textContent = message.name ?? "未命名节点";
      selectionMeta.textContent = locale === "zh"
        ? `${message.nodeType} · ${Math.round(message.width ?? 0)} × ${Math.round(message.height ?? 0)} · 识别 ${message.screenCount ?? 0} 个页面 / ${message.componentCount ?? 0} 个组件`
        : `${message.nodeType} · ${Math.round(message.width ?? 0)} × ${Math.round(message.height ?? 0)} · ${message.screenCount ?? 0} screens / ${message.componentCount ?? 0} components`;
      exportButton.disabled = false;
    } else {
      selectionName.textContent = locale === "zh" ? "请选择一个可导出的设计区域" : "Select one exportable design area";
      selectionMeta.textContent = locale === "zh" ? (message.reason ?? "当前选择无效") : "Select exactly one Frame, Section, Component, or exportable node.";
      exportButton.disabled = true;
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
    setStatus(locale === "zh" ? "正在压缩交付包…" : "Compressing handoff package…");
    try {
      files["EXPORT_SUMMARY.txt"] = strToU8(message.summary);
      const archive = zipSync(files, { level: 6 });
      const blob = new Blob([archive], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = message.filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
      progressBar.style.width = "100%";
      setStatus(locale === "zh" ? "下载已开始" : "Download started");
      receipt.style.display = "block";
      receiptCopy.textContent = locale === "zh"
        ? `${message.receipt.screens} 个页面、${message.receipt.components} 个组件、${message.receipt.images} 张原图 · ${Object.keys(files).length} 个文件 · ${formatBytes(archive.byteLength)}`
        : `${message.receipt.screens} screens, ${message.receipt.components} components, ${message.receipt.images} original images · ${Object.keys(files).length} files · ${formatBytes(archive.byteLength)}`;
    } catch (error) {
      setStatus(`${locale === "zh" ? "ZIP 生成失败" : "ZIP creation failed"}: ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
      exportButton.disabled = false;
    }
    return;
  }

  if (message.type === "export-error") {
    setStatus(message.message, true);
    exportButton.disabled = false;
  }
};
