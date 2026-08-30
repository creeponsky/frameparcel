import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import process from "node:process";
import { strFromU8, unzipSync } from "fflate";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run validate-export -- /absolute/path/to/package.zip-or-folder");
  process.exit(2);
}

const inputPath = resolve(input);
const inputStat = await stat(inputPath);
let files;

if (inputStat.isDirectory()) {
  files = {};
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else files[relative(inputPath, absolute).split("\\").join("/")] = new Uint8Array(await readFile(absolute));
    }
  };
  await visit(inputPath);
} else {
  files = unzipSync(new Uint8Array(await readFile(inputPath)));
}

const names = Object.keys(files).sort();
const has = (name) => Boolean(files[name]);
const parseJson = (name) => JSON.parse(strFromU8(files[name]));
const assets = has("assets/manifest.json") ? parseJson("assets/manifest.json") : { images: [], svg: [] };
const preset = assets.preset ?? (has("design/rest-v1.json") ? "legacy/archive" : "unknown");
const index = has("design/node-index.json") ? parseJson("design/node-index.json") : { nodes: [] };
const nodes = Array.isArray(index.nodes) ? index.nodes : [];
const screens = names.filter((name) => name.startsWith("screens/") && name.endsWith(".png"));
const components = names.filter((name) => name.startsWith("components/") && name.endsWith(".png"));
const images = names.filter((name) => name.startsWith("assets/images/") && !name.endsWith("/"));
const svg = names.filter((name) => name.startsWith("assets/svg/") && name.endsWith(".svg"));
const nodesWithPosition = nodes.filter((node) => typeof node.x === "number" && typeof node.y === "number");
const nodesWithAbsoluteBounds = nodes.filter((node) => node.absoluteBoundingBox && typeof node.absoluteBoundingBox === "object");
const missingImages = (assets.images ?? []).filter((image) => image.error);
const failedSvg = (assets.svg ?? []).filter((item) => item.error);

const report = {
  package: basename(inputPath),
  preset,
  selectedNode: assets.selectedNode,
  files: names.length,
  nodes: nodes.length,
  nodesWithPosition: nodesWithPosition.length,
  nodesWithAbsoluteBounds: nodesWithAbsoluteBounds.length,
  screenshots: screens.length,
  componentPreviews: components.length,
  rawImages: images.length,
  svgFiles: svg.length,
  missingImages: missingImages.length,
  failedSvg: failedSvg.length,
  hasViewer: has("index.html"),
  hasHandoffGuide: has("HANDOFF.md"),
  hasRestV1: has("design/rest-v1.json"),
};

console.log(JSON.stringify(report, null, 2));

const errors = [];
if (!has("assets/manifest.json")) errors.push("asset manifest is missing");
if (preset !== "review") {
  if (nodes.length === 0) errors.push("node index is empty or missing");
  if (nodesWithPosition.length === 0) errors.push("node index contains no x/y coordinates");
  if (nodesWithAbsoluteBounds.length === 0) errors.push("node index contains no absolute bounds");
}
if (screens.length < 1) errors.push("overview screenshot is missing");
if (["developer", "archive", "review"].includes(preset) && !has("index.html")) errors.push("local viewer is missing");
if (["developer", "archive", "review"].includes(preset) && !has("HANDOFF.md")) errors.push("handoff guide is missing");
if (preset === "archive" && !has("design/rest-v1.json")) errors.push("archive preset is missing REST V1 JSON");
if (missingImages.length > 0) errors.push(`${missingImages.length} original image(s) could not be read`);
if (failedSvg.length > 0) errors.push(`${failedSvg.length} SVG candidate(s) failed to export`);

if (errors.length > 0) {
  console.error(`Export validation failed: ${errors.join("; ")}`);
  process.exit(1);
}

console.log("Export package passed structural validation.");
