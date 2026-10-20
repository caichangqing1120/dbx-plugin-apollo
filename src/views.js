import {
  escapeHTML,
  actionButton,
  formField,
  emptyRow,
  attr,
  disabled,
  localTimestamp,
  assetImage,
} from "./ui.js";
import { renderAdvanced } from "./advanced-views.js";
import { referenceAdminView } from "./reference-pages.js";
import { grayPanel, syncPage, historyPage } from "./config-panels.js";
import { appSearchMarkup } from './app-search.js';
function homeView(s, t) {
  const tabs = [
    ["mine", "myProjects", "\ue64a"],
    ["favorites", "favorites", "\ue60b"],
    ["recent", "recent", "\ue663"],
    ["public", "publicNamespaces", "\ue7d1"],
  ];
  const rows =
    s.searchResults ??
    (s.homeTab === "favorites"
      ? s.favorites
      : s.homeTab === "recent"
        ? s.recent
        : s.apps);
  const publicView = s.homeTab === "public";
  const headers = publicView
    ? ["namespace", "appId", "comment", "actions"]
    : ["appId", "appName", "department", "owner", "email"];
  return `<div class="home-layout"><aside class="home-menu" aria-label="${t("project")}">${tabs
    .filter(([tab]) => tab !== "recent" || s.recent.length > 0)
    .map(
      ([tab, key, icon]) =>
        `<button data-action="home-tab" data-tab="${tab}" class="home-tab ${s.homeTab === tab ? "selected" : ""}"><span class="menu-icon" aria-hidden="true">${icon}</span><span>${t(key)}</span></button>`,
    )
    .join(
      "",
    )}</aside><main class="home-main"><div class="home-toolbar">${s.searchResults ? `<span>${t("searchResults")}</span>` : ""}<button type="button" class="btn btn-primary" data-action="new-project"${disabled(!s.canCreate || s.readOnly)}><svg class="create-plus" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2v14M2 9h14" stroke="currentColor" stroke-width="2.6"/></svg>${t("createProject")}</button></div><div class="project-table-wrap"><table class="project-table"><thead><tr>${headers.map((key) => `<th>${t(key)}</th>`).join("")}</tr></thead><tbody>${publicView ? s.publicNamespaces.map((ns) => `<tr><td>${escapeHTML(ns.name)}</td><td>${escapeHTML(ns.appId)}</td><td>${escapeHTML(ns.comment)}</td><td>${actionButton("open-project", t("view"), `data-app="${attr(ns.appId)}"`)}</td></tr>`).join("") || emptyRow(4, t("noData")) : rows.map((app) => `<tr tabindex="0" role="link" data-action="open-project" data-app="${attr(app.appId)}"><td>${escapeHTML(app.appId)}</td><td>${escapeHTML(app.name)}</td><td>${escapeHTML(app.orgName)}${app.orgId ? "(" + escapeHTML(app.orgId) + ")" : ""}</td><td>${escapeHTML(app.ownerName)}</td><td>${escapeHTML(app.ownerEmail)}</td></tr>`).join("") || emptyRow(5, t("noData"))}</tbody></table></div>${s.hasMore && s.homeTab === "mine" && !s.searchResults ? `<div class="load-more">${actionButton("more-apps", t("loadMore"))}</div>` : ""}</main></div>`;
}
function projectSidebar(s, t) {
  return `<aside class="project-sidebar"><section class="panel"><h2 class="panel-heading">${t("envs")}<span class="muted">ⓘ</span></h2><div class="env-list">${s.envTree.map((node) => `<div><button class="env" data-action="select-env" data-env="${attr(node.env)}" data-cluster="${attr(node.clusters?.[0]?.name || "default")}">${escapeHTML(node.env)}</button>${s.route.env === node.env ? node.clusters.map((cluster) => `<button class="cluster ${s.route.env === node.env && s.route.cluster === cluster.name ? "selected" : ""}" data-action="select-env" data-env="${attr(node.env)}" data-cluster="${attr(cluster.name)}">${escapeHTML(cluster.name)}<span class="cluster-tag">${t("cluster")}</span></button>`).join("") : ""}</div>`).join("")}</div></section><section class="panel"><h2 class="panel-heading">${t("projectInfo")}${actionButton("favorite-project", "☆", "", s.readOnly)}${actionButton("project-settings", "✎", "", !s.canManage)}</h2><dl class="project-info">${[
    ["appId", s.app?.appId],
    ["appName", s.app?.name],
    [
      "department",
      (s.app?.orgName || "") + (s.app?.orgId ? "(" + s.app.orgId + ")" : ""),
    ],
    [
      "owner",
      (s.app?.ownerDisplayName ? s.app.ownerDisplayName + " (" : "") +
        (s.app?.ownerName || "") +
        (s.app?.ownerDisplayName ? ")" : ""),
    ],
    ["email", s.app?.ownerEmail],
  ]
    .map(([key, value]) => `<dt>${t(key)}:</dt><dd>${escapeHTML(value)}</dd>`)
    .join(
      "",
    )}</dl></section><nav class="project-links">${actionButton("project-settings", t("projectManage"), "", !s.canManage)}${actionButton("access-keys", t("accessKeys"), "", !s.canManage)}${actionButton("clusters", t("manageCluster"))}${actionButton(s.canCreateCluster ? "new-cluster" : "request-master-permission", t("createCluster"), "", s.readOnly)}${actionButton(s.canCreateNamespace ? "new-namespace" : "request-master-permission", t("createNamespace"), "", s.readOnly)}</nav></aside>`;
}
export function propertiesText(items) {
  return items
    .filter((row) => !row.isDeleted)
    .map(({ item }) =>
      item.key
        ? item.key +
          " = " +
          String(item.value ?? "").replace(/\n/g, "\\n") +
          "\n"
        : (item.comment || "") + "\n",
    )
    .join("");
}
function configCommits(name, s, t, extra) {
  const data = s.commits[name];
  return `<div class="commit-list"><div class="commit-filter"><input data-commit-filter="${attr(name)}" aria-label="${t("key")}" placeholder="${t("key")}" value="${attr(s.commitFilters[name] || "")}">${actionButton("filter-commits", t("filterConfig"), extra)}</div>${
    (data?.rows || [])
      .map((commit) => {
        let changes;
        try {
          changes =
            typeof commit.changeSets === "string"
              ? JSON.parse(commit.changeSets)
              : commit.changeSets;
        } catch {
          changes = null;
        }
        const rows = changes
          ? [
              ...(changes.createItems || []).map((item) => [
                t("added"),
                item.key,
                "",
                item.value,
                item.comment,
              ]),
              ...(changes.updateItems || []).map((item) => [
                t("modified"),
                item.newItem?.key,
                item.oldItem?.value,
                item.newItem?.value,
                item.newItem?.comment,
              ]),
              ...(changes.deleteItems || []).map((item) => [
                t("remove"),
                item.key,
                item.value,
                "",
                item.comment,
              ]),
            ]
          : [];
        return `<article class="commit-entry"><header><strong>${escapeHTML(commit.dataChangeCreatedByDisplayName || commit.dataChangeCreatedBy)}</strong><time>${escapeHTML(localTimestamp(commit.dataChangeCreatedTime))}</time></header>${commit.comment ? `<p>${escapeHTML(commit.comment)}</p>` : ""}<div class="table-scroll"><table class="admin-table"><thead><tr>${["changes", "key", "oldValue", "newValue", "comment"].map((key) => `<th>${t(key)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td><pre>${escapeHTML(value)}</pre></td>`).join("")}</tr>`).join("") || emptyRow(5, t("noData"))}</tbody></table></div>${!changes ? `<pre>${escapeHTML(commit.changeSets)}</pre>` : ""}</article>`;
      })
      .join("") || `<p class="empty">${t("noData")}</p>`
  }${data?.hasMore ? actionButton("more-commits", t("loadMore"), extra) : ""}</div>`;
}
function iconAction(action, label, extra, off, shape) {
  return `<button type="button" class="btn btn-link config-icon" data-action="${action}" ${extra}${disabled(off)} aria-label="${attr(label)}" title="${attr(label)}">${assetImage(action === 'edit-item' ? 'edit.png' : 'cancel.png', '', 'config-action-image') || `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${shape}" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`}</button>`;
}
const itemPreview = value => {
  const text = String(value ?? '');
  return escapeHTML(text.slice(0, 250) + (text.length > 250 ? '...' : ''));
};
function namespacePanel(ns, index, s, t) {
  const name = ns.baseInfo.namespaceName;
  const extra = `data-ns="${attr(name)}"`;
  const permission = s.permissions[name] || {};
  let filtered = (ns.items || []).filter((row) =>
    String(row.item.key || "")
      .toLowerCase()
      .includes((s.filters[name] || "").toLowerCase()),
  );
  const sorting = s.itemSort?.[name];
  if (sorting)
    filtered = [...filtered].sort(
      (a, b) =>
        String(a.item[sorting.key] ?? "").localeCompare(
          String(b.item[sorting.key] ?? ""),
        ) * (sorting.descending ? -1 : 1),
    );
  if (s.collapsed?.[name])
    return `<section class="panel namespace-panel collapsed"><strong>${escapeHTML(name)}</strong>${ns.lockOwner ? `<span class="badge namespace-lock-owner">${t("Component.Namespace.Master.Items.ChangedUser")}:${escapeHTML(ns.lockOwner)}</span>` : ""}${actionButton("fold-namespace", t("expandCollapse"), extra, false, "link")}</section>`;
  const mode =
    s.modes[name] === "instances"
      ? "instances"
      : s.modes[name] === "commits"
        ? "commits"
        : ns.format !== "properties" || s.modes[name] === "text"
          ? "text"
          : "table";
  const canModify =
    permission.modify && !s.readOnly && !ns.isConfigHidden && !s.busy;
  const canRelease =
    permission.release &&
    !s.readOnly &&
    !ns.isConfigHidden &&
    !s.busy &&
    !s.textEditing?.[name];
  const text =
    s.drafts[name] ??
    (ns.format === "properties"
      ? propertiesText(ns.items || [])
      : ns.items?.[0]?.item?.value || "");
  const toolbar = (action, label, off = false, style = "default") => {
    const icon = {
      publish: "release.png",
      "rollback-latest": "rollback.png",
      history: "release-history.png",
      permissions: "assign.png",
      gray: "test.png",
      "import-namespace": "import.png",
      "export-namespace": "export.png",
      sync: "sync.png",
      diff: "diff.png",
    }[action];
    const html = actionButton(action, t(label), extra, off, style);
    return icon ? html.replace(">", ">" + assetImage(icon)) : html;
  };
  const tool = (action, label, icon) =>
    `<button type="button" class="btn btn-text-icon" data-action="${action}" ${extra} aria-label="${attr(t(label))}" title="${attr(t(label))}"${disabled(["edit-text", "save-text", "syntax-text", "format-text"].includes(action) && !canModify)}>${assetImage(icon) || escapeHTML(t(label))}</button>`;
  const textTools = `<div class="text-tools">${s.textEditing?.[name] ? `${["yaml", "yml"].includes(ns.format) ? tool("syntax-text", "syntaxCheck", "test.png") : ""}${ns.format === "json" ? tool("format-text", "formatConfig", "edit.png") : ""}${tool("cancel-text", "cancel", "delete.png")}${tool("save-text", "save", "release.png")}` : tool("copy-text", "copy", "export.png") + tool("edit-text", "edit", "edit.png")}${tool("fullscreen-text", "fullscreen", "operate.png")}</div>`;
  const more = permission.modify || permission.release || s.canManage ? `<details class="namespace-more"><summary aria-label="${t('more')}">⚙ ⌄</summary><div class="dropdown-menu">${toolbar('export-namespace','Component.Namespace.Master.Items.ExportNamespace',ns.isConfigHidden,'link')}${toolbar('import-namespace','Component.Namespace.Master.Items.ImportNamespace',!canModify,'link')}${toolbar('namespace-delete','Component.Namespace.Master.Items.DeleteNamespace',s.readOnly || !s.canManage,'link')}</div></details>` : '';
  return `<section class="panel namespace-panel ${s.textFullscreen?.[name] ? "text-fullscreen" : ""}" data-namespace="${attr(name)}">${actionButton("fold-namespace", t("expandCollapse"), extra, false, "namespace-fold")}<div class="namespace-labels"><span class="badge">${t(ns.isPublic ? "public" : "private")}</span><span class="namespace-format">${escapeHTML(ns.format)}</span></div>${s.branches?.[name] ? `<div class="namespace-version-tabs">${toolbar("table-mode", "masterVersion", false, "active")}${toolbar("gray", "grayVersion")}</div>` : ""}<header class="namespace-heading"><div class="namespace-title"><strong>${escapeHTML(name)}</strong>${ns.lockOwner ? `<span class="badge namespace-lock-owner">${t("Component.Namespace.Master.Items.ChangedUser")}:${escapeHTML(ns.lockOwner)}</span>` : ""}${ns.itemModifiedCnt ? `<span class="badge pending">${t("hasChanges")} ${ns.itemModifiedCnt}</span>` : ""}</div><div class="namespace-actions">${permission.modify || permission.release ? toolbar("publish", "publish", (!canRelease && !canModify) || !!s.textEditing?.[name], "success") : ""}${permission.release ? toolbar("rollback-latest", "rollback", !canRelease) : ""}${toolbar("history", "history")}${s.canManage ? toolbar("permissions", "authorize") : ""}${!permission.modify && !permission.release ? toolbar("request-modify-permission", "requestPermissions") : ""}${!s.branches?.[name] && permission.modify ? toolbar("gray", "gray") : ""}${more}</div></header><div class="config-toolbar"><div class="view-tabs">${[
    ["table-mode", "table", "table"],
    ["text-mode", "text", "text"],
    ["commits-mode", "commitHistory", "commits"],
    ["instances", "instanceList", "instances"],
  ]
    .map(([action, label, tab]) =>
      toolbar(
        action,
        label,
        ns.isConfigHidden,
        mode === tab ? "active" : "default",
      ),
    )
    .join(
      "",
    )}</div><div class="config-toolbar-right">${mode === "text" ? textTools : `${toolbar("filter-config", "filterConfig")}${permission.modify ? toolbar("sync", "sync",!canModify) + toolbar("revoke-items", "revokeConfig", !canModify) : ""}${toolbar("diff", "diff")}${permission.modify ? toolbar("new-item", "addItem", !canModify, "primary") : ""}`}</div></div>${mode === "table" && (s.filterOpen[name] || s.filters[name]) ? `<div class="config-filter"><input aria-label="${t("filter")} ${attr(name)}" data-filter="${attr(name)}" placeholder="${t("filter")}" value="${attr(s.filters[name] || "")}">${toolbar("reset-items", "reset")}</div>` : ""}${
    ns.isConfigHidden
      ? `<div class="empty">${t("hidden")}</div>`
      : mode === "instances"
        ? renderNamespaceInstances(name, s, t, extra)
        : mode === "commits"
          ? configCommits(name, s, t, extra)
          : mode === "text"
            ? `<div class="text-editor"><div class="line-numbers" aria-hidden="true">${text
                .split("\n")
                .map((_, i) => i + 1)
                .join(
                  "\n",
                )}</div><textarea spellcheck="false" aria-label="${t("text")} ${attr(name)}" data-text="${attr(name)}"${canModify && s.textEditing?.[name] ? "" : " readonly"}>${escapeHTML(text)}</textarea></div>`
            : `<div class="table-scroll"><table class="config-table"><thead><tr>${["publishStatus", "key", "type", "value", "comment", "modifiedBy", "modifiedTime", "actions"].map((k) => `<th>${["key", "modifiedBy", "modifiedTime", "publishStatus"].includes(k) ? actionButton("sort-items", t(k), extra + ` data-sort="${k === "modifiedBy" ? "dataChangeLastModifiedBy" : k === "key" ? "key" : "dataChangeLastModifiedTime"}"`, false, "sort-heading") : t(k)}</th>`).join("")}</tr></thead><tbody>${
                filtered
                  .map((row) => {
                    const i = row.item,
                      changed =
                        row.isDeleted || row.isModified || row.isNewlyAdded;
                    const marker = row.isDeleted ? 'Deleted' : row.isNewlyAdded ? 'NewAdded' : row.isModified ? 'Modified' : '';
                    return `<tr class="${row.isDeleted ? "deleted-row" : row.isModified ? "modified-row" : row.isNewlyAdded ? "new-row" : ""}${!i.value ? ' empty-value-row' : ''}"><td><span class="status-label ${changed ? "status-pending" : ""}">${t(changed ? "pendingShort" : "published")}</span></td><td class="key-cell">${actionButton("show-config-value", String(i.key || "").slice(0,250) + (String(i.key || "").length > 250 ? "..." : ""), extra + ` data-item="${attr(i.id)}" data-field="key"`, false, "value-inspect")}${(s.branches?.[name]?.items || []).some(branchRow=>branchRow.item.key===i.key && !branchRow.isDeleted) ? actionButton('gray',t('Component.Namespace.Master.Items.Body.Grayscale'),extra+` data-gray-item="${attr(i.key)}"`,false,'gray-item-link') : ''}${marker ? `<span class="config-change-badge change-${marker}">${t('Component.Namespace.Master.Items.Body.' + marker)}</span>` : ''}</td><td>${["String", "Number", "Boolean", "JSON"][i.type] || ""}</td><td class="value-cell"><button type="button" class="value-inspect" data-action="show-config-value" ${extra} data-item="${attr(i.id)}" data-field="value">${itemPreview(i.value)}</button></td><td title="${attr(i.comment || '')}">${itemPreview(i.comment)}</td><td>${escapeHTML(i.dataChangeLastModifiedByDisplayName || "")}(${escapeHTML(i.dataChangeLastModifiedBy)})</td><td class="date-cell">${escapeHTML(localTimestamp(i.dataChangeLastModifiedTime))}</td><td class="row-actions">${permission.modify && !row.isDeleted ? iconAction("edit-item", t("edit"), extra + ` data-item="${attr(i.id)}"`, !canModify || row.isDeleted, "M14 5H3v16h16V10M10 14l1-5L19 1l4 4-8 8z") + iconAction("delete-item", t("remove"), extra + ` data-item="${attr(i.id)}"`, !canModify || row.isDeleted, "M4 4l16 16M20 4L4 20") : ""}</td></tr>`;
                  })
                  .join("")
              }</tbody></table></div>`
  }</section>`;
}
function projectView(s, t) {
  const clusters =
    s.envTree.find((node) => node.env === s.route.env)?.clusters || [];
  return `<div class="project-layout">${projectSidebar(s, t)}<main class="config-main">${clusters.length > 1 && !s.noticeHidden ? `<div class="cluster-notice"><span>${t("clusterNotice")}</span>${actionButton("hide-notice", t("hideNotice"))}</div>` : ""}${unpublishedBanner(s, t)}${s.namespaces.map((ns, i) => namespacePanel(ns, i, s, t)).join("") || `<section class="panel empty">${t("noData")}</section>`}</main></div>`;
}
function unpublishedBanner(s, t) {
  const groups = s.publishInfo
    ? Object.entries(s.publishInfo).flatMap(([env, clusters]) =>
        Object.entries(clusters)
          .filter(([, changed]) => changed)
          .map(
            ([cluster]) =>
              env + (Object.keys(clusters).length > 1 ? ", " + cluster : ""),
          ),
      )
    : s.namespaces.some((ns) => ns.itemModifiedCnt > 0)
      ? [s.route.env]
      : [];
  return groups.length
    ? `<div class="cluster-notice unpublished-banner"><div><strong>${t("notice")}:</strong> ${t("unpublishedEnvironments")}<p><mark>${escapeHTML(groups.map((group) => "[" + group + "]").join(", "))}</mark></p></div></div>`
    : "";
}
function projectGrayView(s, t) {
  return `<div class="project-layout">${projectSidebar(s, t)}<main class="config-main">${unpublishedBanner(s, t)}${grayPanel(s, t)}</main></div>`;
}
function renderNamespaceInstances(name, s, t, extra) {
  const page = s.instancePanels?.[name];
  return `<div class="namespace-instances"><p>${t("instances")}</p><table class="reference-table"><thead><tr><th>AppId</th><th>Cluster Name</th><th>IP</th></tr></thead><tbody>${(page?.content || []).map((instance) => `<tr><td>${escapeHTML(instance.appId)}</td><td>${escapeHTML(instance.clusterName)}</td><td>${escapeHTML(instance.ip)}</td></tr>`).join("") || emptyRow(3, t("noData"))}</tbody></table>${actionButton("instances", t("refresh"), extra)}</div>`;
}
const documentViews = new Set(['create-project','project','app-roles','access-keys','clusters','cluster-create','cluster-roles','namespace-create','permissions','permissions-env','history','sync','diff','users','server-config','audit','audit-trace','global-search','instances','release-diff']);
function navigationTools(s, t) {
  const entries = s.isRoot ? [
    ['users', 'Common.Nav.UserManage'], ['system-roles', 'Common.Nav.SystemRoleManage'],
    ['consumers', 'Common.Nav.OpenMange'], ['server-config', 'Common.Nav.SystemConfig'],
    ['delete', 'Common.Nav.DeleteApp-Cluster-Namespace'], ['system-info', 'Common.Nav.SystemInfo'],
    ['transfer', 'Common.Nav.ConfigExport'], ['audit', 'ApolloAuditLog.Title'],
    ['global-search', 'Global.Title'],
  ] : [['users', 'Common.Nav.UserManage'], ['transfer', 'Common.Nav.ConfigExport']];
  return `<details class="nav-dropdown" data-navigation-tools><summary><svg class="nav-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 0h3l.5 2 1.3.7 2-.6 1.5 2.6-1.5 1.4v1.8l1.5 1.4-1.5 2.6-2-.6-1.3.7-.5 2h-3l-.5-2-1.3-.7-2 .6L1.2 11l1.5-1.4V7.8L1.2 6.4l1.5-2.6 2 .6L6 3.7z" fill="currentColor"/><circle cx="8" cy="7.8" r="2.2" fill="white"/></svg> ${t(s.isRoot ? 'admin' : 'Common.Nav.NonAdminTools')} <span class="nav-caret"></span></summary><div class="dropdown-menu">${entries.map(([action, label]) => actionButton(action, t(label))).join('')}</div></details>`;
}
export function renderPortal(s, t, logo = "") {
  const header = `<header class="apollo-nav"><button class="apollo-brand" data-action="home" aria-label="Apollo">${logo ? `<img src="${attr(logo)}" alt="Apollo">` : "<b>APOLLO</b>"}</button><div class="nav-actions">${appSearchMarkup(t)}<button class="nav-button" data-action="help"><svg class="nav-help-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M5.5 5.5c.2-3 5.1-3 5.1 0 0 1.6-2.5 1.8-2.5 3.7" fill="none" stroke="white" stroke-width="1.4"/><circle cx="8.1" cy="12" r=".8" fill="white"/></svg> ${t("help")}</button><details class="nav-dropdown nav-language-menu"><summary role="button" aria-label="Language">${assetImage("language.png", "", "nav-language-icon")} &nbsp;Language<span class="nav-caret"></span></summary><div class="dropdown-menu"><button data-action="language" data-locale="zh-CN">简体中文</button><button data-action="language" data-locale="en">English</button></div></details>${navigationTools(s, t)}<details class="nav-dropdown" data-navigation-user><summary><svg class="nav-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="4" r="3" fill="currentColor"/><path d="M1 16v-3c0-5 14-5 14 0v3z" fill="currentColor"/></svg> ${escapeHTML(s.user?.name || "")}(${escapeHTML(s.user?.userId || "")}) <span class="nav-caret"></span></summary><div class="dropdown-menu"><button data-action="logout">${t("logout")}</button></div></details></div></header>`;
  const body = s.loading
    ? `<main class="loading" role="status"><span class="spinner"></span>${t("loading")}</main>`
    : (referenceAdminView(s, t) ??
      (s.route.view === "home"
        ? homeView(s, t)
        : s.route.view === "config"
          ? projectView(s, t)
          : s.route.view === "gray"
            ? projectGrayView(s, t)
            : ["sync", "diff"].includes(s.route.view)
              ? syncPage(s, t)
              : s.route.view === "history"
                ? historyPage(s, t)
                : renderAdvanced(s, t)));
  return (
    header +
    `<div class="portal-content ${documentViews.has(s.route.view) ? "portal-document-content" : "portal-fluid-content"} ${s.route.view === "home" ? "portal-home-content" : ["config", "gray"].includes(s.route.view) ? "portal-config-content" : ""}">${body}</div><footer class="apollo-footer"><hr>Copyright 2024 Apollo Authors ${actionButton("github", "GitHub", "", false, "link")}</footer>` +
    (s.error
      ? `<div class="notice error" role="alert"><span>${escapeHTML(s.error)}</span>${s.expired ? actionButton("reconnect", t("reconnect")) : actionButton("refresh", t("retry"))}${Object.keys(s.drafts).length ? actionButton("discard-drafts", t("discard")) : ""}${actionButton("dismiss", "×")}</div>`
      : "") +
    (s.success
      ? `<div class="notice success" role="status">✓ ${t("success")}${actionButton("dismiss", "×")}</div>`
      : "") +
    (s.dialog ? dialogView(s.dialog, t, s.busy) : "")
  );
}
function dialogView(dialog, t, busy) {
  const close = actionButton('cancel-dialog', dialog.confirmLabel || t('confirm'), '', busy, dialog.danger ? 'danger' : 'primary');
  const footer = dialog.publishDenied ? `<footer>${dialog.emergencyAllowed ? `<button type="button" data-action="submit-form" class="btn btn-danger"${disabled(busy)}>${t('Component.PublishDeny.EmergencyPublish')}</button>` : ''} ${actionButton('cancel-dialog',t('Component.PublishDeny.Close'),'',busy,'primary')}</footer>` : dialog.readOnly || dialog.inlineSubmit ? '' : `<footer>${dialog.ackOnly ? close : `${actionButton("cancel-dialog", t("cancel"), "", busy)} <button type="button" data-action="submit-form" class="btn btn-${dialog.danger ? "danger" : "primary"}"${disabled(busy)}>${busy ? t("loading") : dialog.confirmLabel || t("save")}</button>`}</footer>`;
  return `<div class="modal-backdrop"><section class="modal-box ${dialog.wide ? "modal-wide" : ""} ${dialog.sourceNotice ? 'source-notice' : ''}"${dialog.sourceId ? ` data-dialog-source="${attr(dialog.sourceId)}"` : ''} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header><h2 id="dialog-title">${escapeHTML(dialog.title)}${dialog.subtitle ? ` <small>${escapeHTML(dialog.subtitle)}</small>` : ""}</h2>${actionButton("cancel-dialog", "×", "", busy)}</header><form data-form="dialog">${dialog.textViewer ? dialog.fields : `<div class="modal-body">${dialog.fields}${dialog.error ? `<p class="form-error" role="alert">${escapeHTML(dialog.error)}</p>` : ""}</div>`}${dialog.afterBody || ""}${footer}</form></section></div>`;
}
