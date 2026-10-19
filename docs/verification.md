# Verification - Apollo Handwritten Plugin 0.1.2

Date: 2026-10-19. **Full original-page/modal 1:1 acceptance remains FAIL.**
This is an independently authored implementation and an unsigned local candidate, not an
embedded Portal or an accepted full replica. Current repairs and precise remaining items are
in [parity-finish.md](parity-finish.md) and [parity/finish-manifest.json](parity/finish-manifest.json).
The older audit and 0.1.1 repair records remain historical evidence.

## Current Automated Checks

- `npm test`: **161/161 pass**, zero failures. Coverage includes DOM events, literal API/DTO
  contracts, all-environment role scopes, stale editor/lock/syntax/rollback responses,
  precision-preserving JSON formatting, independent user controls and gray inheritance.
- Backend: **14 tests pass with race detector**, plus `go vet ./...`.
- `npm run test:smoke`: actual Go JSON-RPC sidecar and stateful loopback HTTP server:
  ordinary password login, wrong credentials, session isolation/expiry/disconnect,
  edit/publish/history/rollback and draft retention/revoke, gray/rules/merge, UAT sync,
  key/consumer/role/admin operations, ZIP transfer and 2 MiB chunked message boundaries.
  A modified NamespaceBO repeats large values, so its >4 MiB response is explicitly rejected;
  the 2 MiB reply test uses the real raw ItemDTO endpoint without weakening transport limits.
- Build: self-contained handwritten JS/CSS; all asset placeholders resolved. No upstream
  HTML, AngularJS, Bootstrap, original controller/runtime, external script or style loads.
- Package: ID/version and platform executable, every checksum, actual packaged initialize
  handshake and byte-for-byte UI equality are checked by `scripts/verify-package.py`.
  The Mach-O CPU type is checked independently of its filename; the packaged ARM64 sidecar
  is also exercised through the complete loopback smoke flow.
  Exact artifact hash/size and source/UI hashes are in [package-verification.json](package-verification.json).

The fixture now uses real ItemBO old/new/modified fields, non-null KVEntity pairs for
added/deleted release comparisons, separate lock-info DTOs, env-role DTOs, Eureka appName
and MultiResponseEntity prerequisites. Unknown endpoints still fail with 404. Fixture
corrections are regression-tested, not wildcard successful responses.

## Developer-Owned Browser Checks

Actual SDK dev host and Go sidecar; named task-owned browser `apollo-finish`. Dummy credentials
and loopback fixtures only. The standard `sandbox="allow-scripts"` boundary is not relaxed.

- 17 critical write/guard assertions pass: empty/Boolean editing, no early publication,
  publication/rollback previews and second confirmation, draft retention/revoke, actual
  history comparison, gray rules/full-merge guards, UAT grant scope, AccessKey, Master and
  invalidated delete-query targets.
- 9 user-picker/consumer assertions pass: keyboard owner selection, conditional rate field,
  shared AppId, create/token lookup, stale token invalidation, draft preservation,
  environment authorization and administrator chip selection/removal.
- 4 gray-inheritance checks pass, including matching original inherited data and a single
  real POST to the gray branch, never the parent. Gray deletion uses the source confirmation.
- Table/text comparison step 2, sync preview, Chinese/English, light/dark host and 390px host
  are exercised. This is not a claim that every narrow-screen page is pixel-identical.
- Sidebar hit-testing passes **15/15** at 1180px, 1500px and 390px host widths. This check
  first reproduced the footer overlap regression and passed after the stacking fix.
- Re-captured **24 original management pages and 53 native normal page/modal/subview states**.
  Original page requests and native UI notices have no failures in accepted captures.
- **14 warning states are actually triggered on both surfaces**. Normalized copy and computed
  title fonts match. Every recorded dialog interior exceeds 99.99% exactly equal pixels,
  excluding a 3px shadow/border edge; source transitions/toasts are settled and pointers neutral.
- Dialog position/size is checked separately: nine declarations pass their listed rendered
  states; several source frames retain a 4px horizontal offset and are not marked PASS.
- Common page-frame geometry passes for application creation/settings. Field proportions,
  total content heights and the full pages remain separate, still-failed gates.

The census covers **24 management entries and 31 dialog declarations, 51 paired records**.
Three legacy declarations have no call site in the pinned original; the generic confirm
component is a template, not an independent user entry. They are explicitly source-only,
never counted as browser-triggered states.

Local evidence: `output/playwright/finish/`. The self-contained `report.html` has per-entry
findings and paired images. The static census intentionally exits **1** for the remaining
full 1:1 failure; that result is not a unit-test or sidecar failure.

## Boundaries

Remaining page/form/preview/default/conditional-state differences are developer-owned,
not verification assigned back to the user. First-viewport screenshots do not certify all
below-fold states. Source-inspired layout and passing APIs do not prove 1:1 equivalence.

No real Apollo deployment is accessed. Role fixtures record the exact grant scope but do not
prove persistence/readback on a real authorization service. Native desktop installation,
Secret Store/restart and actual save-file integration are not verified by the browser host.
No commit, push, publication, issue writeback, deployment or real Apollo mutation is performed.
Task-owned browser contexts and services are stopped after verification; user Chrome and
unrelated original DBX files are preserved.
