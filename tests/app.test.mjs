import { test } from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { createPortalApp } from "../src/app.js";

function dataClient() {
  const calls = [];
  return {
    calls,
    user: async () => ({ userId: "apollo", name: "Apollo Admin" }),
    rootPermission: async () => ({ hasPermission: true }),
    creationPermission: async () => ({ hasCreateApplicationPermission: true }),
    apps: async () => [
      {
        appId: "SampleApp",
        name: "Sample App",
        orgId: "TEST1",
        orgName: "Department",
        ownerName: "apollo",
        ownerEmail: "test@example.test",
      },
    ],
    favorites: async () => [],
    publicNamespaces: async () => [],
    app: async () => ({
      appId: "SampleApp",
      name: "Sample App",
      ownerName: "apollo",
    }),
    tree: async () => ({
      entities: [
        { code: 200, body: { env: "DEV", clusters: [{ name: "default" }] } },
      ],
    }),
    namespaces: async () => [
      {
        baseInfo: { namespaceName: "application" },
        format: "properties",
        isPublic: false,
        itemModifiedCnt: 1,
        items: [
          {
            item: {
              id: 1,
              key: "sample.key",
              value: '<img src=x onerror="bad()">',
              comment: "comment",
              dataChangeLastModifiedBy: "apollo",
            },
            isModified: true,
          },
        ],
      },
    ],
    permission: async () => ({ hasPermission: true }),
    saveItem: async (...args) => calls.push(["save", ...args]),
    publish: async (...args) => calls.push(["publish", ...args]),
    namespace: async () => ({ format: 'properties', isConfigHidden: false }),
    history: async () => [],
    releases: async () => [],
    users: async () => [
      {
        userId: "apollo",
        name: "Apollo Admin",
        email: "test@example.test",
        enabled: 1,
      },
    ],
  };
}
async function setup() {
  const win = new Window({ url: "http://localhost" });
  const root = win.document.createElement("div");
  win.document.body.append(root);
  const client = dataClient();
  const app = createPortalApp(root, {
    client,
    locale: "zh-CN",
    storage: { get: async () => null, set: async () => {} },
    connectionId: "a",
  });
  await app.start();
  return { win, root, client, app };
}
test("handwritten home navigates to config with no embedded Portal runtime", async () => {
  const { win, root, app } = await setup();
  assert.equal(root.querySelector("iframe"), null);
  assert.match(root.textContent, /我的应用/);
  root.querySelector('[data-app="SampleApp"]').click();
  await app.idle();
  assert.match(root.textContent, /环境列表/);
  assert.match(root.textContent, /sample.key/);
  assert.equal(root.querySelector("[onerror]"), null);
  assert.match(root.textContent, /<img src=x/);
  await win.happyDOM.close();
});
test("edit and publish dialogs call the real model boundary with user input", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="edit-item"]').click();
  const dialog = root.querySelector('[role="dialog"]');
  assert.ok(dialog);
  dialog.querySelector('[name="value"]').value = "Updated value";
  dialog
    .querySelector("form")
    .dispatchEvent(
      new win.Event("submit", { bubbles: true, cancelable: true }),
    );
  await app.idle();
  assert.equal(client.calls[0][0], "save");
  assert.equal(client.calls[0][2].value, "Updated value");
  root.querySelector('[data-action="publish"]').click();
  const form = root.querySelector('[role="dialog"] form');
  form.querySelector('[name="title"]').value = "First release";
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(client.calls[1][0], "publish");
  assert.equal(client.calls[1][2], "First release");
  await win.happyDOM.close();
});
test("read permissions disable editing and never expose hidden configuration values", async () => {
  const { win, root, client, app } = await setup();
  client.permission = async () => ({ hasPermission: false });
  await app.navigate({ view: "config", appId: "SampleApp" });
  assert.ok(!root.querySelector('[data-action="publish"]'));
  assert.ok(!root.querySelector('[data-action="edit-item"]'));
  assert.ok(root.querySelector('[data-action="request-modify-permission"]'));
  client.namespaces = async () => [
    {
      baseInfo: { namespaceName: "secret" },
      format: "properties",
      isConfigHidden: true,
      items: [{ item: { id: 1, key: "secret", value: "must-not-display" } }],
    },
  ];
  await app.navigate({ view: "config", appId: "SampleApp" });
  assert.ok(!root.textContent.includes("must-not-display"));
  await win.happyDOM.close();
});
test("administrator user page is handwritten and locale switch preserves navigation", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ view: "users" });
  assert.match(root.textContent, /用户管理/);
  assert.match(root.textContent, /test@example.test/);
  await app.setLocale("en");
  assert.match(root.textContent, /User Management/);
  assert.match(root.textContent, /test@example.test/);
  await win.happyDOM.close();
});

test("failed navigation never combines old items with a new write target", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  client.tree = async () => {
    throw Error("DEV is offline");
  };
  await app.navigate({ view: "config", appId: "OtherApp", env: "PRO" });
  assert.equal(app.state.route.appId, "SampleApp");
  assert.match(root.textContent, /DEV is offline/);
  assert.ok(!root.textContent.includes("OtherApp / PRO"));
  await win.happyDOM.close();
});

