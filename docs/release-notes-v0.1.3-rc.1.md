# Apollo Portal Console 0.1.3-rc.1 Preview

Unsigned Preview candidates for DBX Store review; not a completed 1:1 replica.

- Rename the English display identity to `Apollo Portal Console` and the Chinese identity
  to `Apollo Portal 控制台` so the directory can distinguish this plugin from other Apollo tools.
- Use an explicit SemVer `-rc.1` suffix in manifests, native initialize and artifact metadata.
  Preview packaging now rejects stable-looking or invalid SemVer versions.
- Preserve the plugin ID `io.github.caichangqing1120.apollo`, publisher, permissions,
  configuration/authentication contracts and immutable signed `0.1.2` assets.
- Fix unintended Enter-key submissions: Cancel buttons, native selectors and closed user
  comboboxes no longer accidentally execute the enclosing write. Explicit Save still works.
- Preserve unsaved application/editor fields and owner/admin choices when changing language;
  drafts remain in UI memory, never Host storage.
- Restore independently authored form columns, static AppId values, source hints/format
  order, public Namespace department prefixes and the in-page cluster-created state.
- Ignore late cluster success/error UI updates after navigation, and keep long configuration
  sidebars in document flow so they do not cross the footer.

## Verification

176 JavaScript tests, 14 packaging regressions, 14 Go race tests and vet pass. Both packaged
macOS architectures pass the full controlled-fixture sidecar smoke. Five complete unsigned
native packages have verified CPU types, source/UI/assets, file checksums and identity.

Developer-owned browser checks cover 16 normal form-control geometries, seven creation/prefix
checks, four keyboard request-safety checks, five language/theme/narrow cases and three
sidebar-flow widths. Fourteen actually triggered original/SDK warning states match copy,
title fonts and final frames, with 100% equal interior pixels excluding a 3px border/shadow.
These are scoped checks, not all-page or every-state acceptance.

Full all-page/all-dialog 1:1 acceptance remains FAIL. This metadata follow-up does not fix
the remaining parity differences or establish real Apollo/native desktop acceptance.
See [the current repair evidence](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.3-rc.1/docs/parity-polish.md)
and [the privacy/security boundaries](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.3-rc.1/docs/security.md).
Ordinary Portal password authentication only; no SSO/OIDC/LDAP. Source/generated UI/runtime
are independently authored; selected Apache-2.0 assets/copy and the vendored DBX SDK are
attributed in NOTICE. Official signing and review remain required; no private key or fake
`verified` flag is included. This iteration uses a manually submitted marketplace candidate.
