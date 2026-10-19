import { test } from "node:test";
import assert from "node:assert/strict";
import { ApolloClient } from "../src/client.js";
const selection = {
  appId: "SampleApp",
  env: "DEV",
  cluster: "default",
  namespace: "application",
};
const ns = "/apps/SampleApp/envs/DEV/clusters/default/namespaces/application";
function clientFixture(data = {}) {
  const calls = [];
  return {
    calls,
    client: new ApolloClient(
      {
        invoke: async (method, params) => {
          calls.push({ method, ...params });
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyBase64: Buffer.from(JSON.stringify(data)).toString("base64"),
          };
        },
      },
      "conn",
    ),
  };
}
const jsonBody = (call) =>
  JSON.parse(Buffer.from(call.bodyBase64, "base64").toString());

test("gray rule instance choices use Apollo's filtered namespace lookup and 2000-row limit", async () => {
  const { client, calls } = clientFixture();
  await client.ruleInstances(selection, "consumer app");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].path, "/envs/DEV/instances/by-namespace?appId=SampleApp&clusterName=default&namespaceName=application&instanceAppId=consumer%20app&page=0&size=2000");
});

test("selected release metadata uses the literal Portal release lookup", async () => {
  const {client,calls}=clientFixture();
  await client.release('UAT',42);
  assert.equal(calls[0].method,'GET');
  assert.equal(calls[0].path,'/envs/UAT/releases/42');
});

test("gray publish and merge keep the parent/branch identities and release model", async () => {
  const { client, calls } = clientFixture();
  await client.publishGray(selection, "gray-1", {
    releaseTitle: "Gray",
    releaseComment: "test",
    isEmergencyPublish: false,
  });
  assert.equal(calls[0].path, ns + "/branches/gray-1/releases");
  assert.equal(calls[0].method, "POST");
  await client.mergeGray(
    selection,
    "gray-1",
    {
      releaseTitle: "Merge",
      releaseComment: "test",
      isEmergencyPublish: false,
    },
    false,
  );
  assert.equal(calls[1].path, ns + "/branches/gray-1/merge?deleteBranch=false");
  assert.equal(jsonBody(calls[1]).releaseTitle, "Merge");
  await client.namespace({ ...selection, cluster: "gray-1" });
  assert.equal(
    calls[2].path,
    "/apps/SampleApp/envs/DEV/clusters/gray-1/namespaces/application",
  );
});
test("sync preview and apply send the same NamespaceSyncModel without inventing APIs", async () => {
  const { client, calls } = clientFixture();
  const model = {
    syncToNamespaces: [
      {
        appId: "SampleApp",
        env: "UAT",
        clusterName: "default",
        namespaceName: "application",
      },
    ],
    syncItems: [{ key: "a", value: "中文", comment: "test", lineNum: 1 }],
  };
  await client.previewSync(selection, model);
  await client.applySync(selection, model);
  assert.equal(calls[0].path, "/namespaces/application/diff");
  assert.equal(calls[1].path, "/apps/SampleApp/namespaces/application/items");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[1].method, "PUT");
  assert.deepEqual(jsonBody(calls[0]), model);
  assert.deepEqual(jsonBody(calls[1]), model);
});
test("access keys and Portal cluster operations use session authenticated routes", async () => {
  const { client, calls } = clientFixture();
  await client.accessKeys(selection);
  await client.createAccessKey(selection);
  await client.setAccessKey(selection, 3, true, 1);
  await client.setAccessKey(selection, 3, false);
  await client.deleteAccessKey(selection, 3);
  await client.deleteCluster(selection, "extra");
  assert.deepEqual(
    calls.map((c) => [c.method, c.path]),
    [
      ["GET", "/apps/SampleApp/envs/DEV/accesskeys"],
      ["POST", "/apps/SampleApp/envs/DEV/accesskeys"],
      ["PUT", "/apps/SampleApp/envs/DEV/accesskeys/3/enable?mode=1"],
      ["PUT", "/apps/SampleApp/envs/DEV/accesskeys/3/disable"],
      ["DELETE", "/apps/SampleApp/envs/DEV/accesskeys/3"],
      ["DELETE", "/apps/SampleApp/envs/DEV/clusters/extra"],
    ],
  );
});
test("consumer authorization keeps generated tokens out of RPC path strings", async () => {
  const { client, calls } = clientFixture();
  await client.consumers(2);
  await client.consumerToken("consumer/app");
  await client.assignConsumer(
    "sensitive-token",
    "NamespaceRole",
    ["DEV", "UAT"],
    { appId: "SampleApp", namespaceName: "application" },
  );
  assert.equal(calls[0].path, "/consumers?page=2&size=20");
  assert.equal(calls[1].path, "/consumer-tokens/by-appId?appId=consumer%2Fapp");
  assert.equal(calls[2].method, "apollo/consumer-authorize");
  assert.equal(calls[2].token, "sensitive-token");
  assert.equal(calls[2].path, undefined);
  assert.equal(calls[2].envs, "DEV,UAT");
});
test("system role, audit, service health and value search contracts preserve parameters", async () => {
  const { client, calls } = clientFixture();
  await client.systemRoles();
  await client.grantSystemRole(["alice", "bob"]);
  await client.revokeSystemRole("alice");
  await client.systemInfo();
  await client.health("admin/server");
  await client.audit({ query: "a&b", page: 2 });
  await client.auditTrace("trace/1");
  await client.globalSearch("a.b", "hello & world");
  assert.deepEqual(jsonBody(calls[1]), ["alice", "bob"]);
  assert.equal(calls[2].path, "/system/role/createApplication/alice");
  assert.equal(calls[3].path, "/system-info");
  assert.equal(calls[4].path, "/system-info/health?instanceId=admin%2Fserver");
  assert.equal(
    calls[5].path,
    "/apollo/audit/logs/by-name-or-type-or-operator?query=a%26b&page=2&size=20",
  );
  assert.equal(calls[6].path, "/apollo/audit/trace?traceId=trace%2F1");
  assert.equal(
    calls[7].path,
    "/global-search/item-info/by-key-or-value?key=a.b&value=hello%20%26%20world",
  );
});
test("rollback-to and environment roles use the actual target query and env scope", async () => {
  const { client, calls } = clientFixture();
  await client.rollbackTo("DEV", 9, 3);
  await client.envRoleUsers(selection);
  await client.assignEnvRole(selection, "ModifyNamespace", "alice");
  await client.revokeEnvRole(selection, "ReleaseNamespace", "bob");
  assert.equal(calls[0].path, "/envs/DEV/releases/9/rollback?toReleaseId=3");
  assert.equal(
    calls[1].path,
    "/apps/SampleApp/envs/DEV/namespaces/application/role_users",
  );
  assert.equal(Buffer.from(calls[2].bodyBase64, "base64").toString(), "alice");
  assert.equal(
    calls[3].path,
    "/apps/SampleApp/envs/DEV/namespaces/application/roles/ReleaseNamespace?user=bob",
  );
});
test("zip import uses cover conflictAction and byte-safe multipart on the actual config API", async () => {
  const { client, calls } = clientFixture();
  const file = new File([new Uint8Array([0, 255, 65])], "configs.zip", {
    type: "application/zip",
  });
  await client.importConfigs(file, ["DEV", "UAT"], "cover");
  assert.equal(
    calls[0].path,
    "/configs/import?envs=DEV%2CUAT&conflictAction=cover",
  );
  assert.equal(calls[0].method, "POST");
  assert.ok(
    Buffer.from(calls[0].bodyBase64, "base64").includes(
      Buffer.from([0, 255, 65]),
    ),
  );
});
test("linking public namespaces and cluster-wide roles preserve their distinct controller models", async () => {
  const { client, calls } = clientFixture();
  const model = [
    {
      env: "UAT",
      namespace: {
        appId: "SampleApp",
        clusterName: "extra",
        namespaceName: "public.db",
      },
    },
  ];
  await client.linkNamespaces("SampleApp", model);
  await client.clusterRoleUsers(selection);
  await client.assignClusterRole(
    selection,
    "ModifyNamespacesInCluster",
    "alice",
  );
  assert.equal(calls[0].path, "/apps/SampleApp/namespaces");
  assert.deepEqual(jsonBody(calls[0]), model);
  assert.equal(
    calls[1].path,
    "/apps/SampleApp/envs/DEV/clusters/default/ns_role_users",
  );
  assert.equal(
    calls[2].path,
    "/apps/SampleApp/envs/DEV/clusters/default/ns_roles/ModifyNamespacesInCluster",
  );
});