test("search cannot orphan an unsaved text draft and discard provides recovery", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  client.search = async () => ({ content: [] });
  root.querySelector('[data-action="text-mode"]').click();
  root.querySelector('[data-action="edit-text"]').click();
  const editor = root.querySelector("[data-text]");
  editor.value = "sample.key=not saved";
  editor.dispatchEvent(new win.Event("input", { bubbles: true }));
  const search = root.querySelector('[data-form="search"]');
  search.querySelector("input").value = "OtherApp";
  search.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(app.state.route.view, "config");
  assert.ok(root.querySelector("[data-text]"));
  assert.ok(root.querySelector('[data-action="discard-drafts"]'));
  await win.happyDOM.close();
});

test("properties text preserves multiline values and comment-only rows", async () => {
  const { win, root, client, app } = await setup();
  client.namespaces = async () => [
    {
      baseInfo: { id: 1, namespaceName: "application" },
      format: "properties",
      items: [
        { item: { id: 1, key: "message", value: "first\nsecond" } },
        { item: { id: 2, key: "", value: "", comment: "# keep this" } },
        { item: { id: 3, key: "gone", value: "no" }, isDeleted: true },
      ],
    },
  ];
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="text-mode"]').click();
  root.querySelector('[data-action="edit-text"]').click();
  assert.equal(
    root.querySelector("[data-text]").value,
    "message = first\\nsecond\n# keep this\n",
  );
  await win.happyDOM.close();
});

test("history uses actual ReleaseHistoryBO fields and disallows abandoned rollback", async () => {
  const { win, root, client, app } = await setup();
  client.history = async () => [
    {
      id: 1,
      releaseId: 3,
      releaseTitle: "Release three",
      releaseComment: "Actual comment",
      operator: "apollo",
      operatorDisplayName: "Apollo Admin",
      releaseTimeFormatted: "2026-10-19 10:00:00",
      configuration: [],
      isReleaseAbandoned: true,
    },
  ];
  client.releases = async () => [
    {
      baseInfo: {
        id: 3,
        name: "Release three",
        configurations: { "sample.key": "Published value" },
        isAbandoned: true,
      },
      items: [{ key: "sample.key", value: "Published value" }],
    },
  ];
  await app.navigate({
    view: "history",
    appId: "SampleApp",
    env: "DEV",
    cluster: "default",
    namespace: "application",
  });
  assert.match(root.textContent, /Release three/);
  assert.match(root.textContent, /Apollo Admin/);
  assert.match(root.textContent, /2026-10-19 10:00:00/);
  root.querySelector('[data-action="history-display"][data-display="all"]').click();
  assert.match(root.textContent, /Published value/);
  assert.equal(
    root.querySelector('[data-action="rollback-to"]').disabled,
    true,
  );
  await win.happyDOM.close();
});

test("pending text save locks editing and a failed save preserves the draft", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  let rejectSave, started;
  const saving = new Promise((resolve) => (started = resolve));
  client.saveText = () => {
    started();
    return new Promise((_resolve, reject) => (rejectSave = reject));
  };
  root.querySelector('[data-action="text-mode"]').click();
  root.querySelector('[data-action="edit-text"]').click();
  const editor = root.querySelector("[data-text]");
  editor.value = "sample.key=first";
  editor.dispatchEvent(new win.Event("input", { bubbles: true }));
  root.querySelector('[data-action="save-text"]').click();
  assert.equal(root.querySelector("[data-text]").readOnly, true);
  await saving;
  rejectSave(Error("Network unavailable"));
  await app.idle();
  assert.equal(root.querySelector("[data-text]").value, "sample.key=first");
  assert.equal(root.querySelector("[data-text]").readOnly, false);
  await win.happyDOM.close();
});

test("project management checks real independent permission types", async () => {
  const { win, root, client, app } = await setup();
  client.rootPermission = async () => ({ hasPermission: false });
  const types = [];
  client.appPermission = async (_id, type) => {
    types.push(type);
    return { hasPermission: type === "AssignRole" };
  };
  await app.start();
  await app.navigate({ view: "config", appId: "SampleApp" });
  assert.deepEqual(
    types.sort(),
    ["AssignRole", "CreateCluster", "CreateNamespace"].sort(),
  );
  assert.equal(
    root.querySelector('[data-action="project-settings"]').disabled,
    false,
  );
  assert.ok(!root.querySelector('[data-action="new-cluster"]'));
  assert.ok(!root.querySelector('[data-action="new-namespace"]'));
  assert.equal(root.querySelectorAll('[data-action="request-master-permission"]').length, 2);
  root.querySelector('[data-action="request-master-permission"]').click(); await app.idle();
  assert.equal(root.querySelector('[role="dialog"]').dataset.dialogSource, 'masterNoPermissionDialog');
  await win.happyDOM.close();
});

test("user updates explicitly require a replacement password as Apollo does", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ view: "users" });
  root.querySelector('[data-action="edit-user"]').click();
  assert.equal(root.querySelector('[name="password"]').required, true);
  await win.happyDOM.close();
});

test("dialog buttons submit through JS without native form submission in the DBX sandbox", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="edit-item"]').click();
  root.querySelector('[name="value"]').value = "Sandbox save";
  let nativeSubmits = 0;
  root.addEventListener("submit", () => nativeSubmits++);
  const submit = root.querySelector('[role="dialog"] .btn-primary');
  submit.click();
  await app.idle();
  assert.equal(nativeSubmits, 0);
  assert.equal(submit.type, "button");
  assert.equal(client.calls[0][2].value, "Sandbox save");
  await win.happyDOM.close();
});

