import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
const data = JSON.parse(
  await readFile(resolve(root, process.argv[2] || "docs/parity/manifest.json"), "utf8"),
);
const output = resolve(root, data.evidenceDirectory || 'output/playwright/parity');
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function image(name, label) {
  if (!name)
    return `<div class="missing">${escape(label)}: no rendered screenshot. See source finding; not counted as browser verification.</div>`;
  const bytes = await readFile(resolve(output, name));
  return `<figure><figcaption>${escape(label)} - ${escape(name)}</figcaption><a href="${escape(name)}"><img loading="lazy" alt="${escape(label)}" src="data:image/png;base64,${bytes.toString("base64")}"></a></figure>`;
}
let body = "";
for (const [heading, entries] of [
  ["Management Pages", data.pages],
  ["Dialog Declarations", data.dialogs],
  ...(data.additionalStates?.length ? [["Additional Scoped States", data.additionalStates]] : []),
]) {
  body += `<h2>${heading} (${entries.length})</h2>`;
  for (const [index, entry] of entries.entries())
    body += `<section><header><b>${index + 1}. ${escape(entry.source)} ${escape(entry.id || "")}</b><span>${escape(entry.status)}</span></header>${entry.remediation ? `<p>Implemented: ${escape(entry.remediation)}</p>` : ''}<p>${escape(entry.finding)}</p><p class="kind">Evidence: ${escape(entry.evidenceKind)}</p><div class="pair">${await image(entry.referenceImage, "Apollo v2.5.2")}${await image(entry.nativeImage, "Handwritten DBX plugin")}</div></section>`;
}
await writeFile(
  resolve(output, "report.html"),
  `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="icon" href="data:,"><title>Apollo 1:1 Audit - FAIL</title><style>body{font:15px/1.6 Georgia,'Microsoft YaHei',sans-serif;background:#eef1f4;color:#253344;margin:0;padding:32px}main{max-width:1800px;margin:auto}h1{font-size:32px}section{background:white;margin:24px 0;border:1px solid #cbd3dc;padding:18px}header{display:flex;justify-content:space-between;gap:20px}header span{color:#a52b24;font-weight:bold}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;min-width:0}figcaption,.kind{font:12px/1.6 monospace;color:#596e80}img{width:100%;border:1px solid #ddd}.missing{padding:20px;background:#f9f0e4}.notice{border-left:5px solid #a52b24;padding:18px;background:white}@media(max-width:800px){body{padding:12px}.pair{grid-template-columns:1fr}}</style><main><h1>Apollo 1:1 Audit: FAIL</h1><p class="notice">${data.auditDate} | Apollo ${data.referenceTag} ${data.referenceCommit}<br>24 management-page mappings and 31 dialog declarations inventoried. This is a failed parity gate, not a claim of full acceptance. Some warning flows are source-only findings and explicitly marked; they were not triggered in the browser. Both surfaces use controlled loopback fixture data, not live Apollo. Capture animations are settled before accepted screenshots.</p>${body}</main></html>`,
);
console.log(
  "Wrote self-contained visual report:",
  resolve(output, "report.html"),
);
