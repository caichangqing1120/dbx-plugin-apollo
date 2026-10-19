# Apollo Config 0.1.2 Preview

Independently authored Apollo 2.x management UI and Go sidecar for DBX. This is not an
iframe, embedded Portal, or redistribution of the original AngularJS/Bootstrap frontend.
Related request: https://github.com/t8y2/dbx/issues/12466 (claimed; intentionally not closed).

## Included

- Ordinary Portal username/password authentication and per-connection isolated sessions.
- Application, cluster, namespace, typed configuration, history, publish/rollback and gray
  configuration flows; sync, import/export, permissions, consumers, keys and admin routes.
- Chinese/English, source-referenced light styling and complete native packages for
  darwin-arm64, darwin-x64, windows-x64, linux-x64 and linux-arm64.
- SHA-256/size metadata per package, a checksum list, source/UI verification and the merged
  store-compatible unsigned release-candidate identity/artifact manifest.

## Required Disclosures

**Full all-page/all-dialog 1:1 acceptance remains FAIL.** Remaining differences include
management-form proportions, copy/icons/tables, previews/editors, default/conditional states
and some delete contexts. See [the detailed current audit](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.2/docs/parity-finish.md) and
[the per-entry census](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.2/docs/parity/finish-manifest.json). Passing unit or API tests does not close
that gate. This Preview must not be marketed as a completed 1:1 Apollo replica.

Only ordinary account/password authentication is implemented; SSO/OIDC/LDAP is not.
No real Apollo deployment, production data or native DBX desktop installation acceptance
was used to validate this release. Fixtures and SDK browser checks are not live acceptance.
Cross-built executable headers and checksums do not prove every target's runtime behavior.

Author release assets are **unsigned review/development candidates**. Install them only
through DBX's explicit unsigned-development-package option. Official marketplace assets
must be signed by DBX Store maintainers and merged through the single candidate PR process.
No signing private key, telemetry, extra host privilege or custom trust bypass is included.

License: Apache-2.0. Apollo assets/data-only copy and the vendored DBX SDK are attributed
in [NOTICE](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.2/NOTICE).
Data/network/native behavior is documented in [security.md](https://github.com/caichangqing1120/dbx-plugin-apollo/blob/v0.1.2/docs/security.md).