test("ordinary users can edit their own profile without getting root user-management capabilities", async () => {
  const { win, root, client, app } = await setup();
  client.rootPermission = async () => ({ hasPermission: false });
  let update;
  client.saveUser = async (data) => (update = data);
  await app.start();
  await app.navigate({ view: "users" });
  assert.match(root.textContent, /Apollo Admin/);
  assert.equal(root.querySelector('[data-action="new-user"]').disabled, true);
  root.querySelector('[data-action="edit-user"]').click();
  const form = root.querySelector("[data-submit-action=save-user-submit]");
  assert.ok(form);
  form.querySelector('[name="email"]').value = "test@example.test";
  form.querySelector('[name="password"]').value = "new-safe-password";
  form.querySelector('[name="confirmPassword"]').value = "new-safe-password";
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(update.username, "apollo");
  assert.equal(update.enabled, 1);
  await win.happyDOM.close();
});

test("read-only state comes from sidecar metadata even when Host context omits it", async () => {
  const { win, root, client, app } = await setup();
  client.session = async () => ({ readOnly: true });
  await app.start();
  await app.navigate({ view: "config", appId: "SampleApp" });
  assert.equal(root.querySelector('[data-action="publish"]').disabled, true);
  await win.happyDOM.close();
});

test("configuration history renders real ItemChangeSets, escapes values and paginates by key", async () => {
  const { win, root, client, app } = await setup();
  client.commits = async (scope, key, page) => {
    client.calls.push(["commits", scope, key, page]);
    return Array.from({ length: page === 0 ? 10 : 1 }, (_, i) => ({
      id: i,
      dataChangeCreatedBy: "apollo",
      dataChangeCreatedTime: "2026-10-19T00:00:00Z",
      changeSets: JSON.stringify({
        createItems: [{ key: "added", value: "<script>bad()</script>" }],
        updateItems: [
          {
            oldItem: { key: "edited", value: "old" },
            newItem: { key: "edited", value: "new" },
          },
        ],
        deleteItems: [{ key: "deleted", value: "gone" }],
      }),
    }));
  };
  await app.navigate({ view: "config", appId: "SampleApp" });
  assert.equal(root.querySelectorAll(".config-table th").length, 8);
  root.querySelector('[data-action="commits-mode"]').click();
  await app.idle();
  assert.match(root.textContent, /added/);
  assert.match(root.textContent, /old/);
  assert.match(root.textContent, /gone/);
  assert.equal(root.querySelector("script"), null);
  root.querySelector('[data-action="more-commits"]').click();
  await app.idle();
  assert.equal(client.calls.at(-1)[3], 1);
  const filter = root.querySelector("[data-commit-filter]");
  filter.value = "edited";
  filter.dispatchEvent(new win.Event("input", { bubbles: true }));
  root.querySelector('[data-action="filter-commits"]').click();
  await app.idle();
  assert.deepEqual(client.calls.at(-1).slice(2), ["edited", 0]);
  await win.happyDOM.close();
});

test("revocation requires confirmation, preserves the displayed state on failure and respects permissions", async () => {
  const { win, root, client, app } = await setup();
  client.revokeItems = async (scope) => {
    client.calls.push(["revoke", scope]);
    throw Error("Revoke denied");
  };
  await app.navigate({ view: "config", appId: "SampleApp" });
  const original = app.state.namespaces[0].items[0].item.value;
  root.querySelector("[data-action=revoke-items]").click();
  assert.equal(client.calls.length, 0);
  const submit = () =>
    root
      .querySelector("[role=dialog] form")
      .dispatchEvent(
        new win.Event("submit", { bubbles: true, cancelable: true }),
      );
  submit();
  await app.idle();
  assert.match(root.textContent, /Revoke denied/);
  assert.equal(app.state.namespaces[0].items[0].item.value, original);
  client.revokeItems = async (scope) => client.calls.push(["revoke", scope]);
  submit();
  await app.idle();
  assert.ok(!root.querySelector("[role=dialog]"));
  client.permission = async () => ({ hasPermission: false });
  await app.navigate({ view: "config", appId: "SampleApp" });
  assert.ok(!root.querySelector("[data-action=revoke-items]"));
  await win.happyDOM.close();
});

test("YAML save runs syntax check before mutation and keeps draft on validation failure", async () => {
  const { win, root, client, app } = await setup();
  client.namespaces = async () => [
    {
      baseInfo: { id: 17, namespaceName: "settings.yaml" },
      format: "yaml",
      items: [{ item: { value: "a: old" } }],
    },
  ];
  client.checkSyntax = async () => {
    client.calls.push(["syntax"]);
    throw Error("Invalid YAML");
  };
  client.saveText = async () => client.calls.push(["text"]);
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="edit-text"]').click();
  const editor = root.querySelector("[data-text]");
  editor.value = "invalid: [";
  editor.dispatchEvent(new win.Event("input", { bubbles: true }));
  root.querySelector('[data-action="save-text"]').click();
  await app.idle();
  assert.deepEqual(client.calls, [["syntax"]]);
  assert.equal(root.querySelector("[data-text]").value, "invalid: [");
  client.checkSyntax = async () => client.calls.push(["valid"]);
  root.querySelector('[data-action="save-text"]').click();
  await app.idle();
  assert.deepEqual(client.calls.slice(1), [["valid"], ["text"]]);
  await win.happyDOM.close();
});

