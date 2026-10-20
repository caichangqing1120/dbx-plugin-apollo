import { translator } from "./i18n.js";
import { renderPortal } from "./views.js";
import { createAppSearch } from './app-search.js';
import { selectedHistory, historyBaseReleaseId } from "./history.js";
import { loadNamespaceAssignments } from "./roles.js";
import { sourceNotice, publishDeniedFields } from "./notices.js";
import { syncUserPickers, userPickerInput, userPickerAction, userPickerKey } from './user-picker.js';
import { handleGrayRuleControl } from "./gray-rules.js";
import { formField, escapeHTML, configTypeField } from "./ui.js";
import {
  itemEditorFields,
  itemValueField,
  validateItem,
  releaseFields,
  comparisonTable,
  formatJSONUniqueKeys,
} from "./editor.js";
import {
  referenceActions,
  handleReferenceAction,
} from "./reference-actions.js";
import {
  advancedRouteNames,
  loadAdvancedRoute,
  handleAdvancedAction,
  isAdvancedAction,
} from "./advanced.js";

export function createPortalApp(root, options) {
  const doc = root.ownerDocument,
    win = doc.defaultView,
    client = options.client;
  const jobs = new Set();
  let revision = 0,
    commitRevision = {},
    roleRevision = {},
    disposed = false;
  let successTimer = null, successNotice = null, successRevision = 0, appSearch;
  const s = {
    route: { view: "home" },
    homeTab: "mine",
    locale: options.locale || "zh-CN",
    user: null,
    isRoot: false,
    canCreate: false,
    canManage: false,
    readOnly: !!options.readOnly,
    apps: [],
    favorites: [],
    publicNamespaces: [],
    recent: [],
    envTree: [],
    namespaces: [],
    permissions: {},
    filters: {},
    modes: {},
    drafts: {},
    commits: {},
    commitFilters: {},
    filterOpen: {},
    history: [],
    releases: [],
    users: [],
    serverConfigs: [],
    loading: false,
    error: "",
    success: false,
    dialog: null,
    busy: false,
    hasMore: false,
    page: 0,
  };
  const t = (key) => translator(s.locale)(key);
  const formRouteKey = (route) =>
    JSON.stringify([
      route.view,
      route.appId,
      route.env,
      route.cluster,
      route.namespace,
      route.paramEnv,
      route.traceId,
    ]);
  function restoreValues(form, values) {
    if (!form) return;
    for (const [key, value] of Object.entries(values))
      for (const input of form.querySelectorAll(`[name="${key}"]`)) {
        if (input.type === "file") continue;
        if (input.type === "radio")
          input.checked = input.value === String(value);
        else if (input.type === "checkbox") input.checked = !!value;
        else input.value = value;
      }
  }
  function render() {
    if (disposed) return;
    appSearch?.reset();
    root.innerHTML = renderPortal(s, t, options.logo || "");
    successNotice = root.querySelector('.notice.success');
    if (s.dialog?.values) {
      restoreValues(root.querySelector("[role=dialog] form"), s.dialog.values);
    }
    if (s.advancedFormValues?.routeKey === formRouteKey(s.route)) {
      const targetForm = root.querySelectorAll('[data-form="advanced"]')[
        s.advancedFormValues.formIndex || 0
      ];
      restoreValues(targetForm, s.advancedFormValues.data);
    }
    if (s.busy)
      for (const control of root.querySelectorAll(
        "button,input,select,textarea",
      ))
        control.disabled = true;
    syncUserPickers(root);
    const namespaceMode = root.querySelector("[data-namespace-mode]");
    if (namespaceMode)
      for (const section of root.querySelectorAll("[data-namespace-section]"))
        section.hidden =
          section.dataset.namespaceSection !== namespaceMode.value;
  }
  function clearSuccess() {
    successRevision++;
    if (successTimer !== null) win.clearTimeout(successTimer);
    successTimer = null;
    successNotice?.remove();
    successNotice = null;
    s.success = false;
  }
  function notifySuccess() {
    if (disposed) return;
    clearSuccess();
    s.success = true;
    const ticket = successRevision;
    successTimer = win.setTimeout(() => {
      if (disposed || ticket !== successRevision) return;
      successTimer = null;
      s.success = false;
      // Expiry must not recreate editors or disturb unsaved fields and focus.
      successNotice?.remove();
      successNotice = null;
    }, 5000);
  }
  function fail(error) {
    s.error = error.message || String(error);
    s.expired =
      error.status === 401 ||
      error.code === -32001 ||
      String(error.message).includes("Apollo connection is not active");
    clearSuccess();
    render();
  }
  function run(task) {
    clearSuccess();
    const promise = (async () => {
      try {
        return await task();
      } catch (error) {
        fail(error);
      }
    })();
    jobs.add(promise);
    promise.finally(() => jobs.delete(promise));
    return promise;
  }
  const selected = (name) => ({
    ...s.route,
    namespace: name || s.route.namespace,
  });
  function persist() {
    return options.storage?.set("native:" + options.connectionId, {
      route: s.route,
      recent: s.recent,
      locale: s.locale,
    });
  }
  async function loadRoute(route) {
    const ticket = ++revision;
    s.loading = true;
    s.error = "";
    clearSuccess();
    render();
    try {
      const data = {};
      if (advancedRouteNames.has(route.view)) {
        Object.assign(data, await loadAdvancedRoute(route, s, client));
      } else if (route.view === "home") {
        const [apps, favorites, publicNamespaces] = await Promise.all([
          client.apps(),
          client.favorites(s.user.userId),
          client.publicNamespaces(),
        ]);
        Object.assign(data, {
          apps,
          favorites,
          publicNamespaces,
          page: 0,
          hasMore: apps.length === 10,
          searchResults: null,
        });
      } else if (route.view === "config") {
        const [app, tree] = await Promise.all([
          client.app(route.appId),
          client.tree(route.appId),
        ]);
        const failed = (tree.entities || []).find(
          (entity) => entity.code !== 200,
        );
        if (failed)
          throw Error(
            failed.message || "An Apollo environment could not be loaded",
          );
        const envTree = (tree.entities || []).map((entity) => entity.body);
        route = {
          ...route,
          env: route.env || envTree[0]?.env,
          cluster: route.cluster || "default",
        };
        if (!route.env)
          throw Error("Apollo returned no accessible environment");
        const namespaces = await Promise.all((await client.namespaces(route)).map(async ns => ({
          ...ns,
          lockOwner: client.namespaceLock
            ? (await client.namespaceLock({...route, namespace: ns.baseInfo.namespaceName})).lockOwner || ''
            : '',
        })));
        const permissions = Object.fromEntries(
          await Promise.all(
            namespaces.map(async (ns) => {
              const selection = {
                ...route,
                namespace: ns.baseInfo.namespaceName,
              };
              const [modify, release] = await Promise.all([
                client.permission(selection, "ModifyNamespace"),
                client.permission(selection, "ReleaseNamespace"),
              ]);
              return [
                selection.namespace,
                {
                  modify: !!modify.hasPermission,
                  release: !!release.hasPermission,
                },
              ];
            }),
          ),
        );
        const [manage, createCluster, createNamespace] = s.isRoot
          ? [true, true, true]
          : await Promise.all(
              ["AssignRole", "CreateCluster", "CreateNamespace"].map(
                async (type) =>
                  (await client.appPermission(route.appId, type)).hasPermission,
              ),
            );
        Object.assign(data, {
          route,
          app,
          envTree,
          namespaces,
          permissions,
          canManage: manage,
          canCreateCluster: createCluster,
          canCreateNamespace: createNamespace,
          commits: {},
          textEditing: {},
          textFullscreen: {},
          branches: client.branches
            ? Object.fromEntries(
                await Promise.all(
                  namespaces.map(async (ns) => [
                    ns.baseInfo.namespaceName,
                    await client.branches({
                      ...route,
                      namespace: ns.baseInfo.namespaceName,
                    }),
                  ]),
                ),
              )
            : {},
          publishInfo: client.publishInfo
            ? await client.publishInfo(route.appId)
            : null,
        });
        const recent = [
          app,
          ...s.recent.filter((a) => a.appId !== app.appId),
        ].slice(0, 20);
        data.recent = recent;
      } else if (route.view === "history") {
        const namespace = await client.namespace(route);
        const [history, releases, permission] = await Promise.all([
          namespace.isConfigHidden ? [] : client.history(route),
          namespace.isConfigHidden ? [] : client.releases(route),
          client.permission(route, "ReleaseNamespace"),
        ]);
        Object.assign(data, {
          history,
          releases,
          historyDiffs: {},
          historySelected: null,
          historyDisplay: 'changes',
          historyPage: 0,
          historyHasMore: history.length === 10,
          historyLoading: false,
          historyHidden: !!namespace.isConfigHidden,
          canRelease: !!permission.hasPermission && !namespace.isConfigHidden,
        });
      } else if (route.view === "users") {
        data.users = s.isRoot ? await client.users() : [s.user];
        data.userEdit = null;
      } else if (route.view === "server-config") {
        data.serverConfigs = s.isRoot
          ? await client.serverConfigs(route.paramEnv || "portal")
          : [];
        data.serverConfigEnvs = s.isRoot ? await client.environments() : [];
        data.configEdit = null;
      } else if (route.view === "permissions") {
        const canManage =
          s.isRoot ||
          (await client.appPermission(route.appId, "AssignRole")).hasPermission;
        if (canManage && !s.readOnly && client.initializeNamespaceRoles)
          await client.initializeNamespaceRoles(route);
        Object.assign(data, {
          ...await loadNamespaceAssignments(route, client, s.envTree.map(node => node.env)),
          canManage,
          roleBuckets: {},
          userChoices: client.users ? await client.users() : [],
        });
      } else if (route.view === "gray") {
        const [branch, modify] = await Promise.all([
          client.branches(route),
          client.permission(route, "ModifyNamespace"),
        ]);
        Object.assign(data, {
          grayBranch: branch,
          canModify: !!modify.hasPermission,
          grayRules: branch
            ? await client.branchRules(route, branch.clusterName)
            : null,
        });
      }
      if (ticket !== revision || disposed) return;
      s.advancedFormValues = null;
      if (route.view === 'config' && route.namespace && route.item !== undefined) {
        data.filters = { ...s.filters, [route.namespace]: route.item };
        data.filterOpen = { ...s.filterOpen, [route.namespace]: true };
        data.collapsed = { ...s.collapsed, [route.namespace]: false };
        data.modes = { ...s.modes, [route.namespace]: 'table' };
      }
      Object.assign(s, data, { route: data.route || route, loading: false });
      render();
      await persist();
      if (ticket === revision && route.view === "history")
        await ensureHistoryComparison();
    } catch (error) {
      if (ticket !== revision || disposed) return;
      s.loading = false;
      throw error;
    }
  }
  function navigate(route) {
    if (Object.keys(s.drafts).length) {
      fail(Error(t("unsaved")));
      return Promise.resolve();
    }
    s.dialog = null;
    return run(() => loadRoute(route));
  }
  function openDialog(title, fields, submit, extra = {}) {
    clearSuccess();
    s.dialog = { title, fields, submit, ...extra };
    render();
    root
      .querySelector('[role="dialog"] input,[role="dialog"] textarea')
      ?.focus();
  }
  function confirm(message, submit) {
    openDialog(t("confirm"), `<p>${escapeHTML(message)}</p>`, submit, {
      confirmLabel: t("confirm"),
    });
  }
  function editable(ns) {
    return (
      !s.readOnly &&
      !ns.isConfigHidden &&
      s.permissions[ns.baseInfo.namespaceName]?.modify
    );
  }
  function requiredPermission(value) {
    if (!value) throw Error(t("denied"));
  }
  async function ensureEditLock(scope) {
    if (!client.namespaceLock) return;
    const lock = await client.namespaceLock(scope);
    if (lock.lockOwner && lock.lockOwner !== s.user.userId) {
      const error = Error(t("namespaceLocked") + " " + lock.lockOwner);
      error.lockOwner = lock.lockOwner;
      throw error;
    }
  }
  async function ensureHistoryComparison() {
    const record = selectedHistory(s);
    const cached = record && s.historyDiffs?.[record.id];
    if (!record || s.historyDisplay === "all" || (cached && !cached.error)) return;
    const ticket = revision, env = s.route.env;
    s.historyDiffs = { ...s.historyDiffs, [record.id]: { loading: true } };
    render();
    let result;
    try {
      result = await client.compareReleases(env, historyBaseReleaseId(record), record.releaseId);
    } catch (error) {
      result = { error: error.message || String(error) };
    }
    if (ticket !== revision || disposed) return;
    s.historyDiffs = { ...s.historyDiffs, [record.id]: result };
    render();
  }
  function publicationDialog(namespace,scope,release,emergency=false){
    openDialog(t(emergency?'emergency':'publish')+' · '+namespace.baseInfo.namespaceName,releaseFields(namespace,release,t),async(data)=>{
      if(client.namespaceLock){
        const [lock,actor]=await Promise.all([client.namespaceLock(scope),client.user()]);
        if(emergency&&!lock.isEmergencyPublishAllowed)throw Error(t('emergencyNotAllowed'));
        if(!emergency&&lock.lockOwner===actor.userId)throw Error(t('selfPublishDenied'));
      }
      return client.publish(scope,data.title,data.comment,emergency);
    },{sourceId:'releaseModal',wide:true,confirmLabel:t('publish'),subtitle:t('publishContext')+' '+scope.env});
  }
  function captureConsumerDraft(form) {
    if (form?.dataset.submitAction !== 'consumer-create-submit') return;
    s.consumerDraft = Object.fromEntries(new win.FormData(form));
    for (const input of form.querySelectorAll('input[type="checkbox"]')) s.consumerDraft[input.name] = input.checked;
  }
  function captureFormDraft(form) {
    if (!form || !root.contains(form) || s.busy || s.loading) return;
    if (!['advanced', 'dialog'].includes(form.dataset.form)) return;
    const data = Object.fromEntries(new win.FormData(form));
    for (const input of form.querySelectorAll('input[type="checkbox"]')) data[input.name] = input.checked;
    if (form.dataset.form === 'dialog') {
      if (s.dialog) s.dialog.values = data;
    } else {
      s.advancedFormValues = {
        routeKey: formRouteKey(s.route), data,
        formIndex: [...root.querySelectorAll('[data-form="advanced"]')].indexOf(form),
      };
    }
  }
  async function action(element) {
    const action = element.dataset.action;
    const ns = s.namespaces.find(
      (n) => n.baseInfo.namespaceName === element.dataset.ns,
    );
    const selection = selected(element.dataset.ns);
    if (element.disabled || s.busy || s.loading) return;
    if (action.startsWith('user-picker-')) {
      const form = element.closest('form');
      userPickerAction(action, element, root);
      captureConsumerDraft(form); captureFormDraft(form);
      return;
    }
    if (action === 'request-modify-permission' || action === 'request-master-permission' ||
      (action === 'publish' && !s.permissions[selection.namespace]?.release && !s.readOnly)) {
      const ticket = revision, roles = client.appRoles ? await client.appRoles(selection.appId) : {};
      if (ticket !== revision || disposed) return;
      sourceNotice({ openDialog, t }, action === 'publish' ? 'releaseNoPermissionDialog' : action === 'request-master-permission' ? 'masterNoPermissionDialog' : 'modifyNoPermissionDialog', null, { masterUsers: (roles.masterUsers || []).map(user => user.userId).join(', ') });
      return;
    }
    if (
      [
        "edit-text",
        "cancel-text",
        "copy-text",
        "format-text",
        "syntax-text",
        "fullscreen-text",
      ].includes(action)
    ) {
      const name = selection.namespace;
      if (action === "fullscreen-text") {
        s.textFullscreen = {
          ...s.textFullscreen,
          [name]: !s.textFullscreen?.[name],
        };
        render();
        return;
      }
      if (action === "cancel-text") {
        delete s.drafts[name];
        s.textEditing = { ...s.textEditing, [name]: false };
        render();
        return;
      }
      if (action === "copy-text") {
        await options.copy?.(root.querySelector(`[data-text="${name}"]`).value);
        return;
      }
      requiredPermission(editable(ns));
      if (action === "edit-text") {
        const ticket = revision;
        try {
          if (client.namespaceLock) await ensureEditLock(selection);
        } catch (error) {
          if (ticket === revision && !disposed) {
            if (error.lockOwner) { sourceNotice({openDialog,t}, 'namespaceLockedDialog', null, {lockOwner:error.lockOwner}); return; }
            throw error;
          }
          return;
        }
        if (ticket !== revision || disposed) return;
        s.textEditing = { ...s.textEditing, [name]: true };
        render();
        return;
      }
      if (!s.textEditing?.[name]) throw Error(t("denied"));
      const text = root.querySelector(`[data-text="${name}"]`).value;
      if (action === "format-text") {
        s.drafts[name] = formatJSONUniqueKeys(text);
        render();
        return;
      }
      const ticket = revision, originDialog = s.dialog;
      const currentSyntax = () => ticket === revision && !disposed && s.dialog === originDialog && s.textEditing?.[name] && root.querySelector(`[data-text="${name}"]`)?.value === text;
      try {
        await client.checkSyntax(selection, text, { namespaceId: ns.baseInfo.id, format: ns.format, operator: s.user.userId });
      } catch (error) {
        if (currentSyntax() && (error.status === 401 || error.code === -32001)) throw error;
        if (currentSyntax()) sourceNotice({ openDialog, t }, 'syntaxCheckFailedDialog', null, { message: error.detail || error.message });
        return;
      }
      if (!currentSyntax()) return;
      notifySuccess();
      render();
      return;
    }
    if (action === "sort-items") {
      const name = element.dataset.ns,
        previous = s.itemSort?.[name];
      s.itemSort = {
        ...s.itemSort,
        [name]: {
          key: element.dataset.sort,
          descending:
            previous?.key === element.dataset.sort
              ? !previous.descending
              : false,
        },
      };
      render();
      return;
    }
    if (action === "fold-namespace") {
      const name = element.dataset.ns;
      s.collapsed = { ...s.collapsed, [name]: !s.collapsed?.[name] };
      render();
      return;
    }
    if (action === "show-config-value") {
      if (!ns || ns.isConfigHidden) throw Error(t('hidden'));
      const item = ns.items.find(
        (row) => String(row.item.id) === element.dataset.item,
      )?.item;
      if (!item) return;
      let text = String((element.dataset.field === 'key' ? item.key : item.value) ?? '');
      if (element.dataset.field !== 'key' && /^[\[{]/.test(text.trim())) {
        try { text = formatJSONUniqueKeys(text); } catch { /* Keep the original text when formatting is unsafe. */ }
      }
      openDialog(
        t("Component.ShowText.Title"),
        `<pre class="modal-body value-inspector">${escapeHTML(text)}</pre>`,
        () => {},
        { sourceId:'showTextModal',textViewer:true,readOnly: true },
      );
      return;
    }
    if (action === "reset-items") {
      s.filters[element.dataset.ns] = "";
      render();
      return;
    }
    if (action === "reveal-dialog-token") {
      const input = root.querySelector("[data-dialog-token]");
      input.type = input.type === "password" ? "text" : "password";
      return;
    }
    if (action === "detect-special-chars") {
      const value =
          root.querySelector("[role=dialog] [name=value]")?.value || "",
        result = root.querySelector("[data-special-result]");
      result.hidden = false;
      result.textContent =
        [...value]
          .map((char, index) =>
            /[\s，]/.test(char)
              ? `${index + 1}: ${JSON.stringify(char)}`
              : null,
          )
          .filter(Boolean)
          .join(", ") || t("noChanges");
      return;
    }
    if (action === 'expand-item-value') {
      root.querySelector('[role="dialog"] [data-item-value]')?.classList.toggle('expanded');
      return;
    }
    if (action === 'format-item-value') {
      const form = root.querySelector('[role="dialog"] form'), input = form.querySelector('[name="value"]');
      s.dialog.values = Object.fromEntries(new win.FormData(form));
      for (const box of form.querySelectorAll('input[type="checkbox"]')) s.dialog.values[box.name] = box.checked;
      const formatted = formatJSONUniqueKeys(input.value);
      input.value = formatted;
      s.dialog.values.value = formatted;
      return;
    }
    if (action === 'toggle-item-targets') {
      for (const input of root.querySelectorAll('[name^="itemTarget_"]')) input.checked = element.checked;
      return;
    }
    if (action === "select-history") {
      s.historySelected = element.dataset.id;
      render();
      await ensureHistoryComparison();
      return;
    }
    if (action === 'more-history') {
      if (s.historyLoading || !s.historyHasMore || s.historyHidden) return;
      const ticket = revision, scope = { ...s.route }, page = s.historyPage + 1;
      s.historyLoading = true;
      render();
      try {
        const rows = await client.history(scope, page);
        if (ticket !== revision || disposed) return;
        const ids = new Set(s.history.map(record => record.id));
        s.history.push(...rows.filter(record => !ids.has(record.id)));
        s.historyPage = page;
        s.historyHasMore = rows.length === 10;
      } finally {
        if (ticket === revision && !disposed) { s.historyLoading = false; render(); }
      }
      return;
    }
    if (action === "history-display") {
      s.historyDisplay = element.dataset.display;
      render();
      await ensureHistoryComparison();
      return;
    }
    if (action === "gray-tab") {
      const ticket = revision,
        scope = { ...s.route, cluster: s.grayMeta.clusterName },
        tab = element.dataset.tab;
      if (tab === "history") s.grayHistory = await client.commits(scope);
      if (tab === "instances")
        s.grayInstancePage = await client.instances(scope);
      if (ticket !== revision) return;
      s.grayTab = tab;
      render();
      return;
    }
    if (action === "instances" && s.route.view === "config") {
      if (s.textEditing?.[selection.namespace]) throw Error(t("unsaved"));
      const ticket = revision,
        page = await client.instances(selection);
      if (ticket !== revision) return;
      s.instancePanels = { ...s.instancePanels, [selection.namespace]: page };
      s.modes[selection.namespace] = "instances";
      render();
      return;
    }
    if (
      ["sort-sync", "filter-sync", "reset-sync", "sync-back"].includes(action)
    ) {
      if (action === "sort-sync") {
        s.syncDescending =
          s.syncSort === element.dataset.syncSort ? !s.syncDescending : false;
        s.syncSort = element.dataset.syncSort;
      }
      if (action === "filter-sync") s.syncFilterDates = { ...s.syncDate };
      if (action === "reset-sync") {
        s.syncDate = {};
        s.syncFilterDates = {};
      }
      if (action === "sync-back") s.syncStep = 1;
      render();
      return;
    }
    if (referenceActions.has(action))
      return handleReferenceAction(action, element, advancedContext());
    if (isAdvancedAction(action, s.route)) {
      await handleAdvancedAction(action, element, advancedContext());
      return;
    }
    if (action === "home") return navigate({ view: "home" });
    if (action === "home-tab") {
      s.homeTab = element.dataset.tab;
      s.searchResults = null;
      render();
      return;
    }
    if (action === "open-project")
      return navigate({ view: "config", appId: element.dataset.app });
    if (action === "select-env")
      return navigate({
        ...s.route,
        view: "config",
        env: element.dataset.env,
        cluster: element.dataset.cluster,
      });
    if (action === "refresh") return navigate(s.route);
    if (action === "hide-notice") {
      s.noticeHidden = true;
      render();
      return;
    }
    if (action === "dismiss") {
      s.error = "";
      clearSuccess();
      render();
      return;
    }
    if (action === "discard-drafts") {
      s.drafts = {};
      s.error = "";
      render();
      return;
    }
    if (action === "language")
      return setLocale(
        element.dataset.locale || (s.locale.startsWith("zh") ? "en" : "zh-CN"),
      );
    if (action === "help" || action === "github") {
      const url =
        action === "github"
          ? "https://github.com/apolloconfig/apollo"
          : "https://www.apolloconfig.com";
      openDialog(
        t(action === "github" ? "github" : "help"),
        `<p>${t("externalLinkHint")}</p><input class="external-link" value="${escapeHTML(url)}" readonly>`,
        () => options.copy?.(url),
        { confirmLabel: t("copy") },
      );
      return;
    }
    if (action === "logout") {
      await options.disconnect?.();
      s.disconnected = true;
      root.innerHTML = `<main class="connection-empty"><h1>Apollo</h1><p>${t("disconnected")}</p><button class="btn btn-primary" data-action="reconnect">${t("reconnect")}</button></main>`;
      return;
    }
    if (action === "reconnect") {
      await options.reconnect?.();
      s.disconnected = false;
      return navigate({ view: "home" });
    }
    if (action === "users" || action === "server-config")
      return navigate({ view: action });
    if (action === "back-config")
      return navigate({ ...s.route, view: "config" });
    if (action === "history" || action === "permissions" || action === "gray")
      return navigate({ ...selection, view: action });
    if (action === "table-mode" || action === "text-mode") {
      if (s.textEditing?.[selection.namespace]) throw Error(t("unsaved"));
      commitRevision[element.dataset.ns] =
        (commitRevision[element.dataset.ns] || 0) + 1;
      s.modes[element.dataset.ns] = action === "text-mode" ? "text" : "table";
      render();
      return;
    }
    if (["commits-mode", "more-commits", "filter-commits"].includes(action)) {
      if (s.textEditing?.[selection.namespace]) throw Error(t("unsaved"));
      const name = ns.baseInfo.namespaceName;
      const previous = s.commits[name];
      const page = action === "more-commits" ? previous.page + 1 : 0;
      const key =
        action === "more-commits" ? previous.key : s.commitFilters[name] || "";
      const ticket = revision;
      const requestID = (commitRevision[name] =
        (commitRevision[name] || 0) + 1);
      const rows = await client.commits(selection, key, page);
      if (ticket !== revision || requestID !== commitRevision[name]) return;
      s.commits[name] = {
        rows: page ? [...previous.rows, ...rows] : rows,
        page,
        key,
        hasMore: rows.length === 10,
      };
      s.modes[name] = "commits";
      render();
      return;
    }
    if (action === "filter-config") {
      s.filterOpen[element.dataset.ns] = !s.filterOpen[element.dataset.ns];
      render();
      root
        .querySelector(
          `[data-filter="${element.dataset.ns.replace(/["\\]/g, "\\$&")}"]`,
        )
        ?.focus();
      return;
    }
    if (action === "revoke-items") {
      requiredPermission(editable(ns));
      const name = ns.baseInfo.namespaceName;
      confirm(
        t("confirmRevoke") +
          (s.drafts[name] !== undefined ? " " + t("revokeDraft") : ""),
        async () => {
          await client.revokeItems(selection);
          delete s.drafts[name];
        },
      );
      return;
    }
    if (action === "more-apps") {
      const apps = await client.apps(s.page + 1);
      s.page++;
      s.apps.push(...apps);
      s.hasMore = apps.length === 10;
      render();
      return;
    }
    if (action === "cancel-dialog") {
      const afterClose = s.dialog?.afterClose;
      s.dialog = null;
      render();
      if (afterClose) await afterClose();
      return;
    }
    if (action === "new-item" || action === "edit-item") {
      requiredPermission(editable(ns));
      const ticket = revision, request = s.itemEditorRequest = (s.itemEditorRequest || 0) + 1, originDialog = s.dialog;
      const currentEditor = () => ticket === revision && !disposed && s.itemEditorRequest === request && s.dialog === originDialog;
      if (client.namespaceLock) {
        try {
          await ensureEditLock(selection);
        } catch (error) {
          if (!currentEditor()) return;
          if (!error.lockOwner) throw error;
          sourceNotice({ openDialog, t }, 'namespaceLockedDialog', null, { lockOwner: error.lockOwner });
          return;
        }
      }
      if (!currentEditor()) return;
      const item =
        action === "edit-item"
          ? ns.items.find((r) => String(r.item.id) === element.dataset.item)
              ?.item
          : {};
      if (!item) throw Error("Configuration item no longer exists");
      const targets = s.envTree.flatMap((node) =>
        (node.clusters || []).map((cluster) => ({
          env: node.env,
          cluster: cluster.name,
          selected:
            node.env === selection.env && cluster.name === selection.cluster,
        })),
      );
      const fields = itemEditorFields(item, t, {
        isNew: action === "new-item",
        targets,
      });
      openDialog(
        t(action === "new-item" ? "Component.ConfigItem.Title" : "Component.ConfigItem.ModifyItem"),
        fields,
        async (data) => {
          const typed = validateItem(data, t);
          await ensureEditLock(selection);
          const model = {
            ...item,
            ...typed,
            key: action === "new-item" ? data.key : item.key,
            comment: data.comment,
          };
          const chosen =
            action === "new-item"
              ? targets.filter((_target, index) => data["itemTarget_" + index])
              : [selection];
          if (!chosen.length) throw Error(t("chooseClusters"));
          const created = [];
          for (const target of chosen) {
            try {
              await client.saveItem(
                { ...selection, env: target.env, cluster: target.cluster },
                model,
                action === "new-item",
              );
              created.push(target.env + "/" + target.cluster);
              const index = targets.indexOf(target);
              if (action === "new-item" && s.dialog?.values)
                s.dialog.values["itemTarget_" + index] = false;
            } catch (error) {
              throw Error(
                (created.length
                  ? created.join(", ") + " " + t("createdSuccessfully") + ". "
                  : "") +
                  target.env +
                  "/" +
                  target.cluster +
                  ": " +
                  error.message,
              );
            }
          }
        },
        {
          wide: true,
          itemEditor: true,
          sourceId: 'itemModal',
          subtitle: action === "new-item" ? t('Component.ConfigItem.TitleTips') : '',
          values: { type: String(item.type ?? 0), value: item.value ?? "" },
        },
      );
      return;
    }
    if (action === "delete-item") {
      requiredPermission(editable(ns));
      const item = ns.items.find(row => String(row.item.id) === element.dataset.item)?.item;
      if (!item) throw Error(t('noData'));
      sourceNotice({ openDialog, t }, 'deleteConfirmDialog', () =>
        ensureEditLock(selection).then(() =>
          client.deleteItem(selection, element.dataset.item),
        ),
        { 'config.key': item.key, 'config.value': item.value },
      );
      return;
    }
    if (action === "save-text") {
      requiredPermission(editable(ns));
      const text = s.drafts[ns.baseInfo.namespaceName];
      if (text === undefined) return;
      s.busy = true;
      render();
      try {
        const metadata = {
          namespaceId: ns.baseInfo.id,
          format: ns.format,
          operator: s.user.userId,
        };
        await ensureEditLock(selection);
        if (["yaml", "yml"].includes(ns.format))
          await client.checkSyntax(selection, text, metadata);
        await client.saveText(selection, text, metadata);
        delete s.drafts[ns.baseInfo.namespaceName];
        s.textEditing = {
          ...s.textEditing,
          [ns.baseInfo.namespaceName]: false,
        };
      } finally {
        s.busy = false;
        render();
      }
      return navigate(s.route);
    }
    if (action === "publish") {
      if (s.drafts[ns.baseInfo.namespaceName] !== undefined)
        throw Error(t("unsaved"));
      requiredPermission(
        s.permissions[ns.baseInfo.namespaceName]?.release &&
          !s.readOnly &&
          !ns.isConfigHidden,
      );
      const ticket = revision;
      if (client.namespaceLock) {
        const [lock,actor] = await Promise.all([client.namespaceLock(selection),client.user()]);
        if (ticket !== revision) return;
        if (lock.lockOwner === actor.userId) {
          openDialog(
            t("Component.PublishDeny.Title"),
            publishDeniedFields(t,selection.env,lock.isEmergencyPublishAllowed),
            () => sourceNotice({openDialog,t}, 'emergencyPublishAlertDialog',async()=>{
              const fresh=await client.namespaceLock(selection);if(!fresh.isEmergencyPublishAllowed)throw Error(t('emergencyNotAllowed'));
              const previous=client.latestRelease?await client.latestRelease(selection):null;
              if(ticket!==revision||disposed)return;
              publicationDialog(ns,selection,previous,true);
            }),
            { sourceId:'publishDenyModal',publishDenied:true, emergencyAllowed:lock.isEmergencyPublishAllowed,danger:true,confirmLabel:t('emergency') },
          );
          return;
        }
      }
      const release = client.latestRelease
        ? await client.latestRelease(selection)
        : null;
      if (ticket !== revision) return;
      publicationDialog(ns,selection,release);
      return;
    }
    if (action === "rollback") {
      requiredPermission(s.canRelease && !s.readOnly);
      confirm(t("confirmRollback"), () =>
        client.rollback(s.route.env, element.dataset.release),
      );
      return;
    }
    if (action === "rollback-latest") {
      requiredPermission(
        s.permissions[ns.baseInfo.namespaceName]?.release &&
          !s.readOnly &&
          !ns.isConfigHidden,
      );
      if (s.drafts[ns.baseInfo.namespaceName] !== undefined)
        throw Error(t("unsaved"));
      const ticket = revision;
      const releases = await client.releases(selection);
      if (ticket !== revision) return;
      const current = releases
        .map((release) => release.baseInfo || release)
        .find((release) => !release.isAbandoned);
      if (!current) throw Error(t("noRelease"));
      const previous = releases
        .map((release) => release.baseInfo || release)
        .filter((release) => !release.isAbandoned)[1];
      if (!previous) throw Error(t("noPreviousRelease"));
      const comparison = client.compareReleases
        ? await client.compareReleases(selection.env, current.id, previous.id)
        : { changes: [] };
      if (ticket !== revision) return;
      openDialog(
        `${current.name || current.id} → ${previous.name || previous.id}`,
        `<p class="limit-warning">${t("rollbackContext")}</p>` +
          comparisonTable(comparison, t),
        () => {
          sourceNotice({openDialog,t}, 'rollbackAlertDialog', () => client.rollback(selection.env, current.id));
        },
        { sourceId:'rollbackModal',wide: true, confirmLabel: t("rollback"), danger: true },
      );
      return;
    }
    if (action === "new-project" || action === "project-settings") {
      requiredPermission(
        !s.readOnly && (action === "new-project" ? s.canCreate : s.canManage),
      );
      const app = action === "new-project" ? {} : s.app;
      openDialog(
        t(action === "new-project" ? "createProject" : "projectManage"),
        formField("appId", t("appId"), app.appId, "text", true) +
          formField("name", t("appName"), app.name, "text", true) +
          formField("orgId", t("department") + " ID", app.orgId, "text", true) +
          formField("orgName", t("department"), app.orgName, "text", true) +
          formField(
            "ownerName",
            t("owner"),
            app.ownerName || s.user.userId,
            "text",
            true,
          ),
        (data) => client.saveApp({ ...app, ...data }, action === "new-project"),
      );
      return;
    }
    if (action === "new-cluster") {
      requiredPermission(s.canCreateCluster && !s.readOnly);
      openDialog(
        t("createCluster"),
        formField("name", t("clusterName"), "", "text", true),
        (data) =>
          client.createCluster(s.route, {
            name: data.name,
            appId: s.route.appId,
          }),
      );
      return;
    }
    if (action === "new-namespace") {
      requiredPermission(s.canCreateNamespace && !s.readOnly);
      openDialog(
        t("createNamespace"),
        formField("name", t("namespace"), "", "text", true) +
          `<label class="form-field"><span>${t("format")}</span><select name="format"><option>properties</option><option>xml</option><option>json</option><option>yml</option><option>yaml</option><option>txt</option></select></label>` +
          formField("comment", t("comment")) +
          formField("isPublic", t("isPublic"), false, "checkbox"),
        (data) =>
          client.createNamespace(s.route, {
            ...data,
            appId: s.route.appId,
            isPublic: !!data.isPublic,
          }),
      );
      return;
    }
    if (action === "new-user" || action === "edit-user") {
      const user = s.users.find((u) => u.userId === element.dataset.user) || {};
      requiredPermission(
        !s.readOnly &&
          (s.isRoot ||
            (action === "edit-user" && user.userId === s.user.userId)),
      );
      openDialog(
        t(action === "new-user" ? "newUser" : "edit"),
        formField("username", t("userId"), user.userId, "text", true).replace(
          'name="username"',
          `name="username"${action === "edit-user" ? " readonly" : ""}`,
        ) +
          formField("userDisplayName", t("name"), user.name, "text", true) +
          formField("email", t("email"), user.email, "email", true) +
          formField("password", t("password"), "", "password", true) +
          formField(
            "confirmPassword",
            t("confirmPassword"),
            "",
            "password",
            true,
          ) +
          (s.isRoot
            ? formField(
                "enabled",
                t("enabled"),
                user.enabled ?? true,
                "checkbox",
              )
            : ""),
        (data) => {
          if (data.password !== data.confirmPassword)
            throw Error(t("passwordMismatch"));
          const { confirmPassword, ...model } = data;
          return client.saveUser(
            { ...model, enabled: s.isRoot ? (data.enabled ? 1 : 0) : 1 },
            action === "new-user",
          );
        },
      );
      return;
    }
    if (action === "new-server-config" || action === "edit-server-config") {
      requiredPermission(s.isRoot && !s.readOnly);
      const config = s.serverConfigs[Number(element.dataset.config)] || {};
      openDialog(
        t("systemConfig"),
        formField("key", t("parameter"), config.key, "text", true) +
          formField("value", t("value"), config.value, "textarea", true) +
          formField("comment", t("comment"), config.comment),
        (data) =>
          client.saveServerConfig(
            { ...config, ...data },
            s.route.paramEnv || "portal",
          ),
      );
      return;
    }
    if (action === "add-role") {
      requiredPermission(s.canManage && !s.readOnly);
      openDialog(
        t("addRole") + " · " + element.dataset.role,
        formField("user", t("userId"), "", "text", true),
        (data) => client.assignRole(s.route, element.dataset.role, data.user),
      );
      return;
    }
    if (action === "revoke-role") {
      requiredPermission(s.canManage && !s.readOnly);
      confirm(t("remove") + " " + element.dataset.user + "?", () =>
        client.revokeRole(s.route, element.dataset.role, element.dataset.user),
      );
      return;
    }
    if (action === "create-gray") {
      requiredPermission(s.canModify && !s.readOnly);
      const scope = { ...s.route };
      sourceNotice({ openDialog, t }, 'createBranchTips', () => client.createBranch(scope));
      return;
    }
    if (action === "delete-gray") {
      requiredPermission(s.canModify && !s.readOnly);
      confirm(t("remove") + " " + s.grayBranch.clusterName + "?", () =>
        client.deleteBranch(s.route, s.grayBranch.clusterName),
      );
      return;
    }
    if (action === "gray-rules") {
      requiredPermission(s.canModify && !s.readOnly);
      openDialog(
        t("rules"),
        formField(
          "rules",
          "JSON",
          JSON.stringify(s.grayRules, null, 2),
          "textarea",
          true,
        ),
        (data) =>
          client.saveBranchRules(
            s.route,
            s.grayBranch.clusterName,
            JSON.parse(data.rules),
          ),
        { wide: true },
      );
      return;
    }
  }
  function onClick(event) {
    const element = event.target.closest("[data-action]");
    if (!element || !root.contains(element)) return;
    event.preventDefault();
    if (element.dataset.action === "submit-form") {
      onSubmit({ target: element.closest("form"), preventDefault() {} });
      return;
    }
    run(() => action(element));
  }
  function onKey(event) {
    if (userPickerKey(event, root)) {
      const form = event.target.closest('form');
      captureConsumerDraft(form); captureFormDraft(form);
      return;
    }
    if (
      event.key === "Enter" &&
      event.target.closest("form") &&
      event.target.tagName === "INPUT" &&
      ['text', 'search', 'password', 'email', 'url', 'tel', 'number'].includes(event.target.type)
    ) {
      event.preventDefault();
      onSubmit({ target: event.target.closest("form"), preventDefault() {} });
      return;
    }
    if (event.key === "Enter" && event.target.matches("tr[data-app]")) {
      event.preventDefault();
      run(() => action(event.target));
    }
    if (event.key === "Escape" && !s.dialog && s.textFullscreen) {
      s.textFullscreen = {};
      render();
    }
    if (event.key === "Escape" && s.dialog && !s.busy) {
      s.dialog = null;
      render();
    }
    if (event.key === "Tab" && s.dialog) {
      const items = [
        ...root.querySelectorAll(
          '[role="dialog"] button:not([disabled]),[role="dialog"] input,[role="dialog"] textarea,[role="dialog"] select',
        ),
      ];
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  function onInput(event) {
    const input = event.target;
    if (input.name === 'env' && input.closest('[data-submit-action="key-create-inline"]'))
      input.closest('form').querySelector('[data-action="submit-form"]').disabled = s.readOnly || !s.canManage || !input.value;
    captureConsumerDraft(input.closest('form'));
    captureFormDraft(input.closest('form'));
    if (input.name === 'lookupAppId' && s.route.view === 'consumer-create') {
      s.advancedFormValues = null;
      s.consumerAppId = input.value;
      const field = root.querySelector('[data-submit-action="consumer-create-submit"] [name="appId"]');
      if (field) field.value = input.value;
      s.consumerCredential = null;
      const token = root.querySelector('[data-submit-action="consumer-grant-inline"] input[readonly]');
      if (token) token.value = '';
    }
    if (input.name === 'rateLimitEnabled' && s.route.view === 'consumer-create')
      root.querySelector('[data-consumer-rate]').hidden = !input.checked;
    if (userPickerInput(input)) return;
    if (s.dialog?.grayRule && input.closest('[role="dialog"]')) {
      const dialog = s.dialog;
      dialog.values = Object.fromEntries(new win.FormData(input.closest('form')));
      if (input.name === 'clientAppId') {
        dialog.grayRule.clientAppId = input.value;
        run(() => dialog.refreshInstances());
        return;
      }
      if (input.hasAttribute('data-gray-rule-instances')) {
        run(() => handleGrayRuleControl('gray-rule-select', input, advancedContext()));
        return;
      }
    }
    if (["namespaceType", "appendPrefix"].includes(input.name) && s.route.view === "namespace-create") {
      const restoreFocus = win.document.activeElement === input, focusValue = input.value;
      const form = input.closest("form"),
        data = Object.fromEntries(new win.FormData(form));
      for (const checkbox of form.querySelectorAll("input[type=checkbox]"))
        data[checkbox.name] = checkbox.checked;
      if (input.name === 'namespaceType') s.namespacePublicType = input.value;
      else s.namespaceAppendPrefix = input.checked;
      s.advancedFormValues = {
        routeKey: formRouteKey(s.route),
        formIndex: 0,
        data,
      };
      render();
      if (restoreFocus) {
        const next = [...root.querySelectorAll(`input[name="${input.name}"]`)].find(control => input.name !== 'namespaceType' || control.value === focusValue);
        next?.focus();
      }
      return;
    }
    if (input.closest("[data-transfer-query]")) {
      const query = input.closest("form");
      s.transferSelection = Object.fromEntries(new win.FormData(query));
      s.transferLookup = null;
      for (const button of root.querySelectorAll(
        "[data-action=export-transfer-cluster],[data-submit-action=transfer-cluster-import] [data-action=submit-form]",
      ))
        button.disabled = true;
    }

    if (input.dataset.syncDate) {
      s.syncDate = { ...s.syncDate, [input.dataset.syncDate]: input.value };
      return;
    }
    if (input.name === "compareMode") {
      s.compareMode = input.value;
      return;
    }
    if (input.dataset.compareOption) {
      s[input.dataset.compareOption] = input.checked;
      render();
      return;
    }
    if (input.hasAttribute("data-compare-key")) {
      s.compareKey = input.value;
      render();
      const next = root.querySelector("[data-compare-key]");
      next.focus();
      next.setSelectionRange(input.selectionStart, input.selectionStart);
      return;
    }
    if (input.closest("[data-delete-kind]")) {
      const form = input.closest("form"),
        kind = form.dataset.deleteKind;
      s.deleteForms = {
        ...s.deleteForms,
        [kind]: Object.fromEntries(new win.FormData(form)),
      };
      if (s.deleteLookups) s.deleteLookups[kind] = null;
      root.querySelector(
        `[data-action="delete-queried"][data-kind="${kind}"]`,
      ).disabled = true;
    }
    if (input.closest("[data-system-master]") && input.name === "appId") {
      s.masterLookup = null;
      for (const button of root.querySelectorAll(
        '[data-action="allow-master"],[data-action="forbid-master"]',
      ))
        button.disabled = true;
    }
    if (input.hasAttribute("data-config-filter")) {
      s.configFilter = input.value;
      return;
    }
    if (input.hasAttribute("data-role-env")) {
      const role = input.dataset.roleEnv,
        env = input.value,
        ticket = revision,
        request = (roleRevision[role] = (roleRevision[role] || 0) + 1);
      s.advancedFormValues = null;
      s.roleBuckets = { ...s.roleBuckets, [role]: { env, pending: true, users: [] } };
      render();
      run(async () => {
        const roles = env
          ? await client.envRoleUsers({ ...s.route, env })
          : await client.roleUsers(s.route);
        if (ticket !== revision || roleRevision[role] !== request) return;
        s.roleAssignments = { ...s.roleAssignments, [env]: roles };
        s.roleBuckets = {
          ...s.roleBuckets,
          [role]: {
            env,
            users: role.startsWith("Modify")
              ? roles.modifyRoleUsers
              : roles.releaseRoleUsers,
          },
        };
        render();
      });
      return;
    }
    if (s.dialog?.itemEditor && input.name === "type") {
      const form = input.closest("form");
      const values = Object.fromEntries(new win.FormData(form));
      for (const checkbox of form.querySelectorAll("input[type=checkbox]"))
        values[checkbox.name] = checkbox.checked;
      if (values.type === "2") {
        s.dialog.lastText = values.value;
        values.value = "false";
      } else if (s.dialog.previousType === "2")
        values.value = s.dialog.lastText ?? "";
      s.dialog.previousType = values.type;
      s.dialog.values = values;
      const valueField = root.querySelector("[data-item-value]");
      valueField.innerHTML = itemValueField(values.type, values.value, t);
      valueField.querySelector("[name=value]").value = values.value;
      return;
    }
    if (input.hasAttribute("data-namespace-mode")) {
      s.namespaceMode = input.value;
      for (const section of root.querySelectorAll("[data-namespace-section]"))
        section.hidden = section.dataset.namespaceSection !== input.value;
      return;
    }
    if (
      input.dataset.syncItem !== undefined ||
      input.dataset.syncTarget !== undefined
    ) {
      if (s.busy) return;
      if (input.dataset.syncItem !== undefined)
        s.syncKeys[input.dataset.syncItem] = input.checked;
      else s.syncTargets[input.dataset.syncTarget] = input.checked;
      s.syncPreview = null;
      s.syncPreviewSignature = null;
      s.diffMatrix = null;
      render();
      return;
    }
    if (input.dataset.exportEnv !== undefined) {
      s.exportEnvs[input.dataset.exportEnv] = input.checked;
      return;
    }
    if (input.dataset.text) {
      if (!s.busy && s.textEditing?.[input.dataset.text])
        s.drafts[input.dataset.text] = input.value;
      return;
    }
    if (input.dataset.commitFilter !== undefined) {
      s.commitFilters[input.dataset.commitFilter] = input.value;
      return;
    }
    if (input.dataset.filter !== undefined) {
      const name = input.dataset.filter,
        position = input.selectionStart;
      s.filters[name] = input.value;
      render();
      const next = [...root.querySelectorAll("[data-filter]")].find(
        (i) => i.dataset.filter === name,
      );
      next?.focus();
      next?.setSelectionRange(position, position);
    }
    if (input.hasAttribute("data-users-filter")) {
      const position = input.selectionStart;
      s.userFilter = input.value;
      render();
      const next = root.querySelector("[data-users-filter]");
      next?.focus();
      next?.setSelectionRange(position, position);
    }
  }
  function onSubmit(event) {
    const form = event.target;
    if (!form.dataset.form) return;
    event.preventDefault();
    clearSuccess();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    captureConsumerDraft(form);
    const data = Object.fromEntries(new win.FormData(form));
    for (const checkbox of form.querySelectorAll('input[type="checkbox"]'))
      data[checkbox.name] = checkbox.checked;
    if (form.dataset.form === "advanced") {
      if (s.busy) return;
      const action = form.dataset.submitAction;
      s.advancedFormValues = {
        routeKey: formRouteKey(s.route),
        data,
        formIndex: [...root.querySelectorAll('[data-form="advanced"]')].indexOf(
          form,
        ),
      };
      s.busy = true;
      render();
      run(async () => {
        try {
          await (
            referenceActions.has(action)
              ? handleReferenceAction
              : handleAdvancedAction
          )(action, { dataset: {} }, advancedContext(), data);
        } finally {
          s.busy = false;
          render();
          if (s.dialog) root.querySelector('[role="dialog"] input')?.focus();
        }
      });
      return;
    }
    if (form.dataset.form === "search") {
      run(() => appSearch.submit());
      return;
    }
    if (s.busy || !s.dialog) return;
    run(async () => {
      const dialog = s.dialog;
      s.busy = true;
      dialog.values = data;
      render();
      try {
        await dialog.submit(data);
        if (s.dialog !== dialog) {
          s.busy = false;
          render();
          return;
        }
        s.dialog = null;
        s.busy = false;
        await loadRoute(s.route);
        notifySuccess();
        render();
      } catch (error) {
        s.busy = false;
        if (s.dialog === dialog) {
          dialog.error = error.message;
          render();
        } else fail(error);
      }
    });
  }
  appSearch = createAppSearch(root, { client, navigate, state: () => s, track: run, fail });
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKey);
  async function setLocale(locale) {
    s.locale = locale;
    render();
    await persist();
  }
  function advancedContext() {
    return { s, t, client, options, navigate, openDialog, render, root, ensureEditLock, notifySuccess };
  }
  return {
    async start() {
      const saved = await options.storage?.get(
        "native:" + options.connectionId,
      );
      if (saved) {
        s.recent = saved.recent || [];
        s.locale = options.locale || saved.locale || s.locale;
      }
      try {
        const user = await client.user();
        if (client.session)
          s.readOnly = !!(s.readOnly || (await client.session()).readOnly);
        const [permission, creation] = await Promise.all([
          client.rootPermission(),
          client.creationPermission(user.userId),
        ]);
        s.user = user;
        s.isRoot = !!permission.hasPermission;
        s.canCreate = !!creation.hasCreateApplicationPermission;
        await navigate(saved?.route || { view: "home" });
      } catch (error) {
        fail(error);
      }
    },
    navigate,
    setLocale,
    async idle() {
      while (jobs.size) await Promise.all([...jobs]);
    },
    destroy() {
      disposed = true;
      revision++;
      clearSuccess();
      appSearch.destroy();
      root.removeEventListener("click", onClick);
      root.removeEventListener("submit", onSubmit);
      root.removeEventListener("input", onInput);
      root.removeEventListener("keydown", onKey);
      root.replaceChildren();
    },
    get state() {
      return s;
    },
  };
}
