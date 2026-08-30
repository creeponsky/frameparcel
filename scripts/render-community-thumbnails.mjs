import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, "docs", "community-assets");
const sources = ["thumbnail.svg", "thumbnail-zh.svg"];
const work = await mkdtemp(join(tmpdir(), "frameparcel-thumbnails-"));

try {
  for (const source of sources) {
    let svg = await readFile(join(assets, source), "utf8");
    const matches = [...svg.matchAll(/href="(vendor-marks\/[^"]+\.png)"/g)];

    for (const [, relativePath] of matches) {
      const image = await readFile(join(assets, relativePath));
      svg = svg.replaceAll(
        `href="${relativePath}"`,
        `href="data:image/png;base64,${image.toString("base64")}"`,
      );
    }

    const embeddedSvg = join(work, source);
    const output = join(assets, source.replace(".svg", ".png"));
    await writeFile(embeddedSvg, svg);
    await execFileAsync("sips", ["-s", "format", "png", embeddedSvg, "--out", output]);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

console.log("Rendered Community thumbnails with embedded compatibility marks.");
