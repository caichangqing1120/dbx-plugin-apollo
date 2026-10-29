# apollo MCP Tools Upgrade

## Scope And Authorization

The user requests exposing all existing plugin capabilities under the updated DBX MCP rules and upgrading plugin versions. The user explicitly includes the private XXL-JOB, BD Job and BD Gateway plugins. SSH is excluded. Implementation is authorized; remote push, publication, installation, restarts and changes to user grants are not authorized.

## Authoritative Protocol

Reference: DBX upstream `8c2bbe35b`, `plugins/README.md` section `mcp`, `plugins/manifest.schema.json`, and plugin-development documentation. This package adapts existing capabilities, not new service APIs.

- Implement side-effect-free `mcp/tools` returning `{"tools":[{"name","description","inputSchema","annotations"}]}`.
- Implement `mcp/call` accepting `{"tool","arguments","lifecycle"}` and returning MCP CallToolResult `{"content":[{"type":"text","text":"..."}],"isError":false}`; execution errors must be represented consistently and never resemble success.
- Add exactly one manifest `mcp` contribution with `external_tools: true`, `ai_tools: true`, meaningful `toolsets`, and `tools` declarations keyed exactly by the discovered tool name. At most 64 entries. Declare `access` as `read` (no state change), `write` (ordinary changes), or `full` (destructive, arbitrary execution or bulk/admin changes); each tool's highest reachable effect controls its level. No annotations-only exposure.
- Expose existing service capabilities with accurate schemas; do not add raw arbitrary RPC, URL, credential, connection-lifecycle, install or host-control tools. Existing generic request adapters need enforced method/path classification so a read tool cannot mutate state.
- Host binds identity using `lifecycle.connection.id`; reject mismatched argument identities. Use lifecycle credentials and transformed runtime endpoint, never model-supplied credentials. Support external calls on saved connections without requiring an already-open UI session. Do not overwrite or disconnect unrelated existing sessions.
- Discovery must not authenticate, connect to services, write files or create workloads. For every execution, enforce connection read-only policy plus all existing plugin mutation/confirmation/validation guards. A readonly lifecycle must not inherit writable cached session permissions.
- Preserve existing API paths, parameters, auth, redaction, two-phase confirmation, idempotency and UI behavior. Keep all current capabilities even on non-main source branches.
- Tool output is untrusted data, bounded and secret-redacted. Reuse existing transport timeouts and size limits. Reject malformed arguments and unknown tools before network effects.
- Preserve user-controlled grants: installing/upgrading never grants external access automatically. Document settings enablement and matching updated DBX/MCP requirements.
- Upgrade active manifest, backend initialize metadata, package.json/package-lock.json and active build metadata consistently to `0.2.0`. Do not rewrite historical release receipts, tagged assets or old versioned notes. Keep publisher and plugin ID unchanged.

## Acceptance

Baseline tests run before edits. New tests are observed failing before bridge implementation, then passing. Cover manifest/discovery parity and access hints, every supported tool or endpoint dispatch, side-effect-free discovery, external lifecycle calls, missing/mismatched identity, read-only mutation denial, existing confirmation guards, malformed/unknown input, error envelopes and secret handling. Run complete Go tests, race and vet, applicable frontend tests/build, and package checks. Use only local fake HTTP services, never real credentials or service writes. Report exact verification gaps without claiming deployment or acceptance.

## Confirmed Apollo Safety Boundary

Connection authentication and routing are exclusively host lifecycle input. Existing user-provisioning password fields are business input permitted only behind full-access confirmation; they must never be echoed. Consumer authorization resolves the existing token backend-side from its appId. Existing managed tokens/access keys are never returned by MCP. MCP exports provide bounded redacted previews/metadata, not raw binary backup bytes; existing UI raw export/reveal behavior stays unchanged. Full MCP mutations require explicit two-phase prepare/confirm tokens; preparation performs no network request.

## Delivery Authorization (2026-10-28)

The user explicitly requests local verification, publication of the new version, and source-code push. This authorizes immutable v0.2.0 author releases in each repository's existing public/private channel, a tag-only source prerequisite, and then fast-forward updates to the existing source branches. It does not authorize production service writes, changing the user's real MCP grants, official Store signing, unrelated branch merges or overwriting prior assets.

## Approved 0.2.1 Store Compatibility Patch (2026-10-29)

The user explicitly approves the corrected patch release. For this focused patch,
the active version requirement is `0.2.1`; the preceding `0.2.0` implementation
and delivery record remain historical. Remove only the unsupported `mcpTools`
field from `.dbx-store.json`, preserving the complete manifest MCP contribution,
five tools/access declarations, service/UI behavior and user-controlled grants.

Keep the release generator's top-level `plugin` identity plus `artifacts` format.
The generated identity may retain its MCP hint, but current Store metadata and
candidate schemas do not support that field and must not receive it. Verify
against the actual Store importer/schema at
`t8y2/dbx-plugin-store@5b8ab0045086a9838c35b730c5a37df02632f870`, with closed local
fetch fixtures and all five target packages. Preserve immutable `0.2.0` assets
and receipts. Local implementation/verification does not itself publish a
release, submit/sign a Store candidate, install packages or change real profiles.

## Maintainer Review Response 0.2.2 (2026-10-29)

The active release version is now `0.2.2`. Earlier 0.2.0/0.2.1 scope and receipts
remain historical and immutable; do not replace their tags or assets. The current
Store baseline is Apollo 0.1.3: neither 0.2.0 nor 0.2.1 entered the Store. Active
Store notes must disclose the full five-tool read/write/full MCP upgrade since
that baseline, as well as removal of the unsupported `mcpTools` listing field.
Use the exact reviewer wording retained in `../../release-notes-v0.2.2.md` and
pin listing source to the repository's `tree/v0.2.2`, not its moving root.

Only active version/listing metadata and release workflow/provenance verification
change. Preserve the complete manifest contributions, `host.storage` permission,
plugin ID/publisher, service API, UI, lifecycle identity, redaction, read-only and
explicit-confirmation guards. Upgrading grants no access. Matching updated DBX
Desktop and standalone MCP are required; known visual/native acceptance gaps
remain unchanged.

Build 0.2.2 in clean CI through the official reusable workflow pinned at
`417c1bfc28ea8669dfbc2e1525f54e3b68285b1c`, with `install-plugin-cli: false`,
Go 1.26.3 and the existing backend `replace ... => ./sdk` retained. Invoke
`scripts/package-ci.py` with `RELEASE_TAG=v0.2.2` and `DBX_PLUGIN_TARGET`.
Verify full packaged executable VCS provenance, including `vcs.revision` equal
to the resolved tag commit and `vcs.modified=false`; retain complete build info
and a per-target provenance record beside package/artifact metadata. Missing or
mismatched provenance must fail packaging. All five targets, final hashes/sizes,
initialize identity/version and actual Store import/validation are required.

Fresh CI, downloaded-byte/provenance verification, publication and Store
review/signing remain pending delivery gates until separately evidenced. Source
edits or historical receipts cannot be described as those results. No live
service calls, Desktop installs, user-grant changes or official signing are
authorized by this source implementation subtask.
