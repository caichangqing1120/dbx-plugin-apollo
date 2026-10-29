# apollo MCP Upgrade Implementation Plan

> Execute with the foundation handoff and Superpowers TDD. Keep all edits inside this isolated worktree; no commits, pushes or releases are implicit.

**Goal:** Expose all current service capabilities safely to the updated DBX MCP host and upgrade to 0.2.0.
**Architecture:** A dedicated `backend/mcp.go` tool registry and adapter calls existing service handlers, preserving their guards. The manifest declares the exact registry and maximum tool access. The UI and service API contracts are unchanged.
**Tech Stack:** Go sidecar; existing plugin-specific frontend and packaging tools.
**Spec:** `spec.md` in this package (user-request scope and existing upstream protocol).

## Global Constraints

All requirements in Spec apply. No remote writes, installation, restarts, grant mutations or credential use. Version 0.2.0; ID/publisher unchanged; manifest has at most 64 tool declarations. Keep detached HEAD and evidence.

## Review Focus

- A model selects a read-labelled wrapper then smuggles a mutation or alternate method/path.
- A stale writable session is reused for a current readonly lifecycle or a different connection identity.
- A sidecar starts during discovery and unexpectedly logs in or creates workloads.
- A generic form/body hides credentials or authorization-affecting values.
- Version bumps or packaging leave initialize metadata inconsistent with the shipped manifest.

## Task 1: Inventory And Bridge (backend/mcp.go, backend/mcp_test.go, backend/main.go)

- [x] Read existing dispatch tables, safety checks, tests and this Spec; record the full exact tool-name/method/access inventory here before implementation.
- [x] Run existing `go test ./...` in backend and applicable frontend baseline. Record unavailable dependencies/failures.
- [x] Write failing behavior tests exercising real dispatch through local HTTP fixtures, identity, readonly, confirmation, error envelopes, discovery parity and zero discovery effects. Run `go test ./...` and confirm expected missing-bridge failures.
- [x] Implement `mcp/tools` / `mcp/call` in backend/mcp.go and wire Handle in backend/main.go. Reuse existing APIs and guards; no arbitrary RPC forwarding. Include explicit portable parameter schemas. Record any existing capability that cannot safely be exposed.
- [x] Run focused tests, then `go test ./...`, `go test -race ./...`, and `go vet ./...`. Expected: all pass.

## Task 2: Declarations, Version And Delivery Evidence (manifest.json, active build metadata, README.md)

- [x] Test exact tool-name parity and max-access mapping between discovery and manifest; then add the mcp contribution and meaningful toolsets.
- [x] Bump active version metadata to 0.2.0 without rewriting historical evidence. Extend README with access levels and user enablement instructions.
- [x] Run the applicable complete frontend tests/build and existing package checks. Verify packaged manifest and sidecar initialize metadata agree.
- [x] Record commands, results, full inventory, limitations and risks in validation.md in this package. Mark completed steps in this plan. Keep the uncommitted diff for review.

## Confirmed Apollo Inventory (Before Implementation)

Five MCP tools preserve service API capability while keeping connection and chunk-transfer lifecycle private:

| Tool | Access | Exact backend dispatch |
| --- | --- | --- |
| `apollo_read` | read | Allowlisted GET/POST read-only service endpoints below, via `portalSession.request` |
| `apollo_write` | write | Allowlisted ordinary POST/PUT endpoints below, via `portalSession.request` |
| `apollo_admin` | full | Allowlisted destructive/bulk/admin endpoints below, two-phase prepare/confirm, via `portalSession.request` |
| `apollo_authorize_consumer` | full | Two-phase prepare/confirm; GET `/consumer-tokens/by-appId?appId=...` internally, then existing POST `/consumers/{token}/assign-role?type=...&envs=...`; token never accepted/returned |
| `apollo_session` | read | Return host lifecycle read-only metadata; no credential or endpoint output |

Parameters `{app}`, `{env}`, `{cluster}`, `{namespace}`, `{id}`, `{role}`, `{user}` are single escaped path segments. `N` means `/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}`. Queries are limited to the explicitly listed names; no arbitrary URL/RPC passthrough.

### Read Endpoint Inventory