test("namespace rollback selects the current non-abandoned release and confirms before calling", async () => {
  const { win, root, client, app } = await setup();
  client.releases = async () => [
    { baseInfo: { id: 9, isAbandoned: true } },
    { baseInfo: { id: 8, isAbandoned: false } },
    { baseInfo: { id: 7, isAbandoned: false } },
  ];
  client.rollback = async (...args) => client.calls.push(["rollback", ...args]);
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="rollback-latest"]').click();
  await app.idle();
  assert.equal(client.calls.length, 0);
  root
    .querySelector('[role="dialog"] form')
    .dispatchEvent(
      new win.Event("submit", { bubbles: true, cancelable: true }),
    );
  await app.idle();
  assert.equal(client.calls.length, 0);
  root
    .querySelector('[role="dialog"] form')
    .dispatchEvent(
      new win.Event("submit", { bubbles: true, cancelable: true }),
    );
  await app.idle();
  assert.deepEqual(client.calls, [["rollback", "DEV", 8]]);
  await win.happyDOM.close();
});

test("late commit history cannot override text/table choice and namespaces load independently", async () => {
  const { win, root, client, app } = await setup();
  const oldNamespaces = client.namespaces;
  client.namespaces = async () => {
    const ns = (await oldNamespaces())[0];
    return [ns, { ...ns, baseInfo: { namespaceName: "other" }, items: [] }];
  };
  const pending = {};
  client.commits = async (scope) =>
    new Promise((resolve) => (pending[scope.namespace] = resolve));
  await app.navigate({ view: "config", appId: "SampleApp" });
  const click = (action, ns) =>
    root.querySelector(`[data-action="${action}"][data-ns="${ns}"]`).click();
  click("commits-mode", "application");
  await Promise.resolve();
  click("text-mode", "application");
  pending.application([]);
  await app.idle();
  assert.ok(root.querySelector('[data-text="application"]'));
  click("commits-mode", "application");
  click("commits-mode", "other");
  await Promise.resolve();
  pending.application([
    { changeSets: '{"createItems":[{"key":"from-a","value":"A"}]}' },
  ]);
  pending.other([
    { changeSets: '{"createItems":[{"key":"from-b","value":"B"}]}' },
  ]);
  await app.idle();
  assert.match(root.textContent, /from-a/);
  assert.match(root.textContent, /from-b/);
  await win.happyDOM.close();
});

test("config Type uses numeric Apollo ItemDTO types and item editor preserves type", async () => {
  const { win, root, client, app } = await setup();
  client.namespaces = async () => [
    {
      baseInfo: { namespaceName: "application" },
      format: "properties",
      items: [0, 1, 2, 3].map((type) => ({
        item: { id: type + 1, type, key: `key${type}`, value: "value" },
      })),
    },
  ];
  await app.navigate({ view: "config", appId: "SampleApp" });
  assert.deepEqual(
    [...root.querySelectorAll(".config-table tbody tr")].map(
      (row) => row.children[2].textContent,
    ),
    ["String", "Number", "Boolean", "JSON"],
  );
  root.querySelector('[data-action="edit-item"][data-item="3"]').click();
  const form = root.querySelector('[role="dialog"] form');
  assert.equal(form.querySelector('[name="type"]').value, "2");
  form.querySelector('[name="type"]').value = "3";
  form
    .querySelector('[name="type"]')
    .dispatchEvent(new win.Event("input", { bubbles: true }));
  form.querySelector('[name="value"]').value = '{"enabled":true}';
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(client.calls[0][2].type, 3);
  await win.happyDOM.close();
});

test("gray configuration toolbar opens the branch management page", async () => {
  const { win, root, client, app } = await setup();
  client.branches = async () => null;
  client.namespace = async () => (await client.namespaces())[0];
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="gray"]').click();
  await app.idle();
  assert.match(root.textContent, /尚未创建灰度/);
  assert.ok(root.querySelector('[data-action="create-gray"]'));
  await win.happyDOM.close();
});

test("parity: item editor allows empty string, locks existing key and switches Boolean control", async () => {
  const { win, root, client, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="new-item"]').click();
  let form = root.querySelector('[role="dialog"] form');
  form.querySelector('[name="key"]').value = "empty.value";
  assert.equal(form.querySelector('[name="value"]').required, false);
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(client.calls.at(-1)[2].value, "");
  root.querySelector('[data-action="edit-item"]').click();
  form = root.querySelector('[role="dialog"] form');
  assert.equal(form.querySelector('[name="key"]').readOnly, true);
  const type = form.querySelector('[name="type"]');
  type.value = "2";
  type.dispatchEvent(new win.Event("input", { bubbles: true }));
  form = root.querySelector('[role="dialog"] form');
  assert.ok(form.querySelector('select[name="value"]'));
  assert.equal(form.querySelector('[name="value"]').value, "false");
  await win.happyDOM.close();
});

test("parity: publication shows released versus draft values before the only mutation", async () => {
  const { win, root, client, app } = await setup();
  client.latestRelease = async () => ({
    id: 8,
    configurations: { "sample.key": "old published value" },
  });
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="publish"]').click();
  await app.idle();
  assert.match(
    root.querySelector('[role="dialog"]').textContent,
    /old published value/,
  );
  assert.ok(root.querySelector("[data-release-preview]"));
  assert.equal(client.calls.length, 0);
  const form = root.querySelector('[role="dialog"] form');
  form.querySelector('[name="title"]').value = "Previewed release";
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(client.calls[0][0], "publish");
  await win.happyDOM.close();
});

