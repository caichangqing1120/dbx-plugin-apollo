async (page) => {
  const results = [];
  let visit = 0;
  async function go(path = "config.html") {
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
      const master = page.locator(
        "[ng-click=\"switchBranch('master', true)\"]:visible",
      );
      if (await master.count()) await master.click();
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
      path: `output/playwright/finish/reference-${id}.png`,
      fullPage: false,
      animations: "disabled",
    });
    results.push({
      id,
      text: await page.locator(".modal.in").first().innerText(),
    });
  }
  async function open(expression, id) {
    await go();
    const control = page.locator(`[ng-click="${expression}"]:visible`).first();
    if (!(await control.count())) {
      results.push({
        id,
        error: "No visible original control: " + expression,
        controls: await page
          .locator("[ng-click]:visible")
          .evaluateAll((els) =>
            els.map((el) => ({
              action: el.getAttribute("ng-click"),
              text: el.textContent?.trim(),
            })),
          ),
      });
      return;
    }
    await control.click();
    try {
      await page.locator(".modal.in").first().waitFor({ timeout: 4000 });
      await cap(id);
    } catch (error) {
      results.push({
        id,
        error: error.message,
        body: (await page.locator("body").innerText()).slice(-900),
      });
    }
  }
  await page.setViewportSize({ width: 1304, height: 876 });
  for (const [expression, id] of [
    ["createItem(namespace)", "modal-item-create"],
    ["editItem(namespace, config.item)", "modal-item-edit"],
    ["preDeleteItem(namespace, config.item)", "modal-item-delete"],
    ["publish(namespace)", "modal-release"],
    ["rollback(namespace)", "modal-rollback"],
    ["preRevokeItem(namespace)", "modal-revoke"],
    ["showText(config.item.value)", "modal-show-text"],
  ])
    await open(expression, id);
  await go();
  results.push({
    id: "config-controls",
    controls: await page
      .locator("[ng-click]:visible")
      .evaluateAll((els) =>
        els.map((el) => ({
          action: el.getAttribute("ng-click"),
          text: el.textContent?.trim(),
        })),
      ),
  });
  for (const [path, id] of [
    ["user-manage.html", "user-controls"],
    ["server_config_manage.html", "server-controls"],
    ["open/manage.html", "consumer-controls"],
  ]) {
    await go(path);
    results.push({
      id,
      controls: await page
        .locator("[ng-click]:visible")
        .evaluateAll((els) =>
          els.map((el) => ({
            action: el.getAttribute("ng-click"),
            text: el.textContent?.trim(),
          })),
        ),
    });
  }
  return results;
}
