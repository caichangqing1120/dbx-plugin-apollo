# Apollo Portal Implementation Plan

> Execute inline with superpowers:executing-plans, task by task, using test-first changes.

**Goal:** Installable DBX plugin with independently authored Apollo 2.5.2 management pages and password authentication.
**Architecture:** Go SDK sidecar owns per-connection cookie jars and bounded same-Portal HTTP.
Handwritten DOM components, CSS, router/state and API client run in the DBX sandbox.
**Tech Stack:** Go 1.22+, standard net/http, vendored DBX Go SDK; Node 22+ native test runner;
Handwritten JavaScript/CSS and happy-dom tests; DBX plugin CLI and Playwright CLI.
**Spec:** ./spec.md

## Global Constraints

- Plugin `io.github.caichangqing1120.apollo` version `0.1.2`; ordinary form login only.
- Password/cookies stay in the sidecar, UI has no direct network or native access.
- No modified DBX host, no production operations, no commits/push/publish without authorization.
- New independent repository has no HEAD: linked worktree creation is unavailable until an
  initial commit; develop on `codex/apollo-admin-plugin`, isolated from existing repositories.

## Review Focus

- Prefix/path/redirect escapes cannot send authenticated requests to another origin or app.
- Failed login/reconnect/disconnect must not leave an old authenticated session usable.
- Sandbox opaque origins break storage, relative assets, navigation and file downloads.
- Replay, timeouts, permission errors and body limits must preserve failures without retrying writes.
- All new components must work without unsafe-eval or native form navigation in the SDK sandbox.

## Task 1: Authenticated Sidecar

Files: `backend/{main,portal,portal_test}.go`, `backend/sdk`, `manifest.json`, `dbx-plugin.toml`.
Consumes DBX lifecycle payload; produces `apollo/request` HTTP byte bridge.

- [x] Write tests using actual loopback HTTP servers for login, cookies, context paths,
      failure invalidation, malicious URLs/redirects, read-only mode and response limits.
- [x] Run `cd backend && go test ./...`; verify RED against missing implementation.
- [x] Implement isolated sessions, bounded requests, validation, sanitized failures, lifecycle.
- [x] Run `go test -race ./...` and `go vet ./...`; verify GREEN.

## Task 2: Handwritten Portal Frontend (User-Corrected Design)

Files: `src/{portal,client,i18n,views,app,runtime}.js`, `src/styles.css`, `scripts/build.mjs`,
`tests/{client,app}.test.mjs`, `ui/index.html`.
Consumes `apollo/request`; produces independently authored UI, no original Portal runtime.

- [x] Observe RED for missing client/app; implement real-DOM/event tests.
- [x] Implement native home/config/history/roles/user/parameter views and modal forms.
- [x] Trace API contracts against Java controllers; fix creation permission, effective role
      grants, ReleaseBO, properties serialization and stale route/write-target risks.
- [x] Test draft recovery/save locking, XSS escaping, denial, expiration and no retries.
- [x] Implement core and 21 advanced route families listed in spec; full parity is a separate gate.
- [ ] Verify full visual and interaction 1:1 parity, not merely similar layout.

## Task 3: Integration And Packaging

Files: `tests/fixture.mjs`, `scripts/smoke.mjs`, `README.md`, `docs/verification.md`.
Consumes plugin package and actual SDK dev host; produces reproducible verification evidence.

- [x] Exercise real JSON-RPC sidecar against fixture login/config/publish/history/rollback.
- [x] Open SDK sandbox in owned Playwright session; check representative pages, admin,
      Chinese/English, dark/light, desktop/narrow widths and error states. Close owned session.
- [x] Build package and inspect manifest/assets/executable; record exact pass/fail and gaps.
- [x] Review custom code; fix important findings test-first; leave uncommitted for user.

## Self-Review

All spec sections map to the three tasks. Live Apollo acceptance requires an actual server
and credentials and is not inferred from the controlled fixture. Native UI implementation does not prove every administrator operation. Full 1:1 acceptance remains
unverified; record the actual exercised operation matrix.