- GET `/user`, `/permissions/root`, `/system/role/createApplication/{user}`, `/envs`, `/system/role/createApplication`, `/system-info`, `/system-info/health` (`instanceId`), `/openapi/v1/organizations`.
- GET `/apps/by-self` (`page,size`), `/apps/search/by-appid-or-name` (`query,page,size`), `/favorites` (`userId,appId,page,size`), `/appnamespaces/public` (`page,size`), `/apps/{app}`, `/apps/{app}/navtree`, `/apps/{app}/permissions/{role}`, `/apps/{app}/role_users`, `/apps/{app}/appnamespaces/{namespace}`, `/apps/{app}/namespaces/publish_info`.
- GET `/apps/{app}/namespaces/{namespace}/permissions/{role}`, `/apps/{app}/envs/{env}/namespaces/{namespace}/permissions/{role}`, `/apps/{app}/envs/{env}/clusters/{cluster}/ns_permissions/{role}`; corresponding namespace `/role_users`, environment namespace `/role_users`, cluster `/ns_role_users`.
- GET `/apps/{app}/envs/{env}/clusters/{cluster}`, `/apps/{app}/envs/{env}/clusters/{cluster}/namespaces`, `N`, `N/items`, `N/commits` (`key,page,size`), `N/releases/histories`, `N/releases/all`, `N/releases/active` (all three `page,size`), `N/branches`, `N/branches/{id}/rules`, `N/lock-info`.
- GET `/envs/{env}/releases/{id}`, `/envs/{env}/releases/compare` (`baseReleaseId,toCompareReleaseId`), `/envs/{env}/instances/by-namespace` (`appId,clusterName,namespaceName,instanceAppId,page,size`).
- GET `/server/portal-db/config/find-all-config`, `/server/envs/{env}/config-db/config/find-all-config`, `/apps/{app}/envs/{env}/accesskeys`, `/consumers` (`page,size`), `/consumer-tokens/by-appId` (`appId`, output token redacted).
- GET `/apps/{app}/namespaces/{namespace}/usage`, `/apps/{app}/envs/{env}/clusters/{cluster}/linked-namespaces/{namespace}/usage`.
- GET `/apollo/audit/logs` (`page,size`), `/apollo/audit/logs/by-name-or-type-or-operator` (`query,page,size`), `/apollo/audit/logs/opName` (`opName,page,size,startDate,endDate`), `/apollo/audit/properties`, `/apollo/audit/trace` (`traceId`), `/apollo/audit/logs/dataInfluences/field` (`entityName,entityId,fieldName,page,size`), `/global-search/item-info/by-key-or-value` (`key,value`).
- GET `N/items/export`, `/apps/{app}/envs/{env}/clusters/{cluster}/export`, `/configs/export` (`envs`): MCP redacted preview/metadata only, not full-fidelity backup bytes.
- POST `N/syntax-check`, `/namespaces/{namespace}/diff`: side-effect-free service computations; existing session's read-only non-GET gate still applies.

### Ordinary Write Endpoint Inventory

- POST `/favorites`; POST/PUT `N/item`; POST `/apps/{app}/envs/{env}/clusters`; POST `/apps/{app}/appnamespaces` (`appendNamespacePrefix`); POST `N/branches`.

### Full Endpoint Inventory

- DELETE `/favorites/{id}`, `N/items/{id}`, `N/branches/{id}`, `/apps/{app}`, `/apps/{app}/appnamespaces/{namespace}`, `/apps/{app}/envs/{env}/clusters/{cluster}`, `/apps/{app}/envs/{env}/clusters/{cluster}/linked-namespaces/{namespace}`.
- POST `/apps`; PUT `/apps/{app}`, `N/items`, `N/revoke-items`, `N/branches/{id}/rules`, `/apps/{app}/namespaces/{namespace}/items`; POST `N/releases`, `N/branches/{id}/releases`, `N/branches/{id}/merge` (`deleteBranch`); PUT `/envs/{env}/releases/{id}/rollback` (`toReleaseId`).
- POST `/users` (`isCreate`), PUT `/users/enabled`; POST `/server/portal-db/config`, `/server/envs/{env}/config-db/config`.
- POST `/apps/{app}/envs/{env}/accesskeys`; PUT `/apps/{app}/envs/{env}/accesskeys/{id}/enable` (`mode`), `/apps/{app}/envs/{env}/accesskeys/{id}/disable`; DELETE `/apps/{app}/envs/{env}/accesskeys/{id}`.
- POST `/consumers` (`expires`); DELETE `/consumers/by-appId` (`appId`). Consumer grant uses its dedicated full tool, never a token-bearing generic path.
- POST/DELETE `/system/role/createApplication` (DELETE uses `/{user}`), `/apps/{app}/system/master/{user}`, `/apps/{app}/roles/Master`, `/apps/{app}/namespaces/{namespace}/roles/{role}`, `/apps/{app}/envs/{env}/namespaces/{namespace}/roles/{role}`, `/apps/{app}/envs/{env}/clusters/{cluster}/ns_roles/{role}` (DELETE role paths accept `user`).
- POST `/apps/{app}/initPermission`, `/apps/{app}/envs/{env}/clusters/{cluster}/initNsPermission`, `/apps/{app}/namespaces`.
- POST `N/items/import`, `/apps/{app}/envs/{env}/clusters/{cluster}/import` (`conflictAction`), `/configs/import` (`envs,conflictAction`). Whole bounded multipart request replaces internal chunk handles for MCP; existing UI transport stays unchanged.

