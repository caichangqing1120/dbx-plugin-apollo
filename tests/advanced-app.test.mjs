import { test } from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { createPortalApp } from "../src/app.js";

const base = {
  appId: "SampleApp",
  env: "DEV",
  cluster: "default",
  namespace: "application",
};
const source = {
  baseInfo: {
    id: 1,
    appId: "SampleApp",
    clusterName: "default",
    namespaceName: "application",
  },
  format: "properties",
  items: [
    { item: { id: 1, key: "a", value: "one", comment: "comment", lineNum: 1 } },
    { item: { id: 2, key: "b", value: "two", comment: "", lineNum: 2 } },
  ],
};
function makeClient() {
  const calls = [];
  const record =
    (name, result) =>
    (...args) => {
      calls.push([name, ...args]);
      return Promise.resolve(result);
    };
  return {
    calls,
    user: async () => ({ userId: "apollo", name: "Admin" }),
    rootPermission: async () => ({ hasPermission: true }),
    creationPermission: async () => ({ hasCreateApplicationPermission: true }),
    apps: async () => [
      {
        appId: "SampleApp",
        name: "Sample",
        orgId: "D",
        orgName: "Dept",
        ownerName: "apollo",
      },
    ],
    favorites: async () => [],
    publicNamespaces: async () => [],
    app: async () => ({
      appId: "SampleApp",
      name: "Sample",
      orgId: "D",
      orgName: "Dept",
      ownerName: "apollo",
    }),
    tree: async () => ({
      entities: [
        {
          code: 200,
          body: {
            env: "DEV",
            clusters: [{ name: "default" }, { name: "extra" }],
          },
        },
        { code: 200, body: { env: "UAT", clusters: [{ name: "default" }] } },
      ],
    }),
    namespace: async (s) => ({
      ...source,
      baseInfo: { ...source.baseInfo, clusterName: s.cluster },
    }),
    namespaces: async () => [source],
    permission: async () => ({ hasPermission: true }),
    appPermission: async () => ({ hasPermission: true }),
    branches: async () => ({
      ...source,
      baseInfo: { ...source.baseInfo, id: 2, clusterName: "gray-1" },
    }),
    branchRules: async () => ({
      appId: "SampleApp",
      clusterName: "default",
      namespaceName: "application",
      branchName: "gray-1",
      ruleItems: [],
    }),
    saveItem: record("saveItem"),
    publishGray: record("publishGray"),
    mergeGray: record("mergeGray"),
    saveBranchRules: record("saveBranchRules"),
    previewSync: record("previewSync", [
      {
        namespace: {
          appId: "SampleApp",
          env: "UAT",
          clusterName: "default",
          namespaceName: "application",
        },
        diffs: {
          createItems: [{ key: "a", value: "one" }],
          updateItems: [],
          deleteItems: [],
        },
      },
    ]),
    applySync: record("applySync"),
    accessKeys: async () => [
      { id: 1, secret: "never-persist-this-key", enabled: false, mode: 0 },
    ],
    createAccessKey: record("createAccessKey"),
    setAccessKey: record("setAccessKey"),
    deleteAccessKey: record("deleteAccessKey"),
    environments: async () => ["DEV", "UAT"],
    systemRoles: async () => ["alice"],
    grantSystemRole: record("grantSystemRole"),
    revokeSystemRole: record("revokeSystemRole"),
    systemInfo: async () => ({
      version: "2.5.2",
      environments: [
        {
          env: "DEV",
          active: true,
          metaServerAddress: "http://meta",
          adminServices: [
            { instanceId: "admin-1", homepageUrl: "http://admin" },
          ],
          configServices: [],
        },
      ],
    }),
    health: record("health", { status: "UP" }),
    audit: record("audit", [
      {
        id: 1,
        traceId: "trace-1",
        operator: "alice",
        opType: "UPDATE",
        opName: "Item.update",
        description: '<img src=x onerror="bad()">',
        happenedTime: "2026-10-19T00:00:00Z",
      },
    ]),
    auditProperties: async () => ({ enabled: true }),
    auditTrace: record("auditTrace", [
      {
        id: 1,
        traceId: "trace-1",
        operator: "alice",
        opName: "Item.update",
        dataInfluences: [],
      },
    ]),
    globalSearch: record("globalSearch", {
      code: 200,
      body: [
        {
          appId: "SampleApp",
          envName: "UAT",
          clusterName: "default",
          namespaceName: "application",
          key: "a",
          value: "one",
        },
      ],
      hasMoreData: true,
      message: "Results limited",
    }),
    consumers: async () => [
      {
        appId: "consumer",
        name: "Consumer",
        ownerName: "alice",
        token: "consumer-secret",
      },
    ],
    createConsumer: record("createConsumer"),
    assignConsumer: record("assignConsumer"),
    deleteConsumer: record("deleteConsumer"),
    exportConfigs: record("exportConfigs", {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="configs.zip"',
      },
      bodyBase64: "AP9B",
    }),
    exportNamespace: record("exportNamespace", {
      status: 200,
      headers: { "content-type": "text/plain" },
      bodyBase64: "YT1vbmU=",
    }),
    deleteApp: record("deleteApp"),
    deleteCluster: record("deleteCluster"),
    deleteNamespace: record("deleteNamespace"),
    roleUsers: async () => ({
      modifyRoleUsers: [],
      releaseRoleUsers: [],
    }),
    envRoleUsers: async () => ({
      modifyRoleUsers: [],
      releaseRoleUsers: [],
    }),
    assignEnvRole: record("assignEnvRole"),
    organizations: async () => [{ orgId: "D", orgName: "Dept" }],
    appRoles: async () => ({
      masterUsers: [{ userId: "alice", name: "Alice" }],
    }),
    saveApp: record("saveApp", { appId: "SampleApp" }),
    cluster: async (scope) => ({ name: scope.cluster, appId: scope.appId }),
    linkNamespaces: record("linkNamespaces"),
    clusterRoleUsers: async () => ({
      modifyRoleUsers: [{ userId: "alice", name: "Alice" }],
      releaseRoleUsers: [],
    }),
    assignClusterRole: record("assignClusterRole"),
    history: async () => [],
    releases: async () => [],
    instances: async () => ({ content: [], totalElements: 0 }),
    rollbackTo: record("rollbackTo"),
  };
}
async function setup(readOnly = false) {
  const win = new Window({ url: "http://localhost" }),
    root = win.document.createElement("div");
  win.document.body.append(root);
  const client = makeClient(),
    saved = [],
    downloads = [];
  const app = createPortalApp(root, {
    client,
    locale: "zh-CN",
    connectionId: "test",
    readOnly,
    storage: {
      get: async () => null,
      set: async (_key, data) => saved.push(JSON.stringify(data)),
    },
    saveFile: async (name, response) => downloads.push({ name, response }),
    copy: async () => {},
  });
  await app.start();
  return { win, root, client, app, saved, downloads };
}
async function submit(root, app, win, values = {}) {
  const form = root.querySelector('[role="dialog"] form');
  assert.ok(form);
  for (const [key, value] of Object.entries(values)) {
    const input = form.querySelector(`[name="${key}"]`);
    assert.ok(input, key);
    if (input.type === "checkbox") input.checked = value;
    else input.value = value;
  }
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
}

async function submitInline(root, app, win, selector, values = {}) {
  const form = root.querySelector(selector);
  assert.ok(form, selector);
  for (const [name, value] of Object.entries(values)) {
    const input = form.querySelector(`[name="${name}"]`);
    assert.ok(input, name);
    if (input.type === "checkbox") input.checked = value;
    else input.value = value;
  }
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
}

