import {
  escapeHTML as e,
  attr,
  actionButton as button,
  emptyRow,
  localTimestamp,
} from "./ui.js";
import { releaseValues, comparisonTable } from "./editor.js";
import { historyRecords, selectedHistory } from "./history.js";
const btn = (action, label, extra = "", off = false, style = "default") =>
  button(action, label, extra, off, style);
function grid(labels, rows, extra = "") {
  return `<div class="table-scroll"><table class="reference-table" ${extra}><thead><tr>${labels.map((label) => `<th>${label}</th>`).join("")}</tr></thead><tbody>${rows.join("") || emptyRow(labels.length, "—")}</tbody></table></div>`;
}
function commitRows(commits, t) {
  return (
    (commits || [])
      .map((commit) => {
        let changes;
        try {
          changes =
            typeof commit.changeSets === "string"
              ? JSON.parse(commit.changeSets)
              : commit.changeSets;
        } catch {
          changes = {};
        }
        const rows = [
          ...(changes?.createItems || []).map((item) => [
            t("added"),
            item.key,
            "",
            item.value,
          ]),
          ...(changes?.updateItems || []).map((item) => [
            t("modified"),
            item.newItem?.key,
            item.oldItem?.value,
            item.newItem?.value,
          ]),
          ...(changes?.deleteItems || []).map((item) => [
            t("remove"),
            item.key,
            item.value,
            "",
          ]),
        ];
        return `<article class="commit-entry"><header><strong>${e(commit.dataChangeCreatedBy)}</strong><time>${e(localTimestamp(commit.dataChangeCreatedTime))}</time></header>${grid(
          ["Type", "Key", "Old Value", "New Value"],
          rows.map(
            (row) =>
              `<tr>${row.map((value) => `<td><pre>${e(value)}</pre></td>`).join("")}</tr>`,
          ),
        )}</article>`;
      })
      .join("") || `<p class="empty">${t("noData")}</p>`
  );
}
export function grayPanel(s, t) {
  const ns = s.grayBranch,
    scope = s.route.namespace || "application",
    extra = `data-ns="${attr(scope)}"`;
  if (!ns)
    return `<section class="panel namespace-panel"><h3>${e(scope)}</h3><p>${t("noGray")}</p>${btn("create-gray", t("createGray"), "", !s.canModify || s.readOnly, "primary")}</section>`;
  const tab = s.grayTab || "config",
    edit = s.canModify && !s.readOnly && !ns.isConfigHidden,
    release = s.canRelease && !s.readOnly && !ns.isConfigHidden,
    master = releaseValues(s.grayMasterRelease);
  const body = ns.isConfigHidden
    ? `<p class="empty">${t("hidden")}</p>`
    : tab === "config"
      ? grid(
          [
            t("publishStatus"),
            "Key",
            t("type"),
            t("masterValue"),
            t("grayValue"),
            t("comment"),
            t("modifiedBy"),
            t("modifiedTime"),
            t("actions"),
          ],
          (s.grayRows || ns.items || []).map((row) => {
            const item = row.item;
            return `<tr><td><span class="status-label ${row.isModified || row.isNewlyAdded ? "status-pending" : ""}">${t(row.isModified || row.isNewlyAdded ? "pendingShort" : "published")}</span></td><td>${e(item.key)}</td><td>${["String", "Number", "Boolean", "JSON"][item.type] || ""}</td><td><pre>${e(row.masterReleaseValue ?? master[item.key] ?? "")}</pre></td><td><pre>${e(item.value)}</pre></td><td>${e(item.comment)}</td><td>${e(item.dataChangeLastModifiedBy)}</td><td>${e(localTimestamp(item.dataChangeLastModifiedTime))}</td><td>${btn("gray-edit-item", t("edit"), `data-item="${attr(item.id)}"`, !edit || row.isDeleted, "link")}${btn("gray-delete-item", t("remove"), `data-item="${attr(item.id)}" data-key="${attr(item.key)}"`, !edit || row.isDeleted, "link danger")}</td></tr>`;
          }),
          "data-gray-config",
        )
      : tab === "rules"
        ? grid(
            [t("grayAppId"), t("grayRuleDetail"), t("actions")],
            (s.grayRules?.ruleItems || []).map(
              (rule, index) =>
                `<tr><td>${e(rule.clientAppId)}</td><td>${e(rule.clientIpList.join(", "))}<br>${e((rule.clientLabelList || []).join(", "))}</td><td>${btn("gray-edit-rule", t("edit"), `data-index="${index}"`, !edit, "link")}${btn("gray-remove-rule", t("remove"), `data-index="${index}"`, !edit, "link danger")}</td></tr>`,
            ),
          )
        : tab === "instances"
          ? grid(
              ["AppId", t("clusterName"), "IP", t("time")],
              (s.grayInstancePage?.content || []).map(
                (instance) =>
                  `<tr><td>${e(instance.appId)}</td><td>${e(instance.clusterName)}</td><td>${e(instance.ip)}</td><td>${e(localTimestamp(instance.dataChangeLastModifiedTime))}</td></tr>`,
              ),
            )
          : commitRows(s.grayHistory, t);
  const inherited = tab === 'config' && !ns.isConfigHidden && s.grayMasterRows?.length
    ? `<section class="gray-master-panel" data-gray-master><header>${t('Component.Namespace.MasterBranch.Body.Title')}</header>${grid([t('publishStatus'),'Key',t('type'),'Value',t('comment'),t('modifiedBy'),t('modifiedTime'),t('actions')],s.grayMasterRows.map(row=>{
      const item=row.item;return `<tr><td><span class="status-label ${row.isModified || row.isDeleted ? 'status-pending' : ''}">${t(row.isModified || row.isDeleted ? 'pendingShort' : 'published')}</span></td><td>${e(item.key)}</td><td>${['String','Number','Boolean','JSON'][item.type] || ''}</td><td><pre>${e(item.value)}</pre></td><td>${e(item.comment)}</td><td>${e(item.dataChangeLastModifiedByDisplayName || '')}(${e(item.dataChangeLastModifiedBy)})</td><td>${e(localTimestamp(item.dataChangeLastModifiedTime))}</td><td>${!row.isDeleted && edit ? btn('gray-edit-item',t('edit'),`data-item="${attr(item.id)}" data-inherited-key="${attr(item.key)}"`,false,'link') : ''}</td></tr>`;
    }))}</section>` : '';
  return `<section class="panel namespace-panel"><div class="namespace-labels"><span class="badge">${t(ns.isPublic ? "public" : "private")}</span><span class="namespace-format">${e(ns.format)}</span></div><div class="namespace-version-tabs">${btn("back-config", t("masterVersion"))}${btn("gray", t("grayVersion"), extra, false, "active")}</div><header class="namespace-heading"><strong class="namespace-title">${e(scope)}${ns.lockOwner ? `<span class="badge namespace-lock-owner">${t("Component.Namespace.Branch.ChangeUser")}:${e(ns.lockOwner)}</span>` : ""}</strong><div class="namespace-actions">${btn("gray-publish", t("grayPublish"), "", !release, "success")}${btn("gray-merge", t("fullPublish"), "", !edit || !release, "primary")}${btn("delete-gray", t("abandonGray"), "", !edit && !release, "warning")}</div></header><div class="config-toolbar" data-gray-tabs><nav class="view-tabs">${[
    ["config", "config"],
    ["rules", "rules"],
    ["instances", "grayInstances"],
    ["history", "commitHistory"],
  ]
    .map(([name, label]) =>
      btn(
        "gray-tab",
        t(label),
        `data-tab="${name}"`,
        ns.isConfigHidden,
        name === tab ? "active" : "default",
      ),
    )
    .join(
      "",
    )}</nav></div>${tab === "config" ? `<div class="gray-sub-toolbar"><span>${t("grayConfiguration")}</span>${btn("gray-new-item", t("addGrayItem"), "", !edit, "primary")}</div>` : ""}${body}${inherited}${tab === "rules" ? `<div class="gray-sub-toolbar">${btn("gray-add-rule", t("addRule"), "", !edit, "primary")}</div>` : ""}</section>`;
}
function selectionTargets(s, t) {
  return grid([`<input type="checkbox" data-action="toggle-sync-targets" aria-label="${t('selectAll')}"${s.syncAllTargets ? ' checked' : ''}>`, t("environment"), t("cluster")], s.syncChoices.map((target, index) => `<tr><td><input type="checkbox" data-sync-target="${index}" data-env="${attr(target.env)}" aria-label="${attr(target.env + "/" + target.clusterName)}"${s.syncTargets[index] ? " checked" : ""}></td><td>${e(target.env)}</td><td>${e(target.clusterName)}</td></tr>`));
}
export function syncPage(s, t) {
  const compare = s.route.view === "diff",
    step = s.syncStep || 1,
    choices = selectionTargets(s, t);
  let items = (s.syncSource.items || []).filter(
    (row) => row.item.key && !row.isDeleted,
  );
  const dates = s.syncFilterDates || {};
  if (dates.start)
    items = items.filter(
      (row) =>
        new Date(row.item.dataChangeLastModifiedTime) >= new Date(dates.start),
    );
  if (dates.end)
    items = items.filter(
      (row) =>
        new Date(row.item.dataChangeLastModifiedTime) <
        new Date(new Date(dates.end).getTime() + 86400000),
    );
  if (s.syncSort)
    items = [...items].sort(
      (a, b) =>
        String(a.item[s.syncSort] ?? "").localeCompare(
          String(b.item[s.syncSort] ?? ""),
        ) * (s.syncDescending ? -1 : 1),
    );
  const itemTable = grid(
    [
      `<input type="checkbox" data-action="toggle-sync-items" aria-label="${t('selectAll')}"${items.length && items.every(row => s.syncKeys[row.item.key]) ? ' checked' : ''}>`,
      btn("sort-sync", "Key", 'data-sync-sort="key"'),
      "Value",
      btn("sort-sync", "Create Time", 'data-sync-sort="dataChangeCreatedTime"'),
      btn(
        "sort-sync",
        "Update Time",
        'data-sync-sort="dataChangeLastModifiedTime"',
      ),
    ],
    items.map(
      ({ item }) =>
        `<tr><td><input type="checkbox" data-sync-item="${attr(item.key)}" aria-label="${attr(item.key)}"${s.syncKeys[item.key] ? " checked" : ""}></td><td>${e(item.key)}</td><td><pre>${e(item.value)}</pre></td><td>${e(localTimestamp(item.dataChangeCreatedTime))}</td><td>${e(localTimestamp(item.dataChangeLastModifiedTime))}</td></tr>`,
    ),
  );
  const selectBody = compare
    ? `<div class="reference-selection-row"><label>${t("compareClusters")}</label>${choices}</div><div class="reference-selection-row"><label>${t("comparisonMode")}</label><label><input type="radio" name="compareMode" value="table"${s.compareMode !== "text" ? " checked" : ""}> ${t("table")}</label><label><input type="radio" name="compareMode" value="text"${s.compareMode === "text" ? " checked" : ""}> ${t("text")}</label></div>`
    : `<div class="reference-selection-row"><label>${t("syncNamespace")}</label><span>${e(s.route.namespace)}</span></div><div class="reference-selection-row"><label>${t("syncTargets")}</label>${choices}</div><div class="reference-selection-row"><label>${t("sourceItems")}</label><div class="sync-items"><div class="reference-toolbar"><span>${t("filterByTime")}</span><input type="date" data-sync-date="start" aria-label="${t("startTime")}" value="${attr(s.syncDate?.start || "")}"><input type="date" data-sync-date="end" aria-label="${t("endTime")}" value="${attr(s.syncDate?.end || "")}">${btn("filter-sync", t("filterConfig"))}${btn("reset-sync", t("reset"))}</div>${itemTable}</div></div>`;
  let results = "";
  if (!compare)
    results = (s.syncPreview || [])
      .map(
        (result) =>
          `<section class="reference-section"><h4>${e(result.namespace.env)} / ${e(result.namespace.clusterName)}</h4>${
            result.extInfo
              ? `<p role="alert">${e(result.extInfo)}</p>`
              : grid(
                  [t("changes"), "Key", t("oldValue"), t("newValue")],
                  ["createItems", "updateItems", "deleteItems"].flatMap(
                    (kind) =>
                      (result.diffs?.[kind] || []).map(
                        (item) =>
                          `<tr><td>${t(kind === "createItems" ? "added" : kind === "updateItems" ? "modified" : "remove")}</td><td>${e(item.key || item.newItem?.key || item.oldItem?.key)}</td><td><pre>${e(item.oldItem?.value || "")}</pre></td><td><pre>${e(item.newItem?.value ?? item.value ?? "")}</pre></td></tr>`,
                      ),
                  ),
                )
          }</section>`,
      )
      .join("");
  else if (s.diffMatrix) {
    const columns = s.diffMatrix;
    let keys = [
      ...new Set(
        columns.flatMap((column) =>
          (column.items || [])
            .filter((row) => row.item.key && !row.isDeleted)
            .map((row) => row.item.key),
        ),
      ),
    ].sort();
    if (s.compareKey)
      keys = keys.filter((key) =>
        key.toLowerCase().includes(s.compareKey.toLowerCase()),
      );
    const value = (column, key) => {
      if (column.hidden) return t("hidden");
      const item = column.items.find(
        (row) => row.item.key === key && !row.isDeleted,
      )?.item;
      return item
        ? String(item.value) +
            (s.compareComments ? "\n# " + (item.comment || "") : "")
        : undefined;
    };
    if (s.compareOnlyDifferences !== false)
      keys = keys.filter(
        (key) => new Set(columns.map((column) => value(column, key))).size > 1,
      );
    results =
      `<div class="reference-toolbar"><label><input type="checkbox" data-compare-option="compareOnlyDifferences"${s.compareOnlyDifferences !== false ? " checked" : ""}> ${t("onlyDifferences")}</label><label><input type="checkbox" data-compare-option="compareComments"${s.compareComments ? " checked" : ""}> ${t("includeComments")}</label><input data-compare-key value="${attr(s.compareKey || "")}" placeholder="${t("filterKey")}"></div>` +
      (s.compareMode === "text"
        ? `<div class="text-comparison">${columns.map((column) => `<section><h4>${e(column.namespace.env + "/" + column.namespace.clusterName)}</h4><pre>${keys.map((key) => e(key + " = " + (value(column, key) ?? "—"))).join("\n")}</pre></section>`).join("")}</div>`
        : grid(
            [
              "Key",
              ...columns.map((column) =>
                e(column.namespace.env + "/" + column.namespace.clusterName),
              ),
            ],
            keys.map(
              (key) =>
                `<tr><td>${e(key)}</td>${columns.map((column) => `<td><pre>${e(value(column, key) ?? "—")}</pre></td>`).join("")}</tr>`,
            ),
          ));
  }
  return `<main class="reference-page sync-page"><section class="reference-surface"><header class="reference-heading"><span>${t(compare ? "diff" : "sync")} <small>（${t(step === 1 ? "stepSelect" : "stepReview")}）</small></span><div>${step === 1 ? btn("sync-preview", t("next"), " ", false, "primary") : btn("sync-back", t("previous"), " ", false, "primary")}${!compare && step === 2 ? btn("sync-apply", t("syncApply"), " ", !s.syncPreview || s.readOnly, "primary") : ""}${btn("back-config", t("returnHome"), " ", false, "info")}</div></header>${step === 1 ? `<div class="reference-hint"><strong>Tips:</strong><ul>${(compare ? ['Config.Diff.Tips'] : ['Config.Sync.Tips1','Config.Sync.Tips2']).map(key=>`<li>${t(key)}</li>`).join('')}</ul></div>${selectBody}` : results}</section></main>`;
}
export function historyPage(s, t) {
  const filtered = historyRecords(s),
    selected = selectedHistory(s),
    release = selected
      ? s.releases
          .map((item) => item.baseInfo || item)
          .find((item) => item.id === selected.releaseId)
      : null,
    values =
      Array.isArray(selected?.configuration) && selected.configuration.length
        ? Object.fromEntries(
            selected.configuration.map((pair) => [
              pair.firstEntity,
              pair.secondEntity,
            ]),
          )
        : releaseValues(release);
  let body = "";
  if (selected) {
    const comparison = s.historyDiffs?.[selected.id];
    body = `<header class="history-detail-heading"><div><span>${e(selected.releaseTitle || release?.name)}</span>${selected.isReleaseAbandoned ? `<span class="status-label">${t('Config.History.Abandoned')}</span>` : ''}<time>${e(selected.releaseTimeFormatted || localTimestamp(selected.releaseTime))}</time></div><div class="history-detail-tools"><small>${e(selected.releaseComment || release?.comment)}</small><div>${btn("rollback-to", t("rollbackTo"), `data-release="${attr(selected.releaseId)}"`, !s.canRelease || s.readOnly || selected.isReleaseAbandoned || release?.isAbandoned || ![0,1,4].includes(selected.operation))}${btn("history-display", t("Config.History.ChangedItem"), 'data-display="changes"', false, s.historyDisplay !== 'all' ? 'active' : 'default')}${btn("history-display", t("allConfigs"), 'data-display="all"', false, s.historyDisplay === 'all' ? 'active' : 'default')}</div></div></header><div class="history-detail-content"><h4>${t(s.historyDisplay === 'all' ? 'allConfigs' : 'Config.History.ChangedItem')}</h4>`;
    if (s.historyDisplay === "all")
      body += grid(
        ["Key", "Value"],
        Object.entries(values).map(
          ([key, value]) =>
            `<tr><td>${e(key)}</td><td><pre>${e(value)}</pre></td></tr>`,
        ),
      );
    else if (comparison?.error) body += `<p role="alert" class="error">${e(comparison.error)}</p>`;
    else if (!comparison || comparison.loading) body += `<p role="status">${t("loading")}</p>`;
    else body += comparisonTable(comparison, t);
    body += '</div>';
  }
  const operationClass = operation => [0,5].includes(operation) ? 'normal' : [1,6].includes(operation) ? 'rollback' : 'gray';
  const records = filtered.map(record => `<button type="button" data-action="select-history" data-id="${attr(record.id)}" class="history-record history-operation-${operationClass(record.operation)}${selected?.id === record.id ? ' selected' : ''}"><strong>${e(record.operatorDisplayName || record.operator)}(${e(record.operator)})</strong><span>${t('Config.History.OperationType' + record.operation)}</span><time>${e(record.releaseTimeFormatted || localTimestamp(record.releaseTime))}</time></button>`).join('');
  return `<main class="release-history-page"><header class="history-page-heading"><div class="history-legends"><span class="history-operation-normal">${t("masterPublish")}</span><span class="history-operation-rollback">${t("masterRollback")}</span><span class="history-operation-gray">${t("grayOperations")}</span></div><div class="history-page-title"><h4>${t("history")}</h4><small>(AppId:${e(s.route.appId)}, ${t('environment')}:${e(s.route.env)}, ${t('cluster')}:${e(s.route.cluster)}, Namespace:${e(s.route.namespace)})</small></div>${btn("back-config", t("returnHome"), " ", false, "info")}</header>${s.historyHidden ? `<p class="empty">${t('hidden')}</p>` : `<div class="release-history-columns"><nav class="release-list">${records}${s.historyHasMore ? btn('more-history', t('loadMore'), '', s.historyLoading) : ''}</nav><section class="history-detail">${body || `<p class="empty">${t("noRelease")}</p>`}</section></div>`}</main>`;
}