## Continuation: Complete Remaining Native Workflows

User explicitly authorized completing the remaining work on 2026-10-19. Continue inline;
do not repeat requirement approval. The existing new repository is still unborn and isolated
on `codex/apollo-admin-plugin`; creating a linked worktree would require an unauthorized commit.

### Task 4: Source-Accurate Advanced Client And File Bridge

Files: `src/client.js`, `src/transfer.js`, `backend/main.go`, client/transfer/backend tests.
- [x] RED: literal path/body tests for gray publish/merge, NamespaceSyncModel preview/apply,
  access keys, cluster deletion, consumer roles, system roles/info, audit and global search.
- [x] Implement actual Portal controller contracts, including NamespaceBO.baseInfo for branches,
  actual SearchResponseEntity.body and typed BO history. No guessed endpoint aliases.
- [x] Implement byte-preserving multipart upload and native Host save-file downloads, preserve
  4 MiB bounded transport, never persist file content or generated secrets in UI state.
- [x] Consumer authorization uses a token-redacted RPC boundary so the token is not in RPC paths.
- [x] Run new tests and all existing suites; no write replay or relaxed TLS/read-only rules.

### Task 5: Native Advanced Configuration Pages

Files: `src/advanced.js`, `src/advanced-views.js`, existing app/views/i18n/styles and tests.
- [x] RED -> GREEN: gray branch config editing/publish/rules/merge/cleanup, parent and branch
  target separation, modify/release permission gates and hidden configuration handling.
- [x] RED -> GREEN: multi-environment/cluster sync/clone preview and apply, invalidate preview
  on selection changes; standalone comparison, import/export and selected-version rollback.
- [x] RED -> GREEN: cluster list/delete, access-key create/enable/disable/delete, env-scoped
  role management, project administration/favorites, guarded app/namespace/cluster deletion.

### Task 6: Remaining Native Administration Pages

- [x] RED -> GREEN: consumer registration/token and authorization, system roles, config-db
  parameters, system service health, audit list/search/trace and global key/value search.
- [x] All actions use real clients, validation/confirmation, disabled/read-only/error/empty
  states and Chinese/English labels. No success-only placeholder dialogs or mocked UI data.

### Task 7: Whole-Change Verification

- [x] Extend the controlled fixture and real sidecar smoke for the new workflows.
- [x] Run complete JS/Go suites; independent final code review and regression fixes.
- [x] Complete representative browser evidence matrix and close owned contexts/services;
  do not label unexercised advanced controls browser-verified.
- [ ] Full original-screen pixel/interaction parity and live/native desktop acceptance.
- [x] Build and inspect a fresh unsigned candidate. Update feature and verification matrices;
  distinguish implemented/tested/real-Apollo-unverified, never claim pixel parity from tests.

## Task 8: Developer-Owned Full Parity Audit (2026-10-19)

- [x] Enumerate all original management-page entries, dialog declarations and scope exclusions.
- [x] Capture 24 reference/native management-page pairs plus normal modal/subview states.
- [x] Review all 31 dialog declarations; explicitly distinguish rendered evidence from
  source-only missing warning flows. Do not count warning flows as browser-triggered.
- [x] Independently fail the parity gate despite passing component/sidecar tests; write
  docs/parity-audit.md and docs/parity/manifest.json plus a self-contained visual report.
- [ ] Rectify every failed page/dialog and missing original workflow in the manifest.
- [ ] Re-run per-entry visual/behavior checks before changing FAIL to PASS.

Previous checked implementation tasks indicate route/API existence, not complete original
workflow equivalence. Task 8 is the pre-repair baseline. Task 9 restores Master assignment,
release/rollback previews and typed/empty-value editing; the old FAIL record is preserved,
and a separate current repair census continues to gate the still incomplete full 1:1 target.