test("gray workflows use NamespaceBO.baseInfo and write branch items without touching the parent", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "gray" });
  assert.match(root.textContent, /灰度版本/);
  assert.match(root.textContent, /one/);
  root.querySelector('[data-action="gray-edit-item"]').click();
  await submit(root, app, win, { value: '{"gray":"value"}', type: "3" });
  assert.equal(client.calls.find((c) => c[0] === "saveItem")[2].type, 3);
  assert.equal(
    client.calls.find((c) => c[0] === "saveItem")[1].cluster,
    "gray-1",
  );
  root.querySelector('[data-action="gray-publish"]').click();
  await submit(root, app, win, { title: "Gray release" });
  const release = client.calls.find((c) => c[0] === "publishGray");
  assert.equal(release[1].cluster, "default");
  assert.equal(release[2], "gray-1");
  root.querySelector('[data-action="gray-merge"]').click();
  await app.idle();
  await submit(root, app, win, { branchDisposition: "keep" });
  await submit(root, app, win, { title: "Merge" });
  assert.equal(client.calls.find((c) => c[0] === "mergeGray")[4], false);
  await win.happyDOM.close();
});
test("sync apply requires a current preview and includes only selected items and targets", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "sync" });
  const target = [...root.querySelectorAll("[data-sync-target]")].find(
    (i) => i.dataset.env === "UAT",
  );
  assert.ok(target);
  assert.equal(target.checked, true);
  [...root.querySelectorAll('[data-sync-target]')].find(input => input.getAttribute('aria-label') === 'DEV/extra').click();
  const items = root.querySelectorAll("[data-sync-item]");
  items[0].click();
  root.querySelector('[data-action="sync-preview"]').click();
  await app.idle();
  assert.match(root.textContent, /核对差异/);
  const apply = root.querySelector('[data-action="sync-apply"]');
  assert.equal(apply.disabled, false);
  apply.click();
  await submit(root, app, win);
  const model = client.calls.find((c) => c[0] === "applySync")[2];
  assert.equal(model.syncItems.length, 1);
  assert.equal(model.syncItems[0].key, "a");
  assert.deepEqual(model.syncToNamespaces, [
    {
      appId: "SampleApp",
      env: "UAT",
      clusterName: "default",
      namespaceName: "application",
    },
  ]);
  await win.happyDOM.close();
});
test("changing sync selection invalidates preview and disabled buttons cannot apply stale targets", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "sync" });
  [...root.querySelectorAll("[data-sync-target]")]
    .find((i) => i.dataset.env === "UAT")
    .click();
  root.querySelector("[data-sync-item]").click();
  root.querySelector('[data-action="sync-preview"]').click();
  await app.idle();
  root.querySelector('[data-action="sync-back"]').click();
  root.querySelector("[data-sync-item]").click();
  assert.ok(!root.querySelector('[data-action="sync-apply"]'));
  assert.equal(app.state.syncPreview, null);
  assert.equal(client.calls.filter((c) => c[0] === "applySync").length, 0);
  await win.happyDOM.close();
});
test("source parity: access keys are visible in authorized environment tables but never persisted", async () => {
  const { win, root, app, saved } = await setup();
  await app.navigate({ ...base, view: "access-keys" });
  assert.match(root.textContent, /never-persist-this-key/);
  assert.ok(!root.querySelector('[data-action="reveal-key"]'));
  assert.ok(saved.every((v) => !v.includes("never-persist-this-key")));
  await win.happyDOM.close();
});
test("system role grants send a user list, and non-admins never query privileged endpoints", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "system-roles" });
  assert.match(root.textContent, /alice/);
  await submitInline(
    root,
    app,
    win,
    "[data-submit-action=grant-system-inline]",
    { users: "bob, carol" },
  );
  assert.deepEqual(client.calls.find((c) => c[0] === "grantSystemRole")[1], [
    "bob",
    "carol",
  ]);
  app.state.isRoot = false;
  let touched = false;
  client.systemRoles = async () => {
    touched = true;
    return [];
  };
  await app.navigate({ view: "system-roles" });
  assert.equal(touched, false);
  assert.match(root.textContent, /管理员/);
  await win.happyDOM.close();
});
test("audit search and trace render server data as text, not injected HTML", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "audit" });
  assert.match(root.textContent, /Item.update/);
  assert.equal(root.querySelector("[onerror]"), null);
  root.querySelector('[data-action="audit-trace"]').click();
  await app.idle();
  assert.equal(client.calls.find((c) => c[0] === "auditTrace")[1], "trace-1");
  assert.match(root.textContent, /trace-1/);
  await win.happyDOM.close();
});
test("global search reads the real SearchResponseEntity body and retains limit warnings", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ view: "global-search" });
  const form = root.querySelector('[data-form="advanced"]');
  form.querySelector('[name="key"]').value = "a";
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.match(root.textContent, /Results limited/);
  assert.match(root.textContent, /UAT/);
  root.querySelector('[data-action="search-open-config"]').click();
  await app.idle();
  assert.equal(app.state.route.env, "UAT");
  await win.happyDOM.close();
});
test("export uses Host save-file with original bytes instead of sandbox navigation", async () => {
  const { win, root, app, downloads } = await setup();
  await app.navigate({ view: "transfer" });
  root.querySelector("[data-export-env]").click();
  root.querySelector('[data-action="export-all"]').click();
  await app.idle();
  assert.equal(downloads[0].name, "configs.zip");
  assert.equal(downloads[0].response.bodyBase64, "AP9B");
  await win.happyDOM.close();
});
test("destructive operations query and confirm the displayed resource before dispatch", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "delete" });
  await submitInline(root, app, win, "[data-delete-kind=cluster]", {
    appId: "SampleApp",
    env: "DEV",
    cluster: "default",
  });
  root.querySelector("[data-action=delete-queried][data-kind=cluster]").click();
  await app.idle();
  assert.match(root.querySelector("[role=dialog]").textContent, /default/);
  assert.equal(client.calls.filter((c) => c[0] === "deleteCluster").length, 0);
  await submit(root, app, win, {});
  assert.equal(
    client.calls.find((c) => c[0] === "deleteCluster")[2],
    "default",
  );
  await win.happyDOM.close();
});
test("read-only advanced pages disable gray publishing and access key mutation", async () => {
  const { win, root, app } = await setup(true);
  await app.navigate({ ...base, view: "gray" });
  assert.equal(
    root.querySelector('[data-action="gray-publish"]').disabled,
    true,
  );
  await app.navigate({ ...base, view: "access-keys" });
  assert.equal(
    root.querySelector(
      "[data-submit-action=key-create-inline] [data-action=submit-form]",
    ).disabled,
    true,
  );
  await win.happyDOM.close();
});

test("advanced project submissions are single-flight and preserve user inputs on failure", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "create-project" });
  const form = root.querySelector('[data-form="advanced"]');
  form.querySelector('[name="appId"]').value = "NewApp";
  form.querySelector('[name="name"]').value = "New Project";
  form.querySelector('[name="orgId"]').value = "D";
  form.querySelector('[name="ownerName"]').value = "apollo";
  let writes = 0,
    rejectWrite;
  client.saveApp = () => {
    writes++;
    return new Promise((_resolve, reject) => (rejectWrite = reject));
  };
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  assert.equal(writes, 1);
  rejectWrite(Error("Permission denied"));
  await app.idle();
  assert.equal(root.querySelector('[name="name"]').value, "New Project");
  assert.match(root.textContent, /Permission denied/);
  await win.happyDOM.close();
});
test("release comparison reads nested Change.entity pairs, including added and removed keys", async () => {
  const { win, root, client, app } = await setup();
  client.releases = async () => [
    { baseInfo: { id: 2, name: "two" } },
    { baseInfo: { id: 1, name: "one" } },
  ];
  client.compareReleases = async () => ({
    changes: [
      {
        type: "MODIFIED",
        entity: {
          firstEntity: { key: "a", value: "old" },
          secondEntity: { key: "a", value: "new" },
        },
      },
      {
        type: "ADDED",
        entity: {
          firstEntity: null,
          secondEntity: { key: "b", value: "added" },
        },
      },
    ],
  });
  await app.navigate({ ...base, view: "release-diff" });
  root
    .querySelector('[data-form="advanced"]')
    .dispatchEvent(
      new win.Event("submit", { bubbles: true, cancelable: true }),
    );
  await app.idle();
  assert.match(root.textContent, /old/);
  assert.match(root.textContent, /new/);
  assert.match(root.textContent, /added/);
  await win.happyDOM.close();
});
test("environment role assignments remain scoped to the selected environment", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "permissions-env", env: "UAT" });
  await submitInline(root, app, win, "[data-submit-action=role-inline]", {
    user: "alice",
  });
  const grant = client.calls.find((c) => c[0] === "assignEnvRole");
  assert.equal(grant[1].env, "UAT");
  assert.equal(grant[2], "ModifyNamespace");
  await win.happyDOM.close();
});
test("public namespace linking binds each chosen namespace to each selected environment/cluster", async () => {
  const { win, root, client, app } = await setup();
  client.publicNamespaces = async () => [
    { name: "public.db", appId: "PublicApp" },
  ];
  await app.navigate({ ...base, view: "namespace-create" });
  let form = root.querySelector('[data-form="advanced"]');
  assert.ok(form);
  root
    .querySelector('[data-action="namespace-mode"][data-mode="link"]')
    .click();
  form = root.querySelector('[data-submit-action="namespace-create-submit"]');
  form.querySelector('[name="public_0"]').checked = true;
  for (const input of form.querySelectorAll('[name^="target_"]'))
    input.checked = false;
  form.querySelector('[name="target_2"]').checked = true;
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  const call = client.calls.find((c) => c[0] === "linkNamespaces");
  assert.deepEqual(call[2], [
    {
      env: "UAT",
      namespace: {
        appId: "SampleApp",
        clusterName: "default",
        namespaceName: "public.db",
      },
    },
  ]);
  await win.happyDOM.close();
});
test("cluster namespace permissions render and grant cluster role types rather than namespace roles", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "cluster-roles" });
  assert.match(root.textContent, /alice/);
  await submitInline(root, app, win, "[data-submit-action=role-inline]", {
    user: "bob",
  });
  const grant = client.calls.find((c) => c[0] === "assignClusterRole");
  assert.equal(grant[2], "ModifyNamespacesInCluster");
  assert.equal(grant[1].cluster, "default");
  await win.happyDOM.close();
});

