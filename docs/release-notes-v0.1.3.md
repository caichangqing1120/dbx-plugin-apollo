# Apollo Portal Console 0.1.3

Stable release promotion of the tested `0.1.3-rc.2` behavior, explicitly authorized on
2026-10-23 under the DBX Store policy: there is no prerelease channel, and any signed
version becomes `latestVersion` for all users. Earlier RC releases/tags/assets remain
immutable. This release is not a relabeled RC artifact.

## Included Repairs

- Success feedback disappears after five seconds without recreating editors or losing
  drafts/focus/cursor selection. New dialogs clear stale notices; successful submitted
  mutation dialogs close automatically, while important errors remain visible.
- Independently authored app/Key autocomplete handles keyboard selection, stale replies,
  paginated multi-environment results and exact environment/cluster/Namespace targets.
  Key navigation reveals previously folded/text-mode targets and preserves unrelated state.
- Source-measured navigation menus, compact cluster management and configuration tables
  restore labels/columns/previews/change badges/image actions and empty-table behavior.
- Prior RC1 repairs retain safer Enter handling, unsaved form values across language
  changes, correct Namespace prefixes/cluster success flows and sidebar/footer layout.

The UI and behavior are unchanged from RC2. Version, descriptions and release tooling are
updated: strict SemVer controls stable versus prerelease publication; new releases stay
draft until every candidate asset is uploaded, and conflicting public bytes are never replaced.
The manifest permission remains exactly `host.storage`; password/cookie, TLS/read-only,
transaction/write-replay, transfer and API contracts do not change.

## Verification And Known Gaps

RC2 has 207 JS / 14 packaging / 14 Go race tests plus vet and ten focused actual DBX 0.6.49
checks against real Apollo 2.5.2 with persistent H2. Those native results remain historical
RC2 evidence, not a new native stable installation. Stable-specific tests verify strict
SemVer, packaging identity, channel choice, immutable uploads and fail-closed errors;
full suites, five-target packages and actual macOS sidecars are revalidated for `0.1.3`.
Exact fresh counts, source/CI, downloaded artifact hashes and Store state are recorded in
the versioned delivery receipt on the repository's main branch after publication.

Stable delivery now passes [source CI](https://github.com/caichangqing1120/dbx-plugin-apollo/actions/runs/39894976659):
207 JS, 28 release-packaging and 14 Go race tests plus vet. All five published packages
are re-downloaded and match their local SHA-256/size/source/UI/native metadata; both
downloaded macOS sidecars and CI Linux x64 pass initialize/full controlled smoke. GitHub
reports `v0.1.3` as Latest with `draft=false` and `prerelease=false`. See the
[current delivery receipt](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/main/docs/delivery-0.1.3.json).

**Full 24-page / 31-dialog / all-state 1:1 remains FAIL.** Toolbar/sidebar/icon/hint/counter
details, some administration tables/forms, previews/editors and conditional/delete contexts
remain incomplete. Production/MySQL, complete multi-account permission matrices, native
cold-start/file transfer and Windows/Linux runtime beyond existing sidecar smoke are not
accepted. Stable SemVer changes release eligibility, not these evidence boundaries.

[Historical RC2 parity report](https://github.com/caichangqing1120/dbx-plugin-apollo/releases/download/v0.1.3-rc.2/apollo-parity-report-v0.1.3-rc.2.html)
and [native evidence](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.3-rc.2/docs/native-rc2-validation-2026-10-20.md)
are preserved with their actual versions/dates and explicit scope.

## Store And Trust

Author GitHub packages are unsigned candidate inputs, not official signed Store packages.
Registration [#298](https://github.com/t8y2/dbx-store/pull/298) is merged with automatic
stable-release discovery. Closed RC submission #304 is not reopened. Discovery may create
a new stable candidate PR; maintainers still own review, protected signing and merge. No
signing key, generated catalog, trust setting or Store filter is changed by this release.
The initial post-publication readback has not yet observed that automatic PR and the latest
Store discovery run predates publication; the officially signed catalog remains `0.1.2`.

[Source and follow-up Apollo issues](https://github.com/caichangqing1120/dbx-plugin-apollo/issues).
