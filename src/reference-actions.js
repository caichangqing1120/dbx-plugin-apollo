import { downloadName } from "./transfer.js";
import { escapeHTML as e, formField as field } from "./ui.js";

export const referenceActions = new Set([
  "new-user",
  "edit-user",
  "save-user-submit",
  "cancel-inline",
  "new-server-config",
  "edit-server-config",
  "save-config-submit",
  "filter-users",
  "reset-users",
  "filter-parameters",
  "reset-parameters",
  "edit-project",
  "app-admin-inline",
  "grant-system-inline",
  "master-lookup",
  "allow-master",
  "forbid-master",
  "delete-query",
  "delete-queried",
  "new-cluster",
  "cluster-create-submit",
  "key-create-inline",
  "enable-key",
  "observe-key",
  "disable-key",
  "delete-key",
  "copy-key",
  "role-inline",
  "role-inline-remove",
  "consumer-create",
  "new-consumer",
  "consumer-lookup",
  "consumer-create-submit",
  "consumer-grant-inline",
  "reveal-created-token",
  "trace-select",
  "trace-field",
  "trace-more",
  "namespace-mode",
  "transfer-tab",
  "transfer-query",
  "transfer-import-submit",
  "transfer-cluster-import",
  "export-transfer-cluster",
]);
const selection = (model) => ({
  appId: model.appId || "",
  env: model.env || "",
  cluster: model.cluster || "",
  namespace: model.namespace || "",
});
const identity = (kind, model) =>
  JSON.stringify([kind, ...Object.values(selection(model))]);
