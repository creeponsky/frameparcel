import { strToU8 } from "fflate";

type ExportPreset = "developer" | "review" | "archive" | "custom";
type InterfaceLocale = "zh" | "en";

type ExportOptions = {
  preset: ExportPreset;
  locale: "zh" | "en";
  scope: "selection" | "page";
  includeNodeIndex: boolean;
  includeRestJson: boolean;
  includeScreenshots: boolean;
  includeImages: boolean;
  includeSvg: boolean;
  includeViewer: boolean;
  screenshotScale: number;
};

type IndexedNode = Record<string, unknown> & {
  id: string;
  name: string;
  type: string;
  path: string;
  parentId: string | null;
  childIndex: number;
};

type NodeIndexWarning = {
  code: "MAIN_COMPONENT_UNAVAILABLE";
  nodeId: string;
  nodeName: string;
  nodePath: string;
  message: string;
};

type NodeIndexResult = {
  nodes: IndexedNode[];
  warnings: NodeIndexWarning[];
  instanceSummary: {
    total: number;
    resolved: number;
    missing: number;
    unavailable: number;
  };
};

type AssetReference = {
  nodeId: string;
  nodeName: string;
  nodePath: string;
  property: "fills" | "strokes";
  paintIndex: number;
  imageHash: string;
  scaleMode: string;
};

type PreviewEntry = {
  nodeId: string;
  name: string;
  nodeType: string;
  width: number;
  height: number;
  path: string;
  kind: "overview" | "screen" | "component";
};

type WalkEntry = {
  node: BaseNode;
  path: string;
  parentId: string | null;
  childIndex: number;
};

type ExportScope = {
  mode: "selection" | "page";
  name: string;
  nodeType: "SELECTION" | "PAGE" | SceneNode["type"];
  id: string;
  roots: Array<SceneNode & ExportMixin>;
};

const EXPORTER_VERSION = "1.0.1";

figma.showUI(__html__, {
  width: 420,
  height: 680,
  title: "FrameParcel",
  themeColors: true,
});

function isExportable(node: BaseNode): node is SceneNode & ExportMixin {
  return "exportAsync" in node && "width" in node && "height" in node;
}

function selectedRoots(): Array<SceneNode & ExportMixin> {
  return figma.currentPage.selection.filter(isExportable);
}

function resolveScope(mode: ExportOptions["scope"]): ExportScope | null {
  if (mode === "page") {
    const roots = figma.currentPage.children
      .filter(isExportable)
      .filter(isEffectivelyVisible);
    if (roots.length === 0) return null;
    return {
      mode,
      name: figma.currentPage.name,
      nodeType: "PAGE",
      id: figma.currentPage.id,
      roots,
    };
  }

  const roots = selectedRoots();
  if (roots.length === 0 || roots.length !== figma.currentPage.selection.length) {
    return null;
  }
  if (roots.length === 1) {
    return {
      mode,
      name: roots[0].name,
      nodeType: roots[0].type,
      id: roots[0].id,
      roots,
    };
  }
  return {
    mode,
    name: `${roots.length} selected layers`,
    nodeType: "SELECTION",
    id: roots.map((root) => root.id).join(","),
    roots,
  };
}

function scopeMessage(): { selection: Record<string, unknown>; page: Record<string, unknown> } {
  const selectionScope = resolveScope("selection");
  const pageScope = resolveScope("page");
  const selectionSurfaces = selectionScope ? classifyScope(selectionScope) : { screens: [], components: [] };
  const pageSurfaces = pageScope ? classifyScope(pageScope) : { screens: [], components: [] };
  return {
    selection: selectionScope
      ? {
          valid: true,
          name: selectionScope.name,
          nodeType: selectionScope.nodeType,
          rootCount: selectionScope.roots.length,
          screenCount: selectionSurfaces.screens.length,
          componentCount: selectionSurfaces.components.length,
        }
      : {
          valid: false,
          reasonCode: figma.currentPage.selection.length === 0 ? "EMPTY_SELECTION" : "INVALID_SELECTION",
        },
    page: pageScope
      ? {
          valid: true,
          name: pageScope.name,
          nodeType: pageScope.nodeType,
          rootCount: pageScope.roots.length,
          screenCount: pageSurfaces.screens.length,
          componentCount: pageSurfaces.components.length,
        }
      : { valid: false, reasonCode: "EMPTY_PAGE" },
  };
}

