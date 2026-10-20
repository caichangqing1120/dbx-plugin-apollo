# Marketplace Review Follow-Up

Date: 2026-10-20. Scope: display identity and Preview versioning only; no UI parity claim.

Review source: https://github.com/t8y2/dbx-store/pull/295#issuecomment-6282097273

The maintainer's two non-blocking suggestions are applied to the next development version:

- English display name: `Apollo Portal Console`.
- Chinese display name: `Apollo Portal 控制台`.
- Next development identity: `0.1.3-rc.1`, shared by npm/lockfile, manifest and Go initialize.
- Marketplace metadata, connection/workbench labels, built document title and release title
  use the distinct names. Plugin ID, database type, publisher and permissions are unchanged.
- Preview packaging and the release workflow require a valid SemVer prerelease suffix;
  stable-looking versions, build metadata without a suffix and invalid numeric identifiers
  are rejected. Future previews must use `-rc.N`, `-beta.N` or another valid prerelease suffix.

## Immutable 0.1.2 Release

The official protected workflow already signed all five `0.1.2` candidates successfully:
https://github.com/t8y2/dbx-store/actions/runs/39360395485

The bot committed the finalized signed catalog to PR #295 at
`fd478f60cf656098ff9a75b4319493fc8118a0e3`. Its generated catalog validates locally.
PR #295 merged on 2026-10-20 at 02:48:29 UTC, commit
`9e48f2eb1dfab418400ae21a831adce37ea10755`. The main-branch catalog validation passed:
https://github.com/t8y2/dbx-store/actions/runs/39360910112

Official catalog publication: https://github.com/t8y2/dbx-store/actions/runs/39360910122
The publication workflow succeeded. A live read of `https://dl.dbxio.com/catalog/index.json`
confirms this plugin at `0.1.2` with five artifacts signed by `dbx-store-release-2026`.

The author does not overwrite `v0.1.2`, any unsigned/signed package, the signed catalog or
the maintainer's signing commit. The signed catalog still has the old display names;
the source rename is not a claim that the current marketplace entry has changed. The PR
reply confirms the next release will carry the distinct names and SemVer suffix; it does
not request rewriting the already signed/merged 0.1.2 entry.

`0.1.3-rc.1` is prepared in source only. No new tag, public release, candidate submission
or signing request is created as part of this review follow-up. The current full-page/
all-dialog 1:1 gate remains FAIL; real Apollo and native desktop installation acceptance
remain unverified. Historical 0.1.2 audits and delivery receipts remain intact.

## Scoped Verification

- 161 JavaScript tests and 14 Python package regressions pass; the new version and title
  checks were first observed failing before the corrections.
- All five next-version native packages build locally and pass archive/checksum/CPU,
  manifest, UI/assets and release-metadata verification, retaining `0.1.3-rc.1`.
- Both packaged macOS sidecars pass initialize with the new version and the full controlled
  fixture smoke; 14 Go race tests and vet pass.
- Generated UI differs from v0.1.2 only in the document title; `src/`, CSS and design assets
  are unchanged. This is not a fresh visual-parity or native desktop acceptance claim.
- Historical 0.1.2 archive checksums and the pinned source tag remain unchanged. The signed
  Store branch is fast-forwarded for read-only validation, not edited or force-pushed.