test("project form values are scoped to full resource identity and cannot leak into another project", async () => {
  const { win, root, client, app } = await setup();
  client.app = async (id) => ({
    appId: id,
    name: id + " name",
    orgId: id + " org",
    orgName: id + " dept",
    ownerName: "apollo",
  });
  await app.navigate({ view: "project", appId: "APP_A" });
  root.querySelector("[data-action=edit-project]").click();
  let form = root.querySelector("[data-submit-action=save-project-submit]");
  form.querySelector('[name="name"]').value = "A edited";
  client.saveApp = async () => {
    throw Error("retryable failure");
  };
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  await app.navigate({ view: "project", appId: "APP_B" });
  assert.equal(root.querySelector('[name="appId"]').value, "APP_B");
  assert.equal(root.querySelector('[name="name"]').value, "APP_B name");
  await win.happyDOM.close();
});

test("favorite handles Apollo null lookup and cannot switch its mutation target during an await", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "config" });
  client.favorites = async () => [null];
  client.favorite = async (...args) => client.calls.push(["favorite", ...args]);
  root.querySelector('[data-action="favorite-project"]').click();
  await app.idle();
  assert.equal(client.calls.find((c) => c[0] === "favorite")[2], "SampleApp");
  let complete;
  client.favorites = () => new Promise((resolve) => (complete = resolve));
  root.querySelector('[data-action="favorite-project"]').click();
  await app.navigate({ view: "project", appId: "OTHER" });
  complete([null]);
  await app.idle();
  assert.equal(client.calls.filter((c) => c[0] === "favorite").length, 1);
  await win.happyDOM.close();
});

test("consumer creation sends required organization, rate policy and optional expiry", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "consumers" });
  root.querySelector('[data-action="new-consumer"]').click();
  await app.idle();
  client.consumerToken = async () => ({ token: "new-consumer-secret" });
  await submitInline(
    root,
    app,
    win,
    "[data-submit-action=consumer-create-submit]",
    {
      appId: "service",
      name: "Service",
      ownerName: "alice",
      orgId: "D",
      rateLimitEnabled: true,
      rateLimit: "25",
      allowCreateApplication: true,
      expires: "2030-01-01T00:00",
    },
  );
  const call = client.calls.find((c) => c[0] === "createConsumer");
  assert.equal(call[1].orgId, "D");
  assert.equal(call[1].orgName, "Dept");
  assert.equal(call[1].rateLimit, 25);
  assert.equal(call[2], "20300101000000");
  await win.happyDOM.close();
});

test("audit trace uses nested logDTO metadata rather than flattened test-only data", async () => {
  const { win, root, client, app } = await setup();
  client.auditTrace = async () => [
    {
      logDTO: {
        opName: "Real nested operation",
        operator: "real-user",
        spanId: "span-nested",
        description: "Details",
      },
      dataInfluenceDTOList: [
        {
          influenceEntityName: "Item",
          fieldName: "value",
          fieldOldValue: "old",
          fieldNewValue: "new",
        },
      ],
    },
  ];
  await app.navigate({ view: "audit-trace", traceId: "trace-1" });
  assert.match(root.textContent, /Real nested operation/);
  root.querySelector('[data-action="trace-select"]').click();
  assert.match(root.textContent, /real-user/);
  assert.match(root.textContent, /span-nested/);
  await win.happyDOM.close();
});

test("sync preserves ItemDTO value type instead of silently converting typed values to strings", async () => {
  const { syncModel } = await import("../src/advanced.js");
  const model = syncModel({
    syncChoices: [
      {
        appId: "A",
        env: "DEV",
        clusterName: "default",
        namespaceName: "application",
      },
    ],
    syncTargets: { 0: true },
    syncKeys: { setting: true },
    syncSource: {
      items: [{ item: { key: "setting", value: "true", type: 2, lineNum: 1 } }],
    },
  });
  assert.equal(model.syncItems[0].type, 2);
});

test("parity: gray full merge refuses a parent with unpublished changes, and rechecks on submit", async () => {
  const { win, root, client, app } = await setup();
  client.namespace = async () => ({ ...source, itemModifiedCnt: 1 });
  await app.navigate({ ...base, view: "gray" });
  root.querySelector('[data-action="gray-merge"]').click();
  await app.idle();
  assert.equal(client.calls.filter((c) => c[0] === "mergeGray").length, 0);
  assert.ok(!root.querySelector('[role="dialog"] [name="title"]'));
  assert.match(root.textContent, /未发布|unpublished/i);
  client.namespace = async () => ({ ...source, itemModifiedCnt: 0 });
  root.querySelector('[data-action="cancel-dialog"]')?.click();
  root.querySelector('[data-action="gray-merge"]').click();
  await app.idle();
  await submit(root, app, win, {});
  client.namespace = async () => ({ ...source, itemModifiedCnt: 1 });
  await submit(root, app, win, { title: "Must not merge" });
  assert.equal(client.calls.filter((c) => c[0] === "mergeGray").length, 0);
  await win.happyDOM.close();
});

test("parity: system Master assignment queries an app before enabling a captured grant", async () => {
  const { win, root, client, app } = await setup();
  client.manageMaster = async (...args) =>
    client.calls.push(["manageMaster", ...args]);
  await app.navigate({ view: "system-roles" });
  assert.ok(root.querySelector("[data-system-master]"));
  assert.equal(
    root.querySelector('[data-action="allow-master"]').disabled,
    true,
  );
  const query = root.querySelector("[data-system-master] form");
  query.querySelector("[name=appId]").value = "SampleApp";
  query.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  root.querySelector('[data-system-master] [name="user"]').value = "alice";
  root.querySelector('[data-action="allow-master"]').click();
  await app.idle();
  await submit(root, app, win, {});
  assert.deepEqual(client.calls.find((c) => c[0] === "manageMaster").slice(1), [
    "SampleApp",
    "alice",
    true,
  ]);
  await win.happyDOM.close();
});

test("parity: deletion requires query/readback, and an identifier edit invalidates deletion", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "delete" });
  let form = root.querySelector('[data-delete-kind="app"]');
  assert.ok(form);
  assert.equal(
    form.querySelector('[data-action="delete-queried"]').disabled,
    true,
  );
  form.querySelector('[name="appId"]').value = "SampleApp";
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  form = root.querySelector('[data-delete-kind="app"]');
  assert.match(form.textContent, /Sample/);
  assert.equal(
    form.querySelector('[data-action="delete-queried"]').disabled,
    false,
  );
  const appId = form.querySelector('[name="appId"]');
  appId.value = "AnotherApp";
  appId.dispatchEvent(new win.Event("input", { bubbles: true }));
  assert.equal(
    root.querySelector(
      '[data-delete-kind="app"] [data-action="delete-queried"]',
    ).disabled,
    true,
  );
  assert.equal(client.calls.filter((c) => c[0] === "deleteApp").length, 0);
  await win.happyDOM.close();
});

test("parity: management pages keep inline user/parameter editors and grouped service tables", async () => {
  const { win, root, client, app } = await setup();
  client.users = async () => [
    { userId: "alice", name: "Alice", email: "a@example.test", enabled: 1 },
  ];
  client.serverConfigs = async () => [{ key: "k", value: "v", comment: "c" }];
  client.environments = async () => ["DEV", "UAT"];
  await app.navigate({ view: "users" });
  root.querySelector('[data-action="new-user"]').click();
  await app.idle();
  assert.equal(!!root.querySelector("[role=dialog]"), false);
  assert.ok(root.querySelector("[data-inline-user]"));
  await app.navigate({ view: "server-config" });
  root.querySelector('[data-action="edit-server-config"]').click();
  await app.idle();
  assert.equal(!!root.querySelector("[role=dialog]"), false);
  assert.ok(root.querySelector("[data-inline-config]"));
  await app.navigate({ view: "system-info" });
  assert.ok(root.querySelector('[data-services="configServices"]'));
  assert.ok(root.querySelector('[data-services="adminServices"]'));
  await win.happyDOM.close();
});

test("parity: gray configuration stays inside the project and exposes master values and four subviews", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: "gray" });
  assert.ok(root.querySelector(".project-layout"));
  assert.ok(root.querySelector("[data-gray-tabs]"));
  assert.match(root.textContent, /主版本的值|Master value/);
  assert.ok(
    root.querySelector('[data-action="gray-tab"][data-tab="instances"]'),
  );
  await win.happyDOM.close();
});

test("parity: compare and synchronize have distinct first steps and text comparison controls", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ ...base, view: "diff" });
  assert.ok(root.querySelector('[name="compareMode"][value="text"]'));
  assert.equal(root.querySelectorAll("[data-sync-item]").length, 0);
  await app.navigate({ ...base, view: "sync" });
  assert.ok(root.querySelector('[data-sync-date="start"]'));
  assert.ok(root.querySelector('[data-sync-sort="key"]'));
  await win.happyDOM.close();
});

test("parity: consumer authorization retrieves the token rather than assuming it is in ConsumerDTO", async () => {
  const { win, root, client, app } = await setup();
  client.consumers = async () => [{ appId: "consumer", name: "Consumer" }];
  client.consumerToken = async () => ({
    token: "actual-token-from-token-controller",
  });
  client.assignConsumer = async (...args) =>
    client.calls.push(["assignConsumer", ...args]);
  await app.navigate({ view: "consumers" });
  root.querySelector('[data-action="assign-consumer"]').click();
  await app.idle();
  assert.ok(!root.textContent.includes("actual-token-from-token-controller"));
  await submit(root, app, win, {
    appId: "SampleApp",
    namespace: "application",
    env_DEV: true,
  });
  assert.equal(
    client.calls.find((c) => c[0] === "assignConsumer")[1],
    "actual-token-from-token-controller",
  );
  assert.deepEqual(client.calls.find((c) => c[0] === "assignConsumer")[3], [
    "DEV",
  ]);
  await win.happyDOM.close();
});