function notifySelection(): void {
  figma.ui.postMessage({ type: "selection", ...scopeMessage() });
}

async function initializeUI(): Promise<void> {
  let storedLocale: InterfaceLocale | null = null;
  try {
    const stored = await figma.clientStorage.getAsync("frameparcel.locale");
    if (stored === "zh" || stored === "en") storedLocale = stored;
  } catch {
    // A missing preference must never block the exporter.
  }
  figma.ui.postMessage({ type: "initialize", locale: storedLocale, ...scopeMessage() });
}

figma.on("selectionchange", notifySelection);

function sanitizeFilename(value: string, fallback = "node"): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return normalized || fallback;
}

function jsonSafe(value: unknown, depth = 0): unknown {
  if (depth > 12) return "__MAX_DEPTH__";
  if (value === figma.mixed) return "__MIXED__";
  if (value === null || value === undefined) return value ?? null;
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (typeof value === "symbol") return String(value);
  if (Array.isArray(value)) return value.map((item) => jsonSafe(item, depth + 1));
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (typeof item !== "function") result[key] = jsonSafe(item, depth + 1);
    }
    return result;
  }
  return String(value);
}

const INDEX_PROPERTIES = [
  "visible", "locked", "opacity", "blendMode", "isMask", "x", "y", "width", "height",
  "rotation", "relativeTransform", "absoluteTransform", "absoluteBoundingBox", "constraints",
  "layoutMode", "layoutPositioning", "layoutAlign", "layoutGrow", "primaryAxisSizingMode",
  "counterAxisSizingMode", "primaryAxisAlignItems", "counterAxisAlignItems", "itemSpacing",
  "counterAxisSpacing", "paddingLeft", "paddingRight", "paddingTop", "paddingBottom",
  "minWidth", "maxWidth", "minHeight", "maxHeight", "clipsContent", "overflowDirection",
  "cornerRadius", "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius",
  "fills", "strokes", "strokeWeight", "strokeAlign", "strokeCap", "strokeJoin", "dashPattern",
  "effects", "backgrounds", "backgroundStyleId", "fillStyleId", "strokeStyleId", "effectStyleId",
  "gridStyleId", "layoutGrids", "exportSettings", "boundVariables", "resolvedVariableModes",
  "characters", "fontSize", "fontName", "fontWeight", "textStyleId", "textAlignHorizontal",
  "textAlignVertical", "textAutoResize", "textCase", "textDecoration", "letterSpacing",
  "lineHeight", "paragraphIndent", "paragraphSpacing", "listSpacing", "hangingPunctuation",
  "hangingList", "hyperlink", "componentProperties", "variantProperties", "reactions",
] as const;

function readProperty(node: BaseNode, property: string): unknown {
  try {
    if (property in node) return jsonSafe((node as unknown as Record<string, unknown>)[property]);
  } catch {
    return "__UNAVAILABLE__";
  }
  return undefined;
}

function walk(root: BaseNode): WalkEntry[] {
  const output: WalkEntry[] = [];
  const visit = (node: BaseNode, path: string, parentId: string | null, childIndex: number): void => {
    output.push({ node, path, parentId, childIndex });
    if ("children" in node) {
      node.children.forEach((child, index) => visit(child, `${path}/${child.name}`, node.id, index));
    }
  };
  visit(root, root.name, root.parent?.id ?? null, 0);
  return output;
}

