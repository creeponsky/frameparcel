import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const fixture = await mkdtemp(join(tmpdir(), "frameparcel-validator-"));
const validator = resolve("scripts/validate-export.mjs");

async function writeIndex(mainComponentStatus) {
  const mainComponent = mainComponentStatus === "resolved" ? { id: "2:1", name: "Primary button" } : null;
  await writeFile(join(fixture, "design/node-index.json"), JSON.stringify({
    nodes: [
      {
        id: "1:1",
        name: "Screen",
        type: "FRAME",
        x: 0,
        y: 0,
        absoluteBoundingBox: { x: 0, y: 0, width: 390, height: 844 },
      },
      {
        id: "1:2",
        name: "Primary button instance",
        type: "INSTANCE",
        x: 24,
        y: 720,
        absoluteBoundingBox: { x: 24, y: 720, width: 342, height: 48 },
        mainComponent,
        mainComponentStatus,
      },
    ],
  }));
}

try {
  await mkdir(join(fixture, "assets"), { recursive: true });
  await mkdir(join(fixture, "design"), { recursive: true });
  await mkdir(join(fixture, "screens"), { recursive: true });
  await writeFile(join(fixture, "assets/manifest.json"), JSON.stringify({ preset: "developer", images: [], svg: [] }));
  await writeFile(join(fixture, "screens/01-screen.png"), new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
  await writeFile(join(fixture, "index.html"), "<!doctype html><title>FrameParcel</title>");
  await writeFile(join(fixture, "HANDOFF.md"), "# Handoff\n");

  await writeIndex("resolved");
  const valid = await run(process.execPath, [validator, fixture]);
  assert.match(valid.stdout, /passed structural validation/);

  await writeIndex("unavailable");
  await assert.rejects(
    run(process.execPath, [validator, fixture]),
    (error) => /instance main component reference/.test(error.stderr),
  );
} finally {
  await rm(fixture, { recursive: true, force: true });
}

console.log("Export validator smoke test passed for instance component references.");