### Confirmed Security Clarifications

Parent relayed user scope: model arguments cannot override connection authentication/endpoint/routing. New user provisioning passwords remain business input only on full-access admin tools, behind confirmation, and never appear in results. Existing managed secrets are never returned. Raw secret-bearing/uninspectable binary exports are excluded from MCP output; UI export/reveal behavior is unchanged. Full operations use two-phase tokens bound to the lifecycle identity and exact request; prepare performs no service network work. Each call uses a temporary lifecycle-authenticated session, never overwrites/disconnects cached UI sessions, and cannot inherit cached writable permissions.

### Baseline

- `cd backend && go test ./...`: PASS (0.778s).
- `npm ci --ignore-scripts`: PASS; existing `happy-dom` high advisory GHSA-834v-8h66-3h79 reported (dev-only; not upgraded in this feature).
- `npm test`: PASS, 207 Node tests + 28 Python release tests. Release/publish tests use local mocks/temp fixtures, no remote publication.

## Execution Ledger

- Pre-flight: manifest declarations consume the exact names/access classifications from the discovery registry; version metadata, initialize and package validators share 0.2.0. No conflicting interfaces found.
- Initial RED: all seven initial MCP tests fail with `-32601 Method not found: mcp/tools` / `mcp/call`; old Go tests still pass. Manifest parity remains RED until declarations exist.
- Release RED: the local candidate generator test fails because `mcpTools` is absent; fixed only in active generators/metadata, not historical receipts.
- Additional observed RED/GREEN: missing action/target in confirmation summary; missing `N/items` read endpoint found in existing smoke; secret-bearing text configuration/API-key/dynamic map-key leaks; cross-tool/null schema fields accepted; HTTP-200 Apollo/partial-environment failure envelopes appearing successful. Each test was observed failing before the corresponding production change and the final complete suite is green.
- Parent-confirmed boundary: do not recreate UI modals or preflight workflows. Retain backend guards and exact method/path/body confirmation; UI-only contextual previews/rechecks are explicitly not replayed.
- Final inventory: five tools (two read, one write, two full); 109 finite method/path contracts (58 read, six write, 45 full), plus dedicated consumer lookup/grant and lifecycle metadata. 107 table-driven endpoint dispatch examples plus explicit `/user`, consumer and session tests cover the surface.
- Validation and retained limitations: see `validation.md`. No commits, push, publication, installation, restart, access grants or real credentials were used.

## Approved 0.2.1 Patch Execution (2026-10-29)

This reuses `spec.md`'s approved patch scope; it does not repeat the completed
MCP implementation or introduce another work package.

- [x] Run clean-source baseline: Go tests, 207 Node tests and 28 release tests. Install only existing npm dependencies when absent.
- [x] Add regression executing the actual current Store importer with generated five-target fixtures and a closed fetch map. Observe RED for unsupported `mcpTools` Store metadata and stale active versions; preserve the expected legacy rejection case.
- [x] Remove the unsupported Store metadata key, align active manifest/backend/npm versions to `0.2.1`, and update active source/notes references. Keep manifest tools/access and the existing manifest-driven release generator unchanged.
- [x] Re-run complete Go normal/race/vet, 207 Node tests, 31 release tests, UI build and controlled packaged-sidecar smoke. Explicitly use ARM64 for native Go checks; verify actual executable headers rather than target labels.
- [x] Build all five targets serially with `scripts/release.py`; verify complete schemas, exact package hashes/checksums, ARM64 initialize and actual Store import/validation in disposable fixtures.
- [x] Add truthful patch notes and `patch-validation-0.2.1.md`; leave historical receipts and all remote actions to the coordinating delivery step.

Patch ledger: the actual importer rejects the old metadata with
`Unsupported store metadata field 'mcpTools'`; the same generated `0.2.1`
fixture succeeds after the source metadata fix. The release generator already
reads active manifest/package versions and therefore needs no hardcoded version
or shape change. The complete manifest is byte-equivalent after normalizing only
its version. Detailed commands, evidence and remaining gates are recorded in
`patch-validation-0.2.1.md`.
