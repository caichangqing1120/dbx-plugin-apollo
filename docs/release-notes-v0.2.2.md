# Apollo Portal Console 0.2.2

## Store-Facing Release Notes

0.2.2 is the first Store update since 0.1.3. It exposes five MCP tools over the existing Apollo service API: read (apollo_read, apollo_session), write (apollo_write) and full-access administration (apollo_admin, apollo_authorize_consumer), while keeping the existing secret redaction, read-only and explicit-confirmation guards; manifest permissions are unchanged (host.storage only) and upgrading grants no access. It also removes the unsupported mcpTools Store metadata field that blocked release import. UI behavior is unchanged. A matching updated DBX Desktop and standalone MCP are required.

## Why A New Version

Neither 0.2.0 nor 0.2.1 entered the Store. Describing only the 0.2.1 metadata
repair omitted the MCP functionality that users upgrading from Store 0.1.3 will
actually receive. The unsupported `mcpTools` listing field blocked release import;
MCP declarations belong in `manifest.json` and remain intact.

0.2.2 is a new immutable release for the maintainer-review response and clean CI
provenance. Existing 0.2.0/0.2.1 tags, assets, notes and validation receipts must not
be replaced or reinterpreted as 0.2.2 evidence. The source listing is pinned to
[`v0.2.2`](https://github.com/caichangqing1120/dbx-plugin-apollo/tree/v0.2.2).

## Required CI And Provenance Gates

The new release must use clean CI and the official reusable workflow pinned at
`417c1bfc28ea8669dfbc2e1525f54e3b68285b1c`. Its caller disables plugin-CLI
installation (`install-plugin-cli: false`) so packaging does not rewrite the
backend module or its existing `replace ... => ./sdk` relationship. Go 1.26.3
builds the sidecar directly through the provenance-aware helper:

```sh
RELEASE_TAG=v0.2.2 DBX_PLUGIN_TARGET=<target> python3 scripts/package-ci.py
```

For each of the five supported targets, the helper emits
`dist/<id>-<version>-<target>.dbxp`, `.artifact.json` and `.provenance.json`.
Full VCS provenance verification is mandatory: inspect the packaged executable's
`go version -m` build information, require its `vcs.revision` to equal the commit
resolved by `v0.2.2`, require `vcs.modified=false`, and retain the complete build
information and provenance record. Missing or mismatched provenance must stop
packaging; a matching initialize version alone is insufficient. Verify the
packaged manifest/sidecar identity and version, target architecture, SHA256 and
size against the emitted metadata and final release inputs before publication.

These are required gates, not completed results. Fresh 0.2.2 CI execution,
downloaded-byte/provenance verification, immutable author publication and Store
review/signing remain pending until recorded by the coordinating delivery step.
Locally built or historical packages are not substitutes for the new CI output.

## Unchanged Safety And Acceptance Boundaries

The five MCP declarations, exact access levels, plugin ID/publisher, service API,
UI and `host.storage` permission are unchanged from the reviewed MCP source.
Installing or upgrading never enables tools, grants connections or elevates access.
Users must explicitly enable/authorize capabilities with matching updated DBX
Desktop and standalone MCP builds; the existing engine floor is not sufficient
evidence of that protocol support.

Known Apollo visual/native acceptance gaps remain. These notes do not claim that
those gaps are fixed, that 0.2.2 was installed, that any live Apollo service was
called, or that official Store signing/merge or business acceptance has occurred.
