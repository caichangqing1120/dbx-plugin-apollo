# Apollo Portal Console 0.1.3-rc.1 Preview

Development notes; this version is not yet published.

- Rename the English display identity to `Apollo Portal Console` and the Chinese identity
  to `Apollo Portal 控制台` so the directory can distinguish this plugin from other Apollo tools.
- Use an explicit SemVer `-rc.1` suffix in manifests, native initialize and artifact metadata.
  Preview packaging now rejects stable-looking or invalid SemVer versions.
- Preserve the plugin ID `io.github.caichangqing1120.apollo`, publisher, permissions,
  configuration/authentication contracts and immutable signed `0.1.2` assets.

Full all-page/all-dialog 1:1 acceptance remains FAIL. This metadata follow-up does not fix
the remaining parity differences or establish real Apollo/native desktop acceptance.
See [the review follow-up](review-follow-up-2026-10-20.md) for signing and release boundaries.
