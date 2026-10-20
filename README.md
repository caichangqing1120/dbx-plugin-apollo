# DBX Apollo Portal Console

DBX issue [#12466](https://github.com/t8y2/dbx/issues/12466).

Development identity: **Apollo Portal Console / Apollo Portal 控制台**, `0.1.3-rc.1` (not yet released).
The new names and explicit SemVer prerelease avoid the separate Apollo plugin's identical
listing labels. The already signed `0.1.2` artifacts and source tag are preserved unchanged.
See [review follow-up](docs/review-follow-up-2026-10-20.md) for the exact current boundaries.

**Independently authored management pages**, using Apollo 2.5.2 as the visual/interaction
reference. Not an embedded website and not the original Portal frontend packaged in DBX.
The 0.1.2 continuation restores all-environment role groups, independently authored searchable
user controls, dedicated warning flows, real lock-info modifiers and gray inherited configuration.
It also fixes stale editor/rollback responses, precision-losing JSON formatting and a footer
hit-testing regression found during final browser traversal.
See [current repairs, measurements and remaining differences](docs/parity-finish.md).
The strict all-page, all-dialog 1:1 gate still FAILS; this is an unsigned Preview/development
candidate, not an accepted replica. The [v0.1.2 release](https://github.com/caichangqing1120/dbx-plugin-apollo/releases/tag/v0.1.2)
contains complete native candidate packages, not a promise of completed visual parity.

[Delivery receipt](docs/delivery-0.1.2.json) | [Source CI](https://github.com/caichangqing1120/dbx-plugin-apollo/actions/runs/39250298164) | [Marketplace candidate PR #295](https://github.com/t8y2/dbx-store/pull/295).
Official signing of all five `0.1.2` targets and PR #295's maintainer merge completed on
2026-10-20. The author Release assets remain unsigned review candidates, distinct from
the official signed Store artifacts.

## Current Route Coverage (Not Original-Workflow Parity)

- Ordinary Portal username/password login; DBX Secret Store and isolated in-memory Go sessions.
- Application search, favorites/recent/public namespaces, creation/editing and administrators.
- Configuration table/text editing, typed String/Number/Boolean/JSON items, YAML validation,
  unpublished-change revocation, filtered/paged commit history, publishing and version rollback.
- Gray branch editing, client IP/label rules, gray publishing, full-release merge and cleanup.
- Multi-environment/cluster sync preview/apply, draft comparison and release comparison.
- Namespace and ZIP import/export; chunked RPC and native Host file-transfer save support.
- Cluster/namespace management, public namespace linking, app/env/cluster namespace permissions,
  access-key lifecycle and identifier-confirmed app/cluster/namespace deletion.
- Consumers/OpenAPI authorization, system roles/parameters, service information/health,
  audit list/trace, global key/value search and client instances.
- Chinese/English, original-style light UI on light/dark Hosts; narrow screens retain the
  original desktop layout with horizontal scrolling.

All pages, dialogs, CSS, router and API clients are independently written. The original
Apollo 2.5.2 frontend is used only as an external reference, never loaded by the plugin.
The developer re-captured all 24 management pages and 53 native normal page/dialog/subview
states, triggered 14 warning scenarios on both original and SDK surfaces, and compared
normalized copy, computed fonts, dialog geometry and cropped pixels. Key workflows, user
controls, gray inheritance, language/theme/narrow contexts and sidebar hit-testing are
verified separately. These checks do not close the remaining page/form/context differences.

## Local Development

Requirements: Node.js 22+, Go 1.22+, Python 3.10+, DBX plugin CLI 0.1.9+ for the dev host.
The release workflow pins Go 1.26.3 and uses only standard-library cross-target packaging.

```sh
npm ci
npm test
npm run test:backend
npm run test:smoke
npm run build
dbx-plugin dev --path . --port 5198
```

Create a DBX Apollo connection with:

- Hostname only (not a full URL), port (normally 8070), protocol HTTP/HTTPS.
- Optional context path such as `/apollo`.
- Existing Portal username and password. SSO/OIDC, LDAP and token-only auth are out of scope.

Connection passwords and session cookies never enter the workbench context, UI persistent state or backend error messages.
HTTP is supported for existing internal deployments; use HTTPS for untrusted networks.
TLS uses system trust; verification is not disabled. Responses/requests are capped at 4 MiB.
The development host stores its connection credentials in plaintext under ignored `.dbx-dev/`;
that host is for development only, not the DBX production Secret Store.

```sh
npm run package:macos
npm run package:all
python3 scripts/verify-package.py dist/release-v0.1.3-rc.1/io.github.caichangqing1120.apollo-0.1.3-rc.1-darwin-arm64.dbxp --handshake
```

`package:macos` builds Darwin ARM64 under `dist/release-v0.1.3-rc.1/darwin-arm64/`; `package:all`
builds Darwin ARM64/x64, Windows x64 and Linux x64/ARM64 under `dist/release-v0.1.3-rc.1/`.
Single-target output never replaces the complete set's merged index. Every package contains the complete UI, licensed
assets and its native Go sidecar. Explicit GOOS/GOARCH/CGO settings and actual Mach-O/PE/ELF
headers prevent misleading target labels. All file checksums, source/UI equality, package
metadata and the current-host initialize handshake are checked. Cross-target runtime
acceptance is separate. The merged `release-candidates.json` follows the store synchronizer's
`plugin` plus `artifacts` contract; it is not a catalog entry. The Preview packaging
path now rejects stable-looking or invalid SemVer versions; all future Preview releases
must retain a prerelease suffix such as `-rc.1` in the manifest, sidecar, tag and metadata.

Unsigned packages require explicitly enabling development packages in DBX. Official
marketplace installation requires DBX Store review, signing and merge; the author cannot
self-assign official trust or publish signed catalog entries. See [release notes](docs/release-notes-v0.1.2.md)
and [privacy/security boundaries](docs/security.md).

## Testing Boundaries

`npm run test:smoke` starts a controlled loopback HTTP fixture and a real Go sidecar and checks
JSON-RPC login/edit/publish/history/rollback, gray merge, sync, key/consumer/role/admin APIs,
commit history/revocation and 2 MiB chunked requests/replies under the Host message limit. This fixture is
NOT an actual Apollo installation. UI screenshots also use that fixture and the actual DBX
SDK sandbox. Neither is evidence of production or live Apollo acceptance.

See [reference evidence](docs/reference.md), [verification](docs/verification.md), and the
[implementation spec](docs/specs/001-apollo-portal/spec.md). The SDK in `backend/sdk` is vendored
from DBX under Apache-2.0 to avoid requiring a local DBX checkout to build.