test("parity: rollback previews actual comparison and requires a second confirmation", async () => {
  const { win, root, client, app } = await setup();
  client.releases = async () => [
    { baseInfo: { id: 8, name: "current", isAbandoned: false } },
    { baseInfo: { id: 7, name: "previous", isAbandoned: false } },
  ];
  client.compareReleases = async () => ({
    changes: [
      {
        entity: {
          firstEntity: { key: "k", value: "after" },
          secondEntity: { key: "k", value: "before" },
        },
      },
    ],
  });
  client.rollback = async (...args) => client.calls.push(["rollback", ...args]);
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="rollback-latest"]').click();
  await app.idle();
  assert.match(root.querySelector('[role="dialog"]').textContent, /before/);
  assert.match(root.querySelector('[role="dialog"]').textContent, /after/);
  const submit = () =>
    root
      .querySelector('[role="dialog"] form')
      .dispatchEvent(
        new win.Event("submit", { bubbles: true, cancelable: true }),
      );
  submit();
  await app.idle();
  assert.equal(client.calls.length, 0);
  submit();
  await app.idle();
  assert.deepEqual(client.calls, [["rollback", "DEV", 8]]);
  await win.happyDOM.close();
});

test("parity: configuration key sorting and complete value inspection work without injecting HTML", async () => {
  const { win, root, client, app } = await setup();
  const old = client.namespaces;
  client.namespaces = async () => {
    const [ns] = await old();
    return [
      {
        ...ns,
        items: [{ item: { id: 2, key: "z", value: "second" } }, ...ns.items],
      },
    ];
  };
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="sort-items"][data-sort="key"]').click();
  await app.idle();
  assert.equal(
    root.querySelector('.config-table tbody .key-cell [data-field="key"]').textContent.trim(),
    "sample.key",
  );
  root
    .querySelector('[data-action="show-config-value"][data-field=value]')
    .click();
  await app.idle();
  assert.ok(root.querySelector("[role=dialog]"));
  assert.equal(root.querySelector("[role=dialog] img"), null);
  assert.match(root.querySelector("[role=dialog]").textContent, /<img src=x/);
  await win.happyDOM.close();
});

test("parity: namespace locks prevent another editor and block self-publication", async () => {
  const { win, root, client, app } = await setup();
  client.namespaceLock = async () => ({
    lockOwner: "alice",
    isEmergencyPublishAllowed: false,
  });
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="edit-item"]').click();
  await app.idle();
  assert.ok(!root.querySelector('[role=dialog] [name="value"]'));
  client.namespaceLock = async () => ({
    lockOwner: "apollo",
    isEmergencyPublishAllowed: false,
  });
  root.querySelector('[data-action="publish"]').click();
  await app.idle();
  assert.ok(!root.querySelector('[role=dialog] [name="title"]'));
  assert.equal(client.calls.length, 0);
  await win.happyDOM.close();
});

test("parity: a partial multi-cluster item creation does not offer already-created targets on retry", async () => {
  const { win, root, client, app } = await setup();
  client.tree = async () => ({
    entities: [
      { code: 200, body: { env: "DEV", clusters: [{ name: "default" }] } },
      { code: 200, body: { env: "UAT", clusters: [{ name: "default" }] } },
    ],
  });
  client.saveItem = async (scope) => {
    client.calls.push(["create", scope.env]);
    if (scope.env === "UAT") throw Error("UAT denied");
  };
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="new-item"]').click();
  const form = root.querySelector("[role=dialog] form");
  form.querySelector("[name=key]").value = "new.key";
  form.querySelector("[name=itemTarget_1]").checked = true;
  form.dispatchEvent(
    new win.Event("submit", { bubbles: true, cancelable: true }),
  );
  await app.idle();
  assert.equal(root.querySelector("[name=itemTarget_0]").checked, false);
  assert.equal(root.querySelector("[name=itemTarget_1]").checked, true);
  assert.deepEqual(client.calls, [
    ["create", "DEV"],
    ["create", "UAT"],
  ]);
  await win.happyDOM.close();
});

test("parity: text mode is read-only until edit, and cancel restores the server text", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="text-mode"]').click();
  assert.equal(root.querySelector("[data-text]").readOnly, true);
  root.querySelector('[data-action="edit-text"]').click();
  await app.idle();
  assert.equal(root.querySelector("[data-text]").readOnly, false);
  const text = root.querySelector("[data-text]"),
    original = text.value;
  text.value = "changed = draft";
  text.dispatchEvent(new win.Event("input", { bubbles: true }));
  root.querySelector('[data-action="cancel-text"]').click();
  await app.idle();
  assert.equal(root.querySelector("[data-text]").value, original);
  assert.equal(root.querySelector("[data-text]").readOnly, true);
  await win.happyDOM.close();
});

