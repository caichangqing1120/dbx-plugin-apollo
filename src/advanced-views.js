import {
  escapeHTML,
  actionButton,
  emptyRow,
  formField,
  localTimestamp,
} from "./ui.js";

const advEscape = (value) => escapeHTML(value);
const advCheck = (value) => (value ? " checked" : "");
function advTable(labels, rows) {
  return `<div class="table-scroll"><table class="admin-table"><thead><tr>${labels.map((label) => `<th>${advEscape(label)}</th>`).join("")}</tr></thead><tbody>${rows.join("") || emptyRow(labels.length, "—")}</tbody></table></div>`;
}
function advPage(title, s, t, body, tools = "") {
  return `<main class="detail-main advanced-page"><div class="detail-title"><h1>${advEscape(title)}${s.route.appId ? ` <small>${advEscape(s.route.appId)}${s.route.namespace ? " / " + advEscape(s.route.namespace) : ""}</small>` : ""}</h1><div>${tools}${s.route.appId ? actionButton("back-config", t("back")) : actionButton("home", t("myProjects"))}</div></div>${body}</main>`;
}
function advPanel(title, body, tools = "") {
  return `<section class="panel"><header class="panel-heading"><span>${advEscape(title)}</span><div>${tools}</div></header><div class="panel-body">${body}</div></section>`;
}
function advForm(action, body, label, off = false) {
  return `<form data-form="advanced" data-submit-action="${action}"><fieldset${off ? " disabled" : ""}>${body}<div class="right">${actionButton("submit-form", label, "", off, "primary")}</div></fieldset></form>`;
}
export function advancedAdminMenu(t) {
  return [
    ["system-roles", "systemRoles"],
    ["consumers", "consumers"],
    ["system-info", "systemInfo"],
    ["transfer", "importExport"],
    ["delete", "deleteResource"],
    ["audit", "audit"],
    ["global-search", "globalSearch"],
  ]
    .map(
      ([action, label]) =>
        `<button data-action="${action}">${t(label)}</button>`,
    )
    .join("");
}
function instancesNativeView(s, t) {
  return advPage(
    t("instances"),
    s,
    t,
    advPanel(
      t("instances") +
        " (" +
        (s.instancePage?.totalElements ?? s.instancePage?.total ?? 0) +
        ")",
      advTable(
        ["AppId", t("clusterName"), "IP", t("time")],
        (s.instancePage?.content || []).map(
          (instance) =>
            `<tr><td>${advEscape(instance.appId)}</td><td>${advEscape(instance.clusterName)}</td><td>${advEscape(instance.ip)}</td><td>${advEscape(localTimestamp(instance.dataChangeLastModifiedTime || instance.lastModifiedTime))}</td></tr>`,
        ),
      ),
    ) +
      `<div class="pagination">${actionButton("instances-prev", t("previous"), "", !(s.instancePageNumber > 0))}<span>${(s.instancePageNumber || 0) + 1}</span>${actionButton("instances-next", t("next"), "", (s.instancePage?.content || []).length < 20)}</div>`,
  );
}

function releaseDiffNativeView(s, t) {
  const releases = (s.compareReleases || []).map(
    (release) => release.baseInfo || release,
  );
  const select = (name) =>
    `<label class="form-field"><span>${t(name === "from" ? "source" : "target")}</span><select name="${name}">${releases.map((release, index) => `<option value="${advEscape(release.id)}"${name === "to" && index === 1 ? " selected" : ""}>${advEscape(release.name)} (#${advEscape(release.id)})</option>`).join("")}</select></label>`;
  return advPage(
    t("releaseCompare"),
    s,
    t,
    advPanel(
      t("releaseCompare"),
      advForm(
        "release-compare-submit",
        select("from") + select("to"),
        t("diff"),
      ),
    ) +
      (s.releaseChanges
        ? advPanel(
            t("changes"),
            advTable(
              [t("key"), t("oldValue"), t("newValue")],
              (s.releaseChanges.changes || []).map(
                (change) =>
                  `<tr><td>${advEscape(change.entity?.firstEntity?.key || change.entity?.secondEntity?.key)}</td><td><pre>${advEscape(change.entity?.firstEntity?.value ?? "—")}</pre></td><td><pre>${advEscape(change.entity?.secondEntity?.value ?? "—")}</pre></td></tr>`,
              ),
            ),
          )
        : ""),
  );
}
export function renderAdvanced(s, t) {
  if (s.advancedDenied)
    return advPage(
      t("admin"),
      s,
      t,
      `<p class="form-error" role="alert">${t("rootOnly")}</p>`,
    );
  if (s.route.view === "instances") return instancesNativeView(s, t);
  if (s.route.view === "release-diff") return releaseDiffNativeView(s, t);
  return "";
}
