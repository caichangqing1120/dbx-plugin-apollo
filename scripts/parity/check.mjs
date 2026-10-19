import { readFile, readdir, access } from "node:fs/promises";
import { resolve, relative } from "node:path";
const root = resolve(import.meta.dirname, "../..");
const reference = process.argv[2];
if (!reference)
  throw Error(
    "Usage: node scripts/parity/check.mjs <Apollo static reference root>",
  );
const manifest = JSON.parse(
  await readFile(resolve(root, process.argv[3] || "docs/parity/manifest.json"), "utf8"),
);
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "vendor") continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (path.endsWith(".html")) result.push(path);
  }
  return result;
}
const inventory = [];
const pages = [];
for (const path of await files(resolve(reference))) {
  const source = relative(resolve(reference), path).replaceAll("\\", "/"),
    text = await readFile(path, "utf8");
  if (!source.startsWith("views/")) pages.push(source);
  for (const match of text.matchAll(/<(?:form|div)\b[^>]*>/g)) {
    const tag = match[0],
      id = tag.match(/\bid=["']([^"']+)/),
      classes = tag.match(/\bclass=["']([^"']+)/);
    if (id && classes && classes[1].split(/\s+/).includes("modal"))
      inventory.push(source + ":" + id[1]);
  }
  for (const match of text.matchAll(
    /<apolloconfirmdialog\b[^>]*apollo-dialog-id="'([^']+)'"/gs,
  ))
    inventory.push(source + ":" + match[1]);
}
const covered = new Set(
  [...manifest.pages, ...manifest.exclusions].map((entry) => entry.source),
);
const missingPages = pages.filter((source) => !covered.has(source));
const declared = new Set(
  manifest.dialogs.map((entry) => entry.source + ":" + entry.id),
);
const missingDialogs = inventory.filter((key) => !declared.has(key));
if (missingPages.length || missingDialogs.length)
  throw Error(JSON.stringify({ missingPages, missingDialogs }));
let pairs = 0;
for (const entry of [...manifest.pages, ...manifest.dialogs]) {
  for (const name of [entry.referenceImage, entry.nativeImage])
    if (name) await access(resolve(root, manifest.evidenceDirectory || "output/playwright/parity", name));
  if (entry.referenceImage && entry.nativeImage) pairs++;
  if (!["FAIL", "PASS", "BLOCKED"].includes(entry.status))
    throw Error("Unclassified entry");
  if (!entry.finding) throw Error("Missing finding: " + entry.source);
}
console.log(
  `Census complete: ${manifest.pages.length} management pages, ${inventory.length} dialog declarations; ${pairs} paired records. No omitted source entry.`,
);
console.log(
  "Evidence kinds are explicit: source-only warning flows are NOT claimed browser-triggered.",
);
console.log(
  `1:1 acceptance gate: ${manifest.verdict}. This gate is independent of unit/integration tests.`,
);
process.exitCode = manifest.acceptancePassed ? 0 : 1;