test('parity: emergency publication is explicit, separately confirmed and revalidated at final submit',async()=>{
 const {win,root,client,app}=await setup();let allowed=true;client.namespaceLock=async()=>({lockOwner:'apollo',isEmergencyPublishAllowed:allowed});client.latestRelease=async()=>({configurations:{'sample.key':'before'}});
 await app.navigate({view:'config',appId:'SampleApp'});root.querySelector('[data-action=publish]').click();await app.idle();assert.equal(client.calls.length,0);
 const submit=()=>root.querySelector('[role=dialog] form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));submit();await app.idle();submit();await app.idle();assert.ok(root.querySelector('[data-release-preview]'));
 root.querySelector('[name=title]').value='Emergency';allowed=false;submit();await app.idle();assert.equal(client.calls.length,0);
 allowed=true;submit();await app.idle();assert.equal(client.calls[0][0],'publish');assert.equal(client.calls[0][4],true);await win.happyDOM.close();
});

test("late edit-lock responses cannot open an old-environment editor or warning after navigation", async () => {
  for (const action of ["new-item", "edit-item", "edit-text", "denied-edit"]) {
    const { win, root, client, app } = await setup();
    let settle;
    await app.navigate({ view: "config", appId: "SampleApp", env: "DEV" });
    client.namespaceLock = scope => scope.env === 'DEV' ? new Promise((resolve, reject) => {
      settle = () => action === "denied-edit" ? reject(Error("DEV locked")) : resolve({ lockOwner: "" });
    }) : Promise.resolve({lockOwner:''});
    if (action === "edit-text") root.querySelector('[data-action="text-mode"]').click();
    root.querySelector(`[data-action="${action === "denied-edit" ? "edit-item" : action}"]`).click();
    await app.navigate({ view: "config", appId: "SampleApp", env: "UAT" });
    settle();
    await app.idle();
    assert.equal(app.state.route.env, "UAT");
    assert.ok(!root.querySelector('[role="dialog"]'), action + " must discard the stale response");
    assert.ok(!app.state.textEditing?.application, "a stale lock cannot enable editing in UAT");
    assert.doesNotMatch(app.state.error, /DEV locked/);
    assert.equal(client.calls.length, 0);
    await win.happyDOM.close();
  }
});

test("release history fetches real added, changed and deleted keys instead of treating a full snapshot as changes", async () => {
  const { win, root, client, app } = await setup();
  client.history = async () => [{ id: 7, previousReleaseId: 2, releaseId: 3, operation: 0, configuration: [
    { firstEntity: "changed", secondEntity: "new" },
    { firstEntity: "constant", secondEntity: "unchanged" },
  ] }];
  client.compareReleases = async (...args) => {
    client.calls.push(["compare", ...args]);
    return { changes: [
      { type: "MODIFIED", entity: { firstEntity: { key: "changed", value: "old" }, secondEntity: { key: "changed", value: "new" } } },
      { type: "DELETED", entity: { firstEntity: { key: "removed", value: "deleted value" }, secondEntity: null } },
    ] };
  };
  await app.navigate({ view: "history", appId: "SampleApp", env: "DEV", cluster: "default", namespace: "application" });
  assert.deepEqual(client.calls, [["compare", "DEV", 2, 3]]);
  const preview = root.querySelector('[data-release-preview]');
  assert.ok(preview);
  assert.match(preview.textContent, /old/);
  assert.match(preview.textContent, /deleted value/);
  assert.doesNotMatch(preview.textContent, /constant|unchanged/);
  root.querySelector('[data-action="history-display"][data-display="all"]').click();
  await app.idle();
  assert.match(root.textContent, /constant/);
  assert.match(root.textContent, /unchanged/);
  await win.happyDOM.close();
});

test("first gray-release history compares the master base and discards late selection responses", async () => {
  const { win, root, client, app } = await setup();
  client.history = async () => [
    { id: 1, previousReleaseId: 0, releaseId: 3, operation: 2, operationContext: { baseReleaseId: 2 }, configuration: [] },
    { id: 2, previousReleaseId: 3, releaseId: 4, operation: 0, configuration: [] },
  ];
  client.compareReleases = async (...args) => { client.calls.push(["compare", ...args]); return { changes: [] }; };
  await app.navigate({ view: "history", appId: "SampleApp", env: "DEV", cluster: "default", namespace: "application" });
  assert.deepEqual(client.calls, [["compare", "DEV", 2, 3]]);
  let resolveDiff;
  client.compareReleases = () => new Promise(resolve => { resolveDiff = resolve; });
  root.querySelector('[data-action="select-history"][data-id="2"]').click();
  root.querySelector('[data-action="select-history"][data-id="1"]').click();
  resolveDiff({ changes: [{ type: "ADDED", entity: { secondEntity: { key: "other-version", value: "wrong selection" } } }] });
  await app.idle();
  assert.doesNotMatch(root.textContent, /wrong selection/);
  assert.equal(app.state.historySelected, "1");
  await win.happyDOM.close();
});

test("a transient history comparison failure can be retried by reselecting Changes", async () => {
  const { win, root, client, app } = await setup();
  client.history = async () => [{ id: 1, previousReleaseId: 1, releaseId: 2, configuration: [] }];
  let attempts = 0;
  client.compareReleases = async () => {
    if (++attempts === 1) throw Error("temporary compare failure");
    return { changes: [] };
  };
  await app.navigate({ view: "history", appId: "SampleApp", env: "DEV", cluster: "default", namespace: "application" });
  assert.match(root.textContent, /temporary compare failure/);
  root.querySelector('[data-action="history-display"][data-display="changes"]').click();
  await app.idle();
  assert.equal(attempts, 2);
  assert.doesNotMatch(root.textContent, /temporary compare failure/);
  assert.ok(root.querySelector('[data-release-preview]'));
  await win.happyDOM.close();
});

test("item editor supports JSON formatting, expanded value editing and selecting all creation targets", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ view: "config", appId: "SampleApp" });
  root.querySelector('[data-action="new-item"]').click();
  const type = root.querySelector('[name="type"]');
  type.value = "3";
  type.dispatchEvent(new win.Event("input", { bubbles: true }));
  root.querySelector('[name="value"]').value = '{"a":1}';
  root.querySelector('[data-action="format-item-value"]').click();
  await app.idle();
  assert.equal(root.querySelector('[name="value"]').value, '{\n    "a": 1\n}');
  root.querySelector('[data-action="expand-item-value"]').click();
  assert.equal(root.querySelector('[data-item-value]').classList.contains('expanded'), true);
  root.querySelector('[data-action="expand-item-value"]').click();
  root.querySelector('[data-action="toggle-item-targets"]').click();
  assert.ok([...root.querySelectorAll('[name^="itemTarget_"]')].every(input => input.checked));
  await win.happyDOM.close();
});

