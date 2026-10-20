# Apollo Portal Console 0.1.3-rc.2 Preview

**Unsigned Preview. Full all-page / all-dialog / all-state 1:1 acceptance remains FAIL.**
This prerelease is an incremental repair, not a declaration of a completed Apollo replica.
Use a non-production Apollo environment and review the native-sidecar/security boundaries.

## Repairs

- Success notices automatically disappear after five seconds without recreating editors.
  New operations/dialogs clear old feedback; drafts, focus and cursor selection survive
  expiry. Successful submitted mutation dialogs close; important errors remain visible.
- Independently authored header autocomplete searches apps and Keys with the source API,
  400ms debounce, pagination, keyboard selection, stale-response guards and draft safety.
- Key results reveal the exact environment/cluster/Namespace even after the target was
  folded or in text mode. Other Namespace choices remain intact.
- Multi-environment Key pagination follows Apollo's maximum per-environment total and page
  size, rather than stopping when the merged content length exceeds one page.
- Navigation menus, compact environment-grouped cluster management and configuration-table
  columns/previews/change badges/image actions are repaired against the pinned original.

All pages, router/state, styles and clients remain independently authored. The original
Portal HTML, AngularJS and Bootstrap runtime are not embedded or repackaged. Display names
remain **Apollo Portal Console / Apollo Portal 控制台**, distinct from other Apollo plugins.

## Verification

- 207 JS and 14 packaging regressions pass; all 14 Go race tests and vet pass.
- Five local native candidates pass actual CPU, archive/checksum, manifest and source/UI
  verification. Both packaged macOS sidecars pass initialize and full controlled smoke.
- Real Apollo 2.5.2 original/SDK comparisons cover selected autocomplete/cluster/table
  geometry, Key targets, success lifecycle and representative page/language/narrow contexts.
- Ten focused actual DBX 0.6.49 native cases pass against the real persistent-H2 Apollo,
  including auto-dismiss, retained input cursor, submitted-editor closure and search.
  Existing local draft `native-v2` and published `native-v1` remain unchanged.
- Fresh independent scoped review found two P2 search defects; both are fixed with
  RED/GREEN regression and a green full suite. This is not a full-census acceptance review.

See [continuation evidence](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.3-rc.2/docs/continuation-validation-2026-10-20-rc2.md),
[native RC2 evidence](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.3-rc.2/docs/native-rc2-validation-2026-10-20.md) and
[package verification](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.3-rc.2/docs/package-verification-0.1.3-rc.2.json) in the tagged source.
Published CI bytes/downloaded verification and Store status are recorded separately in the
versioned delivery receipt rather than inferred from local packaging.

The manual author release now passes source CI and exact-byte readback of all five targets;
both downloaded macOS packages pass full sidecar smoke. The existing
[Store candidate PR #304](https://github.com/t8y2/dbx-store/pull/304) is updated to RC2 and
awaits protected maintainer review/signing. See [the current delivery receipt](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/main/docs/delivery-0.1.3-rc.2.json).
The immutable tag preserves the pre-publication notes; the published Release body and main
README carry the verified delivery status.

## Known Limitations And Trust

Configuration toolbar/sidebar/icon/badge/hint/counter details, some administration tables /
forms, previews/editors and conditional/delete contexts still differ. Selected box matches
are not whole-page pixel acceptance; the normal configuration table has a 1.125px vertical
offset. Production/MySQL, multi-account permissions, native cold start/file transfer and
Windows/Linux runtime remain separate unverified gates.

Author packages are unsigned review candidates. Official DBX Store review/signing/merge
must be performed by its maintainers; do not disable Store verification or self-assign trust.
The manual candidate update keeps automation registration PR #298 separate. Existing
`0.1.2` and `0.1.3-rc.1` tags, public assets and officially signed artifacts remain immutable.

[Source and subsequent Apollo bugs/features](https://github.com/caichangqing1120/dbx-plugin-apollo/issues).
