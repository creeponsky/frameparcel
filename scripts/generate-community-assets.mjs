import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, "docs", "community-assets");

const translations = {
  "carousel-01-scopes.svg": new Map([
    ["Export the scope you actually mean.", "准确导出你真正需要的范围。"],
    ["One node, multiple selections, a screen container, or the current Page.", "一个节点、多选、页面容器，或整个 Page。"],
    ["Single selection", "单个选择"],
    ["A Frame, Section, Component,", "Frame、Section、组件、"],
    ["Instance, or exportable layer.", "实例或其他可导出图层。"],
    ["Multiple selections", "多个选择"],
    ["Choose independent frames and components.", "独立选择多个页面和组件。"],
    ["Current Page", "当前 Page"],
    ["No wrapper frame required.", "无需额外套一层 Frame。"],
    ["The exported boundary follows Figma's node tree—not visual proximity on the canvas.", "导出边界以 Figma 的节点树为准，而不是画布上的视觉距离。"],
  ]),
  "carousel-02-package.svg": new Map([
    ["HANDOFF MANIFEST / 01", "HANDOFF 清单 / 01"],
    ["Everything implementation needs.", "实现真正需要的，都在这里。"],
    ["Visual truth, implementation structure, and reusable assets in one inspectable ZIP.", "视觉参考、实现结构和可复用素材，放进一个可以直接检查的 ZIP。"],
    ["Local visual browser", "本地浏览页"],
    ["Open index.html. No special viewer required.", "打开 index.html，无需安装额外工具。"],
    ["Original assets", "原始素材"],
  ]),
  "carousel-03-private.svg": new Map([
    ["Private by design.", "隐私不是口号，是默认设置。"],
    ["The handoff stays inside Figma until you download it.", "下载之前，交付内容始终留在 Figma 内。"],
    ["No network access", "无网络权限"],
    ["Manifest access is restricted to none.", "manifest 明确限制为 none。"],
    ["No account or API token", "无需账号或 API Token"],
    ["Run the plugin and download the ZIP directly.", "直接运行插件并下载本地 ZIP。"],
    ["No analytics or hosted storage", "无统计分析或托管存储"],
    ["FrameParcel does not receive or retain your design.", "FrameParcel 不会接收或保留你的设计。"],
    ["LOCAL EXPORT READY", "本地导出已准备"],
    ["Free · local-only · open source", "免费 · 仅本机 · 开源"],
  ]),
};

for (const [filename, replacements] of Object.entries(translations)) {
  let svg = await readFile(join(assets, filename), "utf8");
  svg = svg.replaceAll("font-family=\"Inter, Arial, sans-serif\"", "font-family=\"PingFang SC, Inter, Arial, sans-serif\"");
  for (const [source, target] of replacements) svg = svg.replaceAll(source, target);
  if (filename === "carousel-02-package.svg") {
    svg = svg.replace('font-size="82"', 'font-size="70"');
  }
  if (filename === "carousel-03-private.svg") {
    svg = svg.replace('font-size="64"', 'font-size="54"');
  }
  await writeFile(join(assets, filename.replace(".svg", "-zh.svg")), svg);
}

console.log("Generated Chinese Figma Community SVG assets.");