## Task 9: Apply The Confirmed Parity Corrections

User explicitly requested fixing the audited failures; implement inline in the existing
isolated unborn repository, without another approval/menu or remote operations.

- [x] Restore empty/typed item behavior, immutable update keys and cross-cluster creation.
- [x] Restore publication/rollback change previews, two-stage confirmation, namespace locks
  and gray full-merge parent-draft guard, rechecking immediately before a write.
- [x] Restore configuration subviews/gray integration, sorting/filters/text tools/details.
- [ ] Restore source-defined advanced/admin page structures and the missing Master-assignment,
  query-before-delete, multi-environment keys/cluster and in-page user/parameter workflows.
- [ ] Add source-correct contracts and regression tests, then browser-check every affected
  page/modal against the original and update entries only with matching current evidence.
- [ ] Fresh whole-change review, suites/smoke/package inspection, no commits/push/publication.

Repair progress: all seven scoped review defects are fixed, plus gray-rule controls, real
history compare/pagination/hidden-value protection and usage acknowledgement. Current page
census covers all 24 original entries and 54 native normal states with no UI errors. The
remaining unchecked rows intentionally include actual source grouping/layout and dedicated
warning-flow mismatches; do not close them merely because tests or browser smoke pass.

## Task 10: Close The Remaining Native Parity Gaps

User explicitly requested continuing the unfinished entries. Reuse the current isolated
unborn repo and existing approval. No re-claim, commit, push, publication or live mutations.

- [x] Render all environment grant groups simultaneously and retain exact row/action scopes.
- [ ] Match original compact cluster rows, horizontal forms, user controls, Namespace options,
  sync default targets/source row and common page/dialog geometry.
- [x] Restore dedicated source warning/confirmation flows (gray creation, permission/lock,
  gray rules/publish, merge denial, syntax failure and resource deletion contexts).
- [x] RED/GREEN regression coverage, fresh per-entry browser comparison including warnings;
  update evidence by entry, never label blanket PASS from test counts.
- [x] Fresh focused review, full suites/smoke, package inspection and owned-browser cleanup.

Task 10 measured continuation: role groups, native user controls, dedicated warnings, real lock
modifiers, gray inherited rows/branch-only overrides, guarded deletion and stale-response fixes
are implemented. 161 JS regressions pass. Current original/native census is retained in
`../../parity/finish-manifest.json`; full 1:1 remains unchecked. Matching dialog interiors and
common page frames do not close the remaining per-page form/preview/context differences.

## Task 11: Authorized Preview Packaging And Store Submission

User explicitly requested complete packages, source push and DBX marketplace submission.
This authorizes a disclosed Preview, not changing the failed 1:1 gate to PASS. The new
repository baseline is committed locally so release changes can use a separate worktree;
the unrelated DBX core checkout is untouched. Native worktree tooling is rooted to that
different DBX repository, so secondary plugin/store repositories use git worktree fallback.

- [x] Replace the nonexistent reusable workflow reference with standalone release CI.
- [x] Test explicit five-target builds, actual CPU headers, full package checksums, source/UI
  identity, immutable release metadata and native packaged-sidecar smoke flows.
- [x] Audit source/secrets/licenses, then push the plugin's public source and immutable
  v0.1.2 tag to caichangqing1120/dbx-plugin-apollo; publish an honest unsigned Preview.
- [x] Download and verify all published bytes and submit only a candidate JSON in one PR
  to t8y2/dbx-store:main. Official signing/merge remain maintainer-owned gates.
- [x] Preserve the issue's OPEN state and failed parity/live/native acceptance boundaries;
  leave no task-owned browser or fixture server. Display-only shutdown is execution
  housekeeping, never a system-sleep/shutdown request.

Author delivery is recorded in `../../delivery-0.1.2.json`: source/tag/CI-built Preview
assets are published and re-downloaded, candidate PR #295 is open. Official signing and
merge remain pending; this completes author-side submission only, not full parity or listing.