test("parity: audit trace tree selection drives entity and property-history columns", async () => {
  const { win, root, client, app } = await setup();
  client.auditTrace = async () => [
    { logDTO: { spanId: "parent", opName: "Parent" } },
    {
      logDTO: { spanId: "child", parentSpanId: "parent", opName: "Child" },
      dataInfluenceDTOList: [
        {
          influenceEntityName: "Item",
          influenceEntityId: "1",
          fieldName: "value",
          fieldOldValue: "old",
          fieldNewValue: "new",
        },
      ],
    },
  ];
  client.auditFieldHistory = async (...args) => {
    client.calls.push(["auditFieldHistory", ...args]);
    return [
      { fieldName: "value", fieldOldValue: "older", fieldNewValue: "newer" },
    ];
  };
  await app.navigate({ view: "audit-trace", traceId: "trace" });
  assert.equal(root.querySelectorAll("[data-trace-column]").length, 3);
  root.querySelector('[data-action="trace-select"][data-span="child"]').click();
  await app.idle();
  assert.match(
    root.querySelector('[data-trace-column="entities"]').textContent,
    /old/,
  );
  root.querySelector('[data-action="trace-field"]').click();
  await app.idle();
  assert.match(
    root.querySelector('[data-trace-column="history"]').textContent,
    /older/,
  );
  assert.deepEqual(
    client.calls.find((c) => c[0] === "auditFieldHistory").slice(1),
    ["Item", "1", "value", 0],
  );
  await win.happyDOM.close();
});

test("parity: failed inline grant preserves radio values and the explicitly selected scope", async () => {
  const { win, root, client, app } = await setup();
  client.consumerToken = async () => ({ token: "credential" });
  client.assignConsumer = async () => {
    throw Error("Denied");
  };
  await app.navigate({ view: "consumer-create" });
  await submitInline(root, app, win, "[data-submit-action=consumer-lookup]", {
    lookupAppId: "consumer",
  });
  const form = root.querySelector("[data-submit-action=consumer-grant-inline]");
  form.querySelector("[name=managedAppId]").value = "SampleApp";
  form.querySelector("[name=type][value=AppRole]").checked = true;
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  const radios = [
    ...root.querySelectorAll(
      "[data-submit-action=consumer-grant-inline] [name=type]",
    ),
  ];
  assert.deepEqual(
    radios.map((input) => input.value),
    ["NamespaceRole", "AppRole"],
  );
  assert.equal(radios[1].checked, true);
  await win.happyDOM.close();
});

test("parity: deleting a namespace shows usage and requires the explicit force-delete button", async () => {
  const { win, root, client, app } = await setup();
  client.namespaceUsage = async () => [
    {
      envName: "DEV",
      clusterName: "default",
      namespaceName: "application",
      instanceCount: 2,
      branchInstanceCount: 0,
    },
  ];
  await app.navigate({ ...base, view: "config" });
  root.querySelector('[data-action="namespace-delete"]').click();
  await app.idle();
  assert.match(root.querySelector("[role=dialog]").textContent, /DEV/);
  assert.match(root.querySelector('[role="dialog"] [data-action="submit-form"]').textContent, /强制/);
  assert.equal(client.calls.filter(call => call[0] === 'deleteNamespace').length, 0);
  await submit(root, app, win, {});
  assert.equal(
    client.calls.filter((c) => c[0] === "deleteNamespace").length,
    1,
  );
  await win.happyDOM.close();
});

test("parity: Namespace creation uses create/link controls and opens the returned namespace authorization", async () => {
  const { win, root, client, app } = await setup();
  client.createNamespace = async (...args) => {
    client.calls.push(["createNamespace", ...args]);
    return { name: "DEP.settings" };
  };
  await app.navigate({ ...base, view: "namespace-create" });
  assert.ok(
    root.querySelector('[data-action="namespace-mode"][data-mode="link"]'),
  );
  assert.ok(root.querySelector('[name="namespaceType"][value="public"]'));
  const form = root.querySelector(
    '[data-submit-action="namespace-create-submit"]',
  );
  form.querySelector('[name="name"]').value = "settings";
  form.querySelector('[name="namespaceType"][value="public"]').checked = true;
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(
    client.calls.find((c) => c[0] === "createNamespace")[2].isPublic,
    true,
  );
  assert.equal(app.state.route.view, "permissions");
  assert.equal(app.state.route.namespace, "DEP.settings");
  await win.happyDOM.close();
});

test("parity: import/export exposes independent inline environment imports and application-cluster query", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ view: "transfer" });
  assert.ok(
    root.querySelector(
      '[data-submit-action="transfer-import-submit"] input[type=file]',
    ),
  );
  assert.ok(
    root.querySelector('[data-action="transfer-tab"][data-tab="cluster"]'),
  );
  root
    .querySelector('[data-action="transfer-tab"][data-tab="cluster"]')
    .click();
  await app.idle();
  assert.ok(root.querySelector("[data-transfer-query]"));
  assert.equal(
    root.querySelector('[data-action="export-transfer-cluster"]').disabled,
    true,
  );
  await win.happyDOM.close();
});

test("parity: opening permission pages never initializes roles for a non-admin or read-only connection", async () => {
  const { win, client, app } = await setup();
  let initialized = 0;
  client.initializeClusterRoles = async () => initialized++;
  client.initializeNamespaceRoles = async () => initialized++;
  app.state.isRoot = false;
  client.appPermission = async () => ({ hasPermission: false });
  await app.navigate({ ...base, view: "cluster-roles" });
  assert.equal(initialized, 0);
  app.state.isRoot = true;
  app.state.readOnly = true;
  await app.navigate({ ...base, view: "cluster-roles" });
  await app.navigate({ ...base, view: "permissions" });
  assert.equal(initialized, 0);
  await win.happyDOM.close();
});

test("parity: an older environment-role lookup cannot replace the latest selection", async () => {
  const { win, root, client, app } = await setup();
  const pending = {};
  await app.navigate({ ...base, view: "permissions" });
  client.envRoleUsers = (scope) =>
    new Promise((resolve) => (pending[scope.env] = resolve));
  const select = root.querySelector('[data-role-env="ModifyNamespace"]');
  select.value = "DEV";
  select.dispatchEvent(new win.Event("input", { bubbles: true }));
  const latestSelect = root.querySelector('[data-role-env="ModifyNamespace"]');
  latestSelect.value = "UAT";
  latestSelect.dispatchEvent(new win.Event("input", { bubbles: true }));
  pending.UAT({ modifyRoleUsers: [{ userId: "uat-user" }] });
  pending.DEV({ modifyRoleUsers: [{ userId: "dev-user" }] });
  await app.idle();
  assert.equal(app.state.roleBuckets.ModifyNamespace.env, "UAT");
  assert.match(root.textContent, /uat-user/);
  await win.happyDOM.close();
});

test("role scope is blocked while its environment lookup is pending, including synthetic submits", async () => {
  const { win, root, client, app } = await setup();
  let resolveRoles;
  client.assignRole = async (...args) => client.calls.push(["assignRole", ...args]);
  await app.navigate({ ...base, view: "permissions" });
  client.envRoleUsers = () => new Promise(resolve => { resolveRoles = resolve; });
  const select = root.querySelector('[data-role-env="ModifyNamespace"]');
  select.value = "UAT";
  select.dispatchEvent(new win.Event("input", { bubbles: true }));
  const form = root.querySelector('[data-role="ModifyNamespace"] form');
  const blocked = form.querySelector('[data-action="submit-form"]').disabled;
  form.querySelector('[name="user"]').value = "alice";
  form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise(resolve => setTimeout(resolve, 0));
  const earlyWrites = client.calls.filter(call => /assign.*Role/.test(call[0]));
  resolveRoles({ modifyRoleUsers: [], releaseRoleUsers: [] });
  await app.idle();
  assert.deepEqual(earlyWrites, [], "no global or environment grant before scope is loaded");
  assert.equal(blocked, true);
  client.envRoleUsers = async () => ({ modifyRoleUsers: [], releaseRoleUsers: [] });
  await submitInline(root, app, win, '[data-role="ModifyNamespace"] form', { user: "alice" });
  const writes = client.calls.filter(call => /assign.*Role/.test(call[0]));
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], "assignEnvRole");
  assert.equal(writes[0][1].env, "UAT");
  await win.happyDOM.close();
});

test("a failed global-role form cannot restore its hidden scope over a newly selected environment", async () => {
  const { win, root, client, app } = await setup();
  client.assignRole = async () => { throw Error("global grant rejected"); };
  await app.navigate({ ...base, view: "permissions" });
  await submitInline(root, app, win, '[data-role="ModifyNamespace"] form', { user: "alice" });
  const select = root.querySelector('[data-role-env="ModifyNamespace"]');
  select.value = "UAT";
  select.dispatchEvent(new win.Event("input", { bubbles: true }));
  await app.idle();
  assert.equal(root.querySelector('[data-role="ModifyNamespace"] [name="env"]').value, "UAT");
  await submitInline(root, app, win, '[data-role="ModifyNamespace"] form', { user: "alice" });
  assert.equal(client.calls.find(call => call[0] === "assignEnvRole")?.[1].env, "UAT");
  await win.happyDOM.close();
});

