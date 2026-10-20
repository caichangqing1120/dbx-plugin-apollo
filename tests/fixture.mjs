import http from "node:http";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";

// A stateful protocol fixture. It is never presented as a real Apollo server.
export async function startFixture(port = 0, { referenceRoot = null } = {}) {
  const calls = [],
    envs = ["DEV", "UAT"];
  let itemID = 10,
    releaseID = 1,
    keyID = 0,
    consumerID = 1;
  let scenario = 'normal';
  const user = {
    userId: "apollo",
    name: "Apollo Admin",
    email: "admin@example.test",
    enabled: 1,
  };
  const app = {
    appId: "SampleApp",
    name: "Sample App",
    orgId: "TEST1",
    orgName: "Sample Department",
    ownerName: "apollo",
    ownerDisplayName: "Apollo Admin",
    ownerEmail: user.email,
  };
  const apps = new Map([[app.appId, app]]),
    users = new Map([[user.userId, user]]),
    namespaces = new Map(),
    favorites = [],
    keys = [],
    consumers = [],
    systemUsers = ["apollo"];
  const clusters = {
    DEV: [
      { name: "default", appId: app.appId },
      { name: "extra", appId: app.appId },
    ],
    UAT: [{ name: "default", appId: app.appId }],
  };
  const configs = {
    portal: [
      {
        key: "apollo.portal.envs",
        value: "DEV,UAT",
        comment: "Fixture environments",
      },
    ],
    DEV: [
      { key: "sample.parameter", value: "DEV", comment: "Fixture config DB" },
    ],
    UAT: [],
  };
  const nsKey = (appId, env, cluster, name) =>
    [appId, env, cluster, name].join("/");
  function makeNamespace(
    appId,
    env,
    cluster,
    name,
    value = "Initial Apollo value",
    format = "properties",
  ) {
    const row = {
      id: ++itemID,
      key: format === "properties" ? "sample.key" : "content",
      value,
      type: 0,
      comment: "Controlled fixture configuration",
      lineNum: 1,
      dataChangeCreatedBy: "apollo",
      dataChangeLastModifiedBy: "apollo",
      dataChangeLastModifiedTime: "2026-10-19T00:00:00Z",
    };
    if (
      appId === "SampleApp" &&
      env === "DEV" &&
      cluster === "default" &&
      name === "application"
    )
      row.id = 1;
    const state = {
      appId,
      env,
      cluster,
      name,
      format,
      rows: value === null ? [] : [row],
      published: value === null ? {} : { [row.key]: value },
      releases: [],
      branch: null,
      rules: null,
      commits: [],
    };
    namespaces.set(nsKey(appId, env, cluster, name), state);
    return state;
  }
  const base = makeNamespace("SampleApp", "DEV", "default", "application");
  makeNamespace(
    "SampleApp",
    "DEV",
    "extra",
    "application",
    "Extra cluster value",
  );
  makeNamespace(
    "SampleApp",
    "UAT",
    "default",
    "application",
    "UAT initial value",
  );
  base.releases.push({
    id: 1,
    name: "Initial release",
    appId: "SampleApp",
    clusterName: "default",
    namespaceName: "application",
    configurations: { "sample.key": "Initial Apollo value" },
    dataChangeCreatedBy: "apollo",
    dataChangeCreatedTime: "2026-10-18T00:00:00Z",
    isAbandoned: false,
  });
  function bo(state) {
    return {
      baseInfo: {
        id: state === base ? 1 : 2,
        appId: state.appId,
        clusterName: state.cluster,
        namespaceName: state.name,
        dataChangeCreatedBy: "apollo",
        dataChangeLastModifiedBy: "apollo",
      },
      format: scenario === 'syntax-error' && state === base ? 'yaml' : state.format,
      parentAppId: state.parentAppId,
      isPublic: false,
      comment: "Sample namespace",
      items: state.rows.map((item) => ({
        item: { ...item },
        isDeleted: !!item.deleted,
        isModified:
          !!item.deleted || !Object.hasOwn(state.published, item.key) ||
          state.published[item.key] !== item.value,
        isNewlyAdded: !Object.hasOwn(state.published, item.key),
        oldValue: state.published[item.key] ?? '',
        newValue: item.value,
      })),
      itemModifiedCnt: scenario === 'master-pending' && state === base ? 1 : state.rows.filter(
        (item) => item.deleted || state.published[item.key] !== item.value,
      ).length,
    };
  }
  function publish(state, model) {
    const release = {
      id: ++releaseID,
      name: model.releaseTitle,
      comment: model.releaseComment || "",
      appId: state.appId,
      clusterName: state.cluster,
      namespaceName: state.name,
      configurations: Object.fromEntries(
        state.rows
          .filter((row) => !row.deleted)
          .map((row) => [row.key, row.value]),
      ),
      dataChangeCreatedBy: "apollo",
      dataChangeCreatedTime: "2026-10-19T00:00:00Z",
      isAbandoned: false,
    };
    state.releases.unshift(release);
    state.published = { ...release.configurations };
    state.rows = state.rows.filter((row) => !row.deleted);
    return release;
  }
  function itemWrites(state, model) {
    const row = state.rows.find(
      (row) => row.id === model.id || row.key === model.key,
    );
    state.commits.unshift({
      id: state.commits.length + 1,
      dataChangeCreatedBy: "apollo",
      dataChangeCreatedTime: new Date().toISOString(),
      changeSets: JSON.stringify(
        row
          ? {
              updateItems: [
                { oldItem: { ...row }, newItem: { ...row, ...model } },
              ],
            }
          : { createItems: [model] },
      ),
    });
    if (row) Object.assign(row, model);
    else
      state.rows.push({
        id: ++itemID,
        lineNum: state.rows.length + 1,
        comment: "",
        dataChangeLastModifiedBy: "apollo",
        dataChangeLastModifiedTime: "2026-10-19T00:00:00Z",
        ...model,
      });
  }
  function text(state) {
    return (
      state.rows
        .filter((row) => !row.deleted)
        .map((row) => row.key + " = " + row.value.replace(/\n/g, "\\n"))
        .join("\n") + "\n"
    );
  }
  function multipart(req, buffer) {
    const boundary =
      req.headers["content-type"]?.match(/boundary=([^;]+)/)?.[1];
    if (!boundary) throw Error("Missing multipart boundary");
    const head = buffer.indexOf("\r\n\r\n"),
      end = buffer.lastIndexOf("\r\n--" + boundary);
    if (head < 0 || end < head) throw Error("Invalid multipart body");
    const name = buffer
      .subarray(0, head)
      .toString()
      .match(/filename="([^"]*)"/)?.[1];
    return { name, bytes: buffer.subarray(head + 4, end) };
  }
  const audit = {
    id: 1,
    traceId: "fixture-trace",
    spanId: "fixture-span",
    operator: "apollo",
    opType: "UPDATE",
    opName: "Item.update",
    description: "Controlled fixture audit entry",
    happenedTime: "2026-10-19T00:00:00Z",
  };
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://127.0.0.1"),
      buffer = Buffer.concat(await Array.fromAsync(req)),
      body = buffer.toString();
    calls.push({
      method: req.method,
      path: u.pathname,
      query: u.search,
      body,
      headers: req.headers,
    });
    const json = (data, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(data));
    };
    const input = () => (body ? JSON.parse(body) : {});
    const fail = (message, status = 400) => json({ message }, status);
    try {
      if (u.pathname === '/fixture/calls' && req.method === 'GET')
        return json(calls.filter(call => call.path !== '/fixture/calls').map(({ method, path, query, body }) => ({ method, path, query, body })));
      if (u.pathname === '/fixture/scenario' && req.method === 'POST') {
        const mode = input().mode;
        if (!['normal','locked','self-lock','modify-only','no-permissions','no-master','syntax-error','usage-master','usage-gray','public-delete-denied','master-pending'].includes(mode)) return fail('Unknown fixture scenario');
        scenario = mode;
        return json({ mode });
      }
      if (
        referenceRoot &&
        (u.pathname === "/" ||
          u.pathname.endsWith(".html") ||
          /^\/(vendor|scripts|styles|img|i18n)\//.test(u.pathname) ||
          (u.pathname === "/signin" && req.method === "GET") ||
          u.pathname === "/sso_heartbeat")
      ) {
        let name =
          u.pathname === "/"
            ? "index.html"
            : u.pathname === "/signin"
              ? "login.html"
              : u.pathname === "/sso_heartbeat"
                ? "default_sso_heartbeat.html"
                : decodeURIComponent(u.pathname.slice(1));
        const path = resolve(referenceRoot, name);
        if (!path.startsWith(resolve(referenceRoot) + sep))
          return fail("Invalid reference path");
        try {
          const data = await readFile(path);
          const mime = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".json": "application/json",
            ".woff": "font/woff",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
          };
          res.writeHead(200, {
            "content-type": mime[extname(path)] || "application/octet-stream",
          });
          res.end(data);
          return;
        } catch {
          return fail("Reference asset missing: " + name, 404);
        }
      }
      if (u.pathname === "/prefix-path") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("");
        return;
      }
      if (u.pathname === "/signin" && req.method === "POST") {
        const form = new URLSearchParams(body),
          okay =
            form.get("username") === "apollo" &&
            form.get("password") === "apollo";
        res.writeHead(
          302,
          okay
            ? {
                "set-cookie": "SESSION=fixture-session; Path=/; HttpOnly",
                location: "/",
              }
            : { location: "/signin?#/error" },
        );
        res.end();
        return;
      }
      if (!req.headers.cookie?.includes("SESSION=fixture-session")) {
        res.writeHead(302, { location: "/signin" });
        res.end();
        return;
      }
      if (u.pathname === "/user") return json(user);
      if (u.pathname === "/page-settings")
        return json({
          wikiAddress: "https://www.apolloconfig.com",
          namespaceLockSwitch: ['locked','self-lock'].includes(scenario),
          configViewMode: 1,
          portalVersion: "2.5.2",
          enableApolloAuditLog: true,
          enableCreateUser: true,
        });
      if (
        u.pathname === "/permissions/root" ||
        /\/(?:permissions|ns_permissions)\//.test(u.pathname)
      ) {
        const allowed = u.pathname === '/permissions/root'
          ? !['no-master','no-permissions','modify-only'].includes(scenario)
          : scenario === 'no-permissions' ? false
          : scenario === 'no-master' && /\/permissions\/(CreateCluster|CreateNamespace|AssignRole)$/.test(u.pathname) ? false
          : scenario === 'modify-only' && /Release/.test(u.pathname) ? false : true;
        return json({hasPermission:allowed});
      }
      if (u.pathname.startsWith("/system/role/createApplication/")) {
        const id = decodeURIComponent(u.pathname.split("/").at(-1));
        if (req.method === "DELETE") {
          const index = systemUsers.indexOf(id);
          if (index >= 0) systemUsers.splice(index, 1);
          return json(null);
        }
        return json({ hasCreateApplicationPermission: true });
      }
      if (u.pathname === "/system/role/createApplication") {
        if (req.method === "POST") {
          const users = input();
          if (!Array.isArray(users)) return fail("Expected user ID array");
          for (const id of users)
            if (!systemUsers.includes(id)) systemUsers.push(id);
          return json(null);
        }
        return json(systemUsers);
      }
      if (
        /^\/apps\/[^/]+\/system\/master\/[^/]+$/.test(u.pathname) &&
        ["POST", "DELETE"].includes(req.method)
      )
        return json(null);
      if (u.pathname === "/system/role/manageAppMaster")
        return json({ isManageAppMasterPermissionEnabled: false });
      if (u.pathname === "/envs" || u.pathname === "/openapi/v1/envs")
        return json(envs);
      if (
        req.method === "POST" &&
        /^\/apps\/[^/]+\/(?:initPermission|envs\/[^/]+\/clusters\/[^/]+\/initNsPermission)$/.test(
          u.pathname,
        )
      )
        return json(null);
      if (u.pathname === "/openapi/v1/organizations")
        return json([{ orgId: "TEST1", orgName: "Sample Department" }]);
      if (
        req.method === "GET" &&
        /^\/apps\/[^/]+\/(?:namespaces\/[^/]+\/usage|envs\/[^/]+\/clusters\/[^/]+\/linked-namespaces\/[^/]+\/usage)$/.test(
          u.pathname,
        )
      )
        return json(['usage-master','usage-gray'].includes(scenario) ? [{ appId:'SampleApp', appName:'Sample App', envName:'DEV', clusterName:'default', namespaceName:'application', instanceCount:scenario === 'usage-master' ? 1 : 0, branchInstanceCount:scenario === 'usage-gray' ? 1 : 0 }] : []);
      if (u.pathname === "/users/enabled" && req.method === "PUT") {
        const model = input(),
          target = users.get(model.username);
        if (!target) return fail("User not found", 404);
        target.enabled = model.enabled;
        return json(null);
      }
      if (u.pathname === "/users") {
        if (req.method === "POST") {
          const model = input();
          if (!model.username || !model.password)
            return fail("Username and password cannot be empty");
          const target = users.get(model.username) || {
            userId: model.username,
          };
          Object.assign(target, {
            name: model.userDisplayName,
            email: model.email,
            enabled: model.enabled,
          });
          users.set(model.username, target);
          return json(null);
        }
        return json([...users.values()]);
      }
      if (u.pathname === "/apps/search/by-appid-or-name")
        return json({
          content: [...apps.values()].filter((app) =>
            (app.appId + " " + app.name)
              .toLowerCase()
              .includes((u.searchParams.get("query") || "").toLowerCase()),
          ),
          size: 20,
        });
      if (u.pathname === "/apps/by-self" || u.pathname === "/apps") {
        if (req.method === "POST") {
          const model = input();
          if (
            !model.appId ||
            !model.name ||
            !model.orgId ||
            !model.orgName ||
            !model.ownerName
          )
            return fail("Invalid AppModel");
          apps.set(model.appId, { ...model, ownerEmail: user.email });
          for (const env of envs)
            makeNamespace(model.appId, env, "default", "application", null);
          return json(model);
        }
        return json([...apps.values()]);
      }
      if (u.pathname === "/appnamespaces/public")
        return json([
          {
            name: "public.database",
            appId: "PublicApp",
            format: "properties",
            isPublic: true,
            comment: "Reference shared namespace",
          },
        ]);
      if (u.pathname === "/appnamespaces/public/names")
        return json(["public.database"]);
      if (u.pathname === "/favorites") {
        const appId = u.searchParams.get("appId");
        if (req.method === "POST") {
          const model = input(),
            favorite = { ...model, id: favorites.length + 1 };
          favorites.push(favorite);
          return json(favorite);
        }
        if (appId)
          return json([favorites.find((row) => row.appId === appId) || null]);
        return json(
          favorites.map((row) => ({
            ...apps.get(row.appId),
            ...row,
            favoriteId: row.id,
          })),
        );
      }
      if (/^\/favorites\/\d+$/.test(u.pathname)) {
        if (req.method === "DELETE") {
          const index = favorites.findIndex(
            (row) => row.id === Number(u.pathname.split("/").at(-1)),
          );
          if (index >= 0) favorites.splice(index, 1);
        }
        return json(null);
      }
      if (u.pathname === "/consumers") {
        if (req.method === "POST") {
          const model = input();
          if (!model.appId || !model.name || !model.ownerName || !model.orgId)
            return fail("Invalid ConsumerCreateRequestVO");
          if (model.rateLimitEnabled && !(model.rateLimit > 0))
            return fail("Invalid rate limit");
          const consumer = {
            ...model,
            consumerId: consumerID++,
            token: "fixture-consumer-token-" + consumerID,
          };
          consumers.push(consumer);
          return json(consumer);
        }
        return json(consumers);
      }
      if (u.pathname === "/consumers/by-appId" && req.method === "DELETE") {
        const index = consumers.findIndex(
          (row) => row.appId === u.searchParams.get("appId"),
        );
        if (index >= 0) consumers.splice(index, 1);
        return json(null);
      }
      if (
        /^\/consumers\/[^/]+\/assign-role$/.test(u.pathname) &&
        req.method === "POST"
      ) {
        if (!input().appId) return fail("Missing target app");
        return json([{ id: 1, roleId: 1 }]);
      }
      if (u.pathname === "/consumer-tokens/by-appId")
        return json(
          consumers.find((row) => row.appId === u.searchParams.get("appId")) ||
            null,
        );
      if (u.pathname === "/system-info")
        return json({
          version: "2.5.2",
          environments: envs.map((env) => ({
            env,
            active: true,
            metaServerAddress: "http://fixture-meta/" + env,
            adminServices: [
              {
                instanceId: "admin-" + env,
                homepageUrl: "http://fixture-admin/" + env,
              },
            ],
            configServices: [
              {
                instanceId: "config-" + env,
                homepageUrl: "http://fixture-config/" + env,
              },
            ],
          })),
        });
      if (u.pathname === "/system-info/health") return json({ status: "UP" });
      if (u.pathname === "/apollo/audit/logs/dataInfluences/field")
        return json([
          {
            influenceEntityName: u.searchParams.get("entityName"),
            influenceEntityId: u.searchParams.get("entityId"),
            fieldName: u.searchParams.get("fieldName"),
            fieldOldValue: "old",
            fieldNewValue: "new",
            dataChangeCreatedTime: "2026-10-19T00:00:00Z",
          },
        ]);
      if (u.pathname === "/apollo/audit/properties")
        return json({ enabled: true });
      if (u.pathname === "/apollo/audit/trace")
        return json([
          {
            logDTO: audit,
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
        ]);
      if (u.pathname.startsWith("/apollo/audit/logs")) return json([audit]);
      if (u.pathname === "/global-search/item-info/by-key-or-value") {
        const rows = [...namespaces.values()].flatMap((state) =>
          state.rows
            .filter(
              (row) =>
                (!u.searchParams.get("key") ||
                  row.key.includes(u.searchParams.get("key"))) &&
                (!u.searchParams.get("value") ||
                  row.value.includes(u.searchParams.get("value"))),
            )
            .map((row) => ({
              appId: state.appId,
              envName: state.env,
              clusterName: state.cluster,
              namespaceName: state.name,
              key: row.key,
              value: row.value,
            })),
        );
        return json({
          code: 200,
          body: rows,
          hasMoreData: false,
          message: "OK",
        });
      }
      let match = u.pathname.match(
        /^\/server\/(portal-db|envs\/([^/]+)\/config-db)\/config(\/find-all-config)?$/,
      );
      if (match) {
        const env = match[2] || "portal";
        if (req.method === "POST") {
          const model = input(),
            rows = configs[env] || (configs[env] = []),
            existing = rows.find((row) => row.key === model.key);
          if (existing) Object.assign(existing, model);
          else rows.push(model);
          return json(null);
        }
        return json(configs[env] || []);
      }
      match = u.pathname.match(/^\/namespaces\/([^/]+)\/diff$/);
      if (match && req.method === "POST") {
        const model = input();
        if (!model.syncToNamespaces?.length || !model.syncItems?.length)
          return fail("Invalid NamespaceSyncModel");
        return json(
          model.syncToNamespaces.map((target) => {
            const state = namespaces.get(
              nsKey(
                target.appId,
                target.env,
                target.clusterName,
                target.namespaceName,
              ),
            );
            return {
              namespace: target,
              ...(!state
                ? { extInfo: "Namespace does not exist" }
                : {
                    diffs: {
                      createItems: model.syncItems.filter(
                        (row) => !state.rows.some((old) => old.key === row.key),
                      ),
                      updateItems: model.syncItems.filter((row) =>
                        state.rows.some(
                          (old) =>
                            old.key === row.key && old.value !== row.value,
                        ),
                      ),
                      deleteItems: [],
                    },
                  }),
            };
          }),
        );
      }
      match = u.pathname.match(/^\/apps\/([^/]+)\/namespaces\/([^/]+)\/items$/);
      if (match && req.method === "PUT") {
        const model = input();
        if (!model.syncToNamespaces?.length || !model.syncItems?.length)
          return fail("Invalid NamespaceSyncModel");
        if (
          model.syncToNamespaces.some(
            (target) =>
              target.appId !== match[1] ||
              target.namespaceName !== match[2] ||
              !namespaces.has(
                nsKey(
                  target.appId,
                  target.env,
                  target.clusterName,
                  target.namespaceName,
                ),
              ),
          )
        )
          return fail("Invalid sync target");
        for (const target of model.syncToNamespaces) {
          const state = namespaces.get(
            nsKey(
              target.appId,
              target.env,
              target.clusterName,
              target.namespaceName,
            ),
          );
          for (const row of model.syncItems) itemWrites(state, row);
        }
        return json(null);
      }
      match = u.pathname.match(/^\/apps\/([^/]+)\/navtree$/);
      if (match)
        return json({
          entities: envs.map((env) => ({
            code: 200,
            body: { env, clusters: clusters[env] },
          })),
        });
      match = u.pathname.match(/^\/apps\/([^/]+)\/role_users$/);
      if (match) return json({ masterUsers: scenario === 'no-master' ? [] : [user] });
      if (/\/roles\/Master$/.test(u.pathname)) return json(null);
      match = u.pathname.match(/^\/apps\/([^/]+)\/miss_envs$/);
      if (match) return json({entities:[]});
      if (req.method === 'GET' && /^\/apps\/[^/]+\/envs\/[^/]+\/clusters\/[^/]+\/missing-namespaces$/.test(u.pathname))
        return json({entities:[]});
      match = u.pathname.match(/^\/apps\/([^/]+)\/namespaces\/publish_info$/);
      if (match)
        return json({ DEV: { default: bo(base).itemModifiedCnt > 0 } });
      match = u.pathname.match(
        /^\/apps\/([^/]+)\/appnamespaces(?:\/([^/]+))?$/,
      );
      if (match) {
        if (req.method === "DELETE") {
          if (scenario === 'public-delete-denied') return fail('Namespace is still linked by ConsumerApp', 400);
          for (const [key, state] of namespaces)
            if (state.appId === match[1] && state.name === match[2])
              namespaces.delete(key);
          return json(null);
        }
        if (req.method === "POST") {
          const model = input();
          for (const env of envs)
            makeNamespace(
              match[1],
              env,
              "default",
              model.name,
              "",
              model.format,
            );
          return json(model);
        }
        return json({
          id: 1,
          appId: match[1],
          name: match[2],
          format: "properties",
          isPublic: false,
        });
      }
      match = u.pathname.match(/^\/apps\/([^/]+)\/namespaces$/);
      if (match && req.method === "POST") {
        const models = input();
        if (!Array.isArray(models) || !models.length)
          return fail("Expected NamespaceCreationModel array");
        for (const model of models) {
          const state = makeNamespace(
            match[1],
            model.env,
            model.namespace.clusterName,
            model.namespace.namespaceName,
            "shared value",
          );
          state.parentAppId = "PublicApp";
        }
        return json(null);
      }
      match = u.pathname.match(
        /^\/apps\/([^/]+)\/envs\/([^/]+)\/accesskeys(?:\/(\d+)(?:\/(enable|disable))?)?$/,
      );
      if (match) {
        const [_, appId, env, id, op] = match;
        if (req.method === "POST") {
          const key = {
            id: ++keyID,
            appId,
            env,
            enabled: false,
            mode: 0,
            secret: "fixture-access-secret-" + keyID,
          };
          keys.push(key);
          return json(key);
        }
        if (req.method === "DELETE") {
          const index = keys.findIndex((row) => row.id === Number(id));
          if (index >= 0) keys.splice(index, 1);
          return json(null);
        }
        if (req.method === "PUT") {
          const key = keys.find((row) => row.id === Number(id));
          if (!key) return fail("Key not found", 404);
          key.enabled = op === "enable";
          key.mode = Number(u.searchParams.get("mode") || 0);
          return json(null);
        }
        return json(
          keys.filter((row) => row.appId === appId && row.env === env),
        );
      }
      const referenceClusterCreate = req.method === 'POST' && u.pathname.match(
        /^\/openapi\/v1\/envs\/([^/]+)\/apps\/([^/]+)\/clusters$/,
      );
      match = u.pathname.match(
        /^\/apps\/([^/]+)\/envs\/([^/]+)\/clusters(?:\/([^/]+))?$/,
      ) || (referenceClusterCreate ? [referenceClusterCreate[0], referenceClusterCreate[2], referenceClusterCreate[1], undefined] : null);
      if (match) {
        const [_, appId, env, name] = match;
        if (req.method === "POST") {
          const model = input();
          if (referenceClusterCreate && model.appId !== appId)
            return fail('AppId in path and payload must match');
          if (!clusters[env]) return fail('Unknown fixture environment', 404);
          clusters[env].push({ ...model, appId });
          makeNamespace(appId, env, model.name, "application", null);
          return json(model);
        }
        if (req.method === "DELETE") {
          clusters[env] = clusters[env].filter((row) => row.name !== name);
          for (const [key, state] of namespaces)
            if (
              state.appId === appId &&
              state.env === env &&
              state.cluster === name
            )
              namespaces.delete(key);
          return json(null);
        }
        return json(clusters[env].find((row) => row.name === name) || null);
      }
      if (/\/(?:ns_role_users|role_users)$/.test(u.pathname))
        return json({
          ...(/\/envs\/([^/]+)\/namespaces\//.test(u.pathname) ? { env: decodeURIComponent(u.pathname.match(/\/envs\/([^/]+)/)[1]) } : {}),
          modifyRoleUsers: [user],
          releaseRoleUsers: [user],
        });
      if (/\/(?:ns_roles|roles)\/[^/]+$/.test(u.pathname)) return json(null);
      match = u.pathname.match(
        /^\/apps\/([^/]+)\/envs\/([^/]+)\/clusters\/([^/]+)\/namespaces$/,
      );
      if (match)
        return json(
          [...namespaces.values()]
            .filter(
              (state) =>
                state.appId === match[1] &&
                state.env === match[2] &&
                state.cluster === match[3],
            )
            .map(bo),
        );
      match = u.pathname.match(
        /^\/apps\/([^/]+)\/envs\/([^/]+)\/clusters\/([^/]+)\/namespaces\/([^/]+)(.*)$/,
      );
      if (match) {
        const [_, appId, env, cluster, name, suffix] = match,
          state = namespaces.get(nsKey(appId, env, cluster, name));
        if (!state) return fail("Namespace not found", 404);
        if (!suffix)
          return json({ ...bo(state), parentAppId: state.parentAppId });
        if (suffix === "/lock") return json({ isLocked: false });
        if (suffix === "/lock-info")
          return json({ lockOwner: scenario === 'locked' ? 'alice' : scenario === 'self-lock' ? 'apollo' : '', isEmergencyPublishAllowed: scenario === 'self-lock' });
        if (suffix === "/branches") {
          if (req.method === "POST") {
            const branch = makeNamespace(
              appId,
              env,
              "gray-1",
              name,
              null,
              state.format,
            );
            branch.rows = structuredClone(state.rows);
            branch.published = {};
            state.branch = branch;
            state.rules = {
              appId,
              clusterName: cluster,
              namespaceName: name,
              branchName: "gray-1",
              ruleItems: [],
            };
            return json(bo(branch).baseInfo);
          }
          return json(state.branch ? bo(state.branch) : null);
        }
        if (suffix === "/branches/gray-1/rules") {
          if (req.method === "PUT") {
            state.rules = input();
            return json(null);
          }
          return json(state.rules);
        }
        if (suffix === "/branches/gray-1/releases" && req.method === "POST") {
          if (!state.branch) return fail("No gray branch", 404);
          return json(publish(state.branch, input()));
        }
        if (suffix === "/branches/gray-1/merge" && req.method === "POST") {
          if (!state.branch) return fail("No gray branch", 404);
          state.rows = structuredClone(state.branch.rows);
          const release = publish(state, input());
          if (u.searchParams.get("deleteBranch") !== "false") {
            namespaces.delete(nsKey(appId, env, "gray-1", name));
            state.branch = null;
          }
          return json(release);
        }
        if (suffix === "/branches/gray-1" && req.method === "DELETE") {
          namespaces.delete(nsKey(appId, env, "gray-1", name));
          state.branch = null;
          return json(null);
        }
        if (suffix === "/commits" && req.method === "GET") {
          const key = u.searchParams.get("key"),
            page = Number(u.searchParams.get("page") || 0),
            size = Number(u.searchParams.get("size") || 10);
          return json(
            state.commits
              .filter((commit) => !key || commit.changeSets.includes(key))
              .slice(page * size, (page + 1) * size),
          );
        }
        if (suffix === "/syntax-check" && req.method === "POST") {
          if (scenario === 'syntax-error') return fail('Invalid YAML: expected closing bracket', 400);
          const model = input();
          return typeof model.configText === "string"
            ? json(null)
            : fail("Missing configText");
        }
        if (suffix === "/revoke-items" && req.method === "PUT") {
          state.rows = Object.entries(state.published).map(
            ([key, value], i) => ({
              id: ++itemID,
              key,
              value,
              type: 0,
              lineNum: i + 1,
              comment: "",
              dataChangeLastModifiedBy: "apollo",
              dataChangeLastModifiedTime: new Date().toISOString(),
            }),
          );
          return json(null);
        }
        if (suffix === "/item") {
          if (!["PUT", "POST"].includes(req.method))
            return fail("Wrong item verb", 405);
          const model = input();
          if (!model.key) return fail("Missing item key");
          itemWrites(state, model);
          return json(null);
        }
        if (suffix === "/items") {
          if (req.method === "PUT") {
            const model = input();
            if (typeof model.configText !== "string" || !model.namespaceId)
              return fail("Invalid NamespaceTextModel");
            state.rows = model.configText
              .split("\n")
              .filter((line) => line.trim() && !line.startsWith("#"))
              .map((line, index) => {
                const at = line.indexOf("=");
                return {
                  id: ++itemID,
                  key: line.slice(0, at).trim(),
                  value: line
                    .slice(at + 1)
                    .trim()
                    .replace(/\\n/g, "\n"),
                  lineNum: index + 1,
                };
              });
            return json(null);
          }
          return json(state.rows.filter((row) => !row.deleted));
        }
        if (/^\/items\/\d+$/.test(suffix) && req.method === "DELETE") {
          const row = state.rows.find(
            (row) => row.id === Number(suffix.split("/").at(-1)),
          );
          if (row) row.deleted = true;
          return json(null);
        }
        if (suffix === "/items/import" && req.method === "POST") {
          const file = multipart(req, buffer);
          state.rows = file.bytes
            .toString()
            .split("\n")
            .filter((line) => line.includes("="))
            .map((line, index) => {
              const at = line.indexOf("=");
              return {
                id: ++itemID,
                key: line.slice(0, at).trim(),
                value: line.slice(at + 1).trim(),
                lineNum: index + 1,
              };
            });
          return json(null);
        }
        if (suffix === "/items/export") {
          res.writeHead(200, {
            "content-type": "text/plain",
            "content-disposition":
              'attachment; filename="' + name + '.properties"',
          });
          res.end(text(state));
          return;
        }
        if (suffix === "/releases" && req.method === "POST") {
          const model = input();
          if (!model.releaseTitle) return fail("Missing release title");
          return json(publish(state, model));
        }
        if (suffix === "/releases/latest")
          return json(
            state.releases.find((release) => !release.isAbandoned) || null,
          );
        if (suffix === "/releases/active")
          return json(state.releases.filter((release) => !release.isAbandoned));
        if (suffix === "/releases/all")
          return json(
            state.releases.map((release) => ({
              baseInfo: release,
              items: Object.entries(release.configurations).map(
                ([key, value]) => ({ key, value }),
              ),
            })),
          );
        if (suffix === "/releases/histories")
          return json(
            state.releases.map((release, index) => ({
              id: release.id,
              releaseId: release.id,
              previousReleaseId: state.releases[index + 1]?.id || 0,
              releaseTitle: release.name,
              releaseComment: release.comment || "",
              operator: "apollo",
              operatorDisplayName: user.name,
              releaseTime: release.dataChangeCreatedTime,
              releaseTimeFormatted: release.dataChangeCreatedTime
                .replace("T", " ")
                .slice(0, 19),
              configuration: Object.entries(release.configurations).map(([firstEntity, secondEntity]) => ({ firstEntity, secondEntity })),
              isReleaseAbandoned: release.isAbandoned,
              operation: 0,
              operationContext: {},
            })),
          );
      }
      match = u.pathname.match(
        /^\/envs\/([^/]+)\/releases\/(\d+)(\/rollback)?$/,
      );
      if (match) {
        const states = [...namespaces.values()].filter(
            (state) => state.env === match[1],
          ),
          state = states.find((state) =>
            state.releases.some((release) => release.id === Number(match[2])),
          );
        if (!state) return fail("Release not found", 404);
        if (match[3]) {
          const active = state.releases.filter(
              (release) => !release.isAbandoned,
            ),
            targetID = Number(
              u.searchParams.get("toReleaseId") || active[1]?.id,
            ),
            target = state.releases.find((release) => release.id === targetID);
          if (!target) return fail("No previous release");
          if(target.isAbandoned)return fail('Target release is abandoned');
          for(const release of state.releases){if(release===target)break;release.isAbandoned=true;}
          state.published={...target.configurations};
          return json(null);
        }
        return json(
          state.releases.find((release) => release.id === Number(match[2])),
        );
      }
      if (/^\/envs\/[^/]+\/releases\/compare$/.test(u.pathname)) {
        const env=u.pathname.split('/')[2],all=[...namespaces.values()].filter(state=>state.env===env).flatMap(state=>state.releases),from=Number(u.searchParams.get('baseReleaseId')),to=Number(u.searchParams.get('toCompareReleaseId')),old=all.find(release=>release.id===from),next=all.find(release=>release.id===to);
        if((from!==0&&!old)||!next)return fail('Release not found',404);
        const first=old?.configurations||{},second=next.configurations,changes=[];
        for(const key of [...new Set([...Object.keys(first),...Object.keys(second)])].sort()){
          if(first[key]===second[key])continue;
          changes.push({type:!Object.hasOwn(first,key)?'ADDED':!Object.hasOwn(second,key)?'DELETED':'MODIFIED',entity:{firstEntity:{key,value:first[key]??''},secondEntity:{key,value:second[key]??null}}});
        }
        return json({changes});
      }
      if (/^\/envs\/[^/]+\/instances\//.test(u.pathname))
        return json(
          u.pathname.endsWith("/count")
            ? { number: 1 }
            : {
                content: [
                  {
                    appId: "SampleApp",
                    clusterName: "default",
                    ip: "127.0.0.1",
                    dataChangeLastModifiedTime: "2026-10-19T00:00:00Z",
                  },
                ],
                total: 1,
              },
        );
      if (
        u.pathname === "/configs/export" ||
        /^\/apps\/[^/]+\/envs\/[^/]+\/clusters\/[^/]+\/export$/.test(u.pathname)
      ) {
        res.writeHead(200, {
          "content-type": "application/zip",
          "content-disposition": 'attachment; filename="configs.zip"',
        });
        res.end(Buffer.from("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==", "base64"));
        return;
      }
      if (
        u.pathname === "/configs/import" ||
        /^\/apps\/[^/]+\/envs\/[^/]+\/clusters\/[^/]+\/import$/.test(u.pathname)
      ) {
        if (
          !["ignore", "cover"].includes(
            u.searchParams.get("conflictAction") || "ignore",
          )
        )
          return fail("Invalid conflict action");
        const file = multipart(req, buffer);
        if (file.bytes[0] !== 80 || file.bytes[1] !== 75)
          return fail("Invalid ZIP file");
        return json(null);
      }
      match = u.pathname.match(/^\/apps\/([^/]+)$/);
      if (match) {
        if (req.method === "DELETE") {
          apps.delete(match[1]);
          return json(null);
        }
        if (req.method === "PUT") {
          if (input().appId !== match[1]) return fail("AppId mismatch");
          apps.set(match[1], { ...apps.get(match[1]), ...input() });
          return json(null);
        }
        return apps.has(match[1])
          ? json(apps.get(match[1]))
          : fail("App not found", 404);
      }
      if (u.pathname === "/fixture/denied")
        return fail("Permission denied", 403);
      if (u.pathname === "/fixture/expired") {
        res.writeHead(302, { location: "/signin" });
        res.end();
        return;
      }
      return fail(
        "Fixture route not implemented: " + req.method + " " + u.pathname,
        404,
      );
    } catch (error) {
      return fail(error.message, 400);
    }
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return {
    server,
    calls,
    port: server.address().port,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const fixture = await startFixture(Number(process.env.PORT || 18070), {
    referenceRoot: process.env.APOLLO_REFERENCE_ROOT || null,
  });
  console.log(
    "Controlled fixture: http://127.0.0.1:" +
      fixture.port +
      " (apollo/apollo; NOT real Apollo)",
  );
}
