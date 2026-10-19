import { encodeBytes, decodeBytes } from "./portal.js";
import { multipartFile } from "./transfer.js";

const segment = (value) => encodeURIComponent(String(value));
export function namespacePath(s) {
  return `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/namespaces/${segment(s.namespace)}`;
}
export class ApolloClient {
  constructor(host, connectionId) {
    this.host = host;
    this.connectionId = connectionId;
  }
  async request(method, path, body, contentType = "application/json") {
    const headers = {};
    let bytes = new Uint8Array();
    if (body !== undefined) {
      headers["Content-Type"] = contentType;
      bytes = new TextEncoder().encode(
        contentType.startsWith("application/json")
          ? JSON.stringify(body)
          : String(body),
      );
    }
    const response = await this.requestRaw(method, path, bytes, headers);
    return this.decodeResponse(response);
  }
  async requestRaw(method, path, bytes = new Uint8Array(), headers = {}) {
    if (bytes.length > 4 * 1024 * 1024)
      throw Error("Request exceeds 4 MiB transport limit");
    let response;
    if (bytes.length > 512 * 1024) {
      const start = await this.host.invoke("apollo/upload-start", {
        connectionId: this.connectionId,
        method,
        path,
        headers,
        size: bytes.length,
      });
      let finished = false;
      try {
        for (let offset = 0; offset < bytes.length; offset += 128 * 1024) {
          const part = bytes.subarray(
            offset,
            Math.min(bytes.length, offset + 128 * 1024),
          );
          const ack = await this.host.invoke("apollo/upload-chunk", {
            connectionId: this.connectionId,
            uploadId: start.uploadId,
            offset,
            dataBase64: encodeBytes(part),
          });
          if (ack.received !== offset + part.length)
            throw Error("Upload acknowledgment mismatch");
        }
        response = await this.host.invoke(
          "apollo/upload-finish",
          { connectionId: this.connectionId, uploadId: start.uploadId },
          { timeoutMs: 30000 },
        );
        finished = true;
      } finally {
        if (!finished)
          await this.host
            .invoke("apollo/upload-abort", {
              connectionId: this.connectionId,
              uploadId: start.uploadId,
            })
            .catch(() => {});
      }
    } else
      response = await this.host.invoke(
        "apollo/request",
        {
          connectionId: this.connectionId,
          method,
          path,
          headers,
          bodyBase64: encodeBytes(bytes),
        },
        { timeoutMs: 30000 },
      );
    response = await this.resolveResponse(response);
    if (response.status < 200 || response.status >= 300)
      this.decodeResponse(response);
    return response;
  }
  async resolveResponse(response) {
    if (!response.downloadId) return response;
    const size = response.size;
    try {
      if (!Number.isInteger(size) || size < 0 || size > 4 * 1024 * 1024)
        throw Error("Invalid download size");
      const bytes = new Uint8Array(size);
      let offset = 0;
      while (offset < size) {
        const chunk = await this.host.invoke("apollo/download-chunk", {
          connectionId: this.connectionId,
          downloadId: response.downloadId,
          offset,
          limit: 128 * 1024,
        });
        const data = decodeBytes(chunk.dataBase64);
        if (
          chunk.offset !== offset ||
          chunk.length !== data.length ||
          !data.length ||
          offset + data.length > size
        )
          throw Error("Invalid download chunk");
        bytes.set(data, offset);
        offset += data.length;
      }
      return {
        ...response,
        bodyBase64: encodeBytes(bytes),
        downloadId: undefined,
      };
    } finally {
      await this.host
        .invoke("apollo/download-close", {
          connectionId: this.connectionId,
          downloadId: response.downloadId,
        })
        .catch(() => {});
    }
  }
  decodeResponse(response) {
    const text = new TextDecoder().decode(decodeBytes(response.bodyBase64));
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (response.status < 200 || response.status >= 300) {
      const message = typeof data === "object" && data ? data.message : null;
      const error = Error(
        `HTTP ${response.status}${message ? ": " + message : ""}`,
      );
      error.status = response.status;
      error.detail = message || '';
      throw error;
    }
    return data;
  }
  user() {
    return this.request("GET", "/user");
  }
  session() {
    return this.host.invoke("apollo/session", {
      connectionId: this.connectionId,
    });
  }
  rootPermission() {
    return this.request("GET", "/permissions/root");
  }
  creationPermission(userId) {
    return this.request(
      "GET",
      "/system/role/createApplication/" + segment(userId),
    );
  }
  apps(page = 0) {
    return this.request("GET", `/apps/by-self?page=${page}&size=10`);
  }
  search(query, page = 0) {
    return this.request(
      "GET",
      `/apps/search/by-appid-or-name?query=${segment(query)}&page=${page}&size=20`,
    );
  }
  favorites(user, appId = "") {
    return this.request(
      "GET",
      `/favorites?userId=${segment(user)}&appId=${segment(appId)}&page=0&size=100`,
    );
  }
  favorite(user, appId) {
    return this.request("POST", "/favorites", { userId: user, appId });
  }
  unfavorite(id) {
    return this.request("DELETE", `/favorites/${segment(id)}`);
  }
  publicNamespaces() {
    return this.request("GET", "/appnamespaces/public?page=0&size=100");
  }
  app(id) {
    return this.request("GET", `/apps/${segment(id)}`);
  }
  saveApp(data, isNew) {
    return this.request(
      isNew ? "POST" : "PUT",
      isNew ? "/apps" : `/apps/${segment(data.appId)}`,
      data,
    );
  }
  tree(id) {
    return this.request("GET", `/apps/${segment(id)}/navtree`);
  }
  namespaces(s) {
    return this.request(
      "GET",
      namespacePath({ ...s, namespace: "" }).replace(
        /\/namespaces\/$/,
        "/namespaces",
      ),
    );
  }
  async permission(s, type) {
    const app = `/apps/${segment(s.appId)}`,
      role = segment(type);
    const clusterRole = segment(
      type === "ModifyNamespace"
        ? "ModifyNamespacesInCluster"
        : type === "ReleaseNamespace"
          ? "ReleaseNamespacesInCluster"
          : type,
    );
    const results = await Promise.all([
      this.request(
        "GET",
        `${app}/namespaces/${segment(s.namespace)}/permissions/${role}`,
      ),
      this.request(
        "GET",
        `${app}/envs/${segment(s.env)}/namespaces/${segment(s.namespace)}/permissions/${role}`,
      ),
      this.request(
        "GET",
        `${app}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/ns_permissions/${clusterRole}`,
      ),
    ]);
    return { hasPermission: results.some((result) => result.hasPermission) };
  }
  appPermission(id, type) {
    return this.request(
      "GET",
      `/apps/${segment(id)}/permissions/${segment(type)}`,
    );
  }
  saveItem(s, item, isNew) {
    return this.request(
      isNew ? "POST" : "PUT",
      namespacePath(s) + "/item",
      item,
    );
  }
  deleteItem(s, id) {
    return this.request("DELETE", namespacePath(s) + "/items/" + segment(id));
  }
  saveText(s, text, metadata) {
    return this.request("PUT", namespacePath(s) + "/items", {
      ...metadata,
      configText: text,
    });
  }
  checkSyntax(s, text, metadata) {
    return this.request("POST", namespacePath(s) + "/syntax-check", {
      ...metadata,
      configText: text,
    });
  }
  revokeItems(s) {
    return this.request("PUT", namespacePath(s) + "/revoke-items");
  }
  commits(s, key = "", page = 0) {
    return this.request(
      "GET",
      namespacePath(s) + `/commits?key=${segment(key)}&page=${page}&size=10`,
    );
  }
  publish(s, title, comment, emergency) {
    return this.request("POST", namespacePath(s) + "/releases", {
      releaseTitle: title,
      releaseComment: comment,
      isEmergencyPublish: emergency,
    });
  }
  history(s, page = 0) {
    return this.request(
      "GET",
      namespacePath(s) + `/releases/histories?page=${page}&size=10`,
    );
  }
  releases(s) {
    return this.request(
      "GET",
      namespacePath(s) + "/releases/all?page=0&size=100",
    );
  }
  release(env, id) {
    return this.request('GET', `/envs/${segment(env)}/releases/${segment(id)}`);
  }
  async latestRelease(s) {
    const releases = await this.request(
      "GET",
      namespacePath(s) + "/releases/active?page=0&size=1",
    );
    return releases[0] || null;
  }
  rollback(env, id) {
    return this.request(
      "PUT",
      `/envs/${segment(env)}/releases/${segment(id)}/rollback`,
    );
  }
  users(query = "") {
    return this.request(
      "GET",
      `/users?keyword=${segment(query)}&includeInactiveUsers=true&offset=0&limit=100`,
    );
  }
  saveUser(data, isNew) {
    return this.request("POST", `/users?isCreate=${isNew}`, data);
  }
  serverConfigs(env = "portal") {
    return this.request(
      "GET",
      env === "portal"
        ? "/server/portal-db/config/find-all-config"
        : `/server/envs/${segment(env)}/config-db/config/find-all-config`,
    );
  }
  saveServerConfig(data, env = "portal") {
    return this.request(
      "POST",
      env === "portal"
        ? "/server/portal-db/config"
        : `/server/envs/${segment(env)}/config-db/config`,
      data,
    );
  }
  createCluster(s, data) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters`,
      data,
    );
  }
  createNamespace(s, data, appendPrefix = false) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/appnamespaces?appendNamespacePrefix=${appendPrefix}`,
      data,
    );
  }
  roleUsers(s) {
    return this.request(
      "GET",
      `/apps/${segment(s.appId)}/namespaces/${segment(s.namespace)}/role_users`,
    );
  }
  assignRole(s, role, user) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/namespaces/${segment(s.namespace)}/roles/${segment(role)}`,
      user,
      "text/plain;charset=UTF-8",
    );
  }
  revokeRole(s, role, user) {
    return this.request(
      "DELETE",
      `/apps/${segment(s.appId)}/namespaces/${segment(s.namespace)}/roles/${segment(role)}?user=${segment(user)}`,
    );
  }
  branches(s) {
    return this.request("GET", namespacePath(s) + "/branches");
  }
  createBranch(s) {
    return this.request("POST", namespacePath(s) + "/branches");
  }
  deleteBranch(s, branch) {
    return this.request(
      "DELETE",
      namespacePath(s) + "/branches/" + segment(branch),
    );
  }
  branchRules(s, branch) {
    return this.request(
      "GET",
      namespacePath(s) + "/branches/" + segment(branch) + "/rules",
    );
  }
  saveBranchRules(s, branch, rules) {
    return this.request(
      "PUT",
      namespacePath(s) + "/branches/" + segment(branch) + "/rules",
      rules,
    );
  }
  namespace(s) {
    return this.request("GET", namespacePath(s));
  }
  environments() {
    return this.request("GET", "/envs");
  }
  publishGray(s, branch, release) {
    return this.request(
      "POST",
      namespacePath(s) + "/branches/" + segment(branch) + "/releases",
      release,
    );
  }
  mergeGray(s, branch, release, deleteBranch = true) {
    return this.request(
      "POST",
      namespacePath(s) +
        "/branches/" +
        segment(branch) +
        "/merge?deleteBranch=" +
        deleteBranch,
      release,
    );
  }
  previewSync(s, model) {
    return this.request(
      "POST",
      "/namespaces/" + segment(s.namespace) + "/diff",
      model,
    );
  }
  applySync(s, model) {
    return this.request(
      "PUT",
      `/apps/${segment(s.appId)}/namespaces/${segment(s.namespace)}/items`,
      model,
    );
  }
  accessKeys(s) {
    return this.request(
      "GET",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/accesskeys`,
    );
  }
  createAccessKey(s) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/accesskeys`,
      { appId: s.appId },
    );
  }
  setAccessKey(s, id, enabled, mode = 0) {
    return this.request(
      "PUT",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/accesskeys/${segment(id)}/${enabled ? "enable?mode=" + mode : "disable"}`,
    );
  }
  deleteAccessKey(s, id) {
    return this.request(
      "DELETE",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/accesskeys/${segment(id)}`,
    );
  }
  cluster(s) {
    return this.request(
      "GET",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}`,
    );
  }
  deleteCluster(s, name) {
    return this.request(
      "DELETE",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(name)}`,
    );
  }
  deleteApp(appId) {
    return this.request("DELETE", "/apps/" + segment(appId));
  }
  deleteNamespace(s) {
    return this.request(
      "DELETE",
      `/apps/${segment(s.appId)}/appnamespaces/${segment(s.namespace)}`,
    );
  }
  consumers(page = 0) {
    return this.request("GET", `/consumers?page=${page}&size=20`);
  }
  createConsumer(model, expires = "") {
    if (expires && !/^\d{14}$/.test(expires))
      throw Error("Invalid consumer expiry");
    return this.request(
      "POST",
      "/consumers" + (expires ? "?expires=" + expires : ""),
      model,
    );
  }
  consumerToken(appId) {
    return this.request(
      "GET",
      "/consumer-tokens/by-appId?appId=" + segment(appId),
    );
  }
  deleteConsumer(appId) {
    return this.request(
      "DELETE",
      "/consumers/by-appId?appId=" + segment(appId),
    );
  }
  async assignConsumer(token, type, envs, namespace) {
    return this.decodeResponse(
      await this.host.invoke(
        "apollo/consumer-authorize",
        {
          connectionId: this.connectionId,
          token,
          type,
          envs: envs.join(","),
          namespace,
        },
        { timeoutMs: 30000 },
      ),
    );
  }
  systemRoles() {
    return this.request("GET", "/system/role/createApplication");
  }
  grantSystemRole(users) {
    return this.request("POST", "/system/role/createApplication", users);
  }
  revokeSystemRole(user) {
    return this.request(
      "DELETE",
      "/system/role/createApplication/" + segment(user),
    );
  }
  manageMaster(appId, userId, enabled) {
    return this.request(
      enabled ? "POST" : "DELETE",
      `/apps/${segment(appId)}/system/master/${segment(userId)}`,
    );
  }
  appNamespace(appId, name) {
    return this.request(
      "GET",
      `/apps/${segment(appId)}/appnamespaces/${segment(name)}`,
    );
  }
  namespaceUsage(s) {
    return this.request(
      "GET",
      s.isLinkedNamespace
        ? `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/linked-namespaces/${segment(s.namespace)}/usage`
        : `/apps/${segment(s.appId)}/namespaces/${segment(s.namespace)}/usage`,
    );
  }
  namespaceLock(s) {
    return this.request("GET", namespacePath(s) + "/lock-info");
  }
  initializeNamespaceRoles(s) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/initPermission`,
      s.namespace,
      "text/plain;charset=UTF-8",
    );
  }
  initializeClusterRoles(s) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/initNsPermission`,
      "{}",
      "text/plain;charset=UTF-8",
    );
  }
  publishInfo(appId) {
    return this.request(
      "GET",
      `/apps/${segment(appId)}/namespaces/publish_info`,
    );
  }
  systemInfo() {
    return this.request("GET", "/system-info");
  }
  health(id) {
    return this.request("GET", "/system-info/health?instanceId=" + segment(id));
  }
  audit({
    query = "",
    page = 0,
    opName = "",
    startDate = "",
    endDate = "",
  } = {}) {
    if (query)
      return this.request(
        "GET",
        `/apollo/audit/logs/by-name-or-type-or-operator?query=${segment(query)}&page=${page}&size=20`,
      );
    if (opName || startDate || endDate)
      return this.request(
        "GET",
        `/apollo/audit/logs/opName?opName=${segment(opName)}&page=${page}&size=20&startDate=${segment(startDate)}&endDate=${segment(endDate)}`,
      );
    return this.request("GET", `/apollo/audit/logs?page=${page}&size=20`);
  }
  auditProperties() {
    return this.request("GET", "/apollo/audit/properties");
  }
  auditTrace(id) {
    return this.request("GET", "/apollo/audit/trace?traceId=" + segment(id));
  }
  auditFieldHistory(entityName, entityId, fieldName, page = 0) {
    return this.request(
      "GET",
      `/apollo/audit/logs/dataInfluences/field?entityName=${segment(entityName)}&entityId=${segment(entityId)}&fieldName=${segment(fieldName)}&page=${page}&size=10`,
    );
  }
  globalSearch(key, value) {
    return this.request(
      "GET",
      `/global-search/item-info/by-key-or-value?key=${segment(key)}&value=${segment(value)}`,
    );
  }
  rollbackTo(env, from, to) {
    return this.request(
      "PUT",
      `/envs/${segment(env)}/releases/${segment(from)}/rollback?toReleaseId=${segment(to)}`,
    );
  }
  envRoleUsers(s) {
    return this.request(
      "GET",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/namespaces/${segment(s.namespace)}/role_users`,
    );
  }
  linkNamespaces(appId, models) {
    return this.request("POST", `/apps/${segment(appId)}/namespaces`, models);
  }
  deleteLinkedNamespace(s) {
    return this.request(
      "DELETE",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/linked-namespaces/${segment(s.namespace)}`,
    );
  }
  clusterRoleUsers(s) {
    return this.request(
      "GET",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/ns_role_users`,
    );
  }
  assignClusterRole(s, role, user) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/ns_roles/${segment(role)}`,
      user,
      "text/plain;charset=UTF-8",
    );
  }
  revokeClusterRole(s, role, user) {
    return this.request(
      "DELETE",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/ns_roles/${segment(role)}?user=${segment(user)}`,
    );
  }
  setUserEnabled(username, enabled) {
    return this.request("PUT", "/users/enabled", {
      username,
      enabled: enabled ? 1 : 0,
    });
  }
  organizations() {
    return this.request("GET", "/openapi/v1/organizations");
  }
  appRoles(id) {
    return this.request("GET", `/apps/${segment(id)}/role_users`);
  }
  assignAppAdmin(id, user) {
    return this.request(
      "POST",
      `/apps/${segment(id)}/roles/Master`,
      user,
      "text/plain;charset=UTF-8",
    );
  }
  revokeAppAdmin(id, user) {
    return this.request(
      "DELETE",
      `/apps/${segment(id)}/roles/Master?user=${segment(user)}`,
    );
  }
  assignEnvRole(s, role, user) {
    return this.request(
      "POST",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/namespaces/${segment(s.namespace)}/roles/${segment(role)}`,
      user,
      "text/plain;charset=UTF-8",
    );
  }
  revokeEnvRole(s, role, user) {
    return this.request(
      "DELETE",
      `/apps/${segment(s.appId)}/envs/${segment(s.env)}/namespaces/${segment(s.namespace)}/roles/${segment(role)}?user=${segment(user)}`,
    );
  }
  compareReleases(env, from, to) {
    return this.request(
      "GET",
      `/envs/${segment(env)}/releases/compare?baseReleaseId=${segment(from)}&toCompareReleaseId=${segment(to)}`,
    );
  }
  instances(s, page = 0) {
    return this.request(
      "GET",
      `/envs/${segment(s.env)}/instances/by-namespace?appId=${segment(s.appId)}&clusterName=${segment(s.cluster)}&namespaceName=${segment(s.namespace)}&instanceAppId=&page=${page}&size=20`,
    );
  }
  ruleInstances(s, appId) {
    return this.request(
      "GET",
      `/envs/${segment(s.env)}/instances/by-namespace?appId=${segment(s.appId)}&clusterName=${segment(s.cluster)}&namespaceName=${segment(s.namespace)}&instanceAppId=${segment(appId)}&page=0&size=2000`,
    );
  }
  exportNamespace(s) {
    return this.requestRaw("GET", namespacePath(s) + "/items/export");
  }
  exportConfigs(envs, s) {
    return this.requestRaw(
      "GET",
      s
        ? `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/export`
        : "/configs/export?envs=" + segment(envs.join(",")),
    );
  }
  async importFile(file, path) {
    const multipart = multipartFile(
      new Uint8Array(await file.arrayBuffer()),
      file.name,
      file.type,
    );
    return this.requestRaw("POST", path, multipart.bytes, {
      "Content-Type": multipart.contentType,
    });
  }
  importNamespace(s, file) {
    return this.importFile(file, namespacePath(s) + "/items/import");
  }
  importConfigs(file, envs, conflictAction = "ignore", s) {
    if (!["ignore", "cover"].includes(conflictAction))
      throw Error("Invalid import conflict action");
    const path = s
      ? `/apps/${segment(s.appId)}/envs/${segment(s.env)}/clusters/${segment(s.cluster)}/import?conflictAction=${conflictAction}`
      : `/configs/import?envs=${segment(envs.join(","))}&conflictAction=${conflictAction}`;
    return this.importFile(file, path);
  }
}
