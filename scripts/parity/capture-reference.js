async (page) => {
  const pages = [
    "index.html",
    "app.html",
    "config.html",
    "app/setting.html",
    "app/access_key.html",
    "app/manage_cluster.html",
    "cluster.html",
    "cluster/ns_role.html",
    "namespace.html",
    "namespace/role.html",
    "config/history.html",
    "config/sync.html",
    "config/diff.html",
    "user-manage.html",
    "server_config_manage.html",
    "system-role-manage.html",
    "system_info.html",
    "open/manage.html",
    "open/add-consumer.html",
    "config_export.html",
    "delete_app_cluster_namespace.html",
    "audit_log_menu.html",
    "audit_log_trace_detail.html",
    "global_search_value.html",
  ];
  await page.setViewportSize({ width: 1304, height: 876 });
  const results = [];
  for (const path of pages) {
    const failures = [];
    const listener = (response) => {
      if (response.status() >= 400)
        failures.push({
          url: response.url().replace("http://127.0.0.1:18070", ""),
          status: response.status(),
        });
    };
    page.on("response", listener);
    await page.goto(
      "http://127.0.0.1:18070/" +
        path +
        "?#/appid=SampleApp&env=DEV&cluster=default&namespace=application&clusterName=default&namespaceName=application&traceId=fixture-trace",
    );
    await page.waitForLoadState("networkidle");
    const dom = await page.locator("body").innerText();
    await page.screenshot({
      path:
        "output/playwright/parity/reference-" +
        path.replaceAll("/", "-").replace(".html", ".png"),
      fullPage: true,
    });
    results.push({
      path,
      title: await page.title(),
      text: dom.slice(0, 3500),
      failures,
    });
    page.off("response", listener);
  }
  return results;
};
