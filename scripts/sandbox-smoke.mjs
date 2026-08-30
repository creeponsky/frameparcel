import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const messages = [];
let pluginMessageHandler;

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

const figmaMock = {
  mixed: Symbol("mixed"),
  root: { name: "Smoke Test File" },
  currentPage: { name: "Page 1", selection: [rootNode] },
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
  on() {},
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
assert(messages.some((message) => message.type === "selection" && message.valid));

await pluginMessageHandler({
  type: "export",
  options: {
    preset: "archive",
    locale: "en",
    includeNodeIndex: true,
    includeRestJson: true,
    includeScreenshots: true,
    includeImages: true,
    includeSvg: true,
    includeViewer: true,
    screenshotScale: 2,
  },
});

assert(messages.some((message) => message.type === "export-complete"));
assert(messages.some((message) => message.type === "export-file" && message.path === "design/node-index.json"));
assert(messages.some((message) => message.type === "export-file" && message.path === "design/rest-v1.json"));
assert(messages.some((message) => message.type === "export-file" && message.path.startsWith("screens/")));
assert(messages.some((message) => message.type === "export-file" && message.path.startsWith("components/")));
assert(messages.some((message) => message.type === "export-file" && message.path === "index.html"));
assert(messages.some((message) => message.type === "export-file" && message.path === "HANDOFF.md"));

console.log("Figma sandbox smoke test passed without TextEncoder/TextDecoder globals.");
