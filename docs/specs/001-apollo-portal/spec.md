# Apollo Portal Plugin v0.2 Draft - Handwritten UI

## Approval And Sources

- User requested DBX issue https://github.com/t8y2/dbx/issues/12466 and a 1:1 Apollo management UI.
- User confirmed ordinary username/password authentication on 2026-10-19; implementation authorized.
- UI baseline: Apollo v2.5.2, commit ed9785c (resolve full SHA in upstream provenance).
- User correction: independently author the pages/components; visually match Apollo, do not wrap or run its original frontend. This supersedes the earlier reuse proposal.

## Product Scope

Connect to an existing Apollo Portal with a DBX connection. Retain its original project list,
configuration editor, environment/cluster/namespace navigation, publishing, rollback, history,
gray release, permissions and administrator pages. Server permissions remain authoritative.
Keep Chinese/English support, light appearance and page structure, including on
dark DBX hosts. A narrower window may scroll where the original desktop UI does.

Authentication is ordinary Portal form login only. LDAP, SSO/OIDC, OpenAPI-token-only login,
production writes during development, publishing, remote repository creation and push are out
of scope. The plugin does not operate Apollo's database directly.

## Contracts

- Plugin ID `io.github.caichangqing1120.apollo`, version `0.1.2`, Host API `1`.
- Connection fields: host, port, scheme (`http`/`https`), optional context path, username,
  password (`binding: secret`); password and cookies never enter UI context or storage.
- `connection/test`, `connection/connect`, `connection/disconnect` follow DBX SDK v1.
- Authenticate with `POST /signin`, form `username` and `password`; verify `GET /user`.
- `apollo/request`: `{connectionId, method, path, headers?, bodyBase64?}` returns
  `{status, headers, bodyBase64}`. Preserve actual HTTP status and response bytes.
- Sidecar routes only relative paths inside the configured Portal prefix. Reject absolute,
  scheme-relative, encoded traversal, backslash and fragment paths; reject external redirects.
- Cookies are per connection, in memory only. Failed reconnect must invalidate stale sessions.
- Never retry writes automatically. A 401/login redirect reports expired authentication.
- Respect DBX `read_only` on the server boundary; only GET/HEAD allowed, logout handled locally.
- Use system TLS trust; never disable TLS verification. Bounded timeout, body and response sizes.
- Independently implement DOM, CSS, router/state and API client. No remote Portal iframe,
  HTML/template injection, copied stylesheet or original AngularJS/Bootstrap runtime.
- The standard DBX sandbox iframe is the plugin container, not an embedded Apollo website.

## Acceptance

1. Correct credentials establish a session; wrong credentials and SSO redirects fail safely.
2. Two connections do not share cookies; disconnect invalidates the session; secrets absent
   from responses and errors. Context-path and redirected-response boundaries are tested.
3. Handwritten home, configuration and administrator pages render inside the actual SDK sandbox;
   internal links remain in the workbench; RPC performs API reads and writes.
4. Test configuration edit/publish/history/rollback and permission denial against a controlled
   server fixture. Explicitly distinguish fixture coverage from live Apollo acceptance.
5. Package with `dbx-plugin package .`; inspect package contents. No publishing or push.

## Current Coverage And Acceptance Boundary

The implementation now includes the original core route families and 21 advanced route
families: gray, sync, diff, access-keys, clusters, consumers, system-roles, system-info,
audit, audit-trace, global-search, transfer, delete, project, create-project, app-roles,
permissions-env, instances, release-diff, cluster-roles and namespace-create.

Configuration additionally includes source-accurate commit history (key filter/pagination,
ItemChangeSets old/new values), revocation with explicit local-draft warning, YAML syntax
checks, numeric ItemDTO type handling and browser-local timestamps. Gray/sync preserve
configuration types. Sidecar byte chunks keep 4 MiB HTTP transfers below the actual 2 MiB
Host JSON envelope limit; Host file saves use its fileTransfer API with an explicit old-Host
size boundary.

The requested 1:1 fidelity remains the acceptance target. Original static Portal reference
and independently authored home/configuration screens were compared at matching viewport
sizes. Full pixel and interaction parity across every original screen/modal is not yet
accepted. Controlled fixtures exercise source-inspected API contracts but are not a real
Apollo server. Live ordinary-auth/permission integration and native desktop save-file,
installation/restart/Secret Store acceptance require the corresponding environment.

Latest continuation (2026-10-19): all-environment authorization groups, independent searchable
user controls, 14 source-specific warning states and gray inheritance/branch-only override editing
are implemented. Lock modifiers use the real lock-info endpoint. Stale syntax/editor/rollback
responses, large-number formatting, guarded deletes and the footer/sidebar overlap have focused
regressions. Current evidence is in `../../parity-finish.md` and
`../../parity/finish-manifest.json`; earlier records remain historical baselines.

The full 1:1 gate remains **FAIL**: field proportions, labels/help, table/button/icon details,
preview/editor and conditional contexts are not all faithful equivalents. Dialog-interior
measurements do not imply full-page acceptance. These are developer-owned remaining items,
not validation transferred to the user. Live Portal and native desktop integration are separate.
