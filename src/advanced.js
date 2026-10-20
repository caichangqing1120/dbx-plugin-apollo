import { formField, escapeHTML, configTypeField } from "./ui.js";
import { itemEditorFields, validateItem, releaseFields, comparisonTable } from "./editor.js";
import { grayRuleFields, handleGrayRuleControl } from "./gray-rules.js";
import { loadNamespaceAssignments } from "./roles.js";
import { sourceNotice, publishDeniedFields } from "./notices.js";
import { grayItems } from "./gray-items.js";
import { downloadName } from "./transfer.js";

export const advancedRouteNames = new Set([
  "gray",
  "sync",
  "diff",
  "access-keys",
  "clusters",
  "consumers",
  "system-roles",
  "system-info",
  "audit",
  "audit-trace",
  "global-search",
  "transfer",
  "delete",
  "project",
  "create-project",
  "app-roles",
  "permissions-env",
  "instances",
  "release-diff",
  "cluster-create",
  "consumer-create",
]);
advancedRouteNames.add("cluster-roles");
advancedRouteNames.add("namespace-create");
const advancedActions = new Set([
  "access-keys",
  "clusters",
  "project",
  "app-roles",
  "sync",
  "diff",
  "transfer",
  "instances",
  "release-diff",
  "consumers",
  "system-roles",
  "system-info",
  "audit",
  "global-search",
  "delete",
  "new-project",
  "project-settings",
  "advance-env",
  "gray-edit-item",
  "gray-new-item",
  "gray-delete-item",
  "gray-publish",
  "gray-merge",
  "gray-add-rule",
  "gray-edit-rule",
  "gray-rule-manual",
  "gray-rule-mode",
  "gray-rule-add-ip",
  "gray-rule-add-label",
  "gray-rule-remove-ip",
  "gray-rule-remove-label",
  "gray-remove-rule",
  "delete-gray",
  "sync-preview",
  "toggle-sync-targets",
  "toggle-sync-items",
  "sync-apply",
  "create-key",
  "reveal-key",
  "copy-key",
  "enable-key",
  "disable-key",
  "delete-key",
  "delete-cluster",
  "open-cluster",
  "grant-system-role",
  "revoke-system-role",
  "service-health",
  "audit-trace",
  "audit-submit",
  "audit-next",
  "audit-prev",
  "global-search-submit",
  "search-open-config",
  "new-consumer",
  "reveal-consumer",
  "copy-consumer",
  "assign-consumer",
  "delete-consumer",
  "consumer-next",
  "consumer-prev",
  "export-all",
  "export-cluster",
  "export-namespace",
  "import-namespace",
  "import-all",
  "import-cluster",
  "delete-resource-submit",
  "role-env",
  "save-project-submit",
  "app-add-admin",
  "app-remove-admin",
  "project-delete",
  "namespace-delete",
  "release-compare-submit",
  "rollback-to",
]);
export function isAdvancedAction(action, route) {
  return (
    advancedActions.has(action) ||
    [
      "config-db-env",
      "instances-next",
      "instances-prev",
      "cluster-roles",
      "add-cluster-role",
      "revoke-cluster-role",
      "new-namespace",
      "namespace-create-submit",
      "toggle-user",
      "favorite-project",
    ].includes(action) ||
    (["add-role", "revoke-role"].includes(action) &&
      route.view === "permissions-env")
  );
}
const privilegedViews = new Set([
  "consumers",
  "system-roles",
  "system-info",
  "audit",
  "audit-trace",
  "global-search",
  "delete",
  "consumer-create",
]);
const identifiers = (node) => ({
  appId: node.appId,
  env: node.env,
  clusterName: node.clusterName,
  namespaceName: node.namespaceName,
});
export function syncModel(s) {
  const syncToNamespaces = s.syncChoices
    .filter((_n, i) => s.syncTargets[i])
    .map(identifiers);
  const syncItems = (s.syncSource.items || [])
    .filter((row) => !row.isDeleted && row.item.key && s.syncKeys[row.item.key])
    .map(({ item }) => ({
      key: item.key,
      value: item.value,
      type: item.type ?? 0,
      comment: item.comment || "",
      lineNum: item.lineNum,
    }));
  return { syncToNamespaces, syncItems };
}
export async function loadAdvancedRoute(route, s, client) {
  if (privilegedViews.has(route.view) && !s.isRoot)
    return { advancedDenied: true };
  const data = { advancedDenied: false };
  if (route.view === "gray") {
    const [branch, modify, release] = await Promise.all([
      client.branches(route),
      client.permission(route, "ModifyNamespace"),
      client.permission(route, "ReleaseNamespace"),
    ]);
    const meta = branch?.baseInfo || branch;
    const [app, tree, parent, namespaces] = await Promise.all([
      client.app(route.appId),
      client.tree(route.appId),
      client.namespace(route),
      client.namespaces(route),
    ]);
    if (tree.entities?.some((entity) => entity.code !== 200))
      throw Error("Environment lookup failed");
    const hidden = !!parent.isConfigHidden || !!branch?.isConfigHidden;
    const display = grayItems(branch, parent);
    Object.assign(data, {
      app,
      envTree: (tree.entities || []).map((entity) => entity.body),
      namespaces,
      grayParent: parent,
      grayRows: display.branchRows,
      grayMasterRows: display.masterRows,
      grayMasterRelease: !hidden && client.latestRelease
        ? await client.latestRelease(route)
        : null,
      grayTab: "config",
      grayHistory: [],
      grayInstancePage: null,
      permissions: {
        [route.namespace]: {
          modify: !!modify.hasPermission,
          release: !!release.hasPermission,
        },
      },
      canManage:
        s.isRoot ||
        (await client.appPermission(route.appId, "AssignRole")).hasPermission,
      canCreateCluster:
        s.isRoot ||
        (await client.appPermission(route.appId, "CreateCluster"))
          .hasPermission,
      canCreateNamespace:
        s.isRoot ||
        (await client.appPermission(route.appId, "CreateNamespace"))
          .hasPermission,
      grayBranch: branch ? {
        ...branch, isConfigHidden: hidden,
        lockOwner: client.namespaceLock
          ? (await client.namespaceLock({...route, cluster: meta.clusterName})).lockOwner || ''
          : '',
      } : null,
      grayMeta: meta,
      canModify: !!modify.hasPermission && !hidden,
      canRelease: !!release.hasPermission && !hidden,
      grayRules: meta && !hidden
        ? await client.branchRules(route, meta.clusterName)
        : null,
    });
  } else if (route.view === "sync" || route.view === "diff") {
    const [source, tree] = await Promise.all([
      client.namespace(route),
      client.tree(route.appId),
    ]);
    if (source.isConfigHidden)
      throw Error("Configuration values are hidden for the current user");
    const failures = tree.entities?.find((e) => e.code !== 200);
    if (failures) throw Error(failures.message || "Environment lookup failed");
    const choices = (tree.entities || [])
      .flatMap(({ body }) =>
        (body.clusters || []).map((cluster) => ({
          appId: route.appId,
          env: body.env,
          clusterName: cluster.name,
          namespaceName: route.namespace,
        })),
      );
    Object.assign(data, {
      syncSource: source,
      syncChoices: choices,
      syncAllTargets: route.view === 'sync',
      syncTargets: Object.fromEntries(
        choices.map((choice, index) => [
          index,
          route.view === "diff"
            ? choice.env === route.env && choice.clusterName === route.cluster
            : choice.env !== route.env || choice.clusterName !== route.cluster,
        ]),
      ),
      syncKeys: Object.fromEntries(
        (source.items || [])
          .filter((r) => r.item.key && !r.isDeleted)
          .map((r) => [r.item.key, route.view === "diff"]),
      ),
      syncPreview: null,
      syncPreviewSignature: null,
      diffMatrix: null,
      syncStep: 1,
      syncDate: {},
      syncFilterDates: {},
      compareMode: "table",
      compareOnlyDifferences: true,
      compareComments: false,
      compareKey: "",
    });
  } else if (
    ["access-keys", "clusters", "project", "app-roles"].includes(route.view)
  ) {
    const [app, tree] = await Promise.all([
      client.app(route.appId),
      client.tree(route.appId),
    ]);
    if (tree.entities?.some((e) => e.code !== 200))
      throw Error("Could not load every environment");
    const nodes = (tree.entities || []).map((e) => e.body);
    const env = route.env || nodes[0]?.env;
    const canManage =
      s.isRoot ||
      (await client.appPermission(route.appId, "AssignRole")).hasPermission;
    Object.assign(data, {
      advApp: app,
      advTree: nodes,
      route: { ...route, env },
      canManage,
    });
    if (route.view === "access-keys") {
      if (!env) throw Error("No environment available");
      data.accessKeysByEnv = Object.fromEntries(
        await Promise.all(
          nodes.map(async (node) => [
            node.env,
            await client.accessKeys({ ...route, env: node.env }),
          ]),
        ),
      );
      data.accessKeys = Object.values(data.accessKeysByEnv).flat();
      data.revealedKeys = Object.create(null);
    }
    if (route.view === "clusters") {
      data.clusterRows = nodes.flatMap((node) =>
        (node.clusters || []).map((c) => ({ ...c, env: node.env })),
      );
      data.canCreateCluster =
        s.isRoot ||
        (await client.appPermission(route.appId, "CreateCluster"))
          .hasPermission;
    }
    if (route.view === "project" || route.view === "app-roles") {
      data.appRoles = await client.appRoles(route.appId);
      data.organizations = client.organizations
        ? await client.organizations()
        : [{ orgId: app.orgId, orgName: app.orgName }];
      data.userChoices = client.users ? await client.users() : [];
      data.projectEditing = false;
    }
  } else if (route.view === "create-project") {
    data.organizations = s.canCreate ? await client.organizations() : [];
    data.userChoices = client.users ? await client.users() : [];
  } else if (route.view === "system-roles") {
    data.systemRoleUsers = await client.systemRoles();
    data.userChoices = client.users ? await client.users() : [];
    data.masterLookup = null;
  } else if (route.view === "system-info") {
    data.systemInfo = await client.systemInfo();
    data.serviceHealth = Object.create(null);
  } else if (route.view === "audit") {
    const properties = await client.auditProperties();
    data.auditEnabled = properties.enabled !== false;
    data.auditLogs = data.auditEnabled
      ? await client.audit({
          query: s.auditQuery || "",
          page: s.auditPage || 0,
          opName: s.auditOpName || "",
          startDate: s.auditStart || "",
          endDate: s.auditEnd || "",
        })
      : [];
  } else if (route.view === "audit-trace") {
    data.auditDetails = await client.auditTrace(route.traceId);
    data.traceSelected = null;
    data.traceRelated = [];
    data.traceRelatedScope = null;
    data.traceRelatedPage = 0;
  } else if (route.view === "global-search") {
    Object.assign(data, {
      globalResults: [],
      globalWarning: "",
      globalKey: "",
      globalValue: "",
    });
  } else if (route.view === "consumers") {
    data.consumers = await client.consumers(s.consumerPage || 0);
    data.organizations = await client.organizations();
    data.revealedConsumers = Object.create(null);
  } else if (route.view === "consumer-create") {
    data.organizations = await client.organizations();
    data.consumerEnvs = await client.environments();
    data.userChoices = client.users ? await client.users() : [];
    data.consumerCredential = null;
    data.consumerAppId = "";
    data.consumerDraft = {};
    data.showConsumerToken = false;
  } else if (route.view === "transfer" || route.view === "delete") {
    data.transferEnvs = await client.environments();
    data.exportEnvs = {};
    if (route.view === "delete") {
      data.deleteForms = {};
      data.deleteLookups = {};
    }
  } else if (route.view === "cluster-create") {
    data.clusterCreated = null;
    data.clusterCreateEnvs = await client.environments();
    data.canCreateCluster =
      s.isRoot ||
      (await client.appPermission(route.appId, "CreateCluster")).hasPermission;
  } else if (route.view === "namespace-create") {
    const [tree, publicNamespaces, namespaceApp] = await Promise.all([
      client.tree(route.appId),
      client.publicNamespaces(),
      client.app(route.appId),
    ]);
    if (tree.entities?.some((e) => e.code !== 200))
      throw Error("Environment lookup failed");
    Object.assign(data, {
      canCreateNamespace:
        s.isRoot ||
        (await client.appPermission(route.appId, "CreateNamespace"))
          .hasPermission,
      namespaceMode: "create",
      namespacePublicType: "private",
      namespacePrefix: namespaceApp.orgId ? namespaceApp.orgId + '.' : '',
      namespaceAppendPrefix: true,
      namespacePublic: publicNamespaces,
      namespaceChoices: (tree.entities || []).flatMap(({ body }) =>
        (body.clusters || []).map((cluster) => ({
          env: body.env,
          clusterName: cluster.name,
        })),
      ),
    });
  } else if (route.view === "cluster-roles") {
    const canManage =
      s.isRoot ||
      (await client.appPermission(route.appId, "AssignRole")).hasPermission;
    if (canManage && !s.readOnly && client.initializeClusterRoles)
      await client.initializeClusterRoles(route);
    const roles = await client.clusterRoleUsers(route);
    Object.assign(data, {
      roles: {
        modifyRoleUsers: roles.modifyRoleUsers || [],
        releaseRoleUsers: roles.releaseRoleUsers || [],
      },
      canManage,
      roleBuckets: {},
      userChoices: client.users ? await client.users() : [],
    });
  } else if (route.view === "permissions-env") {
    const canManage =
      s.isRoot ||
      (await client.appPermission(route.appId, "AssignRole")).hasPermission;
    if (canManage && !s.readOnly && client.initializeNamespaceRoles)
      await client.initializeNamespaceRoles(route);
    const assignments = await loadNamespaceAssignments(route, client);
    const roles = assignments.roleAssignments[route.env] || {};
    Object.assign(data, {
      ...assignments,
      canManage,
      roleBuckets: {
        ModifyNamespace: {
          env: route.env,
          users: roles.modifyRoleUsers,
        },
        ReleaseNamespace: {
          env: route.env,
          users: roles.releaseRoleUsers,
        },
      },
      userChoices: client.users ? await client.users() : [],
    });
  } else if (route.view === "instances") {
    data.instancePage = await client.instances(
      route,
      s.instancePageNumber || 0,
    );
  } else if (route.view === "release-diff") {
    data.compareReleases = await client.releases(route);
    data.releaseChanges = null;
  }
  return data;
}