function walkScope(scope: ExportScope): WalkEntry[] {
  if (scope.mode === "selection" && scope.roots.length === 1) {
    return walk(scope.roots[0]);
  }
  const output: WalkEntry[] = [];
  const visit = (node: BaseNode, path: string, parentId: string | null, childIndex: number): void => {
    output.push({ node, path, parentId, childIndex });
    if ("children" in node) {
      node.children.forEach((child, index) => visit(child, `${path}/${child.name}`, node.id, index));
    }
  };
  scope.roots.forEach((root, index) => {
    visit(root, `${scope.name}/${root.name}`, scope.id, index);
  });
  return output;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  transform: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await transform(items[index]);
    }
  };
  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

async function buildNodeIndex(entries: WalkEntry[]): Promise<NodeIndexResult> {
  const results = await mapWithConcurrency(entries, 8, async ({ node, path, parentId, childIndex }) => {
    const indexed: IndexedNode = { id: node.id, name: node.name, type: node.type, path, parentId, childIndex };
    let warning: NodeIndexWarning | null = null;
    for (const property of INDEX_PROPERTIES) {
      const value = readProperty(node, property);
      if (value !== undefined) indexed[property] = value;
    }
    if (node.type === "INSTANCE") {
      try {
        const component = await node.getMainComponentAsync();
        indexed.mainComponent = component ? { id: component.id, name: component.name } : null;
        indexed.mainComponentStatus = component ? "resolved" : "missing";
      } catch (error) {
        indexed.mainComponent = null;
        indexed.mainComponentStatus = "unavailable";
        warning = {
          code: "MAIN_COMPONENT_UNAVAILABLE",
          nodeId: node.id,
          nodeName: node.name,
          nodePath: path,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }
    return { indexed, warning };
  });

  const nodes = results.map((result) => result.indexed);
  const warnings = results.flatMap((result) => result.warning ? [result.warning] : []);
  const instances = nodes.filter((node) => node.type === "INSTANCE");
  return {
    nodes,
    warnings,
    instanceSummary: {
      total: instances.length,
      resolved: instances.filter((node) => node.mainComponentStatus === "resolved").length,
      missing: instances.filter((node) => node.mainComponentStatus === "missing").length,
      unavailable: instances.filter((node) => node.mainComponentStatus === "unavailable").length,
    },
  };
}

function paintsFrom(node: BaseNode, property: "fills" | "strokes"): readonly Paint[] {
  const value = readProperty(node, property);
  if (!Array.isArray(value)) return [];
  return value as unknown as readonly Paint[];
}

function collectImageReferences(entries: WalkEntry[]): AssetReference[] {
  const refs: AssetReference[] = [];
  for (const { node, path } of entries) {
    for (const property of ["fills", "strokes"] as const) {
      paintsFrom(node, property).forEach((paint, paintIndex) => {
        if (paint.type === "IMAGE" && paint.imageHash) {
          refs.push({ nodeId: node.id, nodeName: node.name, nodePath: path, property, paintIndex, imageHash: paint.imageHash, scaleMode: paint.scaleMode });
        }
      });
    }
  }
  return refs;
}

function imageExtension(bytes: Uint8Array): string {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 6 && String.fromCharCode(...bytes.slice(0, 6)).startsWith("GIF8")) return "gif";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return "bin";
}

function isEffectivelyVisible(node: BaseNode): boolean {
  let current: BaseNode | null = node;
  while (current && current.type !== "DOCUMENT") {
    if ("visible" in current && current.visible === false) return false;
    current = current.parent;
  }
  return true;
}

function isVectorPrimitive(node: BaseNode): node is SceneNode & ExportMixin {
  if (!isExportable(node) || !["VECTOR", "BOOLEAN_OPERATION", "STAR", "POLYGON", "LINE", "ELLIPSE"].includes(node.type)) {
    return false;
  }
  const hasVisiblePaint = ([...paintsFrom(node, "fills"), ...paintsFrom(node, "strokes")])
    .some((paint) => paint.visible !== false && (paint.opacity ?? 1) > 0);
  const hasVisibleEffect = "effects" in node && node.effects.some((effect) => effect.visible !== false);
  return hasVisiblePaint || hasVisibleEffect;
}

function isSmallVectorComposite(node: BaseNode): node is SceneNode & ChildrenMixin & ExportMixin {
  if (!isExportable(node) || !("children" in node) || !isEffectivelyVisible(node)) return false;
  if (node.width <= 0 || node.height <= 0 || node.width > 256 || node.height > 256) return false;
  if (!["FRAME", "GROUP", "INSTANCE", "COMPONENT", "COMPONENT_SET"].includes(node.type)) return false;
  let hasVector = false;
  let hasTextOrImage = false;
  const inspect = (candidate: BaseNode): void => {
    if (!isEffectivelyVisible(candidate)) return;
    if (candidate.type === "TEXT") hasTextOrImage = true;
    if (paintsFrom(candidate, "fills").some((paint) => paint.type === "IMAGE")) hasTextOrImage = true;
    if (isVectorPrimitive(candidate)) hasVector = true;
    if ("children" in candidate) candidate.children.forEach(inspect);
  };
  node.children.forEach(inspect);
  return hasVector && !hasTextOrImage;
}

function collectSmartSvgCandidates(entries: WalkEntry[]): Array<SceneNode & ExportMixin> {
  const entryById = new Map(entries.map((entry) => [entry.node.id, entry]));
  const compositeIds = new Set<string>();
  const output: Array<SceneNode & ExportMixin> = [];
  const hasSelectedAncestor = (node: BaseNode): boolean => {
    let parent = node.parent;
    while (parent && entryById.has(parent.id)) {
      if (compositeIds.has(parent.id)) return true;
      parent = parent.parent;
    }
    return false;
  };
  for (const { node } of entries) {
    if (isSmallVectorComposite(node) && !hasSelectedAncestor(node)) {
      compositeIds.add(node.id);
      output.push(node);
    }
  }
  for (const { node } of entries) {
    if (isVectorPrimitive(node) && isEffectivelyVisible(node) && !hasSelectedAncestor(node)) {
      compositeIds.add(node.id);
      output.push(node);
    }
  }
  return output;
}

function classifyDirectChildren(root: BaseNode): { screens: Array<SceneNode & ExportMixin>; components: Array<SceneNode & ExportMixin> } {
  const children = "children" in root ? root.children.filter(isExportable).filter(isEffectivelyVisible) : [];
  const screens: Array<SceneNode & ExportMixin> = [];
  const components: Array<SceneNode & ExportMixin> = [];
  for (const child of children) {
    const shortSide = Math.min(child.width, child.height);
    const longSide = Math.max(child.width, child.height);
    const surfaceType = ["FRAME", "COMPONENT", "INSTANCE", "SECTION"].includes(child.type);
    if (surfaceType && shortSide >= 280 && longSide >= 400) screens.push(child);
    else if (child.width >= 16 && child.height >= 16) components.push(child);
  }
  return { screens, components };
}

function classifySurface(node: SceneNode & ExportMixin): "screen" | "component" | null {
  const shortSide = Math.min(node.width, node.height);
  const longSide = Math.max(node.width, node.height);
  const surfaceType = ["FRAME", "COMPONENT", "INSTANCE", "SECTION"].includes(node.type);
  if (surfaceType && shortSide >= 280 && longSide >= 400) return "screen";
  if (node.width >= 16 && node.height >= 16) return "component";
  return null;
}

function classifyScope(scope: ExportScope): { screens: Array<SceneNode & ExportMixin>; components: Array<SceneNode & ExportMixin> } {
  if (scope.mode === "selection" && scope.roots.length === 1) {
    const root = scope.roots[0];
    const children = classifyDirectChildren(root);
    if (
      children.screens.length >= 2 ||
      (children.screens.length >= 1 && children.components.length >= 1) ||
      root.type === "SECTION"
    ) return children;
    const kind = classifySurface(root);
    return {
      screens: kind === "screen" ? [root] : [],
      components: kind === "component" ? [root] : [],
    };
  }

  const screens: Array<SceneNode & ExportMixin> = [];
  const components: Array<SceneNode & ExportMixin> = [];
  const add = (node: SceneNode & ExportMixin): void => {
    const kind = classifySurface(node);
    if (kind === "screen") screens.push(node);
    if (kind === "component") components.push(node);
  };
  for (const root of scope.roots) {
    const children = classifyDirectChildren(root);
    if (
      root.type === "SECTION" ||
      children.screens.length >= 2 ||
      (children.screens.length >= 1 && children.components.length >= 1)
    ) {
      screens.push(...children.screens);
      components.push(...children.components);
    } else {
      add(root);
    }
  }
  return { screens, components };
}

function hashBytes(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function postFile(path: string, bytes: Uint8Array): void {
  figma.ui.postMessage({ type: "export-file", path, bytes });
}

function postJson(path: string, value: unknown): void {
  postFile(path, strToU8(JSON.stringify(value, null, 2)));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] ?? character);
}

