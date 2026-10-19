import { ApolloClient } from "./client.js";
import { createPortalApp } from "./app.js";
import { translator, observeHostLocale } from "./i18n.js";
import { saveHostFile } from "./transfer.js";

async function bootPortal() {
  const host = window.dbxPlugin;
  await host.ready;
  const root = document.getElementById("app");
  const context = host.context || {};
  if (!context.connectionId) {
    root.className = "connection-empty";
    const title = document.createElement("h1");
    title.textContent = "Apollo";
    const text = document.createElement("p");
    text.textContent = translator(host.locale || "en")("connect");
    root.append(title, text);
    return;
  }
  const connectionId = context.connectionId;
  const app = createPortalApp(root, {
    client: new ApolloClient(host, connectionId),
    connectionId,
    locale: host.locale || "zh-CN",
    readOnly: context.readOnly,
    logo: APOLLO_LOGO,
    storage: host.storage,
    copy: (text) => host.copy(text),
    saveFile: (fileName, response) => saveHostFile(host, fileName, response),
    reconnect: () => host.reopenConnection(connectionId),
    disconnect: () =>
      host.invoke("connection/disconnect", {
        connection: { id: connectionId },
      }),
  });
  host.onContext((next) => {
    if (next.connectionId !== connectionId) window.location.reload();
  });
  const updateHostLocale = observeHostLocale(host.locale, (locale) =>
    app.setLocale(locale),
  );
  host.onEvent((event) => {
    if (event.type === "env") updateHostLocale(host.locale);
  });
  window.addEventListener("pagehide", () => app.destroy(), { once: true });
  await app.start();
}
bootPortal().catch((error) => {
  const root = document.getElementById("app");
  root.textContent = "Apollo: " + error.message;
  root.setAttribute("role", "alert");
});
