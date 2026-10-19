import { test } from "node:test";
import assert from "node:assert/strict";
import { ApolloClient, namespacePath } from "../src/client.js";

function clientFixture(status = 200, data = {}) {
  const calls = [];
  const host = {
    invoke: async (method, params) => {
      calls.push({ method, params });
      return {
        status,
        headers: { "content-type": "application/json" },
        bodyBase64: Buffer.from(JSON.stringify(data)).toString("base64"),
      };
    },
  };
  return { client: new ApolloClient(host, "connection-a"), calls };
}
const selection = {
  appId: "test/app",
  env: "DEV",
  cluster: "default",
  namespace: "application",
};

test("namespace and write contracts match Portal controllers, not guessed REST paths", async () => {
  const { client, calls } = clientFixture();
  assert.equal(
    namespacePath(selection),
    "/apps/test%2Fapp/envs/DEV/clusters/default/namespaces/application",
  );
  await client.saveItem(selection, { id: 7, key: "key", value: "中文" }, false);
  assert.equal(
    calls[0].params.path,
    "/apps/test%2Fapp/envs/DEV/clusters/default/namespaces/application/item",
  );
  assert.equal(calls[0].params.method, "PUT");
  assert.deepEqual(
    JSON.parse(Buffer.from(calls[0].params.bodyBase64, "base64")),
    { id: 7, key: "key", value: "中文" },
  );
  await client.publish(selection, "release 1", "comment", false);
  assert.deepEqual(
    JSON.parse(Buffer.from(calls[1].params.bodyBase64, "base64")),
    {
      releaseTitle: "release 1",
      releaseComment: "comment",
      isEmergencyPublish: false,
    },
  );
  await client.history(selection);
  assert.match(calls[2].params.path, /\/releases\/histories\?page=0&size=10$/);
  await client.rollback("DEV", 7);
  assert.equal(calls[3].params.path, "/envs/DEV/releases/7/rollback");
});

test("HTTP failures are not converted to success and writes are never replayed", async () => {
  const { client, calls } = clientFixture(403, {
    message: "Permission denied",
  });
  await assert.rejects(
    () => client.publish(selection, "title", "", false),
    (error) =>
      error.status === 403 && error.message.includes("Permission denied"),
  );
  assert.equal(calls.length, 1);
});

test("Portal validation detail stays separate from HTTP status for the source syntax dialog", async () => {
  const {client}=clientFixture(400,{message:'Invalid YAML: expected closing bracket'});
  await assert.rejects(()=>client.checkSyntax(selection,'broken',{}),error=>error.status===400&&error.detail==='Invalid YAML: expected closing bracket'&&error.message.startsWith('HTTP 400'));
});

test("authentication expiry remains identifiable to reconnect UI", async () => {
  const { client } = clientFixture(401, { message: "Expired" });
  await assert.rejects(
    () => client.user(),
    (error) => error.status === 401,
  );
});

test("creation permission uses the signed-in user role endpoint", async () => {
  const { client, calls } = clientFixture();
  await client.creationPermission("apollo");
  assert.equal(calls[0].params.path, "/system/role/createApplication/apollo");
});

test("effective namespace permission includes global, environment and cluster roles", async () => {
  const calls = [];
  const host = {
    invoke: async (_method, params) => {
      calls.push(params.path);
      return {
        status: 200,
        headers: {},
        bodyBase64: Buffer.from(
          JSON.stringify({
            hasPermission:
              params.path ===
              "/apps/test%2Fapp/namespaces/application/permissions/ModifyNamespace",
          }),
        ).toString("base64"),
      };
    },
  };
  const client = new ApolloClient(host, "a");
  assert.equal(
    (await client.permission(selection, "ModifyNamespace")).hasPermission,
    true,
  );
  assert.deepEqual(
    calls.sort(),
    [
      "/apps/test%2Fapp/namespaces/application/permissions/ModifyNamespace",
      "/apps/test%2Fapp/envs/DEV/namespaces/application/permissions/ModifyNamespace",
      "/apps/test%2Fapp/envs/DEV/clusters/default/ns_permissions/ModifyNamespacesInCluster",
    ].sort(),
  );
});

test("create, delete and configuration text preserve API body shapes", async () => {
  const { client, calls } = clientFixture();
  await client.saveItem(selection, { key: "new", value: "v" }, true);
  assert.equal(calls[0].params.method, "POST");
  await client.deleteItem(selection, 9);
  assert.equal(
    calls[1].params.path,
    "/apps/test%2Fapp/envs/DEV/clusters/default/namespaces/application/items/9",
  );
  await client.saveText(selection, "a=one\nb=two", {
    namespaceId: 17,
    format: "properties",
    operator: "apollo",
  });
  assert.deepEqual(
    JSON.parse(Buffer.from(calls[2].params.bodyBase64, "base64").toString()),
    {
      namespaceId: 17,
      format: "properties",
      operator: "apollo",
      configText: "a=one\nb=two",
    },
  );
  assert.equal(calls[2].params.headers["Content-Type"], "application/json");
});

test("commit history, revoke and YAML syntax preserve literal Portal contracts", async () => {
  const { client, calls } = clientFixture();
  await client.commits(selection, "a & b", 2);
  assert.equal(
    calls[0].params.path,
    namespacePath(selection) + "/commits?key=a%20%26%20b&page=2&size=10",
  );
  await client.revokeItems(selection);
  assert.equal(
    calls[1].params.path,
    namespacePath(selection) + "/revoke-items",
  );
  assert.equal(calls[1].params.method, "PUT");
  assert.ok(!calls[1].params.bodyBase64);
  await client.checkSyntax(selection, "key: value", {
    namespaceId: 17,
    format: "yaml",
    operator: "apollo",
  });
  assert.equal(
    calls[2].params.path,
    namespacePath(selection) + "/syntax-check",
  );
  assert.equal(calls[2].params.method, "POST");
  assert.deepEqual(
    JSON.parse(Buffer.from(calls[2].params.bodyBase64, "base64")),
    {
      namespaceId: 17,
      format: "yaml",
      operator: "apollo",
      configText: "key: value",
    },
  );
});

test("parity: latest release derives from the real active-release BO endpoint", async () => {
  const { client, calls } = clientFixture(200, [
    { id: 9, configurations: '{"key":"value"}' },
  ]);
  assert.equal((await client.latestRelease(selection)).id, 9);
  assert.equal(
    calls[0].params.path,
    namespacePath(selection) + "/releases/active?page=0&size=1",
  );
});
