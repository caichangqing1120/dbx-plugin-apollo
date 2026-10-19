async (page) => {
  const results = [];
  let visit = 100;
  async function go(path = "config.html", branch = false) {
    await page.setViewportSize({ width: 1084, height: 876 });
    await page.goto(
      "http://127.0.0.1:18070/" +
        path +
        "?audit=" +
        ++visit +
        "#/appid=SampleApp&env=DEV&cluster=default&clusterName=default&namespace=application&namespaceName=application",
    );
    await page.waitForLoadState("networkidle");
    if (path === "config.html") {
      const selector = branch
        ? "switchBranch(namespace.branchName, true)"
        : "switchBranch('master', true)";
      const tab = page.locator(`[ng-click="${selector}"]:visible`);
      if (await tab.count()) await tab.click();
    }
  }
  async function cap(id) {
    await page.setViewportSize({ width: 1304, height: 876 });
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".modal.in")].every(
        (el) =>
          getComputedStyle(el).opacity === "1" &&
          [...el.querySelectorAll(".modal-dialog")].every((dialog) => {
            const t = getComputedStyle(dialog).transform;
            return t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)";
          }),
      ),
    );
    await page.screenshot({
      path: `output/playwright/parity/reference-${id}.png`,
      fullPage: true,
      animations: "disabled",
    });
    results.push({
      id,
      text: (await page.locator("body").innerText()).slice(-6000),
    });
  }
  async function act(expr, id, modal = false) {
    const control = page.locator(`[ng-click="${expr}"]`).first();
    if (!(await control.count())) {
      results.push({ id, error: "Original control absent: " + expr });
      return false;
    }
    if (!(await control.isVisible())) {
      const parent = control.locator(
        'xpath=ancestor::div[contains(@class,"btn-group")]',
      );
      if (await parent.count())
        await parent.locator(".dropdown-toggle").click();
    }
    await control.click();
    if (modal) await page.locator(".modal.in").first().waitFor();
    await cap(id);
    return true;
  }
  for (const [expr, id] of [
    ["switchView(namespace, 'text')", "config-text"],
    ["switchView(namespace, 'history')", "config-commits"],
    ["switchView(namespace, 'instance')", "config-instances"],
    ["importNamespace(namespace)", "modal-import-namespace"],
    ["deleteNamespace(namespace)", "modal-delete-namespace"],
  ]) {
    try {
      await go();
      await act(expr, id, id.startsWith("modal"));
    } catch (error) {
      results.push({ id, error: error.message });
    }
  }
  for (const [expr, id] of [
    [null, "config-gray"],
    ["createItem(namespace.branch)", "modal-gray-item-create"],
    ["editItem(namespace.branch, config.item)", "modal-gray-item"],
    ["publish(namespace.branch)", "modal-gray-release"],
    ["mergeAndPublish(namespace.branch)", "modal-merge"],
    ["preDeleteBranch(namespace.branch)", "modal-delete-gray"],
    ["switchView(namespace.branch, 'rule')", "config-gray-rules"],
    ["switchView(namespace.branch, 'instance')", "config-gray-instances"],
    ["switchView(namespace.branch, 'history')", "config-gray-commits"],
  ]) {
    try {
      await go("config.html", true);
      if (expr) await act(expr, id, id.startsWith("modal"));
      else await cap(id);
    } catch (error) {
      results.push({ id, error: error.message });
    }
  }
  try {
    await go("config.html", true);
    await page
      .locator("[ng-click=\"switchView(namespace.branch, 'rule')\"]:visible")
      .click();
    await act("addRuleItem(namespace.branch)", "modal-gray-rule", true);
  } catch (error) {
    results.push({ id: "modal-gray-rule", error: error.message });
  }
  for (const [path, expr, id, modal] of [
    ["user-manage.html", "changeStatus('2')", "modal-user-create", false],
    ["user-manage.html", "changeStatus('3', user)", "modal-user-edit", false],
    [
      "server_config_manage.html",
      "configEdit('edit', config)",
      "modal-server-config",
      false,
    ],
    [
      "server_config_manage.html",
      "configEdit('add')",
      "server-config-create",
      false,
    ],
    [
      "open/manage.html",
      "preGrantPermission(consumer)",
      "modal-consumer-authorize",
      true,
    ],
    [
      "open/manage.html",
      "preDeleteConsumer(consumer)",
      "modal-consumer-delete",
      true,
    ],
  ]) {
    try {
      await go(path);
      await act(expr, id, modal);
    } catch (error) {
      results.push({ id, error: error.message });
    }
  }
  return results;
};
