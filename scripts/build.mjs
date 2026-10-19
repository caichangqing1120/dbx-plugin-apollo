import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
} from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
const root = resolve(import.meta.dirname, "..");
const iconFont = (
  await readFile(resolve(root, "assets/apollo-icons.woff2"))
).toString("base64");
const gitIcon = (await readFile(resolve(root, "assets/github.svg"))).toString(
  "base64",
);
const css = (await readFile(resolve(root, "src/styles.css"), "utf8"))
  .replaceAll("__APOLLO_ICONFONT_DATA__", iconFont)
  .replaceAll("__APOLLO_GITHUB_ICON__", gitIcon);
const logo = (await readFile(resolve(root, "assets/apollo-logo.png"))).toString(
  "base64",
);
const designAssets = Object.fromEntries(
  await Promise.all(
    (await readdir(resolve(root, "assets/reference")))
      .filter((name) => name.endsWith(".png"))
      .map(async (name) => [
        name,
        "data:image/png;base64," +
          (await readFile(resolve(root, "assets/reference", name))).toString(
            "base64",
          ),
      ]),
  ),
);
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/runtime.js"],
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  target: "es2022",
  charset: "utf8",
  define: {
    APOLLO_DESIGN_ASSETS: JSON.stringify(designAssets),
    APOLLO_LOGO: JSON.stringify("data:image/png;base64," + logo),
  },
});
const code = result.outputFiles[0].text;
await mkdir(resolve(root, "ui"), { recursive: true });
await writeFile(
  resolve(root, "ui/index.html"),
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Apollo Config</title><style>' +
    css +
    '</style></head><body><div id="app"></div><script>(()=>{' +
    code.replace(/<\/script/gi, "<\\/script") +
    "})();</script></body></html>",
);
await copyFile(resolve(root, "LICENSE"), resolve(root, "ui/LICENSE"));
await copyFile(resolve(root, "NOTICE"), resolve(root, "ui/NOTICE"));
console.log(
  "Built handwritten Apollo UI (no upstream HTML, AngularJS, Bootstrap or remote assets)",
);
console.log("DBX_UI_BUILD_SUCCESS");