test("literal Apollo namespace-role DTO fields render global and environment grant tags", async () => {
  const { win, root, client, app } = await setup();
  client.roleUsers = async () => ({ modifyRoleUsers: [{ userId: "global-editor" }], releaseRoleUsers: [{ userId: "global-publisher" }] });
  client.envRoleUsers = async () => ({ modifyRoleUsers: [{ userId: "uat-editor" }], releaseRoleUsers: [{ userId: "uat-publisher" }] });
  await app.navigate({ ...base, view: "permissions" });
  assert.match(root.textContent, /global-editor/);
  assert.match(root.textContent, /global-publisher/);
  const select = root.querySelector('[data-role-env="ModifyNamespace"]');
  select.value = "UAT";
  select.dispatchEvent(new win.Event("input", { bubbles: true }));
  await app.idle();
  assert.match(root.querySelector('[data-role="ModifyNamespace"]').textContent, /uat-editor/);
  await app.navigate({ ...base, env: "UAT", view: "permissions-env" });
  assert.match(root.textContent, /uat-editor/);
  assert.match(root.textContent, /uat-publisher/);
  await win.happyDOM.close();
});

test("source parity: access-key rows keep actual environment identities and only offer applicable actions", async () => {
  const { win, root, client, app } = await setup();
  client.accessKeys = async scope => [{ id: 1, enabled: true, mode: scope.env === 'DEV' ? 0 : 1, secret: scope.env + "-private-secret" }];
  await app.navigate({ ...base, view: "access-keys" });
  assert.match(root.textContent, /DEV-private-secret/);
  assert.match(root.textContent, /UAT-private-secret/);
  assert.ok(!root.querySelector('[data-action="delete-key"]'));
  assert.ok(root.querySelector('[data-action="observe-key"][data-env="DEV"]'));
  assert.ok(!root.querySelector('[data-action="enable-key"][data-env="DEV"]'));
  assert.ok(root.querySelector('[data-action="enable-key"][data-env="UAT"]'));
  assert.ok(!root.querySelector('[data-action="observe-key"][data-env="UAT"]'));
  await win.happyDOM.close();
});
test("an empty comparison origin still compares two namespaces including target-only keys", async () => {
  const { win, root, client, app } = await setup();
  client.namespace = async scope => ({ ...source, items: scope.env === "DEV" ? [] : [{ item: { key: "target-only", value: "target value" } }] });
  await app.navigate({ ...base, view: "diff" });
  [...root.querySelectorAll('[data-sync-target]')].find(input => input.dataset.env === "UAT").click();
  root.querySelector('[data-action="sync-preview"]').click();
  await app.idle();
  assert.equal(app.state.syncStep, 2);
  assert.match(root.textContent, /target-only/);
  assert.match(root.textContent, /target value/);
  assert.equal(client.calls.filter(call => /Sync/.test(call[0])).length, 0);
  await win.happyDOM.close();
});

test("gray rules use instance/manual IP chips and accept label-only rules without wildcard or duplicate leakage", async () => {
  const { win, root, client, app } = await setup();
  client.ruleInstances = async () => ({ content: [{ ip: "127.0.0.1" }] });
  await app.navigate({ ...base, view: "gray" });
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click();
  await app.idle();
  root.querySelector('[data-action="gray-add-rule"]').click();
  await app.idle();
  assert.ok(root.querySelector('[data-gray-rule-instances]'));
  assert.ok(!root.querySelector('[name="newIps"]'));
  root.querySelector('[data-action="gray-rule-manual"]').click();
  const ips = root.querySelector('[name="newIps"]');
  ips.value = "127.0.0.1,127.0.0.1";
  root.querySelector('[data-action="gray-rule-add-ip"]').click();
  await app.idle();
  assert.equal(root.querySelectorAll('[data-gray-ip]').length, 1);
  root.querySelector('[data-action="gray-rule-remove-ip"]').click();
  root.querySelector('[name="newLabels"]').value = "canary,canary";
  root.querySelector('[data-action="gray-rule-add-label"]').click();
  await app.idle();
  await submit(root, app, win);
  const model = client.calls.find(call => call[0] === "saveBranchRules")[3];
  assert.deepEqual(model.ruleItems[0], { clientAppId: "SampleApp", clientIpList: [], clientLabelList: ["canary"] });
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click();
  await app.idle();
  root.querySelector('[data-action="gray-add-rule"]').click();
  await app.idle();
  root.querySelector('[data-action="gray-rule-manual"]').click();
  root.querySelector('[name="newIps"]').value = "999.1.2.3";
  root.querySelector('[data-action="gray-rule-add-ip"]').click();
  await app.idle();
  assert.equal(root.querySelectorAll('[data-gray-ip]').length, 0);
  assert.equal(client.calls.filter(call => call[0] === "saveBranchRules").length, 1);
  await win.happyDOM.close();
});

test("a public namespace gray rule supports all instances and rejects a second rule for the same AppId", async () => {
  const { win, root, client, app } = await setup();
  client.namespace = async () => ({ ...source, isPublic: true, parentAppId: 'SampleApp' });
  client.ruleInstances = async () => ({ content: [] });
  await app.navigate({ ...base, view: "gray" });
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click();
  await app.idle();
  root.querySelector('[data-action="gray-add-rule"]').click();
  await app.idle();
  root.querySelector('[name="clientAppId"]').value = "consumer-app";
  root.querySelector('[data-action="gray-rule-mode"][data-all="true"]').click();
  await app.idle();
  await submit(root, app, win);
  const model = client.calls.find(call => call[0] === "saveBranchRules")[3];
  assert.deepEqual(model.ruleItems[0], { clientAppId: "consumer-app", clientIpList: ["*"], clientLabelList: ["*"] });
  client.branchRules = async () => model;
  await app.navigate({ ...base, view: "gray" });
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click();
  await app.idle();
  root.querySelector('[data-action="gray-add-rule"]').click();
  await app.idle();
  root.querySelector('[name="clientAppId"]').value = "consumer-app";
  root.querySelector('[data-action="gray-rule-mode"][data-all="true"]').click();
  await app.idle();
  await submit(root, app, win);
  assert.equal(client.calls.filter(call => call[0] === "saveBranchRules").length, 1);
  assert.ok(root.querySelector('[role="dialog"]'));
  await win.happyDOM.close();
});

test("a real linked public NamespaceBO keeps gray rule AppId fixed to the consumer application", async () => {
  const { win, root, client, app } = await setup();
  client.namespace = async () => ({ ...source, isPublic: true, parentAppId: 'PublicProvider' });
  await app.navigate({ ...base, view: 'gray' });
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click();
  await app.idle();
  root.querySelector('[data-action="gray-add-rule"]').click();
  await app.idle();
  assert.ok(!root.querySelector('[role="dialog"] [name="clientAppId"]'));
  assert.ok(!root.querySelector('[data-action="gray-rule-mode"]'));
  assert.equal(app.state.dialog.grayRule.clientAppId, 'SampleApp');
  await win.happyDOM.close();
});

test("late gray instance lookup preserves IP and label text not yet added to the chip lists", async () => {
  const { win, root, client, app } = await setup();
  let resolveInstances;
  client.ruleInstances = () => new Promise(resolve => { resolveInstances = resolve; });
  await app.navigate({ ...base, view: 'gray' });
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click();
  await app.idle();
  root.querySelector('[data-action="gray-add-rule"]').click();
  root.querySelector('[data-action="gray-rule-manual"]').click();
  for (const [name, value] of [['newIps','127.0.0.2'],['newLabels','in-progress']]) {
    const input = root.querySelector(`[name="${name}"]`);
    input.value = value;
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
  }
  resolveInstances({ content: [{ ip: '127.0.0.1' }] });
  await app.idle();
  assert.equal(root.querySelector('[name="newIps"]').value, '127.0.0.2');
  assert.equal(root.querySelector('[name="newLabels"]').value, 'in-progress');
  assert.equal(root.querySelectorAll('[data-gray-ip]').length, 0);
  await win.happyDOM.close();
});

test("deleting an owned AppNamespace acknowledges linked usage even when instance counts are zero", async () => {
  const { win, root, client, app } = await setup();
  client.namespaceUsage = async () => [{ appId: 'LinkedConsumer', envName: 'DEV', namespaceName: 'application', instanceCount: 0, branchInstanceCount: 0 }];
  await app.navigate({ ...base, view: 'config' });
  root.querySelector('[data-action="namespace-delete"]').click();
  await app.idle();
  assert.match(root.querySelector('[role="dialog"] [data-action="submit-form"]').textContent, /强制/);
  assert.equal(client.calls.filter(call => call[0] === 'deleteNamespace').length, 0);
  await submit(root, app, win);
  assert.equal(client.calls.filter(call => call[0] === 'deleteNamespace').length, 1);
  await win.happyDOM.close();
});