test("parity: Master assignment and namespace usage use their inspected Portal controllers", async () => {
  const { client, calls } = clientFixture();
  await client.manageMaster("APP /", "alice /", true);
  await client.manageMaster("APP /", "alice /", false);
  assert.equal(calls[0].path, "/apps/APP%20%2F/system/master/alice%20%2F");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[1].method, "DELETE");
  await client.namespaceUsage({ appId: "A", namespace: "application" });
  assert.equal(calls[2].path, "/apps/A/namespaces/application/usage");
  await client.appNamespace("A", "public.ns");
  assert.equal(calls[3].path, "/apps/A/appnamespaces/public.ns");
});

test("parity: related audit properties use encoded field-history query parameters", async () => {
  const { client, calls } = clientFixture([]);
  await client.auditFieldHistory("Item/A", "id & 1", "a.b", 2);
  assert.equal(
    calls[0].path,
    "/apollo/audit/logs/dataInfluences/field?entityName=Item%2FA&entityId=id%20%26%201&fieldName=a.b&page=2&size=10",
  );
});

test("parity: lazy permission-role initialization preserves Portal methods and text bodies", async () => {
  const { client, calls } = clientFixture();
  await client.initializeNamespaceRoles(selection);
  await client.initializeClusterRoles(selection);
  assert.equal(calls[0].path, "/apps/SampleApp/initPermission");
  assert.equal(
    Buffer.from(calls[0].bodyBase64, "base64").toString(),
    "application",
  );
  assert.equal(calls[0].headers["Content-Type"], "text/plain;charset=UTF-8");
  assert.equal(
    calls[1].path,
    "/apps/SampleApp/envs/DEV/clusters/default/initNsPermission",
  );
  assert.equal(calls[1].method, "POST");
});
