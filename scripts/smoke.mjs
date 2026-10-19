import { spawn, execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { startFixture } from "../tests/fixture.mjs";
import { ApolloClient } from "../src/client.js";

await mkdir(".dbx-dev", { recursive: true });
const sidecarPath = process.env.APOLLO_SMOKE_SIDECAR || ".dbx-dev/smoke-sidecar";
if (!process.env.APOLLO_SMOKE_SIDECAR)
  execFileSync("go", ["build", "-o", "../.dbx-dev/smoke-sidecar", "."], {
    cwd: "backend",
    stdio: "inherit",
  });
const fixture = await startFixture();
const sidecar = spawn(sidecarPath, [], {
  stdio: ["pipe", "pipe", "inherit"],
});
const waiting = new Map();
let next = 0;
const reader = createInterface({ input: sidecar.stdout });
reader.on("line", (line) => {
  assert.ok(
    Buffer.byteLength(line) < 2 * 1024 * 1024,
    "Sidecar response exceeded Host bridge budget",
  );
  const message = JSON.parse(line);
  const pending = waiting.get(message.id);
  if (!pending) return;
  waiting.delete(message.id);
  clearTimeout(pending.timer);
  if (message.error) pending.reject(Error(message.error.message));
  else pending.resolve(message.result);
});
function rpc(method, params = {}) {
  assert.ok(
    Buffer.byteLength(JSON.stringify({ method, params })) < 2 * 1024 * 1024,
    "RPC request exceeded Host bridge budget",
  );
  return new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => {
      waiting.delete(id);
      reject(Error("RPC timed out: " + method));
    }, 35000);
    waiting.set(id, { resolve, reject, timer });
    sidecar.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
    );
  });
}
const connection = {
  id: "smoke",
  host: "127.0.0.1",
  port: fixture.port,
  username: "apollo",
  connection_secrets: { password: "apollo" },
  external_config: { scheme: "http" },
};
const ns = "/apps/SampleApp/envs/DEV/clusters/default/namespaces/application";
async function api(method, path, body) {
  const response = await rpc("apollo/request", {
    connectionId: "smoke",
    method,
    path,
    headers: body ? { "Content-Type": "application/json" } : {},
    bodyBase64: body
      ? Buffer.from(JSON.stringify(body)).toString("base64")
      : "",
  });
  const text = Buffer.from(response.bodyBase64, "base64").toString();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
try {
  assert.equal(
    (await rpc("plugin/initialize", { host: { protocolVersions: [1] } })).plugin
      .id,
    "io.github.caichangqing1120.apollo",
  );
  await assert.rejects(
    () =>
      rpc("connection/test", {
        connection: {
          ...connection,
          connection_secrets: { password: "wrong" },
        },
      }),
    /login failed/,
  );
  await rpc("connection/connect", { connection });
  assert.equal((await api("GET", "/user")).data.userId, "apollo");
  assert.equal((await api("GET", "/apps/by-self")).data[0].appId, "SampleApp");
  await api("PUT", ns + "/item", {
    id: 1,
    key: "sample.key",
    value: "Updated 中文 value",
  });
  assert.equal(
    (await api("GET", ns + "/items")).data[0].value,
    "Updated 中文 value",
  );
  assert.equal(
    (await api("POST", ns + "/releases", { releaseTitle: "Smoke release" }))
      .data.id,
    2,
  );
  assert.equal(
    (await api("GET", ns + "/releases/histories")).data[0].releaseId,
    2,
  );
  await api("PUT", "/envs/DEV/releases/2/rollback");
  assert.equal(
    (await api("GET", ns + "/items")).data[0].value,
    "Updated 中文 value",
  );
  assert.equal((await api('GET',ns+'/releases/active')).data[0].configurations['sample.key'],'Initial Apollo value');
  assert.equal((await api("GET", "/fixture/denied")).status, 403);
  assert.equal((await api("GET", "/fixture/expired")).status, 401);
  assert.equal(
    fixture.calls.filter(
      (c) => c.method === "POST" && c.path === ns + "/releases",
    ).length,
    1,
  );
  const client = new ApolloClient({ invoke: rpc }, "smoke"),
    selection = {
      appId: "SampleApp",
      env: "DEV",
      cluster: "default",
      namespace: "application",
    };
  assert.equal((await client.session()).readOnly, false);
  await client.manageMaster("SampleApp", "apollo", true);
  await client.manageMaster("SampleApp", "apollo", false);
  assert.deepEqual(await client.namespaceUsage(selection), []);
  assert.equal(
    (await client.auditFieldHistory("Item", "1", "value"))[0].fieldName,
    "value",
  );
  assert.equal(
    typeof (await client.namespaceLock(selection)).lockOwner,
    "string",
  );

  await client.saveItem(
    selection,
    { key: "temporary.revoke", value: "unpublished" },
    true,
  );
  assert.ok(
    (await client.commits(selection, "temporary.revoke", 0)).some((commit) =>
      commit.changeSets.includes("unpublished"),
    ),
  );
  await client.revokeItems(selection);
  assert.ok(
    !(await client.namespace(selection)).items.some(
      (row) => row.item.key === "temporary.revoke",
    ),
  );
  await client.checkSyntax(selection, "key: value", {
    namespaceId: 1,
    format: "yaml",
    operator: "apollo",
  });
  await client.createBranch(selection);
  const branch = await client.branches(selection);
  assert.equal(branch.baseInfo.clusterName, "gray-1");
  await client.saveItem(
    { ...selection, cluster: "gray-1" },
    { id: 1, key: "sample.key", value: "Gray workflow value" },
    false,
  );
  assert.equal(
    (await client.namespace(selection)).items[0].item.value,
    "Initial Apollo value",
  );
  await client.saveBranchRules(selection, "gray-1", {
    appId: "SampleApp",
    clusterName: "default",
    namespaceName: "application",
    branchName: "gray-1",
    ruleItems: [
      {
        clientAppId: "SampleApp",
        clientIpList: ["127.0.0.1"],
        clientLabelList: [],
      },
    ],
  });
  await client.publishGray(selection, "gray-1", {
    releaseTitle: "Gray release",
    releaseComment: "fixture",
    isEmergencyPublish: false,
  });
  await client.mergeGray(
    selection,
    "gray-1",
    {
      releaseTitle: "Merge release",
      releaseComment: "fixture",
      isEmergencyPublish: false,
    },
    true,
  );
  assert.equal(await client.branches(selection), null);
  assert.equal(
    (await client.namespace(selection)).items[0].item.value,
    "Gray workflow value",
  );
  const sync = {
    syncToNamespaces: [
      {
        appId: "SampleApp",
        env: "UAT",
        clusterName: "default",
        namespaceName: "application",
      },
    ],
    syncItems: [
      {
        key: "sample.key",
        value: "Synced value",
        comment: "fixture",
        lineNum: 1,
      },
    ],
  };
  assert.equal(
    (await client.previewSync(selection, sync))[0].diffs.updateItems.length,
    1,
  );
  await client.applySync(selection, sync);
  assert.equal(
    (await client.namespace({ ...selection, env: "UAT" })).items[0].item.value,
    "Synced value",
  );
  const key = await client.createAccessKey(selection);
  await client.setAccessKey(selection, key.id, true, 1);
  assert.equal((await client.accessKeys(selection))[0].enabled, true);
  await client.deleteAccessKey(selection, key.id);
  assert.equal((await client.accessKeys(selection)).length, 0);
  const consumer = await client.createConsumer({
    appId: "fixture-consumer",
    name: "Fixture Consumer",
    ownerName: "apollo",
    orgId: "TEST1",
    orgName: "Sample Department",
    rateLimitEnabled: true,
    rateLimit: 25,
  });
  await client.assignConsumer(consumer.token, "NamespaceRole", ["DEV"], {
    appId: "SampleApp",
    namespaceName: "application",
  });
  await client.deleteConsumer(consumer.appId);
  await client.saveUser(
    {
      username: "fixture-user",
      password: "Fixture-Password-123!",
      userDisplayName: "Fixture User",
      email: "fixture@example.test",
      enabled: 1,
    },
    true,
  );
  await client.grantSystemRole(["fixture-user"]);
  assert.ok((await client.systemRoles()).includes("fixture-user"));
  await client.revokeSystemRole("fixture-user");
  assert.equal((await client.systemInfo()).version, "2.5.2");
  assert.equal(
    (await client.auditTrace("fixture-trace"))[0].logDTO.operator,
    "apollo",
  );
  assert.ok((await client.globalSearch("sample.key", "")).body.length >= 2);
  const exported = await client.exportConfigs(["DEV"]);
  assert.equal(Buffer.from(exported.bodyBase64, "base64")[0], 80);
  await client.importConfigs(
    new File([Buffer.from(exported.bodyBase64, "base64")], "configs.zip", {
      type: "application/zip",
    }),
    ["DEV"],
    "cover",
  );
  const large = "sample.key = " + "A".repeat(2 * 1024 * 1024);
  await client.saveText(selection, large, {
    namespaceId: 1,
    format: "properties",
    operator: "apollo",
  });
  // NamespaceBO duplicates modified values; its HTTP payload can legitimately exceed the cap.
  await assert.rejects(() => client.namespace(selection), /4 MiB limit/);
  assert.equal(
    (await client.request("GET", ns + "/items"))[0].value.length,
    2 * 1024 * 1024,
  );
  await client.saveText(selection, "sample.key = Restored", {
    namespaceId: 1,
    format: "properties",
    operator: "apollo",
  });
  console.log(
    "PASS: gray edit/rules/publish/merge, UAT sync preview/apply, access-key lifecycle, consumer authorization, system roles/info/audit/search, ZIP transfer, 2 MiB chunked body/reply within actual Host message limits",
  );
  await rpc("connection/disconnect", { connection: { id: "smoke" } });
  await assert.rejects(() => api("GET", "/user"), /not active/);
  console.log(
    "PASS: real sidecar JSON-RPC initialize, wrong password, login, user/apps, edit, publish, history, rollback, 403, session expiry, no write replay, disconnect",
  );
  console.log(
    "Evidence uses a controlled HTTP fixture, NOT live Apollo acceptance.",
  );
} finally {
  reader.close();
  sidecar.stdin.end();
  sidecar.kill();
  for (const pending of waiting.values()) clearTimeout(pending.timer);
  await fixture.close();
}
