import {
  escapeHTML as e,
  attr,
  formField,
  configTypeField,
  localTimestamp,
} from "./ui.js";

export function itemEditorFields(
  item,
  t,
  { isNew = false, targets = [] } = {},
) {
  const type = Number(item.type ?? 0);
  return `<div class="item-editor">${formField("key", t("key"), item.key, "text", isNew).replace('name="key"', `name="key"${isNew ? "" : " readonly"}`)}${configTypeField(t("type"), type).replace('<span>', '<span><b>*</b> ')}<div data-item-value>${itemValueField(type, item.value ?? "", t)}</div><p class="editor-hint">${t("Component.ConfigItem.ItemValueTips")} <button type="button" class="btn btn-link" data-action="detect-special-chars">${t("detectSpecialCharacters")}</button></p><p data-special-result hidden></p>${formField("comment", "Comment", item.comment, "textarea")}${isNew && targets.length ? `<div class="item-clusters"><label>${t("chooseClusters")}</label><table class="admin-table"><thead><tr><th><input type="checkbox" data-action="toggle-item-targets" aria-label="${t("selectAll")}"></th><th>${t("environment")}</th><th>${t("clusterName")}</th></tr></thead><tbody>${targets.map((target, index) => `<tr><td><input type="checkbox" name="itemTarget_${index}"${target.selected ? " checked" : ""}></td><td>${e(target.env)}</td><td>${e(target.cluster)}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>`;
}
export function itemValueField(type, value, t) {
  if (Number(type) === 2)
    return `<label class="form-field"><span>${t("value")}</span><select name="value"><option value="true"${value === "true" ? " selected" : ""}>true</option><option value="false"${value !== "true" ? " selected" : ""}>false</option></select></label>`;
  return formField("value", t("value"), value, "textarea") + `<button type="button" class="item-value-expand" data-action="expand-item-value" aria-label="${t("fullscreen")}">⛶</button>${Number(type) === 3 ? `<button type="button" class="btn btn-link item-json-format" data-action="format-item-value">${t("Component.ConfigItem.FormatItemValue")}</button>` : ""}`;
}
export function validateItem(data, t) {
  const type = Number(data.type),
    value = String(data.value ?? "");
  if (![0, 1, 2, 3].includes(type)) throw Error(t("invalidItemType"));
  if (type === 1 && (!value.trim() || !Number.isFinite(Number(value))))
    throw Error(t("invalidNumber"));
  if (type === 2 && !["true", "false"].includes(value))
    throw Error(t("invalidBoolean"));
  if (type === 3) {
    try {
      JSON.parse(value);
    } catch {
      throw Error(t("invalidJSON"));
    }
  }
  return { type, value };
}
export function releaseValues(release) {
  if (!release) return {};
  if (Array.isArray(release.items))
    return Object.fromEntries(
      release.items.map((item) => [item.key, item.value]),
    );
  const values = (release.baseInfo || release).configurations;
  if (typeof values === "string") {
    try {
      return JSON.parse(values);
    } catch {
      throw Error("Apollo returned invalid release configurations");
    }
  }
  return values || {};
}
export function changePreview(namespace, release, t) {
  const old = releaseValues(release),
    rows = [];
  for (const row of namespace.items || []) {
    const item = row.item || row,
      key = item.key;
    if (!key) continue;
    const previous = Object.hasOwn(old, key) ? old[key] : row.oldValue;
    if (row.isDeleted) rows.push([t("remove"), key, previous, "", item]);
    else if (previous === undefined)
      rows.push([t("added"), key, "", item.value, item]);
    else if (String(previous) !== String(item.value))
      rows.push([t("modified"), key, previous, item.value, item]);
  }
  return `<div data-release-preview class="release-preview table-scroll"><table class="admin-table"><thead><tr>${["changeRecordType", "key", "publishedValue", "pendingValue", "changeRecord"].map((key) => `<th>${t(key)}</th>`).join("")}</tr></thead><tbody>${rows.map(([kind, key, old, value, item]) => `<tr><td>${e(kind)}</td><td>${e(key)}</td><td><pre>${e(old)}</pre></td><td><pre>${e(value)}</pre></td><td>${e(item.dataChangeLastModifiedBy)}<br>${e(localTimestamp(item.dataChangeLastModifiedTime))}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">${t("noChanges")}</td></tr>`}</tbody></table></div>`;
}
export function comparisonTable(result, t) {
  return `<div class="table-scroll" data-release-preview><table class="admin-table"><thead><tr>${["changes", "key", "oldValue", "newValue"].map((key) => `<th>${t(key)}</th>`).join("")}</tr></thead><tbody>${
    (result?.changes || [])
      .map((change) => {
        const pair = change.entity || {},
          a = pair.firstEntity,
          b = pair.secondEntity;
        const type = { ADDED: 'added', MODIFIED: 'edit', DELETED: 'remove' }[change.type];
        return `<tr><td>${e(type ? t(type) : change.type || "")}</td><td>${e(a?.key || b?.key)}</td><td><pre>${e(a?.value ?? "")}</pre></td><td><pre>${e(b?.value ?? "")}</pre></td></tr>`;
      })
      .join("") ||
    `<tr><td colspan="4" class="empty">${t("noChanges")}</td></tr>`
  }</tbody></table></div>`;
}
export function releaseFields(namespace, release, t) {
  const stamp = localTimestamp(new Date()).replace(/[- :]/g, "");
  return (
    changePreview(namespace, release, t) +
    formField("title", t("releaseTitle"), stamp + "-release", "text", true) +
    formField("comment", t("releaseComment"), "", "textarea")
  );
}

export function formatJSONUniqueKeys(text) {
  // Format raw tokens after validation so large IDs and exponent literals stay exact.
  JSON.parse(text);
  const tokens =
      text.match(
        /"(?:\\.|[^"\\])*"|[{}\[\],:]|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g,
      ) || [];
  let index = 0;
  function scan(depth) {
    if (depth > 300) throw Error("JSON nesting is too deep to format safely");
    if (tokens[index] === "{") {
      index++;
      const keys = new Set();
      while (tokens[index] !== "}") {
        const key = JSON.parse(tokens[index++]);
        if (keys.has(key)) throw Error("Duplicate JSON key: " + key);
        keys.add(key);
        index++;
        scan(depth + 1);
        if (tokens[index] !== ",") break;
        index++;
      }
      index++;
    } else if (tokens[index] === "[") {
      index++;
      while (tokens[index] !== "]") {
        scan(depth + 1);
        if (tokens[index] !== ",") break;
        index++;
      }
      index++;
    } else index++;
  }
  scan(0);
  index = 0;
  function format(depth) {
    const token = tokens[index++];
    if (token !== '{' && token !== '[') return token;
    const end = token === '{' ? '}' : ']';
    if (tokens[index] === end) { index++; return token + end; }
    const rows = [], indent = '    '.repeat(depth + 1);
    while (tokens[index] !== end) {
      const key = token === '{' ? tokens[index++] : null;
      if (key !== null) index++;
      rows.push(indent + (key === null ? '' : key + ': ') + format(depth + 1));
      if (tokens[index] === ',') index++;
    }
    index++;
    return token + '\n' + rows.join(',\n') + '\n' + '    '.repeat(depth) + end;
  }
  return format(0);
}