test("release history uses static operation legends and single-flight source-sized pagination", async () => {
  const { win, root, client, app } = await setup();
  const first = Array.from({length: 10}, (_, i) => ({ id: i + 1, releaseId: i + 1, previousReleaseId: 0, operation: i % 9, operator: 'apollo', configuration: [] }));
  let resolvePage, requests = 0;
  client.history = (_scope, page = 0) => page === 0 ? Promise.resolve(first) : (requests++, new Promise(resolve => { resolvePage = resolve; }));
  client.compareReleases = async () => ({ changes: [] });
  await app.navigate({ view: 'history', appId: 'SampleApp', env: 'DEV', cluster: 'default', namespace: 'application' });
  assert.ok(!root.querySelector('[data-action="history-kind"]'), 'original operation captions are legends, not filters');
  assert.equal(root.querySelectorAll('[data-action="select-history"]').length, 10);
  root.querySelector('[data-action="more-history"]').click();
  root.querySelector('[data-action="more-history"]').click();
  resolvePage([{ id: 11, releaseId: 11, previousReleaseId: 10, operation: 0, configuration: [] }]);
  await app.idle();
  assert.equal(requests, 1);
  assert.equal(root.querySelectorAll('[data-action="select-history"]').length, 11);
  assert.ok(!root.querySelector('[data-action="more-history"]'));
  await win.happyDOM.close();
});

test("hidden Namespace history never fetches or renders release values", async () => {
  const { win, root, client, app } = await setup();
  client.namespace = async () => ({ isConfigHidden: true, format: 'properties' });
  client.history = async () => { client.calls.push(['history']); return []; };
  client.releases = async () => { client.calls.push(['releases']); return []; };
  await app.navigate({ view: 'history', appId: 'SampleApp', env: 'DEV', cluster: 'default', namespace: 'application' });
  assert.deepEqual(client.calls, []);
  assert.match(root.textContent, /没有查看配置/);
  await win.happyDOM.close();
});

test("delete confirmation shows source Key/Value context with escaped configuration content", async () => {
  const { win, root, app } = await setup();
  await app.navigate({ view: 'config', appId: 'SampleApp' });
  root.querySelector('[data-action="delete-item"]').click();
  await app.idle();
  const dialog = root.querySelector('[role="dialog"]');
  assert.equal(dialog.dataset.dialogSource, 'deleteConfirmDialog');
  assert.match(dialog.textContent, /sample.key/);
  assert.match(dialog.textContent, /<img src=x/);
  assert.ok(!dialog.querySelector('img'));
  await win.happyDOM.close();
});

test("syntax-check failure has the dedicated source dialog and preserves the dirty text", async () => {
  const { win, root, client, app } = await setup();
  const get = client.namespaces;
  client.namespaces = async () => (await get()).map(ns => ({ ...ns, format: 'yaml' }));
  client.checkSyntax = async () => { throw Error('invalid yaml: <unsafe>'); };
  await app.navigate({ view: 'config', appId: 'SampleApp' });
  root.querySelector('[data-action="text-mode"]').click();
  root.querySelector('[data-action="edit-text"]').click(); await app.idle();
  const input = root.querySelector('[data-text]'); input.value = 'key: [';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  root.querySelector('[data-action="syntax-text"]').click(); await app.idle();
  const dialog = root.querySelector('[role="dialog"]');
  assert.ok(dialog);
  assert.equal(dialog.dataset.dialogSource, 'syntaxCheckFailedDialog');
  assert.match(dialog.textContent, /invalid yaml: <unsafe>/);
  assert.equal(app.state.drafts.application, 'key: [');
  assert.equal(client.calls.length, 0);
  await win.happyDOM.close();
});

test("a modify-only user can open the dedicated publish-permission notice without any release write", async () => {
  const { win, root, client, app } = await setup();
  client.permission = async (_scope, role) => ({ hasPermission: role === 'ModifyNamespace' });
  client.appRoles = async () => ({ masterUsers: [{ userId: 'administrator' }] });
  await app.navigate({ view: 'config', appId: 'SampleApp' });
  root.querySelector('[data-action="publish"]').click(); await app.idle();
  assert.equal(root.querySelector('[role="dialog"]')?.dataset.dialogSource, 'releaseNoPermissionDialog');
  assert.match(root.querySelector('[role="dialog"]').textContent, /administrator/);
  assert.equal(client.calls.length, 0);
  await win.happyDOM.close();
});

test("late syntax success or failure cannot overwrite another application's in-progress item dialog", async () => {
  for (const failure of [true,false]) {
    const {win,root,client,app}=await setup();let settle;
    const get=client.namespaces;
    client.namespaces=async scope=>(await get()).map(ns=>({...ns,baseInfo:{namespaceName:scope.appId==='A'?'application':'B.settings'},format:scope.appId==='A'?'yaml':'properties'}));
    client.checkSyntax=()=>new Promise((resolve,reject)=>{settle=()=>failure?reject(Error('old A syntax failure')):resolve(null);});
    await app.navigate({view:'config',appId:'A',env:'DEV'});
    root.querySelector('[data-action="edit-text"]').click();await app.idle();
    root.querySelector('[data-action="syntax-text"]').click();
    await app.navigate({view:'config',appId:'B',env:'UAT'});
    root.querySelector('[data-action="new-item"]').click();
    const dialog=app.state.dialog;root.querySelector('[role="dialog"] [name="key"]').value='B.in-progress';
    settle();await app.idle();
    assert.ok(app.state.dialog===dialog);
    assert.equal(root.querySelector('[role="dialog"] [name="key"]').value,'B.in-progress');
    assert.equal(app.state.success,false);
    await win.happyDOM.close();
  }
});