test("namespace permissions keep global, DEV and UAT assignments visible while the grant target changes", async () => {
  const { win, root, client, app } = await setup();
  client.roleUsers = async () => ({ modifyRoleUsers: [{ userId: 'global-editor' }], releaseRoleUsers: [] });
  client.envRoleUsers = async scope => ({ modifyRoleUsers: [{ userId: scope.env + '-editor' }], releaseRoleUsers: [] });
  await app.navigate({ ...base, view: 'permissions' });
  const groups = () => root.querySelectorAll('[data-role="ModifyNamespace"] [data-role-group]');
  assert.equal(groups().length, 3);
  assert.match(root.textContent, /global-editor/);
  assert.match(root.textContent, /DEV-editor/);
  assert.match(root.textContent, /UAT-editor/);
  const select = root.querySelector('[data-role-env="ModifyNamespace"]');
  select.value = 'UAT'; select.dispatchEvent(new win.Event('input', { bubbles: true }));
  await app.idle();
  assert.equal(groups().length, 3);
  assert.match(root.textContent, /global-editor/);
  assert.match(root.textContent, /DEV-editor/);
  assert.equal(root.querySelector('[data-role="ModifyNamespace"] [name="env"]').value, 'UAT');
  await win.happyDOM.close();
});

test("removing a global grant while UAT is selected uses the global row scope, not the grant form scope", async () => {
  const { win, root, client, app } = await setup();
  client.roleUsers = async () => ({ modifyRoleUsers: [{ userId: 'global-editor' }], releaseRoleUsers: [] });
  client.revokeRole = async (...args) => client.calls.push(['revokeRole', ...args]);
  client.revokeEnvRole = async (...args) => client.calls.push(['revokeEnvRole', ...args]);
  await app.navigate({ ...base, view: 'permissions' });
  const select = root.querySelector('[data-role-env="ModifyNamespace"]');
  select.value = 'UAT'; select.dispatchEvent(new win.Event('input', { bubbles: true }));
  await app.idle();
  const remove = root.querySelector('[data-action="role-inline-remove"][data-env=""][data-user="global-editor"]');
  assert.ok(remove);
  remove.click(); await submit(root, app, win);
  assert.equal(client.calls.filter(call => call[0] === 'revokeRole').length, 1);
  assert.equal(client.calls.filter(call => call[0] === 'revokeEnvRole').length, 0);
  await win.happyDOM.close();
});

test("sync defaults select every other cluster, retain the unchecked source row and support select-all", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: 'sync' });
  const targets = [...root.querySelectorAll('[data-sync-target]')];
  assert.equal(targets.length, 3);
  assert.equal(targets.find(input => input.getAttribute('aria-label') === 'DEV/default').checked, false);
  assert.equal(targets.find(input => input.getAttribute('aria-label') === 'DEV/extra').checked, true);
  assert.equal(targets.find(input => input.getAttribute('aria-label') === 'UAT/default').checked, true);
  root.querySelector('[data-action="toggle-sync-targets"]').click();
  assert.ok([...root.querySelectorAll('[data-sync-target]')].every(input => !input.checked));
  root.querySelector('[data-action="toggle-sync-targets"]').click();
  root.querySelector('[data-action="toggle-sync-items"]').click();
  root.querySelector('[data-action="sync-preview"]').click();
  await app.idle();
  const model = client.calls.find(call => call[0] === 'previewSync')[2];
  assert.equal(model.syncToNamespaces.length, 3);
  assert.equal(model.syncItems.length, 2);
  await win.happyDOM.close();
});

test("creating gray shows the original workflow notice and never writes before confirmation", async () => {
  const { win, root, client, app } = await setup();
  client.branches = async () => null;
  client.createBranch = async scope => client.calls.push(['createBranch', scope]);
  await app.navigate({ ...base, view: 'gray' });
  root.querySelector('[data-action="create-gray"]').click(); await app.idle();
  assert.equal(client.calls.length, 0);
  assert.equal(root.querySelector('[role="dialog"]').dataset.dialogSource, 'createBranchTips');
  assert.match(root.querySelector('[role="dialog"]').textContent, /灰度流程/);
  await submit(root, app, win);
  assert.equal(client.calls.filter(call => call[0] === 'createBranch').length, 1);
  await win.happyDOM.close();
});

test("gray publication without rules succeeds then shows the source missing-rules notice", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ ...base, view: 'gray' });
  root.querySelector('[data-action="gray-publish"]').click(); await app.idle();
  await submit(root, app, win, { title: 'Without rules' });
  assert.equal(client.calls.filter(call => call[0] === 'publishGray').length, 1);
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource, 'grayReleaseWithoutRulesTips');
  assert.equal(app.state.grayTab, 'rules');
  await win.happyDOM.close();
});

test("handwritten user selectors search choices, select by keyboard and retain multiple administrator chips", async () => {
  const { win, root, client, app } = await setup();
  client.users = async () => [{ userId: 'alice', name: 'Alice' }, { userId: 'bob', name: 'Bob' }];
  await app.navigate({ view: 'create-project' });
  const owner = root.querySelector('[name="ownerName"]');
  owner.value = 'ali'; owner.dispatchEvent(new win.Event('input', { bubbles: true }));
  assert.equal(owner.getAttribute('aria-expanded'), 'true');
  owner.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  owner.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  assert.equal(root.querySelector('[name="ownerName"]').value, 'alice');
  const picker = root.querySelector('[data-user-picker="admins"]');
  picker.querySelector('[data-action="user-picker-toggle"]').click();
  picker.querySelector('[data-user-id="alice"]').click();
  picker.querySelector('[data-action="user-picker-toggle"]').click();
  picker.querySelector('[data-user-id="bob"]').click();
  assert.equal(root.querySelector('[name="admins"]').value, 'alice,bob');
  assert.equal(picker.querySelectorAll('[data-user-chip]').length, 2);
  picker.querySelector('[data-action="user-picker-remove"][data-user-id="alice"]').click();
  assert.equal(root.querySelector('[name="admins"]').value, 'bob');
  assert.equal(client.calls.filter(call => call[0] === 'saveApp').length, 0);
  await win.happyDOM.close();
});

test("gray rule updates show the source unpublished-config notice after a successful rule write", async () => {
  const { win, root, client, app } = await setup();
  const branch = client.branches;
  client.branches = async scope => ({ ...await branch(scope), itemModifiedCnt: 1 });
  await app.navigate({ ...base, view: 'gray' });
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click(); await app.idle();
  root.querySelector('[data-action="gray-add-rule"]').click(); await app.idle();
  root.querySelector('[name="newLabels"]').value = 'canary';
  root.querySelector('[data-action="gray-rule-add-label"]').click();
  await submit(root, app, win);
  assert.equal(client.calls.filter(call => call[0] === 'saveBranchRules').length, 1);
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource, 'updateRuleTips');
  await win.happyDOM.close();
});

test("gray merge denial is a dedicated acknowledgement, not a generic toast or submittable release", async () => {
  const { win, root, client, app } = await setup();
  client.namespace = async () => ({ ...source, itemModifiedCnt: 1 });
  await app.navigate({ ...base, view: 'gray' });
  root.querySelector('[data-action="gray-merge"]').click(); await app.idle();
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource, 'mergeAndReleaseDenyDialog');
  assert.ok(!root.querySelector('[role="dialog"] [data-action="submit-form"]'));
  assert.equal(client.calls.length, 0);
  await win.happyDOM.close();
});

test("gray self-publication has the source restriction/emergency flow and rechecks the real flag before writing", async () => {
  const { win, root, client, app } = await setup();
  let allowed = true;
  client.namespaceLock = async () => ({ lockOwner: 'apollo', isEmergencyPublishAllowed: allowed });
  await app.navigate({ ...base, view: 'gray' });
  root.querySelector('[data-action="gray-publish"]').click(); await app.idle();
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource, 'publishDenyModal');
  assert.ok(!root.querySelector('[role="dialog"] [name="title"]'));
  await submit(root, app, win);
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource, 'emergencyPublishAlertDialog');
  await submit(root, app, win);
  allowed = false;
  await submit(root, app, win, { title: 'Not allowed' });
  assert.equal(client.calls.filter(call => call[0] === 'publishGray').length, 0);
  allowed = true;
  await submit(root, app, win, { title: 'Allowed emergency' });
  assert.equal(client.calls.find(call => call[0] === 'publishGray')[3].isEmergencyPublish, true);
  await win.happyDOM.close();
});

test("consumer create shares the queried AppId without duplicate fields and preserves the independent creation draft", async () => {
  const { win, root, client, app } = await setup();
  client.consumerToken = async appId => ({ appId, token: 'local-fixture-token' });
  await app.navigate({ view: 'consumer-create' });
  const create = root.querySelector('[data-submit-action="consumer-create-submit"]');
  assert.equal(create.querySelector('[name="appId"]').type, 'hidden');
  const name = create.querySelector('[name="name"]'); name.value = 'Third App'; name.dispatchEvent(new win.Event('input', { bubbles:true }));
  await submitInline(root, app, win, '[data-submit-action="consumer-lookup"]', { lookupAppId:'ThirdApp' });
  assert.equal(root.querySelector('[data-submit-action="consumer-create-submit"] [name="appId"]').value, 'ThirdApp');
  assert.equal(root.querySelector('[data-submit-action="consumer-create-submit"] [name="name"]').value, 'Third App');
  await win.happyDOM.close();
});

