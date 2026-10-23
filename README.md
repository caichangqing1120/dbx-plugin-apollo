# DBX Apollo Portal Console

DBX issue [#12466](https://github.com/t8y2/dbx/issues/12466).

Current author stable release: **Apollo Portal Console / Apollo Portal 控制台**,
[`0.1.3`](https://github.com/caichangqing1120/dbx-plugin-apollo/releases/tag/v0.1.3).
The user authorized promoting the tested RC2 behavior on 2026-10-23. Stable publication
changes the version/channel, not the UI or the failed full 1:1 acceptance gate.
The Store has no prerelease channel: signing any candidate makes it `latestVersion` for
all users. RC submission [#304](https://github.com/t8y2/dbx-store/pull/304) is therefore closed;
merged automation [#298](https://github.com/t8y2/dbx-store/pull/298) discovers eligible stable
releases. Author publication, automatic candidate creation and official signing/merge are
separate gates. The last confirmed signed Store version is `0.1.2`.
The distinct names avoid the separate Apollo plugin's identical listing labels. Prior RC
versions retain their explicit prerelease suffixes; all previous tags/assets remain immutable.
The [review follow-up](docs/review-follow-up-2026-10-20.md) preserves the earlier naming /
signed-0.1.2 boundary; RC2 and stable delivery are recorded separately.

The stable Release is non-draft/non-prerelease and GitHub Latest. Source CI passes; all
five public packages and 13 assets are re-downloaded/verified, matching exact local bytes.
Both downloaded macOS sidecars pass initialize/full smoke; CI also passes Linux x64 smoke.
The bounded post-publication readback has not yet observed an automatic stable Store PR;
the latest Store discovery run predates this release. Signing/listing are not complete.

**Historical RC2 is published and byte-verified.** Source CI passes; all five downloaded packages
match the local verified bytes, including the exact ARM64 candidate installed in DBX.
This continuation fixes automatic success-feedback dismissal, header app/Key autocomplete,
retained Key-target views and multi-environment search pagination, and restores measured
navigation, compact cluster rows and configuration-table details. See the
[continuation verification](docs/continuation-validation-2026-10-20-rc2.md).
The exact local ARM64 candidate is now installed in native DBX 0.6.49: ten focused cases
pass against actual Apollo 2.5.2, including automatic success dismissal, input focus/cursor
retention, submitted-dialog closure and Key/app search. See [native RC2 evidence](docs/native-rc2-validation-2026-10-20.md).

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
The strict all-page, all-dialog 1:1 gate still FAILS. Stable SemVer is the authorized release
channel, not a claim that these gaps are fixed. Author packages remain unsigned Store inputs
until protected signing; do not mistake an author stable Release for an official signed catalog.

[Stable delivery receipt](docs/delivery-0.1.3.json) | [Stable source CI](https://github.com/caichangqing1120/dbx-plugin-apollo/actions/runs/39894976659) | [Stable release notes](docs/release-notes-v0.1.3.md) | [Historical RC2 visual report](https://github.com/caichangqing1120/dbx-plugin-apollo/releases/download/v0.1.3-rc.2/apollo-parity-report-v0.1.3-rc.2.html).
Official signing of all five `0.1.2` targets and PR #295's maintainer merge completed on
2026-10-20. The author Release assets remain unsigned review candidates, distinct from
the official signed Store artifacts. The [historical 0.1.2 receipt](docs/delivery-0.1.2.json)
records that version's author-submission snapshot, not the current Store review state.

## Installation And Connection

In DBX's plugin marketplace, identify the signed plugin by publisher **caichangqing1120**
and ID **`io.github.caichangqing1120.apollo`**. The published `0.1.2` entry still uses the old
name **Apollo Config / Apollo 配置中心**; the stable update uses the distinct Portal Console
names after Store review/signing/merge. A similarly named Apollo plugin from another publisher
is a different product.

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

### RC2 Continuation

These changes are in the published `0.1.3-rc.2` source and packages, not the immutable RC1 assets.

- Success notices disappear after five seconds without clicking X. A later success receives
  its own interval; opening another action/dialog/navigation clears stale feedback. Expiry
  removes only the notice, retaining editor nodes, unsaved text, focus and selection.
  Completed mutation dialogs close automatically; previews and second-stage confirmations
  still require explicit confirmation, and important error messages remain visible.
- An independently authored header combobox provides 400ms-debounced app/Key search, paged
  results, keyboard selection, Escape/outside dismissal and stale-response protection without
  replacing a live form. Key matches retain environment/cluster/Namespace identity and expand
  only their target into the filtered table, even after it was folded or in text mode.
- Multi-environment Key pagination follows Apollo's per-environment page size and maximum
  total. A merged first page of 40 rows with `size=20,total=30` still exposes the next page;
  it does not stop at the merged result count or merge distinct same-app matches.
- Administrator/ordinary-user tool entries and logout grouping follow the original source.
  Compact cluster management restores environment groups, source labels and assignment icons.
- Configuration tables restore 250-character previews with full-value inspection, `new` /
  `modified` / `deleted` badges, source image actions, eight source-width columns and empty
  headers without an invented placeholder row. Deleted rows have no edit/delete actions.

**Still not accepted as a full 1:1 replica.** Other administration tables/forms,
configuration toolbar/sidebar/icons, never-published hints/instance counters, previews/editors
and some conditional/delete contexts remain
developer-owned work. Focused native macOS checks now cover a real local Apollo 2.5.2
backend, ordinary password login, configuration writes/releases/rollback, cluster/Namespace
creation and persisted-data reconnect. Production/MySQL, multi-account permissions, cold DBX
restart and native file-transfer acceptance remain separate, unverified gates.

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
python3 scripts/verify-package.py dist/release-v0.1.3/io.github.caichangqing1120.apollo-0.1.3-darwin-arm64.dbxp --handshake
```

`package:macos` builds Darwin ARM64 under `dist/release-v0.1.3/darwin-arm64/`; `package:all`
builds Darwin ARM64/x64, Windows x64 and Linux x64/ARM64 under `dist/release-v0.1.3/`.
Single-target output never replaces the complete set's merged index. Every package contains the complete UI, licensed
assets and its native Go sidecar. Explicit GOOS/GOARCH/CGO settings and actual Mach-O/PE/ELF
headers prevent misleading target labels. All file checksums, source/UI equality, package
metadata and the current-host initialize handshake are checked. Cross-target runtime
acceptance is separate. The merged `release-candidates.json` follows the store synchronizer's
`plugin` plus `artifacts` contract; it is not a catalog entry. Packaging validates strict
SemVer. The shared publisher keeps suffix versions such as `-rc.2` on GitHub's prerelease
channel and publishes suffix-free `0.1.3` as stable. New releases stay draft until all five
targets and pinned metadata are uploaded; wrong-channel releases, lookup failures and
conflicting existing asset bytes fail closed without overwriting public artifacts.
Already-published releases are verification-only and must contain the complete asset set;
missing assets require explicit recovery. Publication is manually dispatched through CI,
not triggered by creating an already-public empty Release.

Unsigned packages require explicitly enabling development packages in DBX. Official
marketplace installation requires DBX Store review, signing and merge; the author cannot
self-assign official trust or publish signed catalog entries. See [stable release notes](docs/release-notes-v0.1.3.md)
and [privacy/security boundaries](docs/security.md).

## Release And Update Policy

- `0.1.3` promotes tested RC2 behavior without changing UI/source assets. Stable and RC
  tags/assets are immutable; never relabel an existing RC release or replace its packages.
  Fresh suites/build/package tests prove the stable identity; RC2 native/pixel records are
  historical behavior evidence, not a fresh stable native installation or full-parity verdict.
- The maintainer closed RC candidate PR #304 because signing any version publishes it as
  Store `latestVersion` for all users. Do not reopen it or request RC signing. Stable author
  packages are unsigned; official review, protected signing and merge remain required.
- [Automation registration PR #298](https://github.com/t8y2/dbx-store/pull/298) registers future
  discovery and was merged on 2026-10-23 with `autoUpdate: true`. An eligible non-draft,
  non-prerelease Release with `release-candidates.json` can create the Store candidate PR.
  Do not duplicate the automatic candidate manually or change Store discovery/signing policy.
- Publishing stable is explicitly authorized despite disclosed remaining parity gaps. It
  does not silently claim production/MySQL, cold-start/file-transfer or multi-account
  acceptance. Discovery and signing status are reported from actual readbacks only.

## Source And Feedback

Source code and follow-up Apollo feature requests/bugs belong in
[this repository's issues](https://github.com/caichangqing1120/dbx-plugin-apollo/issues).
Include the plugin version, OS/CPU target, Apollo version, affected page and reproduction
steps. Redact connection passwords, session cookies, tokens and sensitive configuration
values from screenshots and logs. The original DBX request is not the ongoing plugin tracker.

## Testing Boundaries

The [2026-10-20 native validation](docs/live-apollo-validation-2026-10-20.md) uses actual
DBX 0.6.49 and the published macOS ARM64 RC package against upstream Apollo 2.5.2 Assembly
with persistent H2 files, not the fixture or SDK sandbox. Fifteen focused manual scenarios
pass with independent Portal/ConfigService readback, including backend restart and native
reconnect without retyping the password. This is a local unsigned development installation,
not official signed-package or production acceptance. Its historical RC1 finding
`NATIVE-UX-01` records success notices persisting beneath later dialogs, not a stuck request.
The RC2 repair passes timer/draft/focus regressions, real-Apollo SDK checks and
[ten focused actual native DBX cases](docs/native-rc2-validation-2026-10-20.md).
`NATIVE-UX-01` is fixed in RC2; the original RC1 evidence remains historical, not rewritten.

The RC2 local and source CI checks passed **207 JS + 14 packaging regressions**, **14 Go race tests + vet**,
both downloaded macOS sidecar smoke flows, CI Linux x64 smoke, real-Apollo SDK checks
and ten focused actual native DBX cases.
Selected search/cluster geometry matches within 0.016px; configuration table sizes/column widths
match but its shared vertical position is 1.125px off, so that check is not full-table/page PASS.
Exact current results and residuals are in the [RC2 continuation record](docs/continuation-validation-2026-10-20-rc2.md).
The earlier **16 normal form controls**, **14 paired warning interiors** and creation/keyboard/
context/sidebar checks remain scoped historical RC1 evidence in [the prior audit](docs/parity-polish.md),
not a fresh all-state RC2 census. The [local RC2 package proof](docs/package-verification-0.1.3-rc.2.json)
records exact unsigned hashes and native targets. The [published RC2 delivery receipt](docs/delivery-0.1.3-rc.2.json)
records the matching CI/published bytes, downloaded macOS smoke and separate Store gates.
The [RC1 receipt](docs/delivery-0.1.3-rc.1.json) remains historical. None of these counts
is a full 1:1, complete native acceptance or production verdict. Stable-release verification
is recorded separately; no new browser UI or native installation is implied by version promotion.

Fresh `0.1.3` verification passes **207 JS / 28 release-packaging tests / 14 Go race tests
and vet**, five package/source/UI/CPU/checksum checks, and both downloaded macOS sidecar
initialize/full controlled smoke flows. CI passes the same suites and Linux x64 sidecar smoke.
The stable [package proof](docs/package-verification-0.1.3.json) and
[delivery record](docs/delivery-0.1.3.json) separate those results from automatic Store
discovery, maintainer signing/merge and historical RC2 native evidence.

`npm run test:smoke` starts a controlled loopback HTTP fixture and a real Go sidecar and checks
JSON-RPC login/edit/publish/history/rollback, gray merge, sync, key/consumer/role/admin APIs,
commit history/revocation and 2 MiB chunked requests/replies under the Host message limit. This fixture is
NOT an actual Apollo installation. The historical SDK screenshots also use that fixture;
they are not evidence of live Apollo acceptance. The separate native report records the
new real-backend checks and their explicit remaining boundaries, not a blanket acceptance.

See [current repair evidence](docs/parity-polish.md), [reference evidence](docs/reference.md),
[verification history](docs/verification.md), and the
[implementation spec](docs/specs/001-apollo-portal/spec.md). The SDK in `backend/sdk` is vendored
from DBX under Apache-2.0 to avoid requiring a local DBX checkout to build.
