async (page) => {
  const frame = page.locator('iframe[title="Apollo"]'),
    f = frame.contentFrame(),
    result = [];
  async function ready() {
    await f.locator(".loading").waitFor({ state: "hidden" });
  }
  async function click(action) {
    const el = f.locator(`[data-action="${action}"]`).first();
    if (!(await el.isVisible())) {
      const details = el.locator("xpath=ancestor::details");
      if (await details.count()) await details.locator("summary").click();
    }
    await el.click();
    await ready();
  }
  async function cap(id) {
    await page.setViewportSize({ width: 1500, height: 960 });
    await frame.screenshot({
      path: `output/playwright/parity/native-${id}.png`,
    });
    await page.setViewportSize({ width: 1280, height: 960 });
    result.push({
      id,
      text: (await f.locator("body").innerText()).slice(0, 5000),
      errors: await f.locator(".notice.error").allTextContents(),
      buttons: await f.locator("button:visible").allTextContents(),
    });
  }
  async function config() {
    if (await f.locator('[role="dialog"]').count())
      await click("cancel-dialog");
    await click("home");
    await click("open-project");
  }
  async function modal(action, id) {
    await click(action);
    await f.locator('[role="dialog"]').waitFor();
    await cap(id);
    await click("cancel-dialog");
  }
  try {
    await page.setViewportSize({ width: 1280, height: 960 });
    if (await f.locator("[role=dialog]").count()) await click("cancel-dialog");
    await click("home");
    await cap("index");
    await click("new-project");
    await cap("app");
    await config();
    await cap("config");
    await modal("edit-item", "modal-item-edit");
    await modal("new-item", "modal-item-create");
    await modal("delete-item", "modal-item-delete");
    await modal("publish", "modal-release");
    await modal("revoke-items", "modal-revoke");
    await click("text-mode");
    await cap("config-text");
    await click("commits-mode");
    await cap("config-commits");
    await click("table-mode");
    for (const [action, id] of [
      ["history", "config-history"],
      ["instances", "config-instances"],
      ["release-diff", "config-release-diff"],
      ["sync", "config-sync"],
      ["diff", "config-diff"],
      ["permissions", "namespace-role"],
      ["namespace-create", "namespace"],
      ["clusters", "app-manage_cluster"],
      ["access-keys", "app-access_key"],
      ["project-settings", "app-setting"],
    ]) {
      await config();
      if (action === "namespace-create") await click("new-namespace");
      else await click(action);
      await cap(id);
      if (action === "permissions") {
        await modal("add-role", "modal-namespace-role");
        await f.locator("[data-action=role-env][data-env=DEV]").click();
        await ready();
        await cap("namespace-role-env");
      }
      if (action === "clusters") {
        await click("cluster-roles");
        await cap("cluster-ns_role");
        await modal("add-cluster-role", "modal-cluster-role");
      }
      if (action === "project-settings") {
        await cap("app-admins");
        await modal("app-add-admin", "modal-app-admin");
      }
    }
    await config();
    await modal("new-cluster", "cluster");
    await config();
    await modal("import-namespace", "modal-import-namespace");
    await config();
    await modal("namespace-delete", "modal-delete-namespace");
    await config();
    await click("gray");
    await cap("config-gray-empty");
    if (await f.locator("[data-action=create-gray]").count())
      await click("create-gray");
    await cap("config-gray");
    for (const [action, id] of [
      ["gray-edit-item", "modal-gray-item"],
      ["gray-add-rule", "modal-gray-rule"],
      ["gray-publish", "modal-gray-release"],
      ["gray-merge", "modal-merge"],
      ["delete-gray", "modal-delete-gray"],
    ])
      await modal(action, id);
    for (const [action, id] of [
      ["users", "user-manage"],
      ["server-config", "server_config_manage"],
      ["system-roles", "system-role-manage"],
      ["consumers", "open-manage"],
      ["system-info", "system_info"],
      ["transfer", "config_export"],
      ["delete", "delete_app_cluster_namespace"],
      ["audit", "audit_log_menu"],
      ["global-search", "global_search_value"],
    ]) {
      const button = f.locator(`[data-action="${action}"]`).first();
      if (!(await button.isVisible()))
        await f.locator(".nav-dropdown").first().locator("summary").click();
      await button.click();
      await ready();
      await cap(id);
      if (action === "users") {
        await modal("new-user", "modal-user-create");
        await modal("edit-user", "modal-user-edit");
      }
      if (action === "server-config")
        await modal("edit-server-config", "modal-server-config");
      if (action === "system-roles")
        await modal("grant-system-role", "modal-system-role");
      if (action === "consumers")
        await modal("new-consumer", "open-add-consumer");
      if (action === "audit") {
        await click("audit-trace");
        await cap("audit_log_trace_detail");
      }
    }
  } catch (error) {
    result.push({ error: error.message });
  }
  return result;
};
