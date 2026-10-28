# Apollo MCP Upgrade Validation

This is the initial implementation-stage snapshot. The subsequently authorized release-stage validation is recorded in `release-validation.md`; historical no-push/no-publication statements below describe the initial stage.

Date: 2026-10-28. Base: upstream author main `e7fb9b86a1b4769a241a034d7f8316c93dc3a3ef`.
State: local uncommitted implementation on detached HEAD; no remote actions or installation.
Authoritative host contract: DBX `8c2bbe35b`, complete `plugins/manifest.schema.json`
and `plugins/README.md` MCP contribution/bridge sections.

## Delivered Surface

| Tool | Maximum Access | Toolset |
| --- | --- | --- |
| `apollo_read` | read | configuration |
| `apollo_session` | read | configuration |
| `apollo_write` | write | configuration |
| `apollo_admin` | full | administration |
| `apollo_authorize_consumer` | full | administration |

Five tools total: two read, one write, two full. The finite backend route registry
contains 109 method/path contracts: 58 read, six ordinary write, 45 full. The exact
method/path/query inventory is maintained in `plan.md`; the dedicated consumer tool
adds backend-only existing-token lookup followed by the existing role-grant endpoint.
Connection lifecycle and chunk transport helpers remain internal, not model tools.

`mcp/tools` only constructs schemas. `mcp/call` validates tool, schema fields,
connection identity, method/path/query and body/header limits before authentication.
Model arguments cannot override connection authentication or routing. Each execution
uses a lifecycle-authenticated temporary session; cached UI sessions and transfers
are never overwritten/disconnected. Current lifecycle readonly policy is checked
before confirmation/authentication and cannot inherit cached writable permissions.
Existing non-GET readonly restrictions still apply to POST syntax/diff computations.

Full-access calls require explicit prepare/execute confirmation. Prepare performs no
network work and returns a redacted action/target/body summary; random tokens expire
after two minutes, bind the exact tool/request/lifecycle and are consumed before
authentication/dispatch. Failed operations cannot replay writes. Two-phase confirmation
does not grant/elevate host resource access. Contextual UI-only modal previews, in-use
rechecks and wizard state are **not replayed**; this is not 1:1 UI automation. Users
must review exact service method/path/body before approving the full-access call.

MCP output is marked untrusted, bounded to 512 KiB, and credential-named fields,
secret-named configuration values, known lifecycle/new-provisioning secrets, embedded
JSON and secret-bearing map keys are redacted. Managed consumer tokens/access keys
are never returned. Binary/unstructured exports produce metadata only, **not raw
backup/export bytes**. Arbitrary opaque user configuration cannot be guaranteed
secret-free; users must authorize the connection and review data-sharing policy.
The deliberate UI raw export/reveal behavior is unchanged.

## Baseline And Observed RED

- `cd backend && go test ./...`: PASS before implementation (0.778s).
- `npm ci --ignore-scripts`: PASS. Existing dev dependency `happy-dom` 21.0.3 has
  high advisory GHSA-834v-8h66-3h79; no unrelated dependency upgrade performed.
- Baseline `npm test`: PASS, 207 Node tests plus 28 Python release tests.
- Initial MCP tests: observed FAIL with `-32601 Method not found: mcp/tools` /
  `mcp/call` before adding the bridge. Manifest parity then observed FAIL until
  declarations were added.
- Candidate metadata test: observed FAIL for missing `mcpTools`, then PASS after
  updating active metadata generation/publish validation only.
- Further observed regression RED/GREEN cases: confirmation did not identify exact
  target/action; missing existing `N/items` read endpoint; text-config/API-key/dynamic
  map-key leaks; irrelevant empty/null arguments accepted by a different tool schema;
  HTTP-200 Apollo status/partial-environment error envelopes looked like success.

## Final Verification

