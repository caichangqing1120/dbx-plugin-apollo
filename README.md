# DBX Apollo Portal Console

DBX issue [#12466](https://github.com/t8y2/dbx/issues/12466).

Current author Preview: **Apollo Portal Console / Apollo Portal 控制台**, [`0.1.3-rc.1`](https://github.com/caichangqing1120/dbx-plugin-apollo/releases/tag/v0.1.3-rc.1).
All five unsigned native packages are published and re-downloaded/verified. The Store update
is [PR #304](https://github.com/t8y2/dbx-store/pull/304), pending maintainer review/signing;
the last officially signed Store version remains `0.1.2`.
The new names and explicit SemVer prerelease avoid the separate Apollo plugin's identical
listing labels. The already signed `0.1.2` artifacts and source tag are preserved unchanged.
See [review follow-up](docs/review-follow-up-2026-10-20.md) for the exact current boundaries.

**Independently authored management pages**, using Apollo 2.5.2 as the visual/interaction
reference. Not an embedded website and not the original Portal frontend packaged in DBX.
The 0.1.2 continuation restores all-environment role groups, independently authored searchable
user controls, dedicated warning flows, real lock-info modifiers and gray inherited configuration.
It also fixes stale editor/rollback responses, precision-losing JSON formatting and a footer
hit-testing regression found during final browser traversal.
The next-version continuation repairs shared form columns/help/static values, keeps cluster
creation on the original success page, and restores public Namespace department-prefix
display, draft retention and keyboard focus. See [current repairs and verification scope](docs/parity-polish.md)
and the [historical 0.1.2 audit](docs/parity-finish.md).
The strict all-page, all-dialog 1:1 gate still FAILS; the author Release contains unsigned
Preview candidates, not an accepted replica or a promise of completed visual parity.

[Current delivery receipt](docs/delivery-0.1.3-rc.1.json) | [Source CI](https://github.com/caichangqing1120/dbx-plugin-apollo/actions/runs/39375019013) | [Marketplace candidate PR #304](https://github.com/t8y2/dbx-store/pull/304) | [Self-contained visual report](https://github.com/caichangqing1120/dbx-plugin-apollo/releases/download/v0.1.3-rc.1/apollo-parity-report-v0.1.3-rc.1.html).
Official signing of all five `0.1.2` targets and PR #295's maintainer merge completed on
2026-10-20. The author Release assets remain unsigned review candidates, distinct from
the official signed Store artifacts. The [historical 0.1.2 receipt](docs/delivery-0.1.2.json)
records that version's author-submission snapshot, not the current Store review state.

## Installation And Connection

In DBX's plugin marketplace, identify the signed plugin by publisher **caichangqing1120**
and ID **`io.github.caichangqing1120.apollo`**. The published `0.1.2` entry still uses the old
name **Apollo Config / Apollo 配置中心**; the distinct Portal Console names are for the next
release. A similarly named Apollo plugin from another publisher is a different product.

After installation, create an Apollo connection with the Portal hostname, port (normally
8070), HTTP/HTTPS, optional context path and an existing ordinary username/password. Use a
hostname rather than a full URL. The backend logs in to the Portal; no website is embedded.
Test against a non-production environment before using configuration writes or deletions.
SSO/OIDC, LDAP and token-only connection authentication are not supported.

The official signed package is different from the author's unsigned GitHub Release
candidate. Unsigned packages require DBX's explicit development-package setting; do not
disable signature checks or invent a signing key to install a candidate as a trusted package.

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
For the historical 0.1.2 baseline, the developer captured 24 management pages and 53 native normal page/dialog/subview
states, triggered 14 warning scenarios on both original and SDK surfaces, and compared
normalized copy, computed fonts, dialog geometry and cropped pixels. Key workflows, user
controls, gray inheritance, language/theme/narrow contexts and sidebar hit-testing are
verified separately. These checks do not close the remaining page/form/context differences.

## Current Repair Scope

These changes apply to the `0.1.3-rc.1` author Preview, not the immutable signed `0.1.2` release.

- Creation/settings forms use independently authored column gutters, correctly grouped help
  text, source labels/format ordering and non-editable route identities that retain form data.
- Cluster creation shows the source-style success state instead of immediately navigating
  away. Completed forms cannot be resubmitted; a new visit resets the form and late replies
  cannot replace another route.
- Public Namespace names show the selected application's department prefix. Prefix/type
  changes preserve the name, format, comment and keyboard focus; the server still performs
  the actual namespace creation and permission checks.
- Enter submits only from text-like inputs. Cancel buttons and native selectors keep their
  own keyboard actions, so Enter on a destructive dialog's Cancel cannot execute its write.
  Enter/arrow keys on a closed user combobox open choices rather than accidentally saving
  the enclosing application or permission form.
- Language changes retain unsaved application/editor values and owner/administrator
  selections in memory. Drafts are not written to Host storage; a removed administrator
  chip is not resurrected by rerendering.
- Configuration columns keep a tall sidebar in document flow so the footer stays below
  its content, while desktop and narrow-host column positions remain unchanged.
- Current normal form-control geometry, conditional flows and warning comparisons have
  separate evidence. A passing control/frame check is not whole-page pixel acceptance.

**Still not accepted as a full 1:1 replica.** Navigation/search-picker details, other
administration tables/forms, previews/editors and some conditional/delete contexts remain
developer-owned work. Live Apollo persistence, authentication/authorization integration and
native DBX installation/restart/save-file acceptance are separate, unverified gates.

## Local Development

Requirements: Node.js 22+, Go 1.22+, Python 3.10+, DBX plugin CLI 0.1.9+ for the dev host.
The release workflow pins Go 1.26.3 and uses only standard-library cross-target packaging.

```sh
npm ci
npm test
npm run test:backend
(cd backend && go vet ./...)
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
self-assign official trust or publish signed catalog entries. See [current Preview notes](docs/release-notes-v0.1.3-rc.1.md)
and [privacy/security boundaries](docs/security.md).

## Release And Update Policy

- The author Preview `0.1.3-rc.1` is published with five CI-built unsigned native packages,
  exact-byte readback and a versioned visual report. Store update PR #304 is awaiting
  maintainer review/signing; it is not an officially signed catalog update yet. Preserve
  existing version-addressed source tags, unsigned candidates and official signed assets.
- This validation iteration uses manual release submission: an author-initiated tag/Preview
  Release, CI-built candidate packages and an author-submitted Store candidate PR. Review,
  protected signing and maintainer merge are still required.
- [Automation registration PR #298](https://github.com/t8y2/dbx-store/pull/298) registers future
  release discovery only and is pending merge. It does not publish this Preview or change signing policy.
- Store discovery currently skips GitHub Draft/Prerelease releases. An RC remains a Preview
  and is submitted manually; do not disguise it as a stable release to bypass that filter.

## Source And Feedback

Source code and follow-up Apollo feature requests/bugs belong in
[this repository's issues](https://github.com/caichangqing1120/dbx-plugin-apollo/issues).
Include the plugin version, OS/CPU target, Apollo version, affected page and reproduction
steps. Redact connection passwords, session cookies, tokens and sensitive configuration
values from screenshots and logs. The original DBX request is not the ongoing plugin tracker.

## Testing Boundaries

Current scoped checks: **176 JS + 14 packaging regressions**, **14 Go race tests + vet**,
**16 normal form controls**, **14 paired warning interiors**, and the creation, keyboard,
language/theme/narrow and sidebar-flow checks documented in [the current audit](docs/parity-polish.md).
The [current package proof](docs/package-verification-0.1.3-rc.1.json) records exact unsigned
local hashes and native targets. The [published delivery receipt](docs/delivery-0.1.3-rc.1.json)
records the matching CI/published bytes, downloaded macOS smoke and separate Store gates.
None of these counts is a full 1:1 or live-installation verdict.

`npm run test:smoke` starts a controlled loopback HTTP fixture and a real Go sidecar and checks
JSON-RPC login/edit/publish/history/rollback, gray merge, sync, key/consumer/role/admin APIs,
commit history/revocation and 2 MiB chunked requests/replies under the Host message limit. This fixture is
NOT an actual Apollo installation. UI screenshots also use that fixture and the actual DBX
SDK sandbox. Neither is evidence of production or live Apollo acceptance.

See [current repair evidence](docs/parity-polish.md), [reference evidence](docs/reference.md),
[verification history](docs/verification.md), and the
[implementation spec](docs/specs/001-apollo-portal/spec.md). The SDK in `backend/sdk` is vendored
from DBX under Apache-2.0 to avoid requiring a local DBX checkout to build.