export async function handleReferenceAction(action, element, ctx, data = {}) {
  const { s, t, client, navigate, render, openDialog, root, options } = ctx,
    route = s.route;
  const check = (value) => {
    if (!value) throw Error(t("denied"));
  };
  const confirm = (title, content, submit) =>
    openDialog(title, content, submit, {
      danger: true,
      confirmLabel: t("confirm"),
    });
  if (action === "cancel-inline") {
    s.userEdit = null;
    s.configEdit = null;
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "new-user" || action === "edit-user") {
    const existing = action === "edit-user",
      user = existing
        ? s.users.find((user) => user.userId === element.dataset.user)
        : {};
    check(
      !s.readOnly && (s.isRoot || (existing && user?.userId === s.user.userId)),
    );
    s.userEdit = { ...(user || {}), existing };
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "save-user-submit") {
    check(!s.readOnly && (s.isRoot || s.userEdit?.userId === s.user.userId));
    if (data.password !== data.confirmPassword)
      throw Error(t("passwordMismatch"));
    const existing = !!s.userEdit?.existing,
      username = existing ? s.userEdit.userId : data.username;
    await client.saveUser(
      {
        username,
        userDisplayName: data.userDisplayName,
        email: data.email,
        password: data.password,
        enabled: s.isRoot ? (data.enabled ? 1 : 0) : (s.userEdit?.enabled ?? 1),
      },
      !existing,
    );
    s.userEdit = null;
    await navigate(route);
    return;
  }
  if (action === "new-server-config" || action === "edit-server-config") {
    check(s.isRoot && !s.readOnly);
    s.configEdit =
      action === "edit-server-config"
        ? { ...s.serverConfigs[Number(element.dataset.config)] }
        : {};
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "save-config-submit") {
    check(s.isRoot && !s.readOnly);
    await client.saveServerConfig(
      {
        ...s.configEdit,
        key: data.key,
        value: data.value,
        comment: data.comment,
      },
      s.route.paramEnv || "portal",
    );
    s.configEdit = null;
    await navigate(route);
    return;
  }
  if (action === "filter-users" || action === "filter-parameters") {
    render();
    return;
  }
  if (action === "reset-users") {
    s.userFilter = "";
    render();
    return;
  }
  if (action === "reset-parameters") {
    s.configFilter = "";
    render();
    return;
  }
  if (action === "edit-project") {
    check(!s.readOnly && s.canManage);
    s.projectEditing = true;
    render();
    return;
  }
  if (action === "app-admin-inline") {
    check(!s.readOnly && s.canManage);
    if (!data.user) throw Error(t("required"));
    await client.assignAppAdmin(route.appId, data.user);
    await navigate(route);
    return;
  }
  if (action === "grant-system-inline") {
    check(s.isRoot && !s.readOnly);
    const users = String(data.users || "")
      .split(/[,\s]+/)
      .filter(Boolean);
    if (!users.length) throw Error(t("required"));
    await client.grantSystemRole(users);
    await navigate(route);
    return;
  }
  if (action === "master-lookup") {
    check(s.isRoot);
    s.masterLookup = null;
    const app = await client.app(data.appId);
    if (s.route !== route) return;
    s.masterLookup = app;
    render();
    return;
  }
  if (action === "allow-master" || action === "forbid-master") {
    check(s.isRoot && !s.readOnly);
    const app = s.masterLookup,
      section = root.querySelector("[data-system-master]"),
      user = section.querySelector("[name=user]").value,
      appId = section.querySelector("[name=appId]").value;
    if (!app || app.appId !== appId || !user) throw Error(t("queryFirst"));
    confirm(
      t(action === "allow-master" ? "allowMaster" : "forbidMaster"),
      `<p>${e(app.appId)} / ${e(user)}</p>`,
      () => client.manageMaster(app.appId, user, action === "allow-master"),
    );
    return;
  }
  if (action === "delete-query") {
    check(s.isRoot);
    const kind = data.kind;
    if (!["app", "cluster", "namespace"].includes(kind))
      throw Error(t("required"));
    s.deleteForms = { ...s.deleteForms, [kind]: selection(data) };
    s.deleteLookups = { ...s.deleteLookups, [kind]: null };
    const target = selection(data),
      resource =
        kind === "app"
          ? await client.app(target.appId)
          : kind === "cluster"
            ? await client.cluster(target)
            : await client.appNamespace(target.appId, target.namespace);
    if (
      s.route !== route ||
      identity(kind, s.deleteForms[kind]) !== identity(kind, target)
    )
      return;
    s.deleteLookups[kind] = {
      identity: identity(kind, target),
      selection: target,
      resource,
    };
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "delete-queried") {
    check(s.isRoot && !s.readOnly);
    const kind = element.dataset.kind,
      lookup = s.deleteLookups?.[kind],
      form = root.querySelector(`[data-delete-kind="${kind}"]`),
      model = Object.fromEntries(
        new root.ownerDocument.defaultView.FormData(form),
      );
    if (!lookup || lookup.identity !== identity(kind, model))
      throw Error(t("queryFirst"));
    const target = { ...lookup.selection };
    confirm(
      t("deleteResource"),
      `<p>${t("destructiveWarning")}</p><pre>${e(JSON.stringify(lookup.resource, null, 2))}</pre>`,
      () =>
        kind === "app"
          ? client.deleteApp(target.appId)
          : kind === "cluster"
            ? client.deleteCluster(target, target.cluster)
            : client.deleteNamespace(target),
    );
    return;
  }
  if (action === "new-cluster") {
    check(s.canCreateCluster && !s.readOnly);
    await navigate({ ...route, view: "cluster-create" });
    return;
  }
  if (action === "cluster-create-submit") {
    check(s.canCreateCluster && !s.readOnly);
    const envs = (s.clusterCreateEnvs || []).filter(
      (env) => data["env_" + env],
    );
    if (!envs.length) throw Error(t("chooseEnvironment"));
    const created = [];
    for (const env of envs) {
      try {
        await client.createCluster(
          { ...route, env },
          { name: data.name, comment: data.comment, appId: route.appId },
        );
        created.push(env);
        if (s.route === route && s.advancedFormValues)
          s.advancedFormValues.data["env_" + env] = false;
      } catch (error) {
        if (s.route !== route) return;
        throw Error(
          `${created.join(", ")} ${created.length ? t("createdSuccessfully") : ""}; ${env}: ${error.message}`,
        );
      }
    }
    if (s.route !== route) return;
    s.clusterCreated = { name: data.name, environments: created };
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "key-create-inline") {
    check(s.canManage && !s.readOnly);
    if (!s.advTree.some((node) => node.env === data.env))
      throw Error(t("chooseEnvironment"));
    await client.createAccessKey({ ...route, env: data.env });
    await navigate(route);
    return;
  }
  if (
    [
      "enable-key",
      "observe-key",
      "disable-key",
      "delete-key",
      "copy-key",
    ].includes(action)
  ) {
    const env = element.dataset.env || route.env,
      scope = { ...route, env },
      key = (s.accessKeysByEnv?.[env] || s.accessKeys || []).find(
        (key) => String(key.id) === element.dataset.id,
      );
    if (!key) throw Error(t("noData"));
    if (action === "copy-key") {
      await options.copy?.(key.secret);
      return;
    }
    check(s.canManage && !s.readOnly);
    confirm(
      t(
        action === "delete-key"
          ? "remove"
          : action === "disable-key"
            ? "disable"
            : action === "observe-key"
              ? "keyNotify"
              : "enableKey",
      ),
      `<p>${e(route.appId)} / ${e(env)} / #${e(key.id)}</p>`,
      () =>
        action === "delete-key"
          ? client.deleteAccessKey(scope, key.id)
          : client.setAccessKey(
              scope,
              key.id,
              action !== "disable-key",
              action === "observe-key" ? 1 : 0,
            ),
    );
    return;
  }
  if (action === "role-inline" || action === "role-inline-remove") {
    check(s.canManage && !s.readOnly);
    const role = data.role || element.dataset.role,
      env = data.env ?? element.dataset.env ?? "",
      user = data.user || element.dataset.user;
    const cluster = route.view === "cluster-roles",
      allowed = cluster
        ? ["ModifyNamespacesInCluster", "ReleaseNamespacesInCluster"]
        : ["ModifyNamespace", "ReleaseNamespace"];
    if (!allowed.includes(role) || !user) throw Error(t("required"));
    const checkScope = () => {
      check(s.canManage && !s.readOnly && s.route === route);
      if (!cluster) {
        const bucket = s.roleBuckets?.[role];
        check(!bucket?.pending);
        if (action === 'role-inline') check((bucket?.env || '') === env);
        else {
          const users = s.roleAssignments?.[env]?.[role === 'ModifyNamespace' ? 'modifyRoleUsers' : 'releaseRoleUsers'];
          check(users?.some(candidate => (candidate.userId || candidate) === user));
        }
      }
    };
    checkScope();
    const scope = { ...route, env: env || route.env };
    const apply = () => {
      checkScope();
      return cluster
        ? action === "role-inline"
          ? client.assignClusterRole(scope, role, user)
          : client.revokeClusterRole(scope, role, user)
        : env
          ? action === "role-inline"
            ? client.assignEnvRole(scope, role, user)
            : client.revokeEnvRole(scope, role, user)
          : action === "role-inline"
            ? client.assignRole(scope, role, user)
            : client.revokeRole(scope, role, user);
    };
    if (action === "role-inline-remove") {
      confirm(
        t("remove"),
        `<p>${e(user)} / ${e(env || t("allEnvs"))}</p>`,
        apply,
      );
      return;
    }
    await apply();
    await navigate(route);
    if (!cluster && s.route === route) {
      s.roleBuckets = { ...s.roleBuckets, [role]: { env } };
      render();
    }
    return;
  }
  if (action === "trace-select") {
    check(s.isRoot);
    s.traceSelected = element.dataset.span;
    s.traceRelated = [];
    s.traceRelatedScope = null;
    s.traceRelatedPage = 0;
    render();
    return;
  }
  if (action === "trace-field" || action === "trace-more") {
    check(s.isRoot);
    if (s.traceLoading) return;
    const detail = (s.auditDetails || []).find(
      (detail, index) =>
        ((detail.logDTO || detail).spanId || "__span_" + index) ===
        s.traceSelected,
    );
    const influences =
      detail?.dataInfluenceDTOList || detail?.dataInfluences || [];
    const item =
      action === "trace-field"
        ? influences[Number(element.dataset.index)]
        : s.traceRelatedScope;
    if (!item || item.influenceEntityId === "AnyMatched") return;
    const selected = s.traceSelected,
      page = action === "trace-more" ? (s.traceRelatedPage || 0) + 1 : 0;
    s.traceLoading = true;
    render();
    try {
      const rows = await client.auditFieldHistory(
        item.influenceEntityName,
        item.influenceEntityId,
        item.fieldName,
        page,
      );
      if (s.route !== route || s.traceSelected !== selected) return;
      s.traceRelated = page ? [...s.traceRelated, ...rows] : rows;
      s.traceRelatedScope = item;
      s.traceRelatedPage = page;
    } finally {
      s.traceLoading = false;
      render();
    }
    return;
  }
  if (action === "namespace-mode") {
    s.namespaceMode = element.dataset.mode;
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "transfer-tab") {
    s.transferTab = element.dataset.tab;
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "transfer-query") {
    const target = { appId: data.appId, env: data.env, cluster: data.cluster };
    s.transferLookup = null;
    s.transferSelection = target;
    const resource = await client.cluster(target),
      allowed =
        s.isRoot ||
        (await client.appPermission(target.appId, "AssignRole")).hasPermission;
    if (
      s.route !== route ||
      JSON.stringify(s.transferSelection) !== JSON.stringify(target)
    )
      return;
    s.transferLookup = resource;
    s.transferCanManage = allowed;
    s.advancedFormValues = null;
    render();
    return;
  }
  if (
    action === "export-transfer-cluster" ||
    action === "transfer-cluster-import"
  ) {
    const target = s.transferSelection,
      query = root.querySelector("[data-transfer-query]"),
      currentValues = query
        ? Object.fromEntries(new root.ownerDocument.defaultView.FormData(query))
        : {};
    if (
      !target ||
      !s.transferLookup ||
      !s.transferCanManage ||
      ["appId", "env", "cluster"].some(
        (key) => target[key] !== currentValues[key],
      )
    )
      throw Error(t("queryFirst"));
    if (action === "transfer-cluster-import") {
      check(!s.readOnly);
      await client.importConfigs(data.file, [], data.conflict, target);
      s.advancedFormValues = null;
      s.success = true;
      render();
      return;
    }
    if (!options.saveFile) throw Error(t("saveUnavailable"));
    const response = await client.exportConfigs([], target),
      result = await options.saveFile(
        downloadName(
          response.headers["content-disposition"],
          "apollo-configs.zip",
        ),
        response,
      );
    if (!result?.canceled) s.success = true;
    render();
    return;
  }
  if (action === "transfer-import-submit") {
    check(s.isRoot && !s.readOnly);
    const envs = s.transferEnvs.filter((env) => data["import_" + env]);
    if (!envs.length) throw Error(t("chooseEnvironment"));
    await client.importConfigs(data.file, envs, data.conflict);
    s.advancedFormValues = null;
    s.success = true;
    render();
    return;
  }
  if (action === "consumer-create" || action === "new-consumer") {
    check(s.isRoot && !s.readOnly);
    await navigate({ view: "consumer-create" });
    return;
  }
  if (action === "consumer-lookup") {
    check(s.isRoot);
    const token = await client.consumerToken(data.lookupAppId);
    if (s.route !== route) return;
    if (!token?.token) throw Error(t("noData"));
    s.consumerCredential = token;
    s.consumerAppId = data.lookupAppId;
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "consumer-create-submit") {
    check(s.isRoot && !s.readOnly);
    if (!data.appId?.trim()) throw Error(t('required'));
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
    await client.createConsumer(
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
    const token = await client.consumerToken(data.appId);
    if (s.route !== route) return;
    s.consumerCredential = token;
    s.consumerAppId = data.appId;
    s.advancedFormValues = null;
    render();
    return;
  }
  if (action === "reveal-created-token") {
    s.showConsumerToken = !s.showConsumerToken;
    render();
    return;
  }
  if (action === "consumer-grant-inline") {
    check(s.isRoot && !s.readOnly);
    if (!s.consumerCredential?.token) throw Error(t("queryFirst"));
    if (data.type === "NamespaceRole" && !data.namespace)
      throw Error(t("required"));
    await client.assignConsumer(
      s.consumerCredential.token,
      data.type,
      (s.consumerEnvs || []).filter((env) => data["env_" + env]),
      { appId: data.managedAppId, namespaceName: data.namespace },
    );
    s.success = true;
    render();
    return;
  }
}
