# Local RC2 Continuation Verification

Date: 2026-10-20. Version: **0.1.3-rc.2**. The repair phase initially produced local
unsigned candidates only. The user subsequently authorized verification and one manual
Preview release; publication/signing status is recorded separately from these checks.

**The full 24-page / 31-dialog / all-state 1:1 gate remains FAIL.** This report records
completed scoped repairs, not a replacement acceptance census. The immutable published
RC1 and signed 0.1.2 bytes are unchanged. The [machine record](continuation-validation-2026-10-20-rc2.json)
contains exact current result extracts, source/UI/package identities and evidence hashes.

## Environment And Boundaries

- Reference: upstream Apollo 2.5.2, commit `ed9785c87b390c22efece9ea7ec7eeab2d20a042`.
- Browser checks use its actual Assembly with ordinary authentication and persistent H2
  files, on loopback Portal 8070 / ConfigService 8080 / AdminService 8090. They do not use
  the controlled HTTP fixture. The original Portal and the plugin's real SDK sandbox are
  separate pages; both comparison viewports are 1304 x 876.
- The plugin still independently authors its DOM, CSS, router/state, API client and backend.
  Original HTML/templates, Bootstrap styles and AngularJS runtime are not packaged. The
  selected original PNG assets retain the existing Apache-2.0 attribution.
- All real-browser mutations in this continuation are favorite toggles on the dedicated
  `DBXNative20261020` local test application. No configuration item, release, permission,
  existing business connection or production data is modified by these checks.
- The exact ARM64 RC2 is now installed in DBX 0.6.49 with user confirmation. Ten focused
  native cases pass in [the separate native record](native-rc2-validation-2026-10-20.md).
  The SDK measurements in this document remain SDK measurements, not native geometry.

## Success Feedback And Dialogs

The historical [native RC1 report](live-apollo-validation-2026-10-20.md) correctly records
`NATIVE-UX-01`: old success feedback remained beneath later dialogs. It was not a stalled
backend. That historical record is preserved rather than rewritten as fixed RC1 evidence.

The local RC2 repair centralizes every core, advanced and reference success producer:

- Success feedback expires after the original 5000ms interval without clicking X.
- Another success starts its own interval. Locale rerenders do not extend an old interval.
- A new action, dialog or navigation clears stale success. Important error notices remain.
- Expiry removes only its owned notice node; it never rerenders the editor or discards a
  live draft, selection or focus. Disposal cancels the old view's owned timer.
- A successful submitted mutation closes its dialog. Rollback still requires the preview
  and separate confirmation; a stale success message cannot authorize or skip either step.

Ten lifecycle regressions pass, including successful save/rollback dialog closure. The
initial nine timer/lifecycle cases were watched fail 8/9 before implementation and pass
afterward; the rollback case additionally characterizes the already-correct confirmation
closure. No unnecessary real rollback is repeated during this continuation.

The final real-Apollo SDK capture observes auto-dismiss after about 5.4 seconds including
browser polling/measurement overhead. The same input node remains connected and focused,
with value `native` and selection 5/5. Opening the next configuration dialog clears stale
feedback immediately. Exact observations are in `browser.notice` of the machine record.

## Search And Navigation

The header now has an independently authored source-style combobox/dropdown rather than
submitting a query that replaces the application table. Its API remains literal:

`GET /apps/search/by-appid-or-name?query=...&page=...&size=20`

It debounces 400ms, supports paged results and keyboard selection, dismisses with Escape /
Tab / outside click, rejects stale responses and malformed targets, and keeps authentication
failures visible. Updating results does not recreate an unrelated unsaved form. The existing
unsaved configuration-draft navigation guard still applies.

Key matches preserve the full Key, including `+`, and the exact environment / cluster /
Namespace encoded by the real Portal. Their composite identity prevents distinct same-app
matches from collapsing into one. Selecting a Key result expands only that target and
selects its filtered table view; another Namespace's collapse/view state is retained.

A fresh independent scoped review found two P2 correctness issues. Both were accepted and
fixed in one pass, with four new cases watched RED (10 pass / 4 fail), then GREEN (14 pass):

| Finding | Root Cause | Verified Repair |
| --- | --- | --- |
| Retained folded/text target hides Key match | Filter alone did not normalize presentation | Target expands into filtered table; unrelated state remains |
| Multi-environment pagination ends early | Merged content length was compared with per-environment size | Use page cursor and maximum total / size; raw-length fallback when total is absent |