test("namespace deletion upgrades to the source force button when usage appears after opening, without deleting early", async () => {
  const { win, root, client, app } = await setup();
  let rows = [];
  client.namespaceUsage = async () => rows;
  await app.navigate({ ...base, view:'config' });
  root.querySelector('[data-action="namespace-delete"]').click(); await app.idle();
  rows = [{ envName:'DEV',clusterName:'default',namespaceName:'application',instanceCount:2,branchInstanceCount:0 }];
  await submit(root, app, win);
  assert.equal(client.calls.filter(call => call[0] === 'deleteNamespace').length, 0);
  const dialog = root.querySelector('[role="dialog"]');
  assert.equal(dialog.dataset.dialogSource, 'deleteNamespaceModal');
  assert.match(dialog.querySelector('[data-action="submit-form"]').textContent, /强制/);
  assert.ok(!dialog.querySelector('[name="force"]'));
  await submit(root, app, win);
  assert.equal(client.calls.filter(call => call[0] === 'deleteNamespace').length, 1);
  await win.happyDOM.close();
});

test("keyboard-selected consumer owner survives a lookup render as the selected ID, not the search query", async () => {
  const { win, root, client, app } = await setup();
  client.users = async () => [{userId:'alice',name:'Alice'}];
  client.consumerToken = async appId => ({appId,token:'local-token'});
  await app.navigate({view:'consumer-create'});
  const owner = root.querySelector('[name="ownerName"]'); owner.value='ali'; owner.dispatchEvent(new win.Event('input',{bubbles:true}));
  owner.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
  owner.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  await submitInline(root,app,win,'[data-submit-action="consumer-lookup"]',{lookupAppId:'ThirdApp'});
  assert.equal(root.querySelector('[name="ownerName"]').value,'alice');
  await win.happyDOM.close();
});

test("a failed consumer-create snapshot cannot override a newly edited shared AppId on render", async () => {
  const { win, root, client, app } = await setup();
  client.createConsumer = async model => {client.calls.push(['createConsumer',model]); throw Error('create failed');};
  await app.navigate({view:'consumer-create'});
  const setId = id => {const input=root.querySelector('[name="lookupAppId"]');input.value=id;input.dispatchEvent(new win.Event('input',{bubbles:true}));};
  setId('ConsumerA');
  await submitInline(root,app,win,'[data-submit-action="consumer-create-submit"]',{name:'Consumer',orgId:'D',ownerName:'alice'});
  setId('ConsumerB'); await app.setLocale('en');
  assert.equal(root.querySelector('[name="lookupAppId"]').value,'ConsumerB');
  assert.equal(root.querySelector('[data-submit-action="consumer-create-submit"] [name="appId"]').value,'ConsumerB');
  await submitInline(root,app,win,'[data-submit-action="consumer-create-submit"]',{name:'Consumer',orgId:'D',ownerName:'alice'});
  assert.deepEqual(client.calls.filter(call=>call[0]==='createConsumer').map(call=>call[1].appId),['ConsumerA','ConsumerB']);
  await win.happyDOM.close();
});

test("direct gray-rule removal is single-flight and the next removal uses the refreshed rule set", async () => {
  const { win, root, client, app } = await setup();
  let rules={ruleItems:[{clientAppId:'one',clientIpList:[],clientLabelList:['one']},{clientAppId:'two',clientIpList:[],clientLabelList:['two']}]}; const writes=[];
  client.branchRules=async()=>rules;
  client.saveBranchRules=(_scope,_branch,model)=>{client.calls.push(['rules',model]);return new Promise(resolve=>{writes.push(()=>{rules=model;resolve();});});};
  await app.navigate({...base,view:'gray'});
  root.querySelector('[data-action="gray-tab"][data-tab="rules"]').click();await app.idle();
  root.querySelector('[data-action="gray-remove-rule"][data-index="0"]').click();
  const second=root.querySelector('[data-action="gray-remove-rule"][data-index="1"]');second.click();
  const early=client.calls.filter(call=>call[0]==='rules').map(call=>call[1].ruleItems.map(rule=>rule.clientAppId));
  for(const complete of writes.splice(0))complete();await app.idle();
  assert.deepEqual(early,[['two']]);
  root.querySelector('[data-action="gray-remove-rule"]').click();for(const complete of writes.splice(0))complete();await app.idle();
  assert.deepEqual(client.calls.filter(call=>call[0]==='rules').at(-1)[1].ruleItems,[]);
  await win.happyDOM.close();
});

test("selected historical rollback previews the actual versions and requires the separate source confirmation", async () => {
  const { win, root, client, app } = await setup();
  client.history = async () => [{id:2,releaseId:2,previousReleaseId:1,releaseTitle:'Target version',operation:0,configuration:[]}];
  client.releases = async () => [{baseInfo:{id:3,name:'Current'}},{baseInfo:{id:2,name:'Target version'}}];
  client.latestRelease = async () => ({id:3,name:'Current'});
  client.release = async () => ({id:2,name:'Target version',isAbandoned:false});
  client.compareReleases = async (env,from,to) => {client.calls.push(['compare',env,from,to]);return {changes:[]};};
  await app.navigate({...base,view:'history'});
  root.querySelector('[data-action="rollback-to"]').click();await app.idle();
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource,'rollbackModal');
  assert.match(root.querySelector('[role="dialog"]').textContent,/Current.*Target version/s);
  assert.ok(!root.querySelector('[name="confirmation"]'));
  await submit(root,app,win);
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource,'rollbackAlertDialog');
  assert.equal(client.calls.filter(call=>call[0]==='rollbackTo').length,0);
  await submit(root,app,win);
  assert.deepEqual(client.calls.find(call=>call[0]==='rollbackTo').slice(1),['DEV',3,2]);
  await win.happyDOM.close();
});

test("an older same-page rollback lookup cannot replace the user's newer historical target", async () => {
  const {win,root,client,app}=await setup();let resolveFirst;
  client.history=async()=>[{id:1,releaseId:1,previousReleaseId:0,operation:0,configuration:[]},{id:2,releaseId:2,previousReleaseId:1,operation:0,configuration:[]}];
  client.releases=async()=>[{baseInfo:{id:100,name:'Current'}}];
  client.latestRelease=async()=>({id:100,name:'Current'});
  client.release=(_env,id)=>String(id)==='1'?new Promise(resolve=>{resolveFirst=resolve;}):Promise.resolve({id:2,name:'Second target'});
  client.compareReleases=async()=>({changes:[]});
  await app.navigate({...base,view:'history'});
  root.querySelector('[data-action="rollback-to"]').click();
  root.querySelector('[data-action="select-history"][data-id="2"]').click();
  root.querySelector('[data-action="rollback-to"]').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  resolveFirst({id:1,name:'First target'});await app.idle();
  assert.match(root.querySelector('[role="dialog"]').textContent,/Second target/);
  assert.doesNotMatch(root.querySelector('[role="dialog"]').textContent,/First target/);
  await submit(root,app,win);await submit(root,app,win);
  assert.deepEqual(client.calls.find(call=>call[0]==='rollbackTo').slice(1),['DEV',100,2]);
  await win.happyDOM.close();
});

test("namespace import restores the source information panel and file control", async () => {
  const {win,root,client,app}=await setup();
  await app.navigate({...base,view:'config'});
  root.querySelector('[data-action="import-namespace"]').click();await app.idle();
  const dialog=root.querySelector('[role="dialog"]');
  assert.equal(dialog.dataset.dialogSource,'importNamespaceModal');
  assert.equal(dialog.querySelectorAll('.reference-hint li').length,3);
  assert.ok(dialog.querySelector('input[type="file"][name="file"]'));
  assert.equal(client.calls.length,0);
  await win.happyDOM.close();
});

test("a superseded rollback lookup failure does not report an error over the newer preview", async () => {
  const {win,root,client,app}=await setup();let rejectFirst;
  client.history=async()=>[{id:1,releaseId:1,previousReleaseId:0,operation:0,configuration:[]},{id:2,releaseId:2,previousReleaseId:1,operation:0,configuration:[]}];
  client.releases=async()=>[{baseInfo:{id:100,name:'Current'}}];client.latestRelease=async()=>({id:100,name:'Current'});
  client.release=(_env,id)=>String(id)==='1'?new Promise((_resolve,reject)=>{rejectFirst=reject;}):Promise.resolve({id:2,name:'Second target'});
  client.compareReleases=async()=>({changes:[]});
  await app.navigate({...base,view:'history'});root.querySelector('[data-action="rollback-to"]').click();
  root.querySelector('[data-action="select-history"][data-id="2"]').click();root.querySelector('[data-action="rollback-to"]').click();
  await new Promise(resolve=>setTimeout(resolve,0));rejectFirst(Error('old lookup failed'));await app.idle();
  assert.equal(app.state.error,'');assert.match(root.querySelector('[role="dialog"]').textContent,/Second target/);
  await win.happyDOM.close();
});

