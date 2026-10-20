import { userSelector } from "./user-picker.js";
import { referenceField, referenceRow } from './reference-fields.js';
import {
  escapeHTML as e,
  attr,
  actionButton as button,
  formField as field,
  emptyRow,
  localTimestamp,
  assetImage,
} from "./ui.js";

const btn = (action, label, extra = "", off = false, style = "default") =>
  button(action, label, extra, off, style);
const hint = (text) => `<div class="reference-hint">${text}</div>`;
const table = (labels, rows, extra = "") =>
  `<div class="table-scroll"><table class="reference-table" ${extra}><thead><tr>${labels.map((label) => `<th>${e(label)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
const head = (title, subtitle = "", tools = "") =>
  `<header class="reference-heading"><span>${e(title)} ${subtitle ? `<small>${e(subtitle)}</small>` : ""}</span><div>${tools}</div></header>`;
const page = (body, kind = "") =>
  `<main class="reference-page ${kind}"><section class="reference-surface">${body}</section></main>`;
const inlineActions = new Set(['app-admin-inline','grant-system-inline','master-lookup','consumer-lookup','delete-query','transfer-query']);
const form = (action, body, label, extra = "", off = false, grid = null) => {
  const submit = label ? btn('submit-form', label, '', false, 'primary') : '';
  const actions = label ? grid ? referenceRow('', submit, { ...grid, columns: 12 - (grid.labelColumns || 2), className: 'reference-form-actions' }) : `<div class="reference-form-actions">${submit}</div>` : '';
  return `<form class="${inlineActions.has(action) ? 'reference-inline' : ''}${grid ? ' reference-grid-form' : ''}" data-form="advanced" data-submit-action="${action}" ${extra}><fieldset${off ? " disabled" : ""}>${body}${actions}</fieldset></form>`;
};
const back = (t) => btn("back-config", t("returnHome"), " ", false, "info");
const appSubtitle = (s) => `( AppId: ${s.route.appId} )`;
function tags(users, action, extra = "", off = false, title = "", split = false) {
  return `<div class="reference-tags">${title ? `<h5>${e(title)}</h5>` : ""}${users
    .map((user) => {
      const id = user.userId || user;
      return `<span class="reference-tag${split ? ' reference-admin-tag' : ''}">${split ? `<span class="reference-tag-name">${e(id)}</span>` : e(id)}${btn(action, "×", `${extra} data-user="${attr(id)}"`, off, split ? "default" : "link")}</span>`;
    })
    .join("")}</div>`;
}
function usersPage(s, t) {
  const user = s.userEdit;
  const body = user
    ? form(
        "save-user-submit",
        `<div data-inline-user>${field("username", t("userId"), user.userId, "text", true).replace('name="username"', `name="username"${user.existing ? " readonly" : ""}`)}${field("userDisplayName", t("name"), user.name, "text", true)}${field("password", t("password"), "", "password", true)}${field("confirmPassword", t("confirmPassword"), "", "password", true)}${field("email", t("email"), user.email, "email", true)}${s.isRoot?field("enabled", t("enabled"), user.enabled !== 0, "checkbox"):""}${btn("cancel-inline", t("cancel"))}</div>`,
        t(user.existing ? "saveChanges" : "save"),
        " ",
        s.readOnly,
      )
    : `<div class="reference-toolbar">${btn("new-user", t("addUser"), "", s.readOnly || !s.isRoot, "primary")}<input data-users-filter aria-label="${t("searchUsers")}" placeholder="${t("searchUsers")}" value="${attr(s.userFilter || "")}">${btn("filter-users", t("filterUsers"))}${btn("reset-users", t("reset"))}</div>${table(
        [t("userId"), t("name"), t("email"), t("userStatus"), t("actions")],
        s.users
          .filter((user) =>
            (user.userId + " " + user.name)
              .toLowerCase()
              .includes((s.userFilter || "").toLowerCase()),
          )
          .map(
            (user) =>
              `<tr><td>${e(user.userId)}</td><td>${e(user.name)}</td><td>${e(user.email)}</td><td><span class="status-label ${user.enabled ? "status-enabled" : ""}">${t(user.enabled ? "enabled" : "disable")}</span></td><td>${btn("edit-user", t("edit"), `data-user="${attr(user.userId)}"`, s.readOnly, "primary")}${s.isRoot ? btn("toggle-user", t(user.enabled ? "disable" : "enableKey"), `data-user="${attr(user.userId)}"`, s.readOnly, "primary") : ""}</td></tr>`,
          ),
      )}`;
  return page(head(t("users"), t("simpleAuthOnly")) + body, "users-page");
}
function configPage(s, t) {
  if (!s.isRoot) return page(`<p role="alert">${t("rootOnly")}</p>`);
  const env = s.route.paramEnv || "portal",
    editing = s.configEdit;
  const tabs = `<nav class="reference-tabs">${btn("config-db-env", t("portalDB"), 'data-env="portal"', false, env === "portal" ? "active" : "link")}${btn("config-db-env", t("configDB"), `data-env="${attr(s.serverConfigEnvs?.[0] || "DEV")}"`, false, env !== "portal" ? "active" : "link")}</nav>`;
  const envs =
    env !== "portal"
      ? `<div class="reference-toolbar">${(s.serverConfigEnvs || []).map((name) => btn("config-db-env", name, `data-env="${attr(name)}"`, false, name === env ? "active" : "default")).join("")}</div>`
      : "";
  if (editing)
    return page(
      tabs +
        envs +
        form(
          "save-config-submit",
          `<div data-inline-config>${field("key", "Key", editing.key, "text", true)}${field("value", "Value", editing.value, "textarea", true)}${field("comment", "Comment", editing.comment, "textarea")}${btn("cancel-inline", t("backToList"))}</div>`,
          t("save"),
          " ",
          s.readOnly,
        ),
    );
  return page(
    tabs +
      envs +
      head(t("appConfiguration"), t("configTableHint")) +
      `<div class="reference-toolbar">${btn("new-server-config", t("addItem"), "", s.readOnly, "primary")}<input data-config-filter value="${attr(s.configFilter || "")}" aria-label="${t("filterConfig")}" placeholder="${t("filterKey")}">${btn("filter-parameters", t("filterConfig"))}${btn("reset-parameters", t("reset"))}</div>` +
      table(
        ["Key", "Value", "Comment", "Operation"],
        s.serverConfigs
          .map((entry, index) => ({ entry, index }))
          .filter(({ entry }) =>
            entry.key
              .toLowerCase()
              .includes((s.configFilter || "").toLowerCase()),
          )
          .map(
            ({ entry, index }) =>
              `<tr><td>${e(entry.key)}</td><td><pre>${e(entry.value)}</pre></td><td>${e(entry.comment)}</td><td>${btn("edit-server-config", t("edit"), `data-config="${index}"`, s.readOnly, "primary")}</td></tr>`,
          ),
      ),
    "parameters-page",
  );
}
function projectPage(s, t) {
  const creating = s.route.view === "create-project",
    app = creating ? {} : s.advApp;
  if (creating && !s.canCreate)
    return page(`<p role="alert">${t("denied")}</p>`);
  const disabled =
    s.readOnly || (!creating && (!s.canManage || !s.projectEditing));
  const org = app.orgId || "";
  const grid = { labelColumns: creating ? 3 : 2 };
  const organizations = referenceRow(t('department'), `<select class="reference-compact-select" name="orgId" required><option value="">${t("chooseDepartment")}</option>${(s.organizations || []).map((item) => `<option value="${attr(item.orgId)}"${item.orgId === org ? " selected" : ""}>${e(item.orgName)}(${e(item.orgId)})</option>`).join("")}</select>`, { ...grid, columns: 3, required: true });
  const appIdField = referenceField('appId', 'AppId', app.appId, { ...grid, columns: 3, required: true, type: creating ? 'text' : 'static', help: creating ? t('App.AppIdTips') : '' });
  const fields = (creating ? organizations + appIdField : appIdField + organizations) +
    referenceField('name', t('appName'), app.name, { ...grid, columns: creating ? 5 : 4, required: true, help: t('applicationNameHint') }) +
    userSelector("ownerName", t("Common.AppOwnerLong"), creating ? '' : app.ownerName, s, true, grid) +
    (creating
      ? userSelector("admins", t("Common.AppAdmin"), "", s, false, { ...grid, columns: 8, help: [t('App.AppAdminTips1'), t('App.AppAdminTips2')] })
      : "");
  const administrators = creating
    ? ""
    : `<section class="reference-section project-administrators"><h5 class="project-section-title">${t("App.Setting.Admin")} <small>${t("appAdminHint")}</small></h5><hr>${form("app-admin-inline", userSelector("user", t("user"), "", s) + ' ' + btn("submit-form", t("add"), " ", s.readOnly || !s.canManage), "")}${tags(s.appRoles?.masterUsers || [], "app-remove-admin", "", s.readOnly || !s.canManage, '', true)}</section>`;
  return page(
    head(
      t(creating ? "createProject" : "applicationManagement"),
      creating ? "" : appSubtitle(s),
      creating ? "" : back(t),
    ) +
      administrators +
      `<section class="reference-section${creating ? ' create-app-fields' : ' project-basics'}">${creating ? '' : `<h5 class="project-section-title">${t("baseInformation")}</h5><hr>`}${form("save-project-submit", fields, creating || s.projectEditing ? t("save") : "", " ", disabled, grid)}${!creating && !s.projectEditing ? `<div class="reference-grid-form">${referenceRow('', btn("edit-project", t("editAppInfo"), "", s.readOnly || !s.canManage, "primary"), { ...grid, columns: 9, className: 'reference-form-actions' })}</div>` : ""}</section>`,
    creating ? "create-app-page" : "app-management-page",
  );
}
function masterPage(s, t) {
  return page(
    head(t("SystemRole.AddCreateAppRoleToUser"), t("SystemRole.AddCreateAppRoleToUserTips")) +
      form(
        "grant-system-inline",
        userSelector("users", t("SystemRole.ChooseUser"), "", s, false) +
          btn("submit-form", t("add"), " ", s.readOnly),
        "",
      ) +
      tags(s.systemRoleUsers || [], "revoke-system-role", "", s.readOnly, t("SystemRole.AuthorizedUser")) +
      `<section class="reference-section" data-system-master>${head(t("SystemRole.ModifyAppAdminUser"), t("SystemRole.ModifyAppAdminUserTips"))}${form("master-lookup", field("appId", "AppId", s.masterLookup?.appId || "", "text", true) + btn("submit-form", t("query"), " ", s.readOnly, "info"), "")}<div class="form-field master-result"><span>${t("SystemRole.AppInfo")}</span><output>${s.masterLookup ? `${e(s.masterLookup.name)} / ${e(s.masterLookup.orgName)} / ${e(s.masterLookup.ownerName)}` : ""}</output></div>${userSelector("user", t("selectUser"), "", s)}<div class="reference-form-actions">${btn("allow-master", t("allowMaster"), "", s.readOnly || !s.masterLookup, "info")}${btn("forbid-master", t("forbidMaster"), "", s.readOnly || !s.masterLookup, "info")}</div></section>`,
    "system-role-page",
  );
}
function clustersPage(s, t) {
  return page(
    `<header class="reference-heading"><h4 class="cluster-management-title">${t('manageCluster')} ( AppId: <label>${e(s.route.appId)}</label> )</h4><div>${back(t)}</div></header>` +
      (s.advTree || [])
        .map(
          (node) =>
            `<section class="reference-cluster-group"><hr><h4>${t("environment")}: ${e(node.env)}</h4>${(node.clusters || []).map((cluster) => `<div class="reference-cluster-card"><header><strong>${t("cluster")}: ${e(cluster.name)}</strong><div>${btn("cluster-roles", t("authorize"), `data-env="${attr(node.env)}" data-name="${attr(cluster.name)}"`).replace('>', '>' + assetImage('assign.png'))}</div></header></div>`).join("")}</section>`,
        )
        .join(""),
    "clusters-page",
  );
}
function clusterCreate(s, t) {
  return page(
    head(t("Cluster.CreateCluster"), "", back(t)) +
      hint(`<strong>Tips:</strong><ul>${[1,2,3,4].map(index => `<li>${t("Cluster.Tips."+index)}</li>`).join("")}</ul>`) +
      (s.clusterCreated ? `<section class="reference-create-state" data-creation-complete>${assetImage('created.png', t('creationDone'), 'creation-success-image')}<h3>${t('creationDone')}!</h3></section>` : form(
        "cluster-create-submit",
        referenceField('appId', 'AppId', s.route.appId, { type: 'static', required: true }) +
          referenceField('name', t('clusterName'), '', { required: true, help: t('Cluster.CreateNameTips') }) +
          referenceField('comment', t('clusterComment'), '', { type: 'textarea', help: t('Cluster.CreateRemarksTips') }) +
          referenceRow(t('selectEnvironment'), `<table class="reference-environment-options"><tbody>${(s.clusterCreateEnvs || []).map((env, index) => `<tr><td><input type="checkbox" name="env_${attr(env)}" id="cluster-environment-${index}"></td><td><label for="cluster-environment-${index}">${e(env)}</label></td></tr>`).join('')}</tbody></table>`, { required: true, columns: 5 }),
        t("save"),
        " ",
        s.readOnly || !s.canCreateCluster,
        {},
      )),
    "cluster-create-page",
  );
}
function keyPage(s, t) {
  const groups = s.accessKeysByEnv || { [s.route.env]: s.accessKeys || [] };
  return page(
    head(t("accessKeys"), appSubtitle(s), back(t)) +
      hint(
        `<strong>Tips:</strong><ul>${[1, 2, 3, 4].map((index) => `<li>${t("AccessKey.Tips." + index)}${index === 4 ? `<ul>${[1, 2, 3].map((child) => `<li>${t("AccessKey.Tips.4." + child)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ul>`,
      ) +
      form(
        "key-create-inline",
        `<select name="env" required aria-label="${t("environment")}"><option value="">${t("chooseEnvironment")}</option>${(s.advTree || []).map((node) => `<option>${e(node.env)}</option>`).join("")}</select> ${btn("submit-form", t("add"), " ", true)}`,
        "",
      ) +
      Object.entries(groups)
        .map(
          ([env, keys]) =>
            `<section class="reference-section"><h4>${t("environment")}: ${e(env)}</h4>${table(
              [
                t("AccessKey.ConfigAccessKeys.Secret"),
                t("AccessKey.ConfigAccessKeys.Status"),
                t("AccessKey.ConfigAccessKeys.LastModify"),
                t("AccessKey.ConfigAccessKeys.LastModifyTime"),
                t("AccessKey.ConfigAccessKeys.Operator"),
              ],
              keys.length ? keys.map(
                (key) =>
                  `<tr><td>${e(key.secret)}</td><td class="access-status ${key.enabled ? key.mode === 1 ? 'observed' : 'enabled' : 'disabled'}">${t('AccessKey.Operator.' + (key.enabled ? key.mode === 1 ? 'Observed' : 'Enabled' : 'Disabled'))}</td><td>${e(key.dataChangeLastModifiedBy)}</td><td>${e(localTimestamp(key.dataChangeLastModifiedTime))}</td><td>${!key.enabled || key.mode !== 0 ? btn("enable-key", t("AccessKey.Operator.Enable"), `data-env="${attr(env)}" data-id="${attr(key.id)}"`, s.readOnly || !s.canManage, "link") : ''}${!key.enabled || key.mode !== 1 ? btn("observe-key", t("AccessKey.Operator.Observe"), `data-env="${attr(env)}" data-id="${attr(key.id)}"`, s.readOnly || !s.canManage, "link") : ''}${btn(key.enabled ? "disable-key" : "delete-key", t(key.enabled ? "AccessKey.Operator.Disable" : "AccessKey.Operator.Remove"), `data-env="${attr(env)}" data-id="${attr(key.id)}"`, s.readOnly || !s.canManage, "link")}</td></tr>`,
              ) : [`<tr><td colspan="5" class="center">${t("AccessKey.NoAccessKeyServiceTips")}</td></tr>`],
            )}</section>`,
        )
        .join(""),
    "access-page",
  );
}
function rolePage(s, t) {
  const cluster = s.route.view === "cluster-roles",
    roles = cluster ? ["ModifyNamespacesInCluster", "ReleaseNamespacesInCluster"] : ["ModifyNamespace", "ReleaseNamespace"];
  return page(head(t(cluster ? "clusterPermissions" : "permissions"), `${appSubtitle(s)} ${cluster ? s.route.env + " / " + s.route.cluster : s.route.namespace}`, back(t)) + roles.map((role, index) => {
    const state = s.roleBuckets?.[role], env = state?.env || "", field = index === 0 ? 'modifyRoleUsers' : 'releaseRoleUsers', off = s.readOnly || !s.canManage || state?.pending;
    const groups = cluster ? [env] : ['', ...(s.roleEnvs || [])];
    const assigned = groups.map(group => {
      const users = cluster ? s.roles?.[field] || [] : s.roleAssignments?.[group]?.[field] || [];
      return `<section class="role-assignment-group" data-role-group="${attr(group)}">${!cluster ? `<h5>${e(group || t('allEnvs'))}</h5>` : ''}${tags(users, cluster ? "revoke-cluster-role" : "role-inline-remove", `data-role="${role}" data-env="${attr(group)}"`, off)}</section>`;
    }).join('');
    return `<section class="reference-section reference-role" data-role="${role}"><div class="role-label">${t(index === 0 ? "modifyPermission" : "releasePermission")}<small>${t(index === 0 ? "modifyPermissionHint" : "releasePermissionHint")}</small></div><div class="role-content">${form("role-inline", `<input type="hidden" name="role" value="${role}"><input type="hidden" name="env" value="${attr(env)}">${userSelector("user", t("selectUser"), "", s)}${!cluster ? `<select data-role-env="${role}" aria-label="${t("environment")}"><option value="">${t("allEnvs")}</option>${(s.roleEnvs || []).map(name => `<option${name === env ? " selected" : ""}>${e(name)}</option>`).join("")}</select>` : ""}${btn("submit-form", t("add"), " ", off)}`, "")}${assigned}</div></section>`;
  }).join(''), "permissions-page");
}
function deletionPage(s, t) {
  return page(
    ["app", "cluster", "namespace"]
      .map((kind) => {
        const model = s.deleteForms?.[kind] || {},
          lookup = s.deleteLookups?.[kind];
        const title = t(
          kind === "app"
            ? "deleteApplication"
            : kind === "cluster"
              ? "deleteCluster"
              : "deleteAppNamespace",
        );
        const fields =
          `<input type="hidden" name="kind" value="${kind}">` +
          field("appId", "AppId", model.appId, "text", true) +
          (kind === "cluster"
            ? field("env", t("environment"), model.env || "", "text", true) +
              field("cluster", t("clusterName"), model.cluster, "text", true)
            : kind === "namespace"
              ? field(
                  "namespace",
                  "AppNamespace",
                  model.namespace,
                  "text",
                  true,
                )
              : "");
        return `<section class="reference-section">${head(title, t("deleteQueryHint"))}${form("delete-query", fields + btn("submit-form", t("query"), " ", s.readOnly, "info") + `<div class="reference-app-info">${lookup ? e(lookup.resource.name || lookup.resource.namespaceName || lookup.resource.comment || lookup.selection.appId) : ""}</div><div class="reference-form-actions">${btn("delete-queried", title, `data-kind="${kind}"`, s.readOnly || !lookup, "info")}</div>`, "", `data-delete-kind="${kind}"`)}</section>`;
      })
      .join(""),
    "delete-page",
  );
}
function systemPage(s, t) {
  return page(
    head(t("systemInfo")) +
      `<p>${t("systemVersion")}: ${e(s.systemInfo.version)}</p><p>${t("systemEnvironmentHint")}</p>` +
      (s.systemInfo.environments || [])
        .map(
          (env) =>
            `<section class="reference-section"><h4>${t("environment")}: ${e(env.env)}</h4><p>Active: ${e(env.active ?? true)}</p><p>Meta Server ${t("address")}: ${e(env.metaServerAddress)}</p>${[
              "configServices",
              "adminServices",
            ]
              .map(
                (type) =>
                  `<h4 class="center">${type === "configServices" ? "Config Services" : "Admin Services"}</h4>${table(
                    ["Name", "Instance Id", "Home Page Url", "Check Health"],
                    (env[type] || []).map(
                      (service) =>
                        `<tr><td>${e(service.appName)}</td><td>${e(service.instanceId)}</td><td>${e(service.homepageUrl)}</td><td>${s.serviceHealth[service.instanceId] ? e(s.serviceHealth[service.instanceId].status) : ""}${btn("service-health", "Check", `data-id="${attr(service.instanceId)}"`, false, "link")}</td></tr>`,
                    ),
                    `data-services="${type}"`,
                  )}`,
              )
              .join("")}</section>`,
        )
        .join(""),
    "system-info-page",
  );
}
function consumerPage(s, t) {
  return page(
    head(
      t("newConsumer"),
      t("consumerCreateHint"),
      btn("new-consumer", t("newConsumer"), " ", s.readOnly, "primary"),
    ) +
      table(
        [
          "AppId",
          t("appName"),
          t("allowCreateApplication"),
          t("rateLimit"),
          t("department"),
          t("ownerEmail"),
          t("actions"),
        ],
        s.consumers.map(
          (consumer) =>
            `<tr><td>${e(consumer.appId)}</td><td>${e(consumer.name)}</td><td>${t(consumer.allowCreateApplication ? "yes" : "no")}</td><td>${consumer.rateLimitEnabled ? e(consumer.rateLimit) : t("unlimited")}</td><td>${e(consumer.orgName || consumer.orgId)}</td><td>${e(consumer.ownerName)} / ${e(consumer.ownerEmail)}</td><td>${btn("assign-consumer", t("viewTokenAndGrant"), `data-id="${attr(consumer.appId)}"`, s.readOnly)}${btn("delete-consumer", t("remove"), `data-id="${attr(consumer.appId)}"`, s.readOnly)}</td></tr>`,
        ),
      ),
    "consumer-page",
  );
}
function consumerCreatePage(s, t) {
  const credential = s.consumerCredential, draft = s.consumerDraft || {};
  const option = (name, label, tip) => `<div class="form-field"><span>${t(label)}</span><div><label class="checkbox-label"><input type="checkbox" name="${name}"${draft[name] ? ' checked' : ''}></label><small>${t(tip)}</small></div></div>`;
  const createFields = `<input type="hidden" name="appId" value="${attr(s.consumerAppId || '')}">` +
    option('allowCreateApplication','Open.Manage.Consumer.AllowCreateApplication','Open.Manage.Consumer.AllowCreateApplicationTips') +
    option('rateLimitEnabled','Open.Manage.Consumer.RateLimit.Enabled','Open.Manage.Consumer.RateLimit.Enabled.Tips') +
    `<div data-consumer-rate${draft.rateLimitEnabled ? '' : ' hidden'}>${field('rateLimit',t('Open.Manage.Consumer.RateLimitValue'),draft.rateLimit || '0','number')}</div>` +
    `<label class="form-field"><span><b>*</b> ${t('department')}</span><select name="orgId" required><option value="">${t('chooseDepartment')}</option>${(s.organizations || []).map(org => `<option value="${attr(org.orgId)}"${draft.orgId === org.orgId ? ' selected' : ''}>${e(org.orgName)}(${e(org.orgId)})</option>`).join('')}</select></label>` +
    field('name',t('Open.Manage.ThirdAppName'),draft.name || '', 'text',true) + `<p class="reference-field-hint">${t('Open.Manage.ThirdAppNameTips')}</p>` +
    userSelector('ownerName',t('Open.Manage.ProjectOwner'),draft.ownerName || '',s) + `<input type="hidden" name="expires" value="${attr(draft.expires || '')}">`;
  const grantFields = `<div class="form-field"><span><b>*</b> Token</span><input type="text" value="${attr(credential?.token || '')}" readonly autocomplete="off"></div>` +
    field('managedAppId',t('Open.Manage.ManagedAppId'),'','text',true) + field('namespace',t('Open.Manage.ManagedNamespace'),'') + `<p class="reference-field-hint">${t('Open.Manage.ManagedNamespaceTips')}</p>` +
    `<div class="form-field"><span>${t('Open.Manage.GrantType')}</span><label><input type="radio" name="type" value="NamespaceRole" checked> Namespace</label><label><input type="radio" name="type" value="AppRole"> App</label></div><div class="form-field"><span>${t('environment')}</span><div>${(s.consumerEnvs || []).map(env => `<label class="checkbox-label"><input type="checkbox" name="env_${attr(env)}"> ${e(env)}</label>`).join('')}<small>${t('Open.Manage.GrantEnvTips')}</small></div></div>`;
  return page(head(t('Open.Manage.CreateThirdApp'),t('Open.Manage.CreateThirdAppTips')) +
    form('consumer-lookup',field('lookupAppId',t('Open.Manage.ThirdAppId'),s.consumerAppId || '', 'text',true) + btn('submit-form',t('query'),' ',s.readOnly,'info'),'') +
    `<p class="consumer-id-hint reference-field-hint">${t('Open.Manage.ThirdAppIdTips')}</p>` + form('consumer-create-submit', createFields, t('create'),' ',s.readOnly) +
    `<section class="reference-section"><h4>${t('Open.Manage.GrantPermission')} <small>${t('Open.Manage.GrantPermissionTips')}</small></h4>${form('consumer-grant-inline', grantFields, t('save'),' ',s.readOnly)}</section>`, 'consumer-create-page');
}
function auditPage(s, t) {
  const formBody = `<div class="audit-filter"><h2>${t("audit")}</h2>${field("opName", t("operation"), s.auditOpName || "")}${field("startDate", t("startTime"), s.auditStartInput || "", "datetime-local")}${field("endDate", t("endTime"), s.auditEndInput || "", "datetime-local")}${btn("submit-form", t("query"), " ", false, "primary")}</div>`;
  return page(
    form("audit-submit", formBody, "") +
      (s.auditEnabled
        ? table(
            [
              t("operation"),
              t("operationType"),
              t("operator"),
              t("time"),
              t("comment"),
            ],
            s.auditLogs.map(
              (log) =>
                `<tr tabindex="0" role="link" data-action="audit-trace" data-trace="${attr(log.traceId)}"><td>${e(log.opName)}</td><td>${e(log.opType)}</td><td>${e(log.operator)}</td><td>${e(localTimestamp(log.happenedTime))}</td><td>${e(log.description)}</td></tr>`,
            ),
          )
        : `<p role="alert">${t("auditDisabled")}</p>`) +
      `<div class="reference-form-actions">${btn("audit-next", t("loadMore"), "", s.auditLogs.length < 20)}</div>`,
    "audit-page",
  );
}
function tracePage(s, t) {
  const rows = s.auditDetails || [],
    nodes = rows.map((detail, index) => ({
      detail,
      log: detail.logDTO || detail,
      id: (detail.logDTO || detail).spanId || "__span_" + index,
    })),
    map = new Map(nodes.map((node) => [node.id, node])),
    seen = new Set();
  function tree(node, parents = new Set()) {
    if (parents.has(node.id) || seen.has(node.id)) return "";
    seen.add(node.id);
    const trail = new Set([...parents, node.id]);
    const children = nodes.filter(
      (child) => child.log.parentSpanId === node.id && child.id !== node.id,
    );
    return `<li role="treeitem"><button type="button" data-action="trace-select" data-span="${attr(node.id)}" class="trace-node ${s.traceSelected === node.id ? "selected" : ""}">${children.length ? "▾" : "·"} ${e(node.log.opName)}</button>${children.length ? `<ul role="group">${children.map((child) => tree(child, trail)).join("")}</ul>` : ""}</li>`;
  }
  let treeHtml = nodes
    .filter(
      (node) =>
        !node.log.parentSpanId ||
        !map.has(node.log.parentSpanId) ||
        node.log.parentSpanId === node.id,
    )
    .map((node) => tree(node))
    .join("");
  treeHtml += nodes
    .filter((node) => !seen.has(node.id))
    .map((node) => tree(node))
    .join("");
  const selected = map.get(s.traceSelected),
    log = selected?.log,
    influences =
      selected?.detail.dataInfluenceDTOList ||
      selected?.detail.dataInfluences ||
      [];
  const entities = influences.length
    ? `<p>${e(log?.operator)} / ${e(log?.spanId)} / ${e(log?.description)}</p>` +
      table(
        [t("entity"), t("field"), t("oldValue"), t("newValue")],
        influences.map(
          (item, index) =>
            `<tr><td>${e(item.influenceEntityName)} #${e(item.influenceEntityId)}</td><td>${btn("trace-field", item.fieldName, `data-index="${index}"`, false, "link")}</td><td><pre>${e(item.fieldOldValue)}</pre></td><td><pre>${e(item.fieldNewValue)}</pre></td></tr>`,
        ),
      )
    : `<p class="empty">${t("noRelatedChanges")}</p>`;
  const related = s.traceRelated || [],
    history = related.length
      ? table(
          [t("time"), t("oldValue"), t("newValue")],
          related.map(
            (item) =>
              `<tr><td>${e(localTimestamp(item.dataChangeCreatedTime || item.happenedTime))}</td><td><pre>${e(item.fieldOldValue)}</pre></td><td><pre>${e(item.fieldNewValue)}</pre></td></tr>`,
          ),
        )
      : `<p class="empty">${t("noRelatedChanges")}</p>`;
  return `<main class="trace-reference-page"><header class="trace-title"><h2>${t("traceDisplay")}</h2><p>${t("traceId")}: ${e(s.route.traceId)}</p></header><div class="trace-columns"><section data-trace-column="tree"><h4>${t("traceLogs")}</h4><ul role="tree" class="trace-tree">${treeHtml}</ul></section><section data-trace-column="entities"><h4>${t("traceEntityChanges")}</h4>${entities}</section><section data-trace-column="history"><h4>${t("fieldChangeHistory")}</h4>${history}${btn("trace-more", t("loadMore"), "", s.traceLoading || related.length < 10)}</section></div></main>`;
}
function globalPage(s, t) {
  return page(
    head(t("globalValueSearch"), t("globalSearchHint")) +
      form(
        "global-search-submit",
        `<div class="reference-toolbar"><label>Key: <input name="key" value="${attr(s.globalKey || "")}" placeholder="${t("filterKey")}"></label><label>Value: <input name="value" value="${attr(s.globalValue || "")}" placeholder="${t("filterValue")}"></label>${btn("submit-form", t("query"), " ", false, "primary")}</div>`,
        "",
      ) +
      (s.globalWarning ? `<p role="status">${e(s.globalWarning)}</p>` : "") +
      table(
        [
          t("appId"),
          t("environment"),
          t("clusterName"),
          t("namespace"),
          "Key",
          "Value",
          t("actions"),
        ],
        s.globalResults.map(
          (row, index) =>
            `<tr><td>${e(row.appId)}</td><td>${e(row.envName)}</td><td>${e(row.clusterName)}</td><td>${e(row.namespaceName)}</td><td>${e(row.key)}</td><td><pre>${e(row.value)}</pre></td><td>${btn("search-open-config", t("view"), `data-index="${index}"`, false, "link")}</td></tr>`,
        ),
      ) +
      (!s.globalResults.length
        ? `<div class="reference-empty">${assetImage("nodata.png", "", "reference-empty-image")}<p>${t("emptySearch")}</p></div>`
        : ""),
    "global-page",
  );
}
function namespacePage(s, t) {
  const mode = s.namespaceMode || "create",
    publicType = s.namespacePublicType === "public";
  const tip =
    mode === "link"
      ? ["Namespace.Link.Tips1", "Namespace.Link.Tips2"]
      : [1, 2, 3, 4].map(
          (index) =>
            (publicType
              ? "Namespace.CreatePublic.Tips"
              : "Namespace.CreatePrivate.Tips") + index,
        );
  const grid = { labelColumns: 3 };
  const controls = referenceRow('', `<div class="namespace-mode-controls">${btn("namespace-mode", t("newNamespace"), 'data-mode="create"', false, mode === "create" ? "active" : "default")}${btn("namespace-mode", t("linkNamespace"), 'data-mode="link"', false, mode === "link" ? "active" : "default")}</div>`, { ...grid, columns: 5, className: 'namespace-mode-row' });
  const targets = referenceRow(t('chooseClusters'), `<div class="namespace-targets">${s.namespaceChoices.map((target, index) => `<label class="checkbox-label"><input type="checkbox" name="target_${index}" checked> ${e(target.env)} / ${e(target.clusterName)}</label>`).join("")}</div>`, { ...grid, required: true });
  const fields =
    mode === "link"
      ? targets +
        referenceRow(t('publicNamespaces'), `<div class="namespace-public-select">${s.namespacePublic.map((namespace, index) => `<label class="checkbox-label"><input type="checkbox" name="public_${index}"> ${e(namespace.name)} / ${e(namespace.appId)}</label>`).join("")}</div>`, { ...grid, columns: 4, required: true })
      : referenceRow(t('type'), `<label class="reference-radio-inline"><input type="radio" name="namespaceType" value="private"${!publicType ? ' checked' : ''}> private</label> <label class="reference-radio-inline"><input type="radio" name="namespaceType" value="public"${publicType ? ' checked' : ''}> public</label>`, { ...grid, required: true, columns: 5 }) +
        (publicType ? referenceRow(t('namespacePrefix'), `<div><label class="reference-checkbox-inline"><input type="checkbox" name="appendPrefix"${s.namespaceAppendPrefix !== false ? ' checked' : ''}> ${e(s.namespacePrefix || '')}</label></div>`, { ...grid, help: t('namespacePrefixHint') }) : '') +
        referenceRow(t('namespaceName'), `<div class="namespace-name-group">${publicType && s.namespaceAppendPrefix !== false ? `<span class="namespace-prefix-addon" data-namespace-prefix>${e(s.namespacePrefix || '')}</span>` : ''}<input id="namespace-name-input" name="name" required></div>`, { ...grid, columns: 5, required: true, labelFor: 'namespace-name-input', trailing: `<div class="reference-control-extra"><select name="format" class="namespace-format-select" aria-label="${attr(t('type'))}">${['properties','xml','json','yml','yaml','txt'].map(format => `<option>${format}</option>`).join('')}</select></div>` }) +
        referenceField('comment', t('comment'), '', { ...grid, columns: 7, type: 'textarea' });
  return page(
    head(t("newNamespace"), t("namespaceMoreHint"), back(t)) +
      hint(
        `<strong>Tips:</strong><ul>${tip.map((key) => `<li>${t(key)}</li>`).join("")}</ul>`,
      ) +
      form(
        "namespace-create-submit",
        `<input type="hidden" name="mode" value="${mode}">${controls}${referenceField('appId', 'AppId', s.route.appId, { ...grid, type: 'static', className: 'namespace-app-identity' })}${fields}`,
        t("save"),
        " ",
        s.readOnly || !s.canCreateNamespace,
        grid,
      ),
    "namespace-create-page",
  );
}
function transferPage(s, t) {
  const cluster = s.transferTab === "cluster",
    target = s.transferSelection || {
      appId: s.route.appId || "",
      env: s.route.env || "",
      cluster: s.route.cluster || "",
    };
  const envLabels = (prefix) =>
    `<div class="transfer-envs">${s.transferEnvs.map((env) => `<label class="checkbox-label"><input type="checkbox" name="${prefix}_${attr(env)}"${prefix === "export" ? ` data-export-env="${attr(env)}"${s.exportEnvs[env] ? " checked" : ""}` : ""}> ${e(env)}</label>`).join("")}</div>`;
  const conflicts = `<div class="form-field"><span>${t("conflictAction")}</span><label><input type="radio" name="conflict" value="ignore" checked> ${t("ignore")}</label><label><input type="radio" name="conflict" value="cover"> ${t("overwrite")}</label></div>`;
  const importFields =
    conflicts +
    field("file", t("uploadFile"), "", "file", true) +
    `<p class="reference-field-hint">${t("importDoesNotPublish")}</p>`;
  const body = cluster
    ? form(
        "transfer-query",
        field("appId", "AppId", target.appId, "text", true) +
          `<label class="form-field"><span>${t("environment")}</span><select name="env" required><option value="">${t("chooseEnvironment")}</option>${s.transferEnvs.map((env) => `<option${env === target.env ? " selected" : ""}>${e(env)}</option>`).join("")}</select></label>` +
          field("cluster", t("clusterName"), target.cluster, "text", true) +
          btn("submit-form", t("query"), " ", false, "info"),
        "",
        "data-transfer-query",
      ) +
      `<p class="reference-app-info">${e(s.transferLookup?.name || "")}</p><div class="reference-form-actions">${btn("export-transfer-cluster", t("exportConfig"), "", !s.transferLookup || !s.transferCanManage, "primary")}</div>` +
      form(
        "transfer-cluster-import",
        importFields,
        t("importConfig"),
        " ",
        s.readOnly || !s.transferLookup || !s.transferCanManage,
      )
    : `<section class="reference-section"><h4>${t("configExportImport")}</h4><div class="form-field"><span>${t("exportEnvironments")}</span>${envLabels("export")}</div><div class="reference-form-actions">${btn("export-all", t("exportConfig"), "", !s.isRoot, "primary")}</div></section><section class="reference-section">${form("transfer-import-submit", `<div class="form-field"><span>${t("importEnvironments")}</span>${envLabels("import")}</div>${importFields}`, t("importConfig"), " ", s.readOnly || !s.isRoot)}</section>`;
  return page(
    `<nav class="reference-tabs">${btn("transfer-tab", t("byEnvironment"), 'data-tab="environment"', false, !cluster ? "active" : "link")}${btn("transfer-tab", t("byApplicationCluster"), 'data-tab="cluster"', false, cluster ? "active" : "link")}</nav>${body}<p class="muted transfer-limit">${t("transferLimit")}</p>`,
    "transfer-reference-page",
  );
}
export function referenceAdminView(s, t) {
  const views = {
    users: usersPage,
    "server-config": configPage,
    project: projectPage,
    "create-project": projectPage,
    "app-roles": projectPage,
    "system-roles": masterPage,
    clusters: clustersPage,
    "cluster-create": clusterCreate,
    "access-keys": keyPage,
    permissions: rolePage,
    "permissions-env": rolePage,
    "cluster-roles": rolePage,
    delete: deletionPage,
    "system-info": systemPage,
    consumers: consumerPage,
    "consumer-create": consumerCreatePage,
    audit: auditPage,
    "audit-trace": tracePage,
    "global-search": globalPage,
    "namespace-create": namespacePage,
    transfer: transferPage,
  };
  if (!views[s.route.view]) return null;
  if (s.advancedDenied) return page(`<p role="alert">${t("rootOnly")}</p>`);
  return views[s.route.view](s, t);
}