The aggregation regression uses the actual controller/DTO structure: two environments with
30 results each produce 40 rows on page 0 with `size=20,total=30`, then 20 more rows on page 1.
All 60 distinct matches are reachable and no extra page is offered. A separate missing-total
case verifies oversized-page fallback and cross-page duplicate removal. This aggregation
case is a focused unit fixture, not a claim that the single-environment local backend has
been reconfigured into a multi-environment production deployment.

Two actual local-Apollo Key-search cases pass after folding the target and after selecting
text mode. Normal app autocomplete, Escape and Enter navigation also pass. Administrator
and ordinary-user Tools entry/order/labels plus logout grouping have source-backed unit
coverage; no real multi-account permission-matrix acceptance is implied.

## Measured UI Repairs

| Area | Current Evidence | Boundary |
| --- | --- | --- |
| Header autocomplete | Four selection/dropdown/input/result boxes match within 0.016px | Not all loading/error/long-result pixel states |
| Compact cluster management | Environment groups, source copy, 53px rows, assignment icon; selected boxes within 0.016px | Row corner/shadow details and full-page pixels still differ |
| Configuration table | Eight source-width columns, preview limit 250, change badges and 23px image actions; 19 measured boxes have equal sizes | Shared vertical offset is 1.125px; not full table/page PASS |
| Empty/deleted configuration | Empty table retains headers with no invented placeholder; deleted rows have no edit/delete actions | Other never-published/gray/conditional contexts remain incomplete |
| Draft/context safety | Seven actual SDK cases pass: draft retention on search/locale, dark Host/light Portal, 390px narrow, three admin routes | Representative contexts only |

The seven context cases cover application creation, user management, server parameters and
system roles. Selected geometry is not whole-page acceptance. Screenshot inspection still
shows differences in configuration toolbar/sidebar/icons/badges, source never-published
hints and instance counters. Other administration tables/forms, preview/editor and
conditional/delete contexts retain their failed or unverified census status.

Browser harness corrections are not product workarounds: rebuilds require reloading the
whole SDK shell/reopening its connection, and same-window tab sizing can leave `outerWidth`
smaller than `innerWidth`, dropping right-side clicks. The owned harness now forces a real
viewport transition before interactions and captures the iframe viewport rather than an
over-height body. It does not inject original-controller state or force hidden controls.

## Tests, Packages And Review

- `npm test`: **207 JS / 0 failures**, **14 Python packaging / 0 failures**.
- `go test -race -count=1 ./...` and `go vet ./...`: **14 Go tests pass; vet passes**.
- `npm run test:smoke`: full controlled HTTP fixture plus real Go sidecar pass. This
  fixture remains distinct from the real-Apollo browser environment.
- `npm run package:all`: Darwin ARM64/x64, Windows x64 and Linux x64/ARM64 pass archive,
  checksum, actual CPU header, manifest and current source/UI equality checks. Each
  candidate has **26 archive entries / 25 checksum entries**.
- Both actual packaged macOS sidecars pass initialize as `0.1.3-rc.2` and full controlled
  sidecar smoke. Windows/Linux runtime and official signing are not inferred from
  cross-compilation or these macOS executable tests. Native installation has separate proof.
- The fresh read-only reviewer reported no Critical or Minor findings and the two P2
  search findings described here. Both are fixed with a green full suite. That review
  explicitly declined full-census, native RC2 and publication/signing acceptance.

Exact package hashes, identities and per-target execution boundaries are in
[the local RC2 package proof](package-verification-0.1.3-rc.2.json). The ARM64 candidate is
`dist/release-v0.1.3-rc.2/io.github.caichangqing1120.apollo-0.1.3-rc.2-darwin-arm64.dbxp`,
SHA-256 `2753212b424b227352c3f05b97450a4b236461fd7b16f7745cafd62971c5701f`.

## Outstanding Acceptance

1. Focused native RC2 installation/repair validation is complete with consent; it does not
   close cold-start, file-transfer, multi-account or full-state native acceptance.
2. Finish the failed page/editor/table/conditional contexts and a fresh complete original /
   plugin census. Do not relabel all 24 pages / 31 dialogs from selected normal boxes.
3. Independently verify production/MySQL, multi-account permission combinations, cold DBX
   restart, native file transfer and Windows/Linux runtime when those environments exist.
4. Keep release/signing/Store integration separate. The repair-phase status checks showed
   RC1 candidate PR #304 and automation PR #298 OPEN. The later authorized RC2 manual
   delivery must report its actual source, CI, published bytes and candidate update separately.

Raw PNG/log evidence and a self-contained local visual report are under ignored
`output/playwright/continue/`. Their hashes/results are retained in the tracked machine
record. The requested real Apollo backend remains running; only task-owned browser/SDK
validation processes are cleaned up. Existing DBX sessions and unrelated Chrome windows
are not cleanup targets.
