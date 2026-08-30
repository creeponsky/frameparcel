import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const messages = [];
let pluginMessageHandler;
let selectionChangeHandler;

const rootNode = {
  id: "1:1",
  name: "Smoke Test Frame",
  type: "FRAME",
  width: 402,
  height: 874,
  x: 12,
  y: 24,
  parent: { id: "0:1" },
  children: [],
  async exportAsync(settings) {
    if (settings.format === "JSON_REST_V1") {
      return { id: this.id, name: this.name, type: this.type };
    }
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  },
};

const secondRoot = {
  id: "1:4",
  name: "Second Phone",
  type: "FRAME",
  width: 390,
  height: 844,
  x: 450,
  y: 24,
  visible: true,
  parent: { id: "0:1" },
  children: [],
  async exportAsync(settings) {
    if (settings.format === "JSON_REST_V1") {
      return { id: this.id, name: this.name, type: this.type };
    }
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  },
};

const hiddenRoot = {
  ...secondRoot,
  id: "1:5",
  name: "Hidden Phone",
  visible: false,
};

const makeChild = (id, name, width, height) => ({
  id,
  name,
  type: "FRAME",
  width,
  height,
  x: 0,
  y: 0,
  visible: true,
  parent: rootNode,
  children: [],
  async exportAsync() {
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  },
});
rootNode.children.push(
  makeChild("1:2", "Phone screen", 402, 874),
  makeChild("1:3", "Sticker component", 100, 100),
);
const sticker = rootNode.children[1];
const booleanIcon = {
  id: "1:6",
  name: "Boolean icon",
  type: "BOOLEAN_OPERATION",
  width: 24,
  height: 24,
  x: 0,
  y: 0,
  visible: true,
  fills: [{ type: "SOLID", visible: true, opacity: 1, color: { r: 0, g: 0, b: 0 } }],
  strokes: [],
  effects: [],
  parent: sticker,
  children: [],
  async exportAsync() {
    return new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0x3e]);
  },
};
const internalVector = {
  id: "1:7",
  name: "Internal vector path",
  type: "VECTOR",
  width: 12,
  height: 12,
  x: 4,
  y: 4,
  visible: true,
  fills: [{ type: "SOLID", visible: true, opacity: 1, color: { r: 0, g: 0, b: 0 } }],
  strokes: [],
  effects: [],
  parent: booleanIcon,
  async exportAsync() {
    return new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0x3e]);
  },
};
booleanIcon.children.push(internalVector);
sticker.children.push(booleanIcon);

const currentPage = {
  id: "0:1",
  name: "Page 1",
  selection: [rootNode],
  children: [rootNode, secondRoot, hiddenRoot],
};

const figmaMock = {
  mixed: Symbol("mixed"),
  root: { name: "Smoke Test File" },
  currentPage,
  ui: {
    postMessage(message) {
      messages.push(message);
    },
    set onmessage(handler) {
      pluginMessageHandler = handler;
    },
    get onmessage() {
      return pluginMessageHandler;
    },
  },
  showUI() {},
  on(event, handler) {
    if (event === "selectionchange") selectionChangeHandler = handler;
  },
  getImageByHash() { return null; },
};

const code = await readFile(new URL("../dist/code.js", import.meta.url), "utf8");

// TextEncoder and TextDecoder are deliberately absent. Figma's plugin main
// sandbox does not guarantee browser encoding globals.
vm.runInNewContext(code, {
  figma: figmaMock,
  __html__: "<html></html>",
  console,
  Uint8Array,
  Uint16Array,
  Int32Array,
  ArrayBuffer,
  DataView,
  Date,
  Math,
  JSON,
  Promise,
  Symbol,
  Map,
  Set,
  Error,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
});

assert.equal(typeof pluginMessageHandler, "function", "plugin UI handler was not installed");
assert.equal(typeof selectionChangeHandler, "function", "selection change handler was not installed");
assert(messages.some((message) => message.type === "selection" && message.selection.valid && message.page.valid));
const initialScopeMessage = messages.findLast((message) => message.type === "selection");
assert.equal(initialScopeMessage.page.rootCount, 2, "Page scope should exclude hidden top-level roots");

const beforeSingleExport = messages.length;
await pluginMessageHandler({
  type: "export",
  options: {
    preset: "archive",
    locale: "en",
    scope: "selection",
    includeNodeIndex: true,
    includeRestJson: true,
    includeScreenshots: true,
    includeImages: true,
    includeSvg: true,
    includeViewer: true,
    screenshotScale: 2,
  },
});

const singleMessages = messages.slice(beforeSingleExport);
const singleManifest = singleMessages.find((message) => message.type === "export-file" && message.path === "assets/manifest.json");
assert(singleManifest, "asset manifest was not written");
const singleManifestJson = JSON.parse(Buffer.from(singleManifest.bytes).toString("utf8"));
assert.deepEqual(singleManifestJson.svg.map((asset) => asset.nodeId), ["1:3"], "internal vector paths should not be exported separately");

assert(messages.some((message) => message.type === "export-complete"));
assert(messages.some((message) => message.type === "export-file" && message.path === "design/node-index.json"));
assert(messages.some((message) => message.type === "export-file" && message.path === "design/rest-v1.json"));
assert(messages.some((message) => message.type === "export-file" && message.path.startsWith("screens/")));
assert(messages.some((message) => message.type === "export-file" && message.path.startsWith("components/")));
assert(messages.some((message) => message.type === "export-file" && message.path === "index.html"));
assert(messages.some((message) => message.type === "export-file" && message.path === "HANDOFF.md"));

currentPage.selection = [rootNode, secondRoot];
selectionChangeHandler();
const multiScopeMessage = messages.findLast((message) => message.type === "selection");
assert.equal(multiScopeMessage.selection.rootCount, 2);
assert.equal(multiScopeMessage.selection.screenCount, 2);
assert.equal(multiScopeMessage.selection.componentCount, 1);

const beforeMultiExport = messages.length;
await pluginMessageHandler({
  type: "export",
  options: {
    preset: "archive",
    locale: "en",
    scope: "selection",
    includeNodeIndex: true,
    includeRestJson: true,
    includeScreenshots: true,
    includeImages: true,
    includeSvg: true,
    includeViewer: true,
    screenshotScale: 2,
  },
});
const multiMessages = messages.slice(beforeMultiExport);
assert(multiMessages.some((message) => message.type === "export-complete" && message.filename === "2-selected-layers-handoff.zip"));
const multiRest = multiMessages.find((message) => message.type === "export-file" && message.path === "design/rest-v1.json");
assert(multiRest, "multi-selection REST archive was not written");
const multiRestJson = JSON.parse(Buffer.from(multiRest.bytes).toString("utf8"));
assert.equal(multiRestJson.scope.mode, "selection");
assert.equal(multiRestJson.roots.length, 2);

await pluginMessageHandler({
  type: "export",
  options: {
    preset: "developer",
    locale: "en",
    scope: "page",
    includeNodeIndex: true,
    includeRestJson: false,
    includeScreenshots: true,
    includeImages: true,
    includeSvg: true,
    includeViewer: true,
    screenshotScale: 2,
  },
});

assert(messages.some((message) => message.type === "export-complete" && message.filename === "Page-1-handoff.zip"));
const pageComplete = messages.findLast((message) => message.type === "export-complete" && message.filename === "Page-1-handoff.zip");
assert.equal(pageComplete.receipt.screens, 2);
assert.equal(pageComplete.receipt.components, 1);

console.log("Figma sandbox smoke test passed without TextEncoder/TextDecoder globals.");