| Command / Check | Result |
| --- | --- |
| `cd backend && go test -count=1 -json ./...` | PASS, 25 top-level tests + 125 subtests (150 passing events), package 1.883s |
| `cd backend && go test -count=1 -race ./...` | PASS, 3.478s |
| `cd backend && go vet ./...` | PASS, no output |
| `npm test` | PASS, 207 Node tests (0 failed/skipped) + 28 Python release tests |
| `npm run build` | PASS, self-contained handwritten UI; generated UI unchanged |
| `npm run test:smoke` | PASS, actual sidecar JSON-RPC against local fake Apollo; existing edit/publish/rollback/gray/sync/access-key/consumer/role/audit/import/export/large-transfer behavior |
| Complete upstream schema with `Draft202012Validator` 4.26 | PASS for manifest, version 0.2.0 |
| `python3 scripts/release.py --target all` | PASS, five unsigned packages, hashes/architecture/UI-source equality verified |
| `GOARCH=arm64 dbx-plugin package . --target darwin-arm64 --output-dir dist/mcp-cli` | PASS with official CLI 0.1.9, new MCP declarations retained |
| `python3 scripts/verify-package.py dist/mcp-cli/io.github.caichangqing1120.apollo-0.2.0-darwin-arm64.dbxp --handshake` | PASS, packaged initialize ID/version 0.2.0 |
| Native cross-package initialize checks | PASS darwin-x64 (build script native detection) and explicit darwin-arm64 handshake |
| `git diff --check` | PASS |

The 11 new MCP top-level tests include 107 independently listed endpoint dispatch
cases, separate `/user` and consumer grant/session coverage, zero discovery/preparation
network effects, lifecycle runtime transformation, UI session preservation, readonly
denial before network, missing/mismatched identity, malformed/unknown input, exact
manifest/discovery parity/access hints, confirmation mismatch/expiry/single-use,
provisioning-password full-only classification, service errors and secret redaction.
All HTTP fixtures are task-owned loopback servers and close at test cleanup; no
browser session was started.

## Package Evidence

Candidate artifacts are ignored build output under `dist/release-v0.2.0/`.
Architecture/checksum/source verification passes for all five targets; only macOS
initialize processes were executed locally.

| Target | SHA256 | Bytes |
| --- | --- | --- |
| darwin-arm64 | `8c09e947a6461a2ab79f306006f624f32159449b8e67cedbfa5447ed6f45a45d` | 2937239 |
| darwin-x64 | `85340d37602749fcfec8a4842edff9aa1e1f659ade1f02593791274839ebdb72` | 3159073 |
| windows-x64 | `ddf40bc0fafba600ab8005871bf377c0950f69649d73088a20e250d4283a0f85` | 3173730 |
| linux-x64 | `4a0ae9e5624a77165ab7fc1730aad7950762c1cebc7aa381293e33e1f43ebafd` | 3132310 |
| linux-arm64 | `8f5d6e7ea3b1ad1b93153e773186cf4d52d77e413fb0b803d16dca8d0502eb80` | 2857276 |

Official CLI arm64 candidate additionally verified SHA256
`4b931d37a051b5ef4a57610ade1f9297c5aa91895a48880d49d23ca0cb28ffd1`,
5455027 bytes; it uses different compiler strip flags than the custom five-target
script, so differing bytes are expected and were verified independently.

## Active Metadata And Limits

Active manifest, backend initialize, package and lockfile versions are 0.2.0.
Active Store metadata points to v0.2.0 and declares `mcpTools: true`; the candidate
generator derives that flag from the MCP contribution. ID/publisher/permissions and
engine floor are unchanged. Historical receipts/tags/release notes were not rewritten.
Matching updated DBX Desktop and standalone MCP implementing `8c2bbe35b` semantics
are required; no unverified semver floor was invented. Upgrade never changes grants.

No live Apollo credentials, writes, DBX grants, install, restart, push, publication,
signature, deployment or business acceptance was performed. Windows/Linux packages
were cross-built/static-verified, not executed. No DBX Desktop/standalone MCP host
end-to-end acceptance or live multi-account acceptance is claimed. Existing UI visual
parity/native acceptance gaps remain unchanged. The environment's CLI detects arm64
while Go/Python default to x64; the CLI package command explicitly used GOARCH=arm64.
An initial x64 CLI target was refused before build; corrected arm64 packaging passed.
An attempted nonexistent CLI version 0.4.134 returned npm ETARGET; installed official
0.1.9 worked, no global upgrade was performed.

## Independent Review Fixes

- A reviewer reproduced an enabled-transport/missing-runtime direct-login fallback and the omitted `GET /users` capability. Added regression tests, watched both fail, then restored the exact user-search query contract with typed boolean/pagination bounds and rejected incomplete enabled transport lifecycles before authentication.
- Full-action confirmation now binds the complete raw lifecycle, including routing fields. Its targeted mutation test failed with the old digest, then passed with the complete binding.
- These fixes are verified by fresh full tests/race/vet and regenerated candidate checks; no second independent review is claimed.
