export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const attr = (value) => escapeHTML(value);
export const disabled = (value) => (value ? " disabled" : "");
export function configTypeField(label, type = 0) {
  return `<label class="form-field"><span>${escapeHTML(label)}</span><select name="type">${["String", "Number", "Boolean", "JSON"].map((name, index) => `<option value="${index}"${index === type ? " selected" : ""}>${name}</option>`).join("")}</select></label>`;
}
export function localTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
export function actionButton(
  action,
  label,
  extra = "",
  off = false,
  style = "default",
) {
  return `<button type="button" class="btn btn-${style}" data-action="${action}" ${extra}${disabled(off)}>${escapeHTML(label)}</button>`;
}
export function emptyRow(columns, label) {
  return `<tr><td colspan="${columns}" class="empty">${escapeHTML(label)}</td></tr>`;
}
export function formField(
  name,
  label,
  value = "",
  type = "text",
  required = false,
) {
  if (type === "checkbox")
    return `<label class="checkbox-label"><input type="checkbox" name="${name}"${value ? " checked" : ""}> ${escapeHTML(label)}</label>`;
  return `<label class="form-field"><span>${required ? "<b>*</b> " : ""}${escapeHTML(label)}</span>${type === "textarea" ? `<textarea name="${name}" rows="6"${required ? " required" : ""}>${escapeHTML(value)}</textarea>` : `<input name="${name}" type="${type}" value="${attr(value)}"${required ? " required" : ""}>`}</label>`;
}

const designAssets =
  typeof APOLLO_DESIGN_ASSETS === "undefined" ? {} : APOLLO_DESIGN_ASSETS;
export function assetImage(name, alt = "", style = "reference-icon") {
  const src = designAssets[name];
  return src
    ? `<img class="${attr(style)}" src="${attr(src)}" alt="${attr(alt)}">`
    : "";
}
