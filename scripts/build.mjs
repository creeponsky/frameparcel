import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");

await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [resolve(projectRoot, "src/code.ts")],
  bundle: true,
  outfile: resolve(distDir, "code.js"),
  target: "es2020",
  format: "iife",
  logLevel: "info",
});

const uiBuild = await build({
  entryPoints: [resolve(projectRoot, "src/ui.ts")],
  bundle: true,
  write: false,
  target: "es2020",
  format: "iife",
  minify: true,
  logLevel: "info",
});

const htmlTemplate = await readFile(resolve(projectRoot, "src/ui.html"), "utf8");
const uiScript = uiBuild.outputFiles[0].text;
const outputHtml = htmlTemplate.replace("/*__BUNDLED_UI__*/", uiScript);

await writeFile(resolve(distDir, "ui.html"), outputHtml, "utf8");
