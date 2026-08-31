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
let zipIntegrityErrors = [];

const readU16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
const readU32 = (bytes, offset) => (
  bytes[offset]
  | (bytes[offset + 1] << 8)
  | (bytes[offset + 2] << 16)
  | (bytes[offset + 3] << 24)
) >>> 0;

const crcTable = new Uint32Array(256);
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  crcTable[index] = value >>> 0;
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function verifyZipCrc(archive, extractedFiles) {
  const errors = [];
  const searchStart = Math.max(0, archive.length - 65_558);
  let endOfCentralDirectory = -1;
  for (let offset = archive.length - 22; offset >= searchStart; offset -= 1) {
    if (readU32(archive, offset) === 0x06054b50) {
      endOfCentralDirectory = offset;
      break;
    }
  }
  if (endOfCentralDirectory < 0) return ["ZIP central directory is missing"];

  const entryCount = readU16(archive, endOfCentralDirectory + 10);
  let cursor = readU32(archive, endOfCentralDirectory + 16);
  for (let entry = 0; entry < entryCount; entry += 1) {
    if (readU32(archive, cursor) !== 0x02014b50) {
      errors.push(`ZIP central directory entry ${entry + 1} is invalid`);
      break;
    }
    const expected = readU32(archive, cursor + 16);
    const filenameLength = readU16(archive, cursor + 28);
    const extraLength = readU16(archive, cursor + 30);
    const commentLength = readU16(archive, cursor + 32);
    const filename = strFromU8(archive.subarray(cursor + 46, cursor + 46 + filenameLength));
    const extracted = extractedFiles[filename];
    if (extracted && crc32(extracted) !== expected) errors.push(`${filename} has a CRC mismatch`);
    cursor += 46 + filenameLength + extraLength + commentLength;
  }
  return errors;
}

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
  const archive = new Uint8Array(await readFile(inputPath));
  files = unzipSync(archive);
  zipIntegrityErrors = verifyZipCrc(archive, files);
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
const instanceNodes = nodes.filter((node) => node.type === "INSTANCE");
const resolvedMainComponents = instanceNodes.filter((node) => (
  node.mainComponentStatus === "resolved"
  && node.mainComponent
  && typeof node.mainComponent === "object"
  && typeof node.mainComponent.id === "string"
));
const missingMainComponents = instanceNodes.filter((node) => (
  node.mainComponentStatus === "missing" && node.mainComponent === null
));
const unavailableMainComponents = instanceNodes.filter((node) => (
  node.mainComponent === "__UNAVAILABLE__"
  || node.mainComponentStatus === "unavailable"
  || !["resolved", "missing"].includes(node.mainComponentStatus)
));
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
  instances: instanceNodes.length,
  resolvedMainComponents: resolvedMainComponents.length,
  missingMainComponents: missingMainComponents.length,
  unavailableMainComponents: unavailableMainComponents.length,
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
errors.push(...zipIntegrityErrors);
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
if (unavailableMainComponents.length > 0) {
  errors.push(`${unavailableMainComponents.length} instance main component reference(s) could not be resolved`);
}

if (errors.length > 0) {
  console.error(`Export validation failed: ${errors.join("; ")}`);
  process.exit(1);
}

console.log("Export package passed structural validation.");