test("a hidden parent Namespace also hides a branch whose raw DTO does not repeat the hidden flag", async () => {
  const {win,root,client,app}=await setup();let reads=0;
  client.namespace=async()=>({...source,isConfigHidden:true});
  client.branches=async()=>({...source,baseInfo:{...source.baseInfo,clusterName:'gray-1'},isConfigHidden:false,items:[{item:{id:1,key:'secret',value:'must-not-render'}}]});
  client.latestRelease=async()=>{reads++;return {configurations:{secret:'hidden master value'}};};
  client.branchRules=async()=>{reads++;return {ruleItems:[]};};
  await app.navigate({...base,view:'gray'});
  assert.doesNotMatch(root.textContent,/must-not-render|hidden master value/);
  assert.equal(root.querySelector('[data-action="gray-publish"]').disabled,true);
  assert.equal(reads,0);
  await win.happyDOM.close();
});

test("gray item editing checks the branch lock before exposing the editor and again before saving", async () => {
  const {win,root,client,app}=await setup();let owner='alice';
  client.namespaceLock=async()=>({lockOwner:owner});
  await app.navigate({...base,view:'gray'});
  root.querySelector('[data-action="gray-edit-item"]').click();await app.idle();
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource,'namespaceLockedDialog');
  assert.ok(!root.querySelector('[role="dialog"] [name="value"]'));
  root.querySelector('[data-action="cancel-dialog"]').click();owner='';
  root.querySelector('[data-action="gray-edit-item"]').click();await app.idle();owner='alice';
  await submit(root,app,win,{value:'must not save'});
  assert.equal(client.calls.filter(call=>call[0]==='saveItem').length,0);
  await win.happyDOM.close();
});

test("source parity: removing the last application administrator shows the dedicated warning without a write", async () => {
  const { win, root, client, app } = await setup();
  client.appRoles = async () => ({masterUsers:[{userId:'alice'}]});
  await app.navigate({...base,view:'project'});
  root.querySelector('[data-action="app-remove-admin"]').click(); await app.idle();
  assert.equal(root.querySelector('[role="dialog"]').dataset.dialogSource,'warning');
  assert.match(root.querySelector('[role="dialog"]').textContent,/不能删除所有的管理员/);
  assert.ok(!root.querySelector('[role="dialog"] [data-action="submit-form"]'));
  assert.equal(client.calls.filter(call=>call[0]==='revokeAppAdmin').length,0);
  await win.happyDOM.close();
});

test("gray modifier comes from the branch lock-info DTO rather than invented NamespaceBO fields", async () => {
  const {win,root,client,app}=await setup(),scopes=[];
  client.namespaceLock=async scope=>{scopes.push({...scope});return {lockOwner:scope.cluster==='gray-1'?'gray-editor':'master-editor'};};
  await app.navigate({...base,view:'gray'});
  assert.match(root.querySelector('.namespace-heading').textContent,/gray-editor/);
  assert.equal(scopes.find(scope=>scope.cluster==='gray-1')?.namespace,'application');
  await win.happyDOM.close();
});

test('source parity: access-key empty groups show the original empty row and creation waits for an environment',async()=>{
 const {win,root,client,app}=await setup();client.accessKeys=async()=>[];
 await app.navigate({...base,view:'access-keys'});
 assert.equal(root.querySelectorAll('.reference-table td[colspan="5"]').length,2);
 const button=root.querySelector('[data-submit-action="key-create-inline"] [data-action="submit-form"]');
 assert.equal(button.disabled,true);
 const env=root.querySelector('[name="env"]');env.value='DEV';env.dispatchEvent(new win.Event('input',{bubbles:true}));
 assert.equal(button.disabled,false);
 await win.happyDOM.close();
});

test('source parity: cluster instructions contain four real source tips and system services use Eureka appName',async()=>{
 const {win,root,client,app}=await setup();
 await app.navigate({...base,view:'cluster-create'});
 assert.doesNotMatch(root.textContent,/Cluster\.Tips\.5/);
 client.systemInfo=async()=>({version:'2.5.2',environments:[{env:'DEV',configServices:[{appName:'APOLLO-CONFIGSERVICE',instanceId:'config-1',homepageUrl:'http://fixture-config'}],adminServices:[]}]});
 await app.navigate({view:'system-info'});
 assert.match(root.querySelector('[data-services="configServices"]').textContent,/APOLLO-CONFIGSERVICE/);
 await win.happyDOM.close();
});

test('source parity: consumer grant uses a visible read-only token and blank Namespace with the source help',async()=>{
 const {win,root,client,app}=await setup();client.consumerToken=async()=>({token:'local-fixture-token'});
 await app.navigate({view:'consumer-create'});
 assert.equal(root.querySelector('[data-submit-action="consumer-grant-inline"] input[readonly]').type,'text');
 assert.equal(root.querySelector('[name="namespace"]').value,'');
 await app.navigate({view:'consumers'});root.querySelector('[data-action="assign-consumer"]').click();await app.idle();
 assert.equal(root.querySelector('[data-dialog-token]').type,'text');
 assert.equal(root.querySelector('[role="dialog"]').dataset.dialogSource,'grantPermissionModal');
 assert.equal(root.querySelector('[role="dialog"] [name="namespace"]').value,'');
 await win.happyDOM.close();
});

test('source parity: deleting a consumer uses the escaped source confirmation without a typed-ID field',async()=>{
 const {win,root,client,app}=await setup();client.consumers=async()=>[{appId:'a<app>',name:'Name & Test'}];
 await app.navigate({view:'consumers'});root.querySelector('[data-action="delete-consumer"]').click();await app.idle();
 const dialog=root.querySelector('[role="dialog"]');
 assert.equal(dialog.dataset.dialogSource,'deleteConsumerDialog');
 assert.match(dialog.textContent,/a<app>/);
 assert.ok(!dialog.querySelector('input'));
 assert.equal(client.calls.length,0);
 await win.happyDOM.close();
});

test('gray inherits non-overridden master rows and creates an override only in the branch',async()=>{
 const {win,root,client,app}=await setup();
 const branch=client.branches;client.branches=async scope=>({...await branch(scope),items:[{item:{id:3,key:'a',value:'gray-one'},isModified:true}]});
 await app.navigate({...base,view:'gray'});
 assert.match(root.querySelector('[data-gray-master]')?.textContent||'',/two/);
 root.querySelector('[data-action="gray-edit-item"][data-inherited-key="b"]').click();await app.idle();
 assert.equal(root.querySelector('[role="dialog"] [name="key"]').value,'b');
 assert.equal(root.querySelector('[role="dialog"] [name="value"]').value,'two');
 await submit(root,app,win,{value:'override two'});
 const call=client.calls.find(c=>c[0]==='saveItem');
 assert.equal(call[1].cluster,'gray-1');assert.equal(call[2].key,'b');assert.equal(call[3],true);
 assert.equal(call[2].id,undefined);assert.equal(call[2].lineNum,0);
 await win.happyDOM.close();
});

test('a deleted gray override equal to the master published value falls back to the inherited table',async()=>{
 const {win,root,client,app}=await setup();
 const branch=client.branches;client.branches=async scope=>({...await branch(scope),items:[{item:{id:3,key:'a',value:'one'},isDeleted:true,isModified:true,oldValue:'one'}]});
 await app.navigate({...base,view:'gray'});
 assert.ok(root.querySelector('[data-gray-master] [data-inherited-key="a"]'));
 assert.doesNotMatch(root.querySelector('[data-gray-config]').textContent,/one/);
 await win.happyDOM.close();
});

test('gray item deletion checks its lock and uses the source key/value confirmation before a branch-only write',async()=>{
 const {win,root,client,app}=await setup();let owner='alice';client.namespaceLock=async()=>({lockOwner:owner});client.deleteItem=async(...args)=>client.calls.push(['deleteItem',...args]);
 await app.navigate({...base,view:'gray'});
 root.querySelector('[data-action="gray-delete-item"]').click();await app.idle();
 assert.equal(root.querySelector('[role="dialog"]').dataset.dialogSource,'namespaceLockedDialog');
 root.querySelector('[data-action="cancel-dialog"]').click();owner='';
 root.querySelector('[data-action="gray-delete-item"]').click();await app.idle();
 assert.equal(root.querySelector('[role="dialog"]').dataset.dialogSource,'deleteConfirmDialog');
 assert.ok(!root.querySelector('[role="dialog"] input'));assert.equal(client.calls.length,0);
 await submit(root,app,win);assert.equal(client.calls.find(c=>c[0]==='deleteItem')[1].cluster,'gray-1');
 await win.happyDOM.close();
});

test('source parity: application forms keep source-specific owner and administrator labels',async()=>{
 const {win,root,client,app}=await setup();
 await app.navigate({view:'create-project'});
 assert.match(root.querySelector('[data-user-picker="ownerName"]').parentElement.textContent,/应用负责人/);
 assert.match(root.querySelector('[data-user-picker="admins"]').parentElement.textContent,/应用管理员/);
 await app.navigate({...base,view:'project'});
 assert.equal(root.querySelector('.reference-section h4').textContent.startsWith('管理员'),true);
 await win.happyDOM.close();
});