test("syntax checking reports an expired session as authentication failure rather than invalid configuration", async () => {
  const {win,root,client,app}=await setup();const get=client.namespaces;
  client.namespaces=async scope=>(await get(scope)).map(ns=>({...ns,format:'yaml'}));
  client.checkSyntax=async()=>{const error=Error('Login expired');error.status=401;throw error;};
  await app.navigate({view:'config',appId:'SampleApp'});
  root.querySelector('[data-action="edit-text"]').click();await app.idle();
  root.querySelector('[data-action="syntax-text"]').click();await app.idle();
  assert.equal(app.state.expired,true);
  assert.ok(!root.querySelector('[data-dialog-source="syntaxCheckFailedDialog"]'));
  await win.happyDOM.close();
});

test("value details use the source read-only text viewer and retain large JSON IDs", async () => {
  const {win,root,client,app}=await setup();const get=client.namespaces;
  client.namespaces=async scope=>(await get(scope)).map(ns=>({...ns,items:[{item:{id:1,key:'id',value:'{"id":9223372036854775807}'}}]}));
  await app.navigate({view:'config',appId:'SampleApp'});
  root.querySelector('[data-action="show-config-value"][data-field="value"]').click();await app.idle();
  const dialog=root.querySelector('[role="dialog"]');
  assert.equal(dialog.dataset.dialogSource,'showTextModal');
  assert.match(dialog.querySelector('pre').textContent,/9223372036854775807/);
  assert.ok(!dialog.querySelector('footer'));
  await win.happyDOM.close();
});

test("a late lock response for an older item cannot replace the newer same-page editor or its input", async () => {
  const {win,root,client,app}=await setup();const get=client.namespaces,pending=[];
  client.namespaces=async scope=>(await get(scope)).map(ns=>({...ns,items:[{item:{id:1,key:'first',value:'one'}},{item:{id:2,key:'second',value:'two'}}]}));
  await app.navigate({view:'config',appId:'SampleApp'});
  client.namespaceLock=()=>new Promise(resolve=>pending.push(resolve));
  root.querySelector('[data-action="edit-item"][data-item="1"]').click();
  root.querySelector('[data-action="edit-item"][data-item="2"]').click();
  pending[1]({lockOwner:''});await new Promise(resolve=>setTimeout(resolve,0));
  root.querySelector('[role="dialog"] [name="value"]').value='second in progress';
  pending[0]({lockOwner:''});await app.idle();
  assert.equal(root.querySelector('[role="dialog"] [name="key"]').value,'second');
  assert.equal(root.querySelector('[role="dialog"] [name="value"]').value,'second in progress');
  assert.equal(client.calls.length,0);
  await win.happyDOM.close();
});

test("source parity: a locked namespace displays the actual modifier next to its title", async () => {
  const {win,root,client,app}=await setup();
  client.namespaceLock=async()=>({lockOwner:'alice'});
  await app.navigate({view:'config',appId:'SampleApp',env:'DEV',cluster:'default'});
  assert.match(root.querySelector('.namespace-title').textContent,/当前修改者:alice/);
  await win.happyDOM.close();
});

test("late configuration-page lock data cannot replace the current environment's modifier", async () => {
  const {win,root,client,app}=await setup();let settle;
  client.namespaceLock=scope=>scope.env==='DEV'?new Promise(resolve=>{settle=resolve;}):Promise.resolve({lockOwner:'uat-editor'});
  const first=app.navigate({view:'config',appId:'SampleApp',env:'DEV'});
  await new Promise(resolve=>setTimeout(resolve,0));
  await app.navigate({view:'config',appId:'SampleApp',env:'UAT'});
  settle?.({lockOwner:'old-dev-editor'});await first;
  assert.match(root.querySelector('.namespace-title').textContent,/uat-editor/);
  assert.doesNotMatch(root.textContent,/old-dev-editor/);
  await win.happyDOM.close();
});

test('source parity: a master key overridden in gray links to the gray configuration',async()=>{
 const {win,root,client,app}=await setup();
 client.branches=async()=>({baseInfo:{clusterName:'gray-1'},items:[{item:{key:'sample.key',value:'gray'}}]});
 await app.navigate({view:'config',appId:'SampleApp',env:'DEV',cluster:'default'});
 assert.equal(root.querySelector('[data-gray-item="sample.key"]').dataset.action,'gray');
 assert.equal(root.querySelector('[data-gray-item="sample.key"]').textContent,'灰');
 await win.happyDOM.close();
});

test('configuration key filtering stays available in table mode without leaking into text or instance subviews',async()=>{
 const {win,root,client,app}=await setup();
 await app.navigate({view:'config',appId:'SampleApp'});
 root.querySelector('[data-action="filter-config"]').click();
 assert.ok(root.querySelector('[data-filter="application"]'));
 root.querySelector('[data-action="text-mode"]').click();await app.idle();
 assert.ok(!root.querySelector('[data-filter="application"]'));
 root.querySelector('[data-action="table-mode"]').click();await app.idle();
 assert.ok(root.querySelector('[data-filter="application"]'));
 await win.happyDOM.close();
});
