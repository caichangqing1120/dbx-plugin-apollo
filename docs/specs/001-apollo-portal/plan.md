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

## Task 12: Non-Blocking Marketplace Review Follow-Up

User supplied the maintainer's 2026-10-20 feedback. Reuse the clean isolated plugin worktree;
preserve the official signing bot's commits and all published 0.1.2 bytes.

- [x] Verify official signing completed and inspect the distinct-plugin naming conflict.
- [x] Rename next-version display identity to Apollo Portal Console / Apollo Portal 控制台.
- [x] Prepare development version 0.1.3-rc.1 and test that package metadata preserves its
  suffix; require a valid prerelease SemVer for Preview packages and workflow publication.
- [x] Validate complete packages/native identity and regression suites (161 JS, 14 package
  regressions, 14 Go race tests plus vet; both packaged macOS smoke flows pass).

Delivery is source-only plus a reply on PR #295. Do not publish another version or edit
the signed catalog; preserve the officially merged 0.1.2 entry and all immutable artifacts.

Current versus next-version boundaries are in `../../review-follow-up-2026-10-20.md`.

## Task 13: Continue Measured Form And Workflow Repairs

User explicitly requested continuing the remaining issues and updating README after fixes.
The source automation registration is separate (#298); this iteration still uses manual
release submission. Preserve 0.1.2 source tags/assets and the failed full acceptance gate.

- [x] Reproduce four shared form-grid mismatches against the pinned original; add control
  geometry regression, actual form-data/static-ID/copy checks and independent grid helpers.
- [x] Restore source format order, Namespace department-prefix display/draft/focus behavior,
  and the in-page cluster-created flow with a late-response route guard, test-first.
- [x] Verify both declared Portal cluster endpoints and the original frontend's OpenAPI
  controller path; add only the explicit missing reference-fixture route, not a wildcard.
- [x] Recheck form/conditional/success states and existing warnings across real SDK/original
  browser surfaces, including representative locale/theme/viewport contexts.
- [x] Complete fresh suites, smoke/package proof and one scoped independent final review;
  update README/current evidence with actual pass/fail and remaining developer-owned gaps.

Files: `src/reference-fields.js`, affected page/picker/style/action modules, new regression
tests and `scripts/parity/verify-{form-grid,creation-flows}.js`. The normal form-control
geometry gate is 0.1px, independently of whole-page/pixel/conditional-state acceptance.

Task 13 increment is verified at product commit `6b2bdd3`: 176 JS, 14 packaging regressions,
14 Go race tests plus vet; all five local packages and both packaged macOS smoke flows pass.
Current browser records cover 16 normal controls, seven creation/prefix cases, four keyboard
safety cases, five language/theme/narrow cases, three sidebar widths and 14 paired warning
interiors. The 63-section report decodes all 113 embedded images with no broken images.
Independent final review of `2bb1572..6b2bdd3` found no actionable correctness, regression or
security issues. These scoped results do not close Task 7/8/9/10 full-parity or live gates.

## Task 14: Authorized Manual RC Delivery

The user's existing release authorization is unchanged: add source automation registration,
but use a manually initiated release and candidate submission for this validation iteration.
Preserve the signed 0.1.2 catalog, tag and bytes; do not alter signing or discovery policy.

- [x] Push the reviewed repair source and README to the author's main branch, then create
  an immutable `v0.1.3-rc.1` tag and GitHub Prerelease with CI-built assets only.
- [x] Download every published target, verify exact hashes/size/content/native identities,
  and run downloaded macOS packaged-sidecar handshake and full loopback smoke.
- [x] Submit one candidate-only Store PR from the latest official main, leaving protected
  signing and merge to maintainers; keep automation PR #298 separate.
- [x] Update README and the versioned delivery receipt with actual release/submission state;
  close only task-owned browser/services and retain unfinished parity work/evidence.

Author RC delivery: source tag `v0.1.3-rc.1` is immutable at `727c0a6`; source CI run
`39375019013` passed. All five downloaded candidates match their local/CI bytes; both
downloaded macOS sidecars pass full loopback smoke, and CI passed packaged Linux x64 smoke.
Store PR #304 changes only the candidate JSON and is pending maintainer review/signing.
Its red validation is the confirmed unsigned-candidate signing gate. Automation PR #298
remains separate and pending merge. Exact receipts are in `../../delivery-0.1.3-rc.1.json`.
The owned browser/session and three loopback services are closed. No parity/live/native
acceptance gate was promoted; the active unfinished plan and evidence remain preserved.

## Task 15: Real Local Apollo And Native DBX Validation

User requested an actual local Apollo backend and native DBX validation, explicitly
confirmed installation of the reviewed unsigned RC, and later confirmed the specific
local v2-to-v1 rollback. This is focused validation, not another package/Store release.

- [x] Build pinned upstream Apollo 2.5.2 Assembly with official H2 file schemas and ordinary
  authentication; bind all three real services to loopback only, not the controlled fixture.
- [x] Install the exact published macOS ARM64 RC in DBX 0.6.49 with user confirmation;
  preserve existing business connections and the already enabled development trust setting.
- [x] Exercise native login/create/edit/publish/rollback, closed-combobox/selector Enter,
  Cancel Enter, cluster success and public Namespace prefix/draft flows with real readbacks.
- [x] Restart the real backend with existing H2 files and reconnect the saved native DBX
  connection without retyping its password; keep only the requested test service running.
- [x] Record 15 scoped scenarios and update local README/evidence with current boundaries.

Results are in `../../live-apollo-validation-2026-10-20.md` and its JSON record. All 15
focused cases pass; open finding NATIVE-UX-01 is the persistent success notice without an
auto-dismiss timer, not a stalled backend. It is recorded but not repaired in this validation
task. All-page/all-state 1:1 remains FAIL; MySQL/production, native cold-start/file-transfer,
multi-account permission matrices and other native advanced flows remain unverified.
No product bytes, immutable tags/assets, Store candidates or production data changed.

## Task 16: Success Notice Lifecycle Repair

User explicitly requested implementing the remaining gaps and automatically closing success
notices. Reuse the isolated worktree and retain Task 15's original RC evidence as historical.

- [x] RED/GREEN: success disappears after the original 5000ms delay, a later success gets
  its own interval, and harmless rerenders do not indefinitely extend an existing notice.
- [x] Remove stale success on a new operation/dialog/navigation; preserve important errors,
  unrelated form nodes, in-memory drafts, focus and selection when the timer expires.
- [x] Route core/advanced/reference successes through one lifecycle and cancel owned timers
  on disposal; cover expiry, replacement, dialog entry, error and disposed-view regression.
- [x] Run `npm test`; Expected: all JS and packaging regressions pass, including the new
  behavior tests. Update local evidence/README without rewriting the published RC bytes.

## Task 17: Continue Source-Measured Shared And Management Layouts

- [x] Compare the remaining shared navigation/search, core configuration table and compact
  cluster-management structures against pinned Apollo 2.5.2 before choosing layout changes.
- [x] Implement the measured deltas with regression tests; preserve API paths, roles,
  read-only state and all explicit write targets. Do not import original HTML/CSS/runtime.
- [x] Browser-check affected pages and representative contexts against the real loopback
  Apollo, keeping selected geometry and full-page/all-state acceptance separate.
- [x] Verify the final local candidate in native DBX after required install consent.
- [x] Run complete suites/smoke/package proof and one fresh scoped final review; fix both
  reviewed Key-search findings with RED/GREEN regression and a green full suite.
- [x] Finish current per-entry evidence and README with the native result or explicit pending
  installation boundary. Unverified entries never become blanket PASS.

Pre-flight: notice expiry must not call the full render function while an editor is active;
shared layout fixes must not alter permission/namespace/action datasets. New local packaging
needs a new prerelease identity so no published 0.1.3-rc.1 artifact/evidence is overwritten.

## Task 18: Authorized RC2 Verification And Manual Preview Delivery

User explicitly requested verification and one new release after the exact RC2 installation
confirmation request. Preserve the full 1:1 FAIL and all prior immutable source/assets.

- [x] Install the verified ARM64 RC2 in native DBX with confirmation, closing only the local
  test connection required by Host upgrade protection; preserve trust and saved credentials.
- [x] Verify success dismissal, focus/cursor retention, next-dialog cleanup, submitted-editor
  closure, folded/text Key navigation, unrelated state, cluster page and ordinary app search.
- [x] Record actual native proof and independent unchanged draft/published HTTP readbacks;
  rerun full JS/Python/Go race/vet before source delivery.
- [x] Commit/push the reviewed RC2 product/docs to author main; create the immutable
  `v0.1.3-rc.2` tag and manually trigger the existing CI unsigned Preview release workflow.
- [x] Download all five CI-published targets, verify exact source/UI/native/checksum metadata,
  and execute both downloaded macOS sidecars' initialize/full controlled smoke.
- [x] Update the existing candidate-only Store PR #304 to the verified RC2 rather than open
  a competing candidate for the same plugin. Keep automation PR #298/signing policy separate.
- [x] Update README/release notes/delivery receipt with actual results; preserve real Apollo
  and native DBX, and close any task-owned validation/browser services.

RC2 author delivery: immutable source `8319a49`, manually dispatched source CI `39401872416`
passes; all five published packages and 14 total assets are downloaded/verified. Exact local /
CI / published ARM64 bytes match the installed native test package. Downloaded macOS ARM64 /
x64 and CI packaged Linux x64 sidecar smoke pass. The 11-section / 16-image report decodes
fully and downloads byte-for-byte. Store PR #304 is updated candidate-only at `58a17f3`;
its CI red result is confirmed as the documented pending-signing guard. Review/signing/merge
remain maintainer-owned; automation PR #298 is untouched. The full 1:1 gate still FAILS.
See `../../delivery-0.1.3-rc.2.json` for exact provenance and separate acceptance boundaries.