function buildViewerHtml(scope: ExportScope, previews: PreviewEntry[], generatedAt: string): string {
  const cards = previews.map((preview) => `
    <a class="card" href="${encodeURI(preview.path)}" target="_blank" rel="noreferrer">
      <div class="canvas"><img src="${encodeURI(preview.path)}" alt="${escapeHtml(preview.name)}"></div>
      <div class="meta"><strong>${escapeHtml(preview.name)}</strong><span>${preview.width} × ${preview.height} · ${preview.nodeType}</span></div>
    </a>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(scope.name)} — Design Handoff</title>
<style>
:root{color-scheme:light dark;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--bg:#f5f5f3;--panel:#fff;--text:#171715;--muted:#6b6b66;--line:#deded8;--canvas:#e9e9e5}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text)}header{padding:48px clamp(24px,5vw,72px) 28px;border-bottom:1px solid var(--line)}h1{font-size:clamp(28px,4vw,48px);letter-spacing:-.04em;margin:0 0 10px}p{color:var(--muted);margin:0;line-height:1.55}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px;padding:32px clamp(24px,5vw,72px) 72px}.card{display:block;color:inherit;text-decoration:none;background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease}.card:hover{transform:translateY(-2px);box-shadow:0 12px 30px #00000014}.canvas{height:360px;padding:18px;display:flex;align-items:center;justify-content:center;background:var(--canvas)}img{max-width:100%;max-height:100%;object-fit:contain}.meta{display:flex;flex-direction:column;gap:5px;padding:14px 16px}.meta strong{font-size:14px}.meta span{font-size:12px;color:var(--muted)}@media(prefers-color-scheme:dark){:root{--bg:#151514;--panel:#20201f;--text:#f1f1ee;--muted:#a0a09a;--line:#343431;--canvas:#111110}}@media(max-width:560px){header{padding-top:32px}.grid{grid-template-columns:1fr}.canvas{height:460px}}
</style></head><body><header><h1>${escapeHtml(scope.name)}</h1><p>${previews.filter((item) => item.kind === "screen").length} screens · ${previews.filter((item) => item.kind === "component").length} component previews · exported locally ${escapeHtml(generatedAt)}</p></header><main class="grid">${cards}</main></body></html>`;
}

function buildHandoffMarkdown(scope: ExportScope, options: ExportOptions, previews: PreviewEntry[], nodeCount: number, generatedAt: string): string {
  return `# ${scope.name} — Design handoff

Generated locally by FrameParcel ${EXPORTER_VERSION} on ${generatedAt}.

## Start here

- Open \`index.html\` for a browsable visual overview.
- Treat \`screens/\` as the visual source of truth.
- Use \`design/node-index.json\` for relative geometry, typography, colors, effects, component references, and node IDs.
- Reuse exact files in \`assets/\`; do not redraw or invent missing artwork.
- \`components/\` contains top-level design fragments that are useful but are not full screens.

## Package facts

- Export scope: ${scope.mode}
- Scope root: ${scope.name} (${scope.id})
- Top-level exported roots: ${scope.roots.length}
- Node count: ${nodeCount}
- Screen previews: ${previews.filter((item) => item.kind === "screen").length}
- Component previews: ${previews.filter((item) => item.kind === "component").length}
- Export preset: ${options.preset}
- REST V1 included: ${options.includeRestJson ? "yes" : "no"}

## Boundaries

- Font names and styles are recorded, but licensed font files are not included.
- Screenshot pixels are previews; original image fills are preserved separately when enabled.
- A design outside the exported selection or Page cannot appear in this package, even if it is visually positioned nearby on the canvas.
`;
}

async function exportPackage(scope: ExportScope, options: ExportOptions): Promise<void> {
  const entries = walkScope(scope);
  const imageRefs = collectImageReferences(entries);
  const imageHashes = [...new Set(imageRefs.map((ref) => ref.imageHash))];
  const surfaces = classifyScope(scope);
  const svgCandidates = options.includeSvg ? collectSmartSvgCandidates(entries) : [];
  const canExportOverview = scope.mode === "selection" && scope.roots.length === 1 &&
    !surfaces.screens.includes(scope.roots[0]) && !surfaces.components.includes(scope.roots[0]);
  const previewCount = options.includeScreenshots
    ? (canExportOverview ? 1 : 0) + surfaces.screens.length + surfaces.components.length
    : 0;
  const restSteps = options.includeRestJson ? scope.roots.length : 0;
  const estimatedTotal = 1 + (options.includeNodeIndex ? 1 : 0) + restSteps + previewCount
    + (options.includeImages ? imageHashes.length : 0) + svgCandidates.length + (options.includeViewer ? 2 : 0);
  let completed = 0;
  const generatedAt = new Date().toISOString();
  const imageManifest: Array<Record<string, unknown>> = [];
  const svgManifest: Array<Record<string, unknown>> = [];
  const previews: PreviewEntry[] = [];

  const progress = (label: string): void => {
    completed += 1;
    figma.ui.postMessage({ type: "export-progress", completed, total: estimatedTotal, label });
  };
  const label = (zh: string, en: string): string => options.locale === "zh" ? zh : en;

  figma.ui.postMessage({ type: "export-start", total: estimatedTotal });

  if (options.includeNodeIndex) {
    const index = await buildNodeIndex(entries);
    postJson("design/node-index.json", {
      exporterVersion: EXPORTER_VERSION,
      exportedAt: generatedAt,
      fileName: figma.root.name,
      pageName: figma.currentPage.name,
      scope: {
        mode: scope.mode,
        id: scope.id,
        name: scope.name,
        type: scope.nodeType,
        roots: scope.roots.map((root) => ({ id: root.id, name: root.name, type: root.type })),
      },
      nodes: index.nodes,
      warnings: index.warnings,
      instanceSummary: index.instanceSummary,
    });
    progress(label("已解析并写入开发坐标索引", "Resolved and wrote the implementation node index"));
  }

  if (options.includeRestJson) {
    if (scope.mode === "selection" && scope.roots.length === 1) {
      try {
        const rest = await scope.roots[0].exportAsync({ format: "JSON_REST_V1" });
        postJson("design/rest-v1.json", rest);
      } catch (error) {
        postJson("design/rest-v1-error.json", { message: error instanceof Error ? error.message : String(error) });
      }
      progress(label("已写入完整 REST V1 归档", "Wrote the REST V1 archive"));
    } else {
      const roots: Array<Record<string, unknown>> = [];
      for (let position = 0; position < scope.roots.length; position += 1) {
        const root = scope.roots[position];
        try {
          roots.push({ id: root.id, name: root.name, type: root.type, data: await root.exportAsync({ format: "JSON_REST_V1" }) });
        } catch (error) {
          roots.push({ id: root.id, name: root.name, type: root.type, error: error instanceof Error ? error.message : String(error) });
        }
        progress(label(
          `REST V1 ${position + 1}/${scope.roots.length}：${root.name}`,
          `REST V1 ${position + 1}/${scope.roots.length}: ${root.name}`,
        ));
      }
      postJson("design/rest-v1.json", {
        exporterVersion: EXPORTER_VERSION,
        exportedAt: generatedAt,
        scope: { mode: scope.mode, id: scope.id, name: scope.name, type: scope.nodeType },
        roots,
      });
    }
  }

  if (options.includeScreenshots) {
    if (canExportOverview) {
      const root = scope.roots[0];
      const overviewWidth = Math.min(4096, Math.max(1, Math.round(root.width)));
      const overviewPath = `screens/00-${sanitizeFilename(root.name, "selection")}-overview.png`;
      const overview = await root.exportAsync({ format: "PNG", constraint: { type: "WIDTH", value: overviewWidth } });
      postFile(overviewPath, overview);
      previews.push({ nodeId: root.id, name: `${root.name} overview`, nodeType: root.type, width: root.width, height: root.height, path: overviewPath, kind: "overview" });
      progress(label("已导出总览图", "Exported the overview"));
    }

    for (let position = 0; position < surfaces.screens.length; position += 1) {
      const screen = surfaces.screens[position];
      const path = `screens/${String(position + 1).padStart(2, "0")}-${sanitizeFilename(screen.name)}.png`;
      const bytes = await screen.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: options.screenshotScale } });
      postFile(path, bytes);
      previews.push({ nodeId: screen.id, name: screen.name, nodeType: screen.type, width: screen.width, height: screen.height, path, kind: "screen" });
      progress(label(`页面 ${position + 1}/${surfaces.screens.length}：${screen.name}`, `Screen ${position + 1}/${surfaces.screens.length}: ${screen.name}`));
    }

    for (let position = 0; position < surfaces.components.length; position += 1) {
      const component = surfaces.components[position];
      const path = `components/${String(position + 1).padStart(2, "0")}-${sanitizeFilename(component.name)}.png`;
      const bytes = await component.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: options.screenshotScale } });
      postFile(path, bytes);
      previews.push({ nodeId: component.id, name: component.name, nodeType: component.type, width: component.width, height: component.height, path, kind: "component" });
      progress(label(`组件预览 ${position + 1}/${surfaces.components.length}：${component.name}`, `Component ${position + 1}/${surfaces.components.length}: ${component.name}`));
    }
  }

  if (options.includeImages) {
    for (let position = 0; position < imageHashes.length; position += 1) {
      const imageHash = imageHashes[position];
      const image = figma.getImageByHash(imageHash);
      if (!image) {
        imageManifest.push({ imageHash, error: "Image handle unavailable" });
        progress(label(`原图 ${position + 1}/${imageHashes.length} 不可读取`, `Original image ${position + 1}/${imageHashes.length} was unavailable`));
        continue;
      }
      try {
        const [bytes, size] = await Promise.all([image.getBytesAsync(), image.getSizeAsync()]);
        const extension = imageExtension(bytes);
        const filename = `${String(position + 1).padStart(2, "0")}-${imageHash}.${extension}`;
        postFile(`assets/images/${filename}`, bytes);
        imageManifest.push({ imageHash, filename, size, references: imageRefs.filter((ref) => ref.imageHash === imageHash) });
      } catch (error) {
        imageManifest.push({ imageHash, error: error instanceof Error ? error.message : String(error) });
      }
      progress(label(`原图 ${position + 1}/${imageHashes.length}`, `Original image ${position + 1}/${imageHashes.length}`));
    }
  }

  if (options.includeSvg) {
    const seen = new Map<string, string>();
    for (let position = 0; position < svgCandidates.length; position += 1) {
      const node = svgCandidates[position];
      try {
        const svg = await node.exportAsync({ format: "SVG", svgOutlineText: false, svgIdAttribute: true, svgSimplifyStroke: true });
        const bytes = svg instanceof Uint8Array ? svg : strToU8(svg);
        const digest = hashBytes(bytes);
        const existing = seen.get(digest);
        if (existing) {
          svgManifest.push({ nodeId: node.id, name: node.name, type: node.type, duplicateOf: existing });
        } else {
          const filename = `${String(seen.size + 1).padStart(3, "0")}-${sanitizeFilename(node.name)}-${sanitizeFilename(node.id)}.svg`;
          seen.set(digest, filename);
          postFile(`assets/svg/${filename}`, bytes);
          svgManifest.push({ nodeId: node.id, name: node.name, type: node.type, filename, width: node.width, height: node.height });
        }
      } catch (error) {
        svgManifest.push({ nodeId: node.id, name: node.name, type: node.type, error: error instanceof Error ? error.message : String(error) });
      }
      progress(label(`矢量素材 ${position + 1}/${svgCandidates.length}：${node.name}`, `Vector asset ${position + 1}/${svgCandidates.length}: ${node.name}`));
    }
  }

  postJson("assets/manifest.json", {
    exporterVersion: EXPORTER_VERSION,
    preset: options.preset,
    scope: { mode: scope.mode, id: scope.id, name: scope.name, type: scope.nodeType },
    selectedNodes: scope.roots.map((root) => ({
      id: root.id,
      name: root.name,
      type: root.type,
      width: root.width,
      height: root.height,
    })),
    selectedNode: scope.roots.length === 1 ? {
      id: scope.roots[0].id,
      name: scope.roots[0].name,
      type: scope.roots[0].type,
      width: scope.roots[0].width,
      height: scope.roots[0].height,
    } : undefined,
    previews,
    images: imageManifest,
    svg: svgManifest,
  });
  progress(label("已写入交付清单", "Wrote the handoff manifest"));

  if (options.includeViewer) {
    postFile("index.html", strToU8(buildViewerHtml(scope, previews, generatedAt)));
    progress(label("已生成本地浏览页", "Generated the local browser"));
    postFile("HANDOFF.md", strToU8(buildHandoffMarkdown(scope, options, previews, entries.length, generatedAt)));
    progress(label("已生成交付说明", "Generated the handoff guide"));
  }

  const filename = `${sanitizeFilename(scope.name, "figma-design")}-handoff.zip`;
  figma.ui.postMessage({
    type: "export-complete",
    filename,
    receipt: {
      preset: options.preset,
      nodes: entries.length,
      screens: surfaces.screens.length,
      components: surfaces.components.length,
      images: options.includeImages ? imageHashes.length : 0,
      svgCandidates: options.includeSvg ? svgCandidates.length : 0,
    },
    summary: [
      `Scope: ${scope.mode} · ${scope.name} (${scope.id})`,
      `Top-level roots: ${scope.roots.length}`,
      `Preset: ${options.preset}`,
      `Nodes: ${entries.length}`,
      `Screens: ${options.includeScreenshots ? surfaces.screens.length : 0}`,
      `Component previews: ${options.includeScreenshots ? surfaces.components.length : 0}`,
      `Unique image fills: ${options.includeImages ? imageHashes.length : 0}`,
      `Smart SVG candidates: ${options.includeSvg ? svgCandidates.length : 0}`,
      `Generated at: ${generatedAt}`,
      "This package was generated locally and was not uploaded by the plugin.",
    ].join("\n"),
  });
}

figma.ui.onmessage = async (message: { type?: string; options?: ExportOptions; locale?: InterfaceLocale }) => {
  if (message.type === "set-locale" && (message.locale === "zh" || message.locale === "en")) {
    try {
      await figma.clientStorage.setAsync("frameparcel.locale", message.locale);
    } catch {
      // The selected language still applies for this run even if persistence is unavailable.
    }
    return;
  }
  if (message.type !== "export" || !message.options) return;
  const scope = resolveScope(message.options.scope);
  if (!scope) {
    figma.ui.postMessage({
      type: "export-error",
      message: message.options.locale === "zh"
        ? "导出范围已变化，请重新选择图层或当前 Page。"
        : "The export scope changed. Select the layers or current Page again.",
    });
    return;
  }
  try {
    await exportPackage(scope, message.options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    figma.ui.postMessage({
      type: "export-error",
      message: message.options.locale === "zh" ? `导出失败：${detail}` : `Export failed: ${detail}`,
    });
  }
};

void initializeUI();