export async function handleAdvancedAction(action, element, ctx, form = {}) {
  const { s, t, client, options, navigate, openDialog, render, root, notifySuccess } = ctx;
  const check = (value) => {
    if (!value) throw Error(t("denied"));
  };
  const split = (value) =>
    String(value || "")
      .split(/[,\s]+/)
      .filter(Boolean);
  const routeAtStart = s.route;
  const current = () => s.route === routeAtStart;
  const branchSelection = () => ({
    ...s.route,
    cluster: s.grayMeta.clusterName,
  });
  async function updateGrayRules(rules) {
    const scope = { ...s.route }, branch = s.grayMeta.clusterName,
      pending = s.grayBranch.itemModifiedCnt > 0 || s.grayBranch.items?.some(row => row.isModified || row.isNewlyAdded || row.isDeleted);
    await client.saveBranchRules(scope, branch, rules);
    if (!current()) return;
    await navigate(scope);
    if (s.route !== scope) return;
    s.grayTab = 'rules';
    if (pending) sourceNotice(ctx, 'updateRuleTips'); else render();
  }
  const grayEditable = () =>
    s.canModify && !s.readOnly && !s.grayBranch?.isConfigHidden;
  const grayReleasable = () =>
    s.canRelease && !s.readOnly && !s.grayBranch?.isConfigHidden;
  function typedConfirm(label, id, submit) {
    openDialog(
      label,
      `<p>${t("destructiveWarning")}</p><p><strong>${escapeHTML(id)}</strong></p>` +
        formField("confirmation", t("typeIdentifier"), "", "text", true),
      async (data) => {
        if (data.confirmation !== id) throw Error(t("identifierMismatch"));
        return submit();
      },
    );
  }
  async function mutate(task) {
    s.busy = true;
    render();
    try {
      await task();
      s.busy = false;
      await navigate(s.route);
      if (!s.error) notifySuccess();
    } finally {
      s.busy = false;
      render();
    }
  }
  function releaseDialog(title, submit, merge = false) {
    if (merge) {
      const scope = { ...s.route },
        branchNamespace = s.grayBranch;
      openDialog(
        title,
        `<p>${t("mergeContext")}</p><p>${t("afterMerge")}</p><label class="radio-label"><input type="radio" name="branchDisposition" value="delete" checked> ${t("deleteGrayAfterMerge")}</label><label class="radio-label"><input type="radio" name="branchDisposition" value="keep"> ${t("keepGrayAfterMerge")}</label>`,
        async (choice) => {
          const previous = client.latestRelease
            ? await client.latestRelease(scope)
            : null;
          openDialog(
            title,
            releaseFields(branchNamespace, previous, t),
            (data) =>
              submit(
                {
                  releaseTitle: data.title,
                  releaseComment: data.comment,
                  isEmergencyPublish: false,
                },
                { ...data, deleteBranch: choice.branchDisposition !== "keep" },
              ),
            { wide: true, confirmLabel: t("publish") },
          );
        },
        { wide: true, confirmLabel: t("confirm") },
      );
      return;
    }
    openDialog(
      title,
      formField("title", t("releaseTitle"), "", "text", true) +
        formField("comment", t("releaseComment"), "", "textarea") +
        formField("emergency", t("emergency"), false, "checkbox") +
        (merge
          ? formField(
              "deleteBranch",
              t("deleteGrayAfterMerge"),
              true,
              "checkbox",
            )
          : ""),
      (data) =>
        submit(
          {
            releaseTitle: data.title,
            releaseComment: data.comment,
            isEmergencyPublish: !!data.emergency,
          },
          data,
        ),
    );
  }
  async function saveDownload(response, fallback) {
    if (!options.saveFile) throw Error(t("saveUnavailable"));
    const result = await options.saveFile(
      downloadName(response.headers["content-disposition"], fallback),
      response,
    );
    if (result?.canceled) return;
    notifySuccess();
    render();
  }

  if (
    [
      "access-keys",
      "clusters",
      "project",
      "app-roles",
      "sync",
      "diff",
      "transfer",
      "instances",
      "release-diff",
    ].includes(action)
  ) {
    const route = {
      ...s.route,
      view: action,
      namespace: element.dataset.ns || s.route.namespace,
    };
    await navigate(route);
    return true;
  }
  if (
    [
      "consumers",
      "system-roles",
      "system-info",
      "audit",
      "global-search",
      "delete",
    ].includes(action)
  ) {
    await navigate({ view: action });
    return true;
  }
  if (action === "new-project") {
    check(s.canCreate && !s.readOnly);
    await navigate({ view: "create-project" });
    return true;
  }
  if (action === "project-settings") {
    await navigate({ ...s.route, view: "project" });
    return true;
  }
  if (action === "advance-env") {
    await navigate({ ...s.route, env: element.dataset.env });
    return true;
  }
  if (action === "new-namespace") {
    await navigate({ ...s.route, view: "namespace-create" });
    return true;
  }
  if (action === "cluster-roles") {
    await navigate({
      ...s.route,
      view: "cluster-roles",
      cluster: element.dataset.name || s.route.cluster,
      env: element.dataset.env || s.route.env,
    });
    return true;
  }
  if (action === "namespace-create-submit") {
    check(s.canCreateNamespace && !s.readOnly);
    let nextNamespace;
    if (form.mode === "link") {
      const names = s.namespacePublic
        .filter((_row, index) => form["public_" + index])
        .map((row) => row.name);
      const targets = s.namespaceChoices.filter(
        (_row, index) => form["target_" + index],
      );
      if (!names.length || !targets.length) throw Error(t("chooseSync"));
      nextNamespace = names.length === 1 ? names[0] : null;
      await client.linkNamespaces(
        s.route.appId,
        targets.flatMap((target) =>
          names.map((name) => ({
            env: target.env,
            namespace: {
              appId: s.route.appId,
              clusterName: target.clusterName,
              namespaceName: name,
            },
          })),
        ),
      );
    } else {
      if (!form.name) throw Error(t("required"));
      const created = await client.createNamespace(
        s.route,
        {
          appId: s.route.appId,
          name: form.name,
          format: form.format,
          comment: form.comment,
          isPublic: form.namespaceType === "public" || !!form.isPublic,
        },
        (form.namespaceType === "public" || !!form.isPublic) &&
          !!form.appendPrefix,
      );
      nextNamespace = created?.name || form.name;
    }
    await navigate({
      ...s.route,
      view: nextNamespace ? "permissions" : "config",
      namespace: nextNamespace || s.route.namespace,
    });
    return true;
  }
  if (action === "add-cluster-role") {
    check(s.canManage && !s.readOnly);
    openDialog(
      t("addRole"),
      formField("user", t("userId"), "", "text", true),
      (data) =>
        client.assignClusterRole(s.route, element.dataset.role, data.user),
    );
    return true;
  }
  if (action === "revoke-cluster-role") {
    check(s.canManage && !s.readOnly);
    typedConfirm(t("remove"), element.dataset.user, () =>
      client.revokeClusterRole(
        s.route,
        element.dataset.role,
        element.dataset.user,
      ),
    );
    return true;
  }
  if (action === "toggle-user") {
    check(s.isRoot && !s.readOnly);
    const user = s.users.find((user) => user.userId === element.dataset.user);
    typedConfirm(t(user.enabled ? "disable" : "enableKey"), user.userId, () =>
      client.setUserEnabled(user.userId, !user.enabled),
    );
    return true;
  }
  if (action === "favorite-project") {
    check(!s.readOnly);
    const appId = routeAtStart.appId,
      userId = s.user.userId;
    s.busy = true;
    render();
    try {
      const favorites = await client.favorites(userId, appId);
      if (!current()) return true;
      const favorite = favorites.find((row) => row?.appId === appId);
      const result = await (favorite
        ? client.unfavorite(favorite.id || favorite.favoriteId)
        : client.favorite(userId, appId));
      if (current()) {
        s.favoriteId = favorite ? null : result?.id || true;
        notifySuccess();
      }
    } finally {
      s.busy = false;
      render();
    }
    return true;
  }
  if (action === "config-db-env") {
    await navigate({ view: "server-config", paramEnv: element.dataset.env });
    return true;
  }
  if (action === "instances-next" || action === "instances-prev") {
    s.instancePageNumber = Math.max(
      0,
      (s.instancePageNumber || 0) + (action === "instances-next" ? 1 : -1),
    );
    await navigate(s.route);
    return true;
  }
  if (action === "gray-edit-item" || action === "gray-new-item") {
    check(grayEditable());
    const scope = branchSelection(), request = s.itemEditorRequest = (s.itemEditorRequest || 0) + 1,
      originDialog = s.dialog, tab = s.grayTab;
    const currentEditor = () => current() && s.itemEditorRequest === request && s.dialog === originDialog && s.grayTab === tab;
    if (client.namespaceLock) {
      try { await ctx.ensureEditLock(scope); }
      catch (error) {
        if (!currentEditor()) return true;
        if (!error.lockOwner) throw error;
        sourceNotice(ctx,'namespaceLockedDialog',null,{lockOwner:error.lockOwner});return true;
      }
      if (!currentEditor()) return true;
    }
    const inherited = element.dataset.inheritedKey
      ? s.grayMasterRows.find(row => row.item.key === element.dataset.inheritedKey && !row.isDeleted)?.item
      : null;
    if (element.dataset.inheritedKey && !inherited) throw Error(t('noData'));
    const isNew = action === 'gray-new-item' || !!inherited;
    const item = inherited ? {...inherited, id:undefined, lineNum:0} :
      action === "gray-edit-item"
        ? (s.grayBranch.items || []).find(
            (row) => String(row.item.id) === element.dataset.item,
          )?.item
        : {};
    if (!item) throw Error("Item no longer exists");
    openDialog(
      t(isNew ? "itemCreate" : "itemEdit"),
      itemEditorFields(item, t, { isNew }),
      async (data) => {
        const typed = validateItem(data, t);
        if (client.namespaceLock) await ctx.ensureEditLock(scope);
        if (!current()) return;
        return client.saveItem(
          scope,
          {
            ...item,
            ...data,
            ...typed,
            key: isNew ? data.key : item.key,
          },
          isNew,
        );
      },
      {
        wide: true,
        itemEditor: true,
        sourceId: 'itemModal',
        values: { type: String(item.type ?? 0), value: item.value ?? "" },
      },
    );
    return true;
  }
  if (action === "gray-delete-item") {
    check(grayEditable());
    const scope=branchSelection(), item=s.grayBranch.items.find(row=>String(row.item.id)===element.dataset.item)?.item,
      originDialog=s.dialog, request=s.itemEditorRequest=(s.itemEditorRequest||0)+1;
    if(!item)throw Error(t('noData'));
    try { if(client.namespaceLock)await ctx.ensureEditLock(scope); }
    catch(error){
      if(!current()||s.dialog!==originDialog||s.itemEditorRequest!==request)return true;
      if(!error.lockOwner)throw error;
      sourceNotice(ctx,'namespaceLockedDialog',null,{lockOwner:error.lockOwner});return true;
    }
    if(!current()||s.dialog!==originDialog||s.itemEditorRequest!==request)return true;
    sourceNotice(ctx,'deleteConfirmDialog',async()=>{
      if(client.namespaceLock)await ctx.ensureEditLock(scope);
      if(current())await client.deleteItem(scope,item.id);
    },{'config.key':item.key,'config.value':item.value});
    return true;
  }
  if (action === "gray-publish") {
    check(grayReleasable());
    const scope = { ...s.route }, branch = s.grayMeta.clusterName, branchScope = { ...scope, cluster: branch };
    async function showGrayPublish(emergency = false) {
      const lock = client.namespaceLock ? await client.namespaceLock(branchScope) : {};
      if (!current()) return;
      if (emergency && !lock.isEmergencyPublishAllowed) throw Error(t('emergencyNotAllowed'));
      if (!emergency && lock.lockOwner === s.user.userId) {
        openDialog(t('Component.PublishDeny.Title'), publishDeniedFields(t,scope.env,lock.isEmergencyPublishAllowed), () => sourceNotice(ctx, 'emergencyPublishAlertDialog', () => showGrayPublish(true)), { sourceId:'publishDenyModal',publishDenied:true,emergencyAllowed:lock.isEmergencyPublishAllowed,danger:true,confirmLabel:t('emergency') });
        return;
      }
      const release = client.latestRelease ? await client.latestRelease(branchScope) : null;
      if (!current()) return;
      openDialog(t('grayPublish'), releaseFields(s.grayBranch, release, t), async data => {
        if (client.namespaceLock) {
          const [fresh, actor] = await Promise.all([client.namespaceLock(branchScope), client.user()]);
          if (emergency && !fresh.isEmergencyPublishAllowed) throw Error(t('emergencyNotAllowed'));
          if (!emergency && fresh.lockOwner === actor.userId) throw Error(t('selfPublishDenied'));
        }
        await client.publishGray(scope, branch, { releaseTitle:data.title, releaseComment:data.comment, isEmergencyPublish:emergency });
        if (!current()) return;
        if (!s.grayRules?.ruleItems?.length) {
          await navigate(scope); s.grayTab = 'rules'; sourceNotice(ctx, 'grayReleaseWithoutRulesTips');
        }
      }, {sourceId:'releaseModal', wide:true, confirmLabel:t('publish')});
    }
    await showGrayPublish();
    return true;
  }
  if (action === "gray-merge") {
    check(grayEditable() && grayReleasable());
    const scope = { ...s.route },
      branch = s.grayMeta.clusterName;
    async function guard() {
      const parent = await client.namespace(scope);
      if (!current()) return false;
      if (parent.isConfigHidden) throw Error(t("hidden"));
      if (
        parent.itemModifiedCnt > 0 ||
        parent.items?.some(
          (row) => row.isModified || row.isNewlyAdded || row.isDeleted,
        )
      ) {
        sourceNotice(ctx, 'mergeAndReleaseDenyDialog');
        return false;
      }
      return true;
    }
    if (!await guard()) return true;
    if (!current()) return true;
    releaseDialog(
      t("grayMerge"),
      async (release, data) => {
        if (!await guard()) return;
        return client.mergeGray(scope, branch, release, !!data.deleteBranch);
      },
      true,
    );
    return true;
  }
  if (action === "gray-add-rule" || action === "gray-edit-rule") {
    check(grayEditable());
    const index = Number(element.dataset.index);
    const existing =
      action === "gray-edit-rule"
        ? s.grayRules.ruleItems[index]
        : { clientAppId: s.route.appId, clientIpList: [], clientLabelList: [] };
    const scope = { ...s.route }, branch = s.grayMeta.clusterName,
      draft = {
        public: !!s.grayParent?.isPublic && s.grayParent.parentAppId === s.grayParent.baseInfo.appId,
        clientAppId: existing.clientAppId,
        ips: (existing.clientIpList || []).filter(ip => ip !== '*'),
        labels: (existing.clientLabelList || []).filter(label => label !== '*'),
        all: existing.clientIpList?.[0] === '*' && existing.clientLabelList?.[0] === '*',
        instances: [], manual: false,
      };
    if (!draft.public) draft.clientAppId = scope.appId;
    openDialog(
      t("Component.GrayscalePublishRule.Title"),
      grayRuleFields(draft, t),
      (data) => {
        check(grayEditable() && current());
        const appId = draft.public ? data.clientAppId?.trim() : scope.appId;
        if (!appId || (!draft.all && !draft.ips.length && !draft.labels.length)) throw Error(t('required'));
        if (s.grayRules?.ruleItems?.some((rule, i) => rule.clientAppId === appId && (action === 'gray-add-rule' || i !== index)))
          throw Error(t('grayDuplicateApp'));
        const rules = {
          ...s.grayRules,
          ruleItems: [...(s.grayRules?.ruleItems || [])],
        };
        const item = {
          clientAppId: appId,
          clientIpList: draft.all ? ['*'] : [...draft.ips],
          clientLabelList: draft.all ? ['*'] : [...draft.labels],
        };
        if (action === "gray-edit-rule") rules.ruleItems[index] = item;
        else rules.ruleItems.push(item);
        return updateGrayRules(rules);
      },
      { wide: true, grayRule: draft, confirmLabel: t('confirm') },
    );
    const dialog = s.dialog;
    let lookup = 0;
    dialog.refreshInstances = async () => {
      const request = ++lookup, appId = draft.clientAppId;
      draft.instances = [];
      try {
        const result = appId && client.ruleInstances ? await client.ruleInstances(scope, appId) : { content: [] };
        if (!current() || s.dialog !== dialog || lookup !== request) return;
        draft.instances = [...new Set((result.content || []).map(instance => instance.ip))];
        draft.instanceError = '';
      } catch (error) {
        if (!current() || s.dialog !== dialog || lookup !== request) return;
        draft.instanceError = error.message;
      }
      const liveForm = root.querySelector('[role="dialog"] form');
      if (liveForm) dialog.values = Object.fromEntries(new root.ownerDocument.defaultView.FormData(liveForm));
      dialog.fields = grayRuleFields(draft, t);
      render();
    };
    await dialog.refreshInstances();
    return true;
  }
  if (action.startsWith('gray-rule-')) {
    check(grayEditable());
    handleGrayRuleControl(action, element, ctx);
    return true;
  }
  if (action === "gray-remove-rule") {
    check(grayEditable());
    s.busy = true; render();
    try {
      await updateGrayRules({ ...s.grayRules, ruleItems: s.grayRules.ruleItems.filter((_r, i) => i !== Number(element.dataset.index)) });
    } finally { s.busy = false; render(); }
    return true;
  }
  if (action === "gray-rules") {
    return false;
  }
  if (action === "delete-gray") {
    check(grayEditable() || grayReleasable());
    const scope = { ...s.route }, branch = s.grayMeta.clusterName;
    sourceNotice(ctx, 'deleteBranchDialog', () => client.deleteBranch(scope, branch));
    return true;
  }
  if (action === 'toggle-sync-targets' || action === 'toggle-sync-items') {
    if (action === 'toggle-sync-targets') {
      s.syncAllTargets = element.checked;
      s.syncTargets = Object.fromEntries(s.syncChoices.map((_target, index) => [index, element.checked]));
    } else {
      for (const input of root.querySelectorAll('[data-sync-item]')) s.syncKeys[input.dataset.syncItem] = element.checked;
    }
    s.syncPreview = null; s.diffMatrix = null; s.syncPreviewSignature = null;
    render();
    return true;
  }
  if (action === "sync-preview") {
    const model = syncModel(s);
    if (
      (s.route.view !== "diff" && !model.syncItems.length) ||
      model.syncToNamespaces.length < (s.route.view === "diff" ? 2 : 1)
    )
      throw Error(t("chooseSync"));
    const signature = JSON.stringify(model);
    if (s.route.view === "diff") {
      const targets = await Promise.all(
        model.syncToNamespaces.map((n) =>
          client.namespace({
            appId: n.appId,
            env: n.env,
            cluster: n.clusterName,
            namespace: n.namespaceName,
          }),
        ),
      );
      if (!current() || JSON.stringify(syncModel(s)) !== signature) return true;
      s.diffMatrix = targets.map((namespace, index) => ({
        namespace: model.syncToNamespaces[index],
        hidden: namespace.isConfigHidden,
        items: namespace.isConfigHidden ? [] : namespace.items || [],
      }));
      s.syncStep = 2;
    } else {
      check(!s.readOnly);
      const preview = await client.previewSync(s.route, model);
      if (!current() || JSON.stringify(syncModel(s)) !== signature) return true;
      s.syncPreview = preview;
      s.syncStep = 2;
      s.syncPreviewSignature = signature;
    }
    render();
    return true;
  }
  if (action === "sync-apply") {
    check(!s.readOnly);
    const model = syncModel(s);
    if (s.syncPreviewSignature !== JSON.stringify(model))
      throw Error(t("previewFirst"));
    if (s.syncPreview?.some((row) => row.extInfo)) throw Error(t("denied"));
    openDialog(
      t("syncApply"),
      `<p>${t("syncDoesNotPublish")}</p><p>${escapeHTML(model.syncToNamespaces.map((n) => n.env + "/" + n.clusterName).join(", "))}</p>`,
      () => client.applySync(s.route, model),
    );
    return true;
  }
  if (action === "create-key") {
    check(s.canManage && !s.readOnly);
    await mutate(() => client.createAccessKey(s.route));
    return true;
  }
  if (action === "reveal-key") {
    const env = element.dataset.env,
      id = element.dataset.id;
    if (!s.accessKeysByEnv?.[env]?.some(key => String(key.id) === id))
      throw Error(t("denied"));
    const identity = JSON.stringify([env, id]);
    s.revealedKeys[identity] = !s.revealedKeys[identity];
    render();
    return true;
  }
  if (action === "copy-key") {
    const key = s.accessKeys.find(
      (key) => String(key.id) === element.dataset.id,
    );
    await options.copy?.(key.secret);
    return true;
  }
  if (action === "enable-key") {
    check(s.canManage && !s.readOnly);
    openDialog(
      t("enableKey"),
      `<label class="form-field"><span>${t("keyMode")}</span><select name="mode"><option value="0">${t("keyFilter")}</option><option value="1">${t("keyNotify")}</option></select></label>`,
      (data) =>
        client.setAccessKey(
          s.route,
          element.dataset.id,
          true,
          Number(data.mode),
        ),
    );
    return true;
  }
  if (action === "disable-key" || action === "delete-key") {
    check(s.canManage && !s.readOnly);
    typedConfirm(
      t(action === "delete-key" ? "remove" : "disable"),
      String(element.dataset.id),
      () =>
        action === "delete-key"
          ? client.deleteAccessKey(s.route, element.dataset.id)
          : client.setAccessKey(s.route, element.dataset.id, false),
    );
    return true;
  }
  if (action === "delete-cluster") {
    check(s.isRoot && !s.readOnly);
    const selection = { ...s.route, env: element.dataset.env };
    typedConfirm(t("remove"), element.dataset.name, () =>
      client.deleteCluster(selection, element.dataset.name),
    );
    return true;
  }
  if (action === "open-cluster") {
    await navigate({
      ...s.route,
      view: "config",
      env: element.dataset.env,
      cluster: element.dataset.name,
    });
    return true;
  }
  if (action === "grant-system-role") {
    check(s.isRoot && !s.readOnly);
    openDialog(
      t("addRole"),
      formField("users", t("userList"), "", "text", true),
      (data) => client.grantSystemRole(split(data.users)),
    );
    return true;
  }
  if (action === "revoke-system-role") {
    check(s.isRoot && !s.readOnly);
    typedConfirm(t("remove"), element.dataset.user, () =>
      client.revokeSystemRole(element.dataset.user),
    );
    return true;
  }
  if (action === "service-health") {
    check(s.isRoot);
    const health = await client.health(element.dataset.id);
    if (!current()) return true;
    s.serviceHealth[element.dataset.id] = health;
    render();
    return true;
  }
  if (action === "audit-trace") {
    await navigate({ view: "audit-trace", traceId: element.dataset.trace });
    return true;
  }
  if (action === "audit-submit") {
    s.auditQuery = form.query || "";
    s.auditOpName = form.opName || "";
    const date = (value) =>
      value
        ? value.replace("T", " ").length === 16
          ? value.replace("T", " ") + ":00.0"
          : value.includes(".")
            ? value.replace("T", " ")
            : value.replace("T", " ") + ".0"
        : "";
    s.auditStartInput = form.startDate || "";
    s.auditEndInput = form.endDate || "";
    s.auditStart = date(form.startDate);
    s.auditEnd = date(form.endDate);
    s.auditPage = 0;
    await navigate({ view: "audit" });
    return true;
  }
  if (action === "audit-next" || action === "audit-prev") {
    s.auditPage = Math.max(
      0,
      (s.auditPage || 0) + (action === "audit-next" ? 1 : -1),
    );
    await navigate({ view: "audit" });
    return true;
  }
  if (action === "global-search-submit") {
    check(s.isRoot);
    if (!form.key && !form.value) throw Error(t("required"));
    s.globalKey = form.key;
    s.globalValue = form.value;
    const result = await client.globalSearch(form.key || "", form.value || "");
    if (!current()) return true;
    if (result.code !== 200)
      throw Error(String(result.message || "Search failed"));
    s.globalResults = result.body || [];
    s.globalWarning = result.hasMoreData ? String(result.message) : "";
    render();
    return true;
  }
  if (action === "search-open-config") {
    const row = s.globalResults[Number(element.dataset.index)];
    await navigate({
      view: "config",
      appId: row.appId,
      env: row.envName,
      cluster: row.clusterName,
      namespace: row.namespaceName,
    });
    return true;
  }
  if (action === "new-consumer") {
    check(s.isRoot && !s.readOnly);
    openDialog(
      t("newConsumer"),
      formField("appId", "AppId", "", "text", true) +
        formField("name", t("appName"), "", "text", true) +
        formField("ownerName", t("owner"), s.user.userId, "text", true) +
        `<label class="form-field"><span>${t("department")}</span><select name="orgId" required><option value="">${t("chooseDepartment")}</option>${s.organizations.map((org) => `<option value="${escapeHTML(org.orgId)}">${escapeHTML(org.orgName)}</option>`).join("")}</select></label>` +
        formField(
          "allowCreateApplication",
          t("allowCreateApplication"),
          false,
          "checkbox",
        ) +
        formField(
          "rateLimitEnabled",
          t("rateLimitEnabled"),
          false,
          "checkbox",
        ) +
        formField("rateLimit", t("rateLimit"), "0", "number") +
        formField("expires", t("expires"), "", "datetime-local"),
      (data) => {
        const org = s.organizations.find((org) => org.orgId === data.orgId);
        if (!org) throw Error(t("required"));
        const rate = Number(data.rateLimit);
        if (
          data.rateLimitEnabled &&
          (!Number.isInteger(rate) || rate < 1 || rate > 2147483647)
        )
          throw Error(t("invalidRateLimit"));
        const expires = data.expires
          ? data.expires.replace(/\D/g, "").padEnd(14, "0")
          : "";
        return client.createConsumer(
          {
            appId: data.appId,
            name: data.name,
            ownerName: data.ownerName,
            orgId: org.orgId,
            orgName: org.orgName,
            allowCreateApplication: !!data.allowCreateApplication,
            rateLimitEnabled: !!data.rateLimitEnabled,
            rateLimit: data.rateLimitEnabled ? rate : 0,
          },
          expires,
        );
      },
    );
    return true;
  }
  if (action === "reveal-consumer") {
    s.revealedConsumers[element.dataset.id] =
      !s.revealedConsumers[element.dataset.id];
    render();
    return true;
  }
  if (action === "copy-consumer") {
    const consumer = s.consumers.find((c) => c.appId === element.dataset.id);
    await options.copy?.(consumer.token);
    return true;
  }
  if (action === "assign-consumer") {
    check(s.isRoot && !s.readOnly);
    const consumer = s.consumers.find(
      (consumer) => consumer.appId === element.dataset.id,
    );
    const [credential, envs] = await Promise.all([
      client.consumerToken(consumer.appId),
      client.environments(),
    ]);
    if (!current()) return true;
    if (!credential?.token) throw Error(t("noData"));
    openDialog(
      t("Open.Manage.GrantPermission"),
      `<div class="form-field"><span><b>*</b> Token</span><input type="text" data-dialog-token value="${escapeHTML(credential.token)}" readonly></div>` +
        formField("appId", t("managedAppId"), "", "text", true) +
        formField("namespace", t("Open.Manage.ManagedNamespace"), "") +
        `<p class="reference-field-hint">${t('Open.Manage.ManagedNamespaceTips')}</p><div class="form-field"><span>${t("Open.Manage.GrantType")}</span><label><input type="radio" name="type" value="NamespaceRole" checked> Namespace</label><label><input type="radio" name="type" value="AppRole"> App</label></div><div class="form-field"><span>${t("environment")}</span><div>${envs.map((env) => `<label class="checkbox-label"><input type="checkbox" name="env_${escapeHTML(env)}"> ${escapeHTML(env)}</label>`).join("")}<small>${t('Open.Manage.GrantEnvTips')}</small></div></div><div class="reference-form-actions"><button type="button" class="btn btn-primary" data-action="submit-form">${t('submit')}</button></div>`,
      (data) => {
        if (data.type === "NamespaceRole" && !data.namespace)
          throw Error(t("required"));
        return client.assignConsumer(
          credential.token,
          data.type,
          envs.filter((env) => data["env_" + env]),
          { appId: data.appId, namespaceName: data.namespace },
        );
      },
      { wide: true, sourceId:'grantPermissionModal', inlineSubmit:true, subtitle:t('Open.Manage.GrantPermissionTips') },
    );
    return true;
  }
  if (action === "delete-consumer") {
    check(s.isRoot && !s.readOnly);
    const consumer = s.consumers.find(row=>row.appId===element.dataset.id);
    if (!consumer) throw Error(t('noData'));
    sourceNotice(ctx,'deleteConsumerDialog',()=>client.deleteConsumer(consumer.appId),{
      'toOperationConsumer.appId':consumer.appId,'toOperationConsumer.name':consumer.name,
    });
    return true;
  }
  if (action === "consumer-next" || action === "consumer-prev") {
    s.consumerPage = Math.max(
      0,
      (s.consumerPage || 0) + (action === "consumer-next" ? 1 : -1),
    );
    await navigate({ view: "consumers" });
    return true;
  }
  if (action === "export-all") {
    check(s.isRoot);
    const envs = Object.keys(s.exportEnvs).filter((env) => s.exportEnvs[env]);
    if (!envs.length) throw Error(t("chooseEnvironment"));
    await saveDownload(await client.exportConfigs(envs), "apollo-configs.zip");
    return true;
  }
  if (action === "export-cluster") {
    await saveDownload(
      await client.exportConfigs([], s.route),
      s.route.appId + ".zip",
    );
    return true;
  }
  if (action === "export-namespace") {
    const selection = { ...s.route, namespace: element.dataset.ns };
    await saveDownload(
      await client.exportNamespace(selection),
      selection.namespace + ".properties",
    );
    return true;
  }
  if (action === "import-namespace") {
    const selection = { ...s.route, namespace: element.dataset.ns };
    check(!s.readOnly && s.permissions[selection.namespace]?.modify);
    openDialog(
      t("ConfigImport.Title"),
      `<div class="reference-hint"><strong>${t('Config.Note')}:</strong><ul>${[1,2,3].map(index=>`<li>${t('ConfigImport.Tip'+index)}</li>`).join('')}</ul></div>` + formField("file", t("ConfigExport.UploadFile"), "", "file", true),
      (data) => client.importNamespace(selection, data.file),
      {sourceId:'importNamespaceModal'},
    );
    return true;
  }
  if (action === "import-all") {
    check(s.isRoot && !s.readOnly);
    const envs = Object.keys(s.exportEnvs).filter((env) => s.exportEnvs[env]);
    if (!envs.length) throw Error(t("chooseEnvironment"));
    openDialog(
      t("importConfig"),
      `<p>${t("importWarning")}</p>` +
        formField("file", t("file"), "", "file", true) +
        `<label class="form-field"><span>${t("conflictAction")}</span><select name="conflict"><option value="ignore">${t("ignore")}</option><option value="cover">${t("overwrite")}</option></select></label>`,
      (data) => client.importConfigs(data.file, envs, data.conflict),
    );
    return true;
  }
  if (action === "import-cluster") {
    check(s.canManage && !s.readOnly);
    openDialog(
      t("importConfig"),
      `<p>${t("importWarning")}</p>` +
        formField("file", t("file"), "", "file", true) +
        `<label class="form-field"><span>${t("conflictAction")}</span><select name="conflict"><option value="ignore">${t("ignore")}</option><option value="cover">${t("overwrite")}</option></select></label>`,
      (data) => client.importConfigs(data.file, [], data.conflict, s.route),
    );
    return true;
  }
  if (action === "delete-resource-submit") {
    check(s.isRoot && !s.readOnly);
    const selection = {
      appId: form.appId,
      env: form.env,
      cluster: form.cluster,
      namespace: form.namespace,
    };
    if (!selection.appId) throw Error(t("required"));
    let id = selection.appId,
      submit = () => client.deleteApp(id);
    if (form.kind === "cluster") {
      if (!selection.env || !selection.cluster) throw Error(t("required"));
      id = selection.cluster;
      submit = () => client.deleteCluster(selection, selection.cluster);
    } else if (form.kind === "namespace") {
      if (!selection.namespace) throw Error(t("required"));
      id = selection.namespace;
      submit = () => client.deleteNamespace(selection);
    }
    typedConfirm(t("deleteResource"), id, submit);
    return true;
  }
  if (action === "role-env") {
    await navigate({
      ...s.route,
      view: element.dataset.env ? "permissions-env" : "permissions",
      env: element.dataset.env || s.route.env,
    });
    return true;
  }
  if (action === "add-role" && s.route.view === "permissions-env") {
    check(s.canManage && !s.readOnly);
    openDialog(
      t("addRole") + " " + s.route.env,
      formField("user", t("userId"), "", "text", true),
      (data) => client.assignEnvRole(s.route, element.dataset.role, data.user),
    );
    return true;
  }
  if (action === "revoke-role" && s.route.view === "permissions-env") {
    check(s.canManage && !s.readOnly);
    typedConfirm(t("remove"), element.dataset.user, () =>
      client.revokeEnvRole(s.route, element.dataset.role, element.dataset.user),
    );
    return true;
  }
  if (action === "save-project-submit") {
    const isNew = s.route.view === "create-project";
    check(!s.readOnly && (isNew ? s.canCreate : s.canManage));
    const organization = (s.organizations || []).find(
      (o) => o.orgId === form.orgId,
    );
    const model = {
      appId: isNew ? form.appId : s.advApp.appId,
      name: form.name,
      orgId: form.orgId,
      orgName: organization?.orgName || form.orgName || s.advApp?.orgName,
      ownerName: form.ownerName,
      admins: split(form.admins),
    };
    if (!model.appId || !model.orgName) throw Error(t("required"));
    await client.saveApp(model, isNew);
    await navigate({ view: "config", appId: model.appId });
    return true;
  }
  if (action === "app-add-admin") {
    check(s.canManage && !s.readOnly);
    openDialog(
      t("addRole"),
      formField("user", t("userId"), "", "text", true),
      (data) => client.assignAppAdmin(s.route.appId, data.user),
    );
    return true;
  }
  if (action === "app-remove-admin") {
    check(s.canManage && !s.readOnly);
    if ((s.appRoles?.masterUsers || []).length <= 1) {
      sourceNotice(ctx, 'warning');
      return true;
    }
    await mutate(() => client.revokeAppAdmin(s.route.appId, element.dataset.user));
    return true;
  }
  if (action === "project-delete") {
    check(s.isRoot && !s.readOnly);
    typedConfirm(t("deleteResource"), s.route.appId, async () => {
      await client.deleteApp(s.route.appId);
      s.route = { view: "home" };
    });
    return true;
  }
  if (action === "namespace-delete") {
    check((s.isRoot || s.canManage) && !s.readOnly);
    const selection = { ...s.route, namespace: element.dataset.ns };
    const namespace = s.namespaces.find(ns => ns.baseInfo.namespaceName === selection.namespace);
    if (!namespace) throw Error(t('noData'));
    selection.isLinkedNamespace = !!(namespace.parentAppId && namespace.parentAppId !== selection.appId);
    const usage = client.namespaceUsage ? await client.namespaceUsage(selection) : [];
    if (!current()) return true;
    const inUse = rows => !selection.isLinkedNamespace ? rows.length > 0 : rows.some(row => row.instanceCount > 0 || row.branchInstanceCount > 0 || row.linkedNamespaceCount > 0);
    const signature = rows => JSON.stringify(rows.map(row => [row.envName,row.clusterName,row.namespaceName,row.instanceCount||0,row.branchInstanceCount||0,row.linkedNamespaceCount||0]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
    function showDelete(rows) {
      const force = inUse(rows), publicOwner = namespace.isPublic && !selection.isLinkedNamespace;
      const usagePanel = force ? `<div class="namespace-delete-usage"><h5 class="force-delete-warning">${t('Component.DeleteNamespace.ForceDeleteContent')}</h5><table class="reference-table"><thead><tr>${[t('Common.Environment'),t('Common.Cluster'),t('Common.Namespace'),t('Common.Instance'),t('Common.GrayscaleInstance'),...(publicOwner ? [t('Common.LinkedNamespace')] : [])].map(label=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><td>${escapeHTML(row.envName)}</td><td>${escapeHTML(row.clusterName)}</td><td>${escapeHTML(row.namespaceName)}</td><td>${escapeHTML(row.instanceCount)}</td><td>${escapeHTML(row.branchInstanceCount)}</td>${publicOwner ? `<td>${escapeHTML(row.linkedNamespaceCount)}</td>` : ''}</tr>`).join('')}</tbody></table></div>` : '';
      openDialog(t('Component.DeleteNamespace.Title'), t(selection.isLinkedNamespace ? 'Component.DeleteNamespace.LinkedContent' : namespace.isPublic ? 'Component.DeleteNamespace.PublicContent' : 'Component.DeleteNamespace.PrivateContent'),
        async () => {
          const fresh = client.namespaceUsage ? await client.namespaceUsage(selection) : rows;
          if (inUse(fresh) && (!force || signature(fresh) !== signature(rows))) { showDelete(fresh); return; }
          return selection.isLinkedNamespace ? client.deleteLinkedNamespace(selection) : client.deleteNamespace(selection);
        }, { sourceId:'deleteNamespaceModal',afterBody:usagePanel, danger:true, confirmLabel:t(force ? 'forceDelete' : 'confirm'), wide:true });
    }
    showDelete(usage);
    return true;
  }
  if (action === "release-compare-submit") {
    if (form.from === form.to) throw Error(t("differentVersions"));
    const changes = await client.compareReleases(
      s.route.env,
      form.from,
      form.to,
    );
    if (!current()) return true;
    s.releaseChanges = changes;
    render();
    return true;
  }
  if (action === "rollback-to") {
    check(s.canRelease && !s.readOnly);
    const scope = { ...s.route }, targetId = element.dataset.release,
      request = s.rollbackRequest = (s.rollbackRequest || 0) + 1,
      selected = s.historySelected, originDialog = s.dialog;
    const currentRollback = () => current() && s.rollbackRequest === request && s.historySelected === selected && s.dialog === originDialog;
    try {
    const [active, target] = await Promise.all([
      client.latestRelease(scope), client.release(scope.env, targetId),
    ]);
    if (!currentRollback()) return true;
    if (!active) throw Error(t("noRelease"));
    if (!target || target.isAbandoned) throw Error(t('denied'));
    if (active.id === target.id) throw Error(t('Rollback.SameAsCurrentRelease'));
    const comparison = await client.compareReleases(scope.env, active.id, target.id);
    if (!currentRollback()) return true;
    openDialog(`${active.name || active.id} → ${target.name || target.id}`, `<p class="limit-warning">${t('Component.RollbackTo.Tips')}</p>` + comparisonTable(comparison,t),
      () => sourceNotice(ctx,'rollbackAlertDialog',()=>client.rollbackTo(scope.env,active.id,target.id)),
      {sourceId:'rollbackModal',wide:true,confirmLabel:t('rollback'),danger:true});
    return true;
    } catch (error) {
      if (!currentRollback()) return true;
      throw error;
    }
  }
  return false;
}
