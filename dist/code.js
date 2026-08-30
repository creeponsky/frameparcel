"use strict";
(() => {
  // node_modules/fflate/esm/browser.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i2 = 0; i2 < 31; ++i2) {
      b[i2] = start += 1 << eb[i2 - 1];
    }
    var r = new i32(b[30]);
    for (var i2 = 1; i2 < 30; ++i2) {
      for (var j = b[i2]; j < b[i2 + 1]; ++j) {
        r[j] = j - b[i2] << 5 | i2;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i = 0; i < 32768; ++i) {
    x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var x;
  var i;
  var flt = new u8(288);
  for (i = 0; i < 144; ++i)
    flt[i] = 8;
  var i;
  for (i = 144; i < 256; ++i)
    flt[i] = 9;
  var i;
  for (i = 256; i < 280; ++i)
    flt[i] = 7;
  var i;
  for (i = 280; i < 288; ++i)
    flt[i] = 8;
  var i;
  var fdt = new u8(32);
  for (i = 0; i < 32; ++i)
    fdt[i] = 5;
  var i;
  var slc = function(v, s, e) {
    if (s == null || s < 0)
      s = 0;
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var et = /* @__PURE__ */ new u8(0);
  var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  function strToU8(str, latin1) {
    if (latin1) {
      var ar_1 = new u8(str.length);
      for (var i2 = 0; i2 < str.length; ++i2)
        ar_1[i2] = str.charCodeAt(i2);
      return ar_1;
    }
    if (te)
      return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function(v) {
      ar[ai++] = v;
    };
    for (var i2 = 0; i2 < l; ++i2) {
      if (ai + 5 > ar.length) {
        var n = new u8(ai + 8 + (l - i2 << 1));
        n.set(ar);
        ar = n;
      }
      var c = str.charCodeAt(i2);
      if (c < 128 || latin1)
        w(c);
      else if (c < 2048)
        w(192 | c >> 6), w(128 | c & 63);
      else if (c > 55295 && c < 57344)
        c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i2) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
      else
        w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
    }
    return slc(ar, 0, ai);
  }

  // src/code.ts
  var EXPORTER_VERSION = "1.0.0";
  figma.showUI(__html__, {
    width: 420,
    height: 680,
    title: "FrameParcel",
    themeColors: true
  });
  function isExportable(node) {
    return "exportAsync" in node && "width" in node && "height" in node;
  }
  function selectedRoots() {
    return figma.currentPage.selection.filter(isExportable);
  }
  function resolveScope(mode) {
    if (mode === "page") {
      const roots2 = figma.currentPage.children.filter(isExportable).filter(isEffectivelyVisible);
      if (roots2.length === 0) return null;
      return {
        mode,
        name: figma.currentPage.name,
        nodeType: "PAGE",
        id: figma.currentPage.id,
        roots: roots2
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
        roots
      };
    }
    return {
      mode,
      name: `${roots.length} selected layers`,
      nodeType: "SELECTION",
      id: roots.map((root) => root.id).join(","),
      roots
    };
  }
  function scopeMessage() {
    const selectionScope = resolveScope("selection");
    const pageScope = resolveScope("page");
    const selectionSurfaces = selectionScope ? classifyScope(selectionScope) : { screens: [], components: [] };
    const pageSurfaces = pageScope ? classifyScope(pageScope) : { screens: [], components: [] };
    return {
      selection: selectionScope ? {
        valid: true,
        name: selectionScope.name,
        nodeType: selectionScope.nodeType,
        rootCount: selectionScope.roots.length,
        screenCount: selectionSurfaces.screens.length,
        componentCount: selectionSurfaces.components.length
      } : {
        valid: false,
        reasonCode: figma.currentPage.selection.length === 0 ? "EMPTY_SELECTION" : "INVALID_SELECTION"
      },
      page: pageScope ? {
        valid: true,
        name: pageScope.name,
        nodeType: pageScope.nodeType,
        rootCount: pageScope.roots.length,
        screenCount: pageSurfaces.screens.length,
        componentCount: pageSurfaces.components.length
      } : { valid: false, reasonCode: "EMPTY_PAGE" }
    };
  }
  function notifySelection() {
    figma.ui.postMessage({ type: "selection", ...scopeMessage() });
  }
  async function initializeUI() {
    let storedLocale = null;
    try {
      const stored = await figma.clientStorage.getAsync("frameparcel.locale");
      if (stored === "zh" || stored === "en") storedLocale = stored;
    } catch {
    }
    figma.ui.postMessage({ type: "initialize", locale: storedLocale, ...scopeMessage() });
  }
  figma.on("selectionchange", notifySelection);
  function sanitizeFilename(value, fallback = "node") {
    const normalized = value.normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
    return normalized || fallback;
  }
  function jsonSafe(value, depth = 0) {
    if (depth > 12) return "__MAX_DEPTH__";
    if (value === figma.mixed) return "__MIXED__";
    if (value === null || value === void 0) return value ?? null;
    if (["string", "number", "boolean"].includes(typeof value)) return value;
    if (typeof value === "symbol") return String(value);
    if (Array.isArray(value)) return value.map((item) => jsonSafe(item, depth + 1));
    if (typeof value === "object") {
      const result = {};
      for (const [key, item] of Object.entries(value)) {
        if (typeof item !== "function") result[key] = jsonSafe(item, depth + 1);
      }
      return result;
    }
    return String(value);
  }
  var INDEX_PROPERTIES = [
    "visible",
    "locked",
    "opacity",
    "blendMode",
    "isMask",
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "relativeTransform",
    "absoluteTransform",
    "absoluteBoundingBox",
    "constraints",
    "layoutMode",
    "layoutPositioning",
    "layoutAlign",
    "layoutGrow",
    "primaryAxisSizingMode",
    "counterAxisSizingMode",
    "primaryAxisAlignItems",
    "counterAxisAlignItems",
    "itemSpacing",
    "counterAxisSpacing",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "paddingBottom",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    "clipsContent",
    "overflowDirection",
    "cornerRadius",
    "topLeftRadius",
    "topRightRadius",
    "bottomLeftRadius",
    "bottomRightRadius",
    "fills",
    "strokes",
    "strokeWeight",
    "strokeAlign",
    "strokeCap",
    "strokeJoin",
    "dashPattern",
    "effects",
    "backgrounds",
    "backgroundStyleId",
    "fillStyleId",
    "strokeStyleId",
    "effectStyleId",
    "gridStyleId",
    "layoutGrids",
    "exportSettings",
    "boundVariables",
    "resolvedVariableModes",
    "characters",
    "fontSize",
    "fontName",
    "fontWeight",
    "textStyleId",
    "textAlignHorizontal",
    "textAlignVertical",
    "textAutoResize",
    "textCase",
    "textDecoration",
    "letterSpacing",
    "lineHeight",
    "paragraphIndent",
    "paragraphSpacing",
    "listSpacing",
    "hangingPunctuation",
    "hangingList",
    "hyperlink",
    "componentProperties",
    "variantProperties",
    "reactions"
  ];
  function readProperty(node, property) {
    try {
      if (property in node) return jsonSafe(node[property]);
    } catch {
      return "__UNAVAILABLE__";
    }
    return void 0;
  }
  function walk(root) {
    const output = [];
    const visit = (node, path, parentId, childIndex) => {
      output.push({ node, path, parentId, childIndex });
      if ("children" in node) {
        node.children.forEach((child, index) => visit(child, `${path}/${child.name}`, node.id, index));
      }
    };
    visit(root, root.name, root.parent?.id ?? null, 0);
    return output;
  }
  function walkScope(scope) {
    if (scope.mode === "selection" && scope.roots.length === 1) {
      return walk(scope.roots[0]);
    }
    const output = [];
    const visit = (node, path, parentId, childIndex) => {
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
  function buildNodeIndex(entries) {
    return entries.map(({ node, path, parentId, childIndex }) => {
      const indexed = { id: node.id, name: node.name, type: node.type, path, parentId, childIndex };
      for (const property of INDEX_PROPERTIES) {
        const value = readProperty(node, property);
        if (value !== void 0) indexed[property] = value;
      }
      if (node.type === "INSTANCE") {
        try {
          indexed.mainComponent = node.mainComponent ? { id: node.mainComponent.id, name: node.mainComponent.name } : null;
        } catch {
          indexed.mainComponent = "__UNAVAILABLE__";
        }
      }
      return indexed;
    });
  }
  function paintsFrom(node, property) {
    const value = readProperty(node, property);
    if (!Array.isArray(value)) return [];
    return value;
  }
  function collectImageReferences(entries) {
    const refs = [];
    for (const { node, path } of entries) {
      for (const property of ["fills", "strokes"]) {
        paintsFrom(node, property).forEach((paint, paintIndex) => {
          if (paint.type === "IMAGE" && paint.imageHash) {
            refs.push({ nodeId: node.id, nodeName: node.name, nodePath: path, property, paintIndex, imageHash: paint.imageHash, scaleMode: paint.scaleMode });
          }
        });
      }
    }
    return refs;
  }
  function imageExtension(bytes) {
    if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return "png";
    if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
    if (bytes.length >= 6 && String.fromCharCode(...bytes.slice(0, 6)).startsWith("GIF8")) return "gif";
    if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
    return "bin";
  }
  function isEffectivelyVisible(node) {
    let current = node;
    while (current && current.type !== "DOCUMENT") {
      if ("visible" in current && current.visible === false) return false;
      current = current.parent;
    }
    return true;
  }
  function isVectorPrimitive(node) {
    if (!isExportable(node) || !["VECTOR", "BOOLEAN_OPERATION", "STAR", "POLYGON", "LINE", "ELLIPSE"].includes(node.type)) {
      return false;
    }
    const hasVisiblePaint = [...paintsFrom(node, "fills"), ...paintsFrom(node, "strokes")].some((paint) => paint.visible !== false && (paint.opacity ?? 1) > 0);
    const hasVisibleEffect = "effects" in node && node.effects.some((effect) => effect.visible !== false);
    return hasVisiblePaint || hasVisibleEffect;
  }
  function isSmallVectorComposite(node) {
    if (!isExportable(node) || !("children" in node) || !isEffectivelyVisible(node)) return false;
    if (node.width <= 0 || node.height <= 0 || node.width > 256 || node.height > 256) return false;
    if (!["FRAME", "GROUP", "INSTANCE", "COMPONENT", "COMPONENT_SET"].includes(node.type)) return false;
    let hasVector = false;
    let hasTextOrImage = false;
    const inspect = (candidate) => {
      if (!isEffectivelyVisible(candidate)) return;
      if (candidate.type === "TEXT") hasTextOrImage = true;
      if (paintsFrom(candidate, "fills").some((paint) => paint.type === "IMAGE")) hasTextOrImage = true;
      if (isVectorPrimitive(candidate)) hasVector = true;
      if ("children" in candidate) candidate.children.forEach(inspect);
    };
    node.children.forEach(inspect);
    return hasVector && !hasTextOrImage;
  }
  function collectSmartSvgCandidates(entries) {
    const entryById = new Map(entries.map((entry) => [entry.node.id, entry]));
    const compositeIds = /* @__PURE__ */ new Set();
    const output = [];
    const hasSelectedAncestor = (node) => {
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
  function classifyDirectChildren(root) {
    const children = "children" in root ? root.children.filter(isExportable).filter(isEffectivelyVisible) : [];
    const screens = [];
    const components = [];
    for (const child of children) {
      const shortSide = Math.min(child.width, child.height);
      const longSide = Math.max(child.width, child.height);
      const surfaceType = ["FRAME", "COMPONENT", "INSTANCE", "SECTION"].includes(child.type);
      if (surfaceType && shortSide >= 280 && longSide >= 400) screens.push(child);
      else if (child.width >= 16 && child.height >= 16) components.push(child);
    }
    return { screens, components };
  }
  function classifySurface(node) {
    const shortSide = Math.min(node.width, node.height);
    const longSide = Math.max(node.width, node.height);
    const surfaceType = ["FRAME", "COMPONENT", "INSTANCE", "SECTION"].includes(node.type);
    if (surfaceType && shortSide >= 280 && longSide >= 400) return "screen";
    if (node.width >= 16 && node.height >= 16) return "component";
    return null;
  }
  function classifyScope(scope) {
    if (scope.mode === "selection" && scope.roots.length === 1) {
      const root = scope.roots[0];
      const children = classifyDirectChildren(root);
      if (children.screens.length >= 2 || children.screens.length >= 1 && children.components.length >= 1 || root.type === "SECTION") return children;
      const kind = classifySurface(root);
      return {
        screens: kind === "screen" ? [root] : [],
        components: kind === "component" ? [root] : []
      };
    }
    const screens = [];
    const components = [];
    const add = (node) => {
      const kind = classifySurface(node);
      if (kind === "screen") screens.push(node);
      if (kind === "component") components.push(node);
    };
    for (const root of scope.roots) {
      const children = classifyDirectChildren(root);
      if (root.type === "SECTION" || children.screens.length >= 2 || children.screens.length >= 1 && children.components.length >= 1) {
        screens.push(...children.screens);
        components.push(...children.components);
      } else {
        add(root);
      }
    }
    return { screens, components };
  }
  function hashBytes(bytes) {
    let hash = 2166136261;
    for (const byte of bytes) {
      hash ^= byte;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }
  function postFile(path, bytes) {
    figma.ui.postMessage({ type: "export-file", path, bytes });
  }
  function postJson(path, value) {
    postFile(path, strToU8(JSON.stringify(value, null, 2)));
  }
  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
  }
  function buildViewerHtml(scope, previews, generatedAt) {
    const cards = previews.map((preview) => `
    <a class="card" href="${encodeURI(preview.path)}" target="_blank" rel="noreferrer">
      <div class="canvas"><img src="${encodeURI(preview.path)}" alt="${escapeHtml(preview.name)}"></div>
      <div class="meta"><strong>${escapeHtml(preview.name)}</strong><span>${preview.width} \xD7 ${preview.height} \xB7 ${preview.nodeType}</span></div>
    </a>`).join("");
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(scope.name)} \u2014 Design Handoff</title>
<style>
:root{color-scheme:light dark;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--bg:#f5f5f3;--panel:#fff;--text:#171715;--muted:#6b6b66;--line:#deded8;--canvas:#e9e9e5}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text)}header{padding:48px clamp(24px,5vw,72px) 28px;border-bottom:1px solid var(--line)}h1{font-size:clamp(28px,4vw,48px);letter-spacing:-.04em;margin:0 0 10px}p{color:var(--muted);margin:0;line-height:1.55}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px;padding:32px clamp(24px,5vw,72px) 72px}.card{display:block;color:inherit;text-decoration:none;background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease}.card:hover{transform:translateY(-2px);box-shadow:0 12px 30px #00000014}.canvas{height:360px;padding:18px;display:flex;align-items:center;justify-content:center;background:var(--canvas)}img{max-width:100%;max-height:100%;object-fit:contain}.meta{display:flex;flex-direction:column;gap:5px;padding:14px 16px}.meta strong{font-size:14px}.meta span{font-size:12px;color:var(--muted)}@media(prefers-color-scheme:dark){:root{--bg:#151514;--panel:#20201f;--text:#f1f1ee;--muted:#a0a09a;--line:#343431;--canvas:#111110}}@media(max-width:560px){header{padding-top:32px}.grid{grid-template-columns:1fr}.canvas{height:460px}}
</style></head><body><header><h1>${escapeHtml(scope.name)}</h1><p>${previews.filter((item) => item.kind === "screen").length} screens \xB7 ${previews.filter((item) => item.kind === "component").length} component previews \xB7 exported locally ${escapeHtml(generatedAt)}</p></header><main class="grid">${cards}</main></body></html>`;
  }
  function buildHandoffMarkdown(scope, options, previews, nodeCount, generatedAt) {
    return `# ${scope.name} \u2014 Design handoff

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
  async function exportPackage(scope, options) {
    const entries = walkScope(scope);
    const imageRefs = collectImageReferences(entries);
    const imageHashes = [...new Set(imageRefs.map((ref) => ref.imageHash))];
    const surfaces = classifyScope(scope);
    const svgCandidates = options.includeSvg ? collectSmartSvgCandidates(entries) : [];
    const canExportOverview = scope.mode === "selection" && scope.roots.length === 1 && !surfaces.screens.includes(scope.roots[0]) && !surfaces.components.includes(scope.roots[0]);
    const previewCount = options.includeScreenshots ? (canExportOverview ? 1 : 0) + surfaces.screens.length + surfaces.components.length : 0;
    const restSteps = options.includeRestJson ? scope.roots.length : 0;
    const estimatedTotal = 2 + (options.includeNodeIndex ? 1 : 0) + restSteps + previewCount + (options.includeImages ? imageHashes.length : 0) + svgCandidates.length + (options.includeViewer ? 2 : 0);
    let completed = 0;
    const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const imageManifest = [];
    const svgManifest = [];
    const previews = [];
    const progress = (label2) => {
      completed += 1;
      figma.ui.postMessage({ type: "export-progress", completed, total: estimatedTotal, label: label2 });
    };
    const label = (zh, en) => options.locale === "zh" ? zh : en;
    figma.ui.postMessage({ type: "export-start", total: estimatedTotal });
    const index = buildNodeIndex(entries);
    progress(label("\u5DF2\u5EFA\u7ACB\u8282\u70B9\u4E0E\u7D20\u6750\u7D22\u5F15", "Built the node and asset index"));
    if (options.includeNodeIndex) {
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
          roots: scope.roots.map((root) => ({ id: root.id, name: root.name, type: root.type }))
        },
        nodes: index
      });
      progress(label("\u5DF2\u5199\u5165\u5F00\u53D1\u5750\u6807\u7D22\u5F15", "Wrote the implementation node index"));
    }
    if (options.includeRestJson) {
      if (scope.mode === "selection" && scope.roots.length === 1) {
        try {
          const rest = await scope.roots[0].exportAsync({ format: "JSON_REST_V1" });
          postJson("design/rest-v1.json", rest);
        } catch (error) {
          postJson("design/rest-v1-error.json", { message: error instanceof Error ? error.message : String(error) });
        }
        progress(label("\u5DF2\u5199\u5165\u5B8C\u6574 REST V1 \u5F52\u6863", "Wrote the REST V1 archive"));
      } else {
        const roots = [];
        for (let position = 0; position < scope.roots.length; position += 1) {
          const root = scope.roots[position];
          try {
            roots.push({ id: root.id, name: root.name, type: root.type, data: await root.exportAsync({ format: "JSON_REST_V1" }) });
          } catch (error) {
            roots.push({ id: root.id, name: root.name, type: root.type, error: error instanceof Error ? error.message : String(error) });
          }
          progress(label(
            `REST V1 ${position + 1}/${scope.roots.length}\uFF1A${root.name}`,
            `REST V1 ${position + 1}/${scope.roots.length}: ${root.name}`
          ));
        }
        postJson("design/rest-v1.json", {
          exporterVersion: EXPORTER_VERSION,
          exportedAt: generatedAt,
          scope: { mode: scope.mode, id: scope.id, name: scope.name, type: scope.nodeType },
          roots
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
        progress(label("\u5DF2\u5BFC\u51FA\u603B\u89C8\u56FE", "Exported the overview"));
      }
      for (let position = 0; position < surfaces.screens.length; position += 1) {
        const screen = surfaces.screens[position];
        const path = `screens/${String(position + 1).padStart(2, "0")}-${sanitizeFilename(screen.name)}.png`;
        const bytes = await screen.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: options.screenshotScale } });
        postFile(path, bytes);
        previews.push({ nodeId: screen.id, name: screen.name, nodeType: screen.type, width: screen.width, height: screen.height, path, kind: "screen" });
        progress(label(`\u9875\u9762 ${position + 1}/${surfaces.screens.length}\uFF1A${screen.name}`, `Screen ${position + 1}/${surfaces.screens.length}: ${screen.name}`));
      }
      for (let position = 0; position < surfaces.components.length; position += 1) {
        const component = surfaces.components[position];
        const path = `components/${String(position + 1).padStart(2, "0")}-${sanitizeFilename(component.name)}.png`;
        const bytes = await component.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: options.screenshotScale } });
        postFile(path, bytes);
        previews.push({ nodeId: component.id, name: component.name, nodeType: component.type, width: component.width, height: component.height, path, kind: "component" });
        progress(label(`\u7EC4\u4EF6\u9884\u89C8 ${position + 1}/${surfaces.components.length}\uFF1A${component.name}`, `Component ${position + 1}/${surfaces.components.length}: ${component.name}`));
      }
    }
    if (options.includeImages) {
      for (let position = 0; position < imageHashes.length; position += 1) {
        const imageHash = imageHashes[position];
        const image = figma.getImageByHash(imageHash);
        if (!image) {
          imageManifest.push({ imageHash, error: "Image handle unavailable" });
          progress(label(`\u539F\u56FE ${position + 1}/${imageHashes.length} \u4E0D\u53EF\u8BFB\u53D6`, `Original image ${position + 1}/${imageHashes.length} was unavailable`));
          continue;
        }
        try {
          const [bytes, size] = await Promise.all([image.getBytesAsync(), image.getSizeAsync()]);
          const extension = imageExtension(bytes);
          const filename2 = `${String(position + 1).padStart(2, "0")}-${imageHash}.${extension}`;
          postFile(`assets/images/${filename2}`, bytes);
          imageManifest.push({ imageHash, filename: filename2, size, references: imageRefs.filter((ref) => ref.imageHash === imageHash) });
        } catch (error) {
          imageManifest.push({ imageHash, error: error instanceof Error ? error.message : String(error) });
        }
        progress(label(`\u539F\u56FE ${position + 1}/${imageHashes.length}`, `Original image ${position + 1}/${imageHashes.length}`));
      }
    }
    if (options.includeSvg) {
      const seen = /* @__PURE__ */ new Map();
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
            const filename2 = `${String(seen.size + 1).padStart(3, "0")}-${sanitizeFilename(node.name)}-${sanitizeFilename(node.id)}.svg`;
            seen.set(digest, filename2);
            postFile(`assets/svg/${filename2}`, bytes);
            svgManifest.push({ nodeId: node.id, name: node.name, type: node.type, filename: filename2, width: node.width, height: node.height });
          }
        } catch (error) {
          svgManifest.push({ nodeId: node.id, name: node.name, type: node.type, error: error instanceof Error ? error.message : String(error) });
        }
        progress(label(`\u77E2\u91CF\u7D20\u6750 ${position + 1}/${svgCandidates.length}\uFF1A${node.name}`, `Vector asset ${position + 1}/${svgCandidates.length}: ${node.name}`));
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
        height: root.height
      })),
      selectedNode: scope.roots.length === 1 ? {
        id: scope.roots[0].id,
        name: scope.roots[0].name,
        type: scope.roots[0].type,
        width: scope.roots[0].width,
        height: scope.roots[0].height
      } : void 0,
      previews,
      images: imageManifest,
      svg: svgManifest
    });
    progress(label("\u5DF2\u5199\u5165\u4EA4\u4ED8\u6E05\u5355", "Wrote the handoff manifest"));
    if (options.includeViewer) {
      postFile("index.html", strToU8(buildViewerHtml(scope, previews, generatedAt)));
      progress(label("\u5DF2\u751F\u6210\u672C\u5730\u6D4F\u89C8\u9875", "Generated the local browser"));
      postFile("HANDOFF.md", strToU8(buildHandoffMarkdown(scope, options, previews, entries.length, generatedAt)));
      progress(label("\u5DF2\u751F\u6210\u4EA4\u4ED8\u8BF4\u660E", "Generated the handoff guide"));
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
        svgCandidates: options.includeSvg ? svgCandidates.length : 0
      },
      summary: [
        `Scope: ${scope.mode} \xB7 ${scope.name} (${scope.id})`,
        `Top-level roots: ${scope.roots.length}`,
        `Preset: ${options.preset}`,
        `Nodes: ${entries.length}`,
        `Screens: ${options.includeScreenshots ? surfaces.screens.length : 0}`,
        `Component previews: ${options.includeScreenshots ? surfaces.components.length : 0}`,
        `Unique image fills: ${options.includeImages ? imageHashes.length : 0}`,
        `Smart SVG candidates: ${options.includeSvg ? svgCandidates.length : 0}`,
        `Generated at: ${generatedAt}`,
        "This package was generated locally and was not uploaded by the plugin."
      ].join("\n")
    });
  }
  figma.ui.onmessage = async (message) => {
    if (message.type === "set-locale" && (message.locale === "zh" || message.locale === "en")) {
      try {
        await figma.clientStorage.setAsync("frameparcel.locale", message.locale);
      } catch {
      }
      return;
    }
    if (message.type !== "export" || !message.options) return;
    const scope = resolveScope(message.options.scope);
    if (!scope) {
      figma.ui.postMessage({
        type: "export-error",
        message: message.options.locale === "zh" ? "\u5BFC\u51FA\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u56FE\u5C42\u6216\u5F53\u524D Page\u3002" : "The export scope changed. Select the layers or current Page again."
      });
      return;
    }
    try {
      await exportPackage(scope, message.options);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      figma.ui.postMessage({
        type: "export-error",
        message: message.options.locale === "zh" ? `\u5BFC\u51FA\u5931\u8D25\uFF1A${detail}` : `Export failed: ${detail}`
      });
    }
  };
  void initializeUI();
})();
