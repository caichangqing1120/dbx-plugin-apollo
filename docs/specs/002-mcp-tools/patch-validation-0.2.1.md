# Apollo 0.2.1 Patch Validation

Date: 2026-10-29. Source base: `6eceb98d78556f3d35745ce50411ba45e8c7ac67`.
Store reference: `t8y2/dbx-plugin-store@5b8ab0045086a9838c35b730c5a37df02632f870`.
This is local candidate evidence, not a release or Store acceptance receipt.

## Scope And Observed Regression

The current Store importer accepts the existing top-level `plugin` identity plus
`artifacts` index but rejects `mcpTools` in `.dbx-store.json`. The candidate schema
also forbids that property. Remove it only from Store metadata; retain the
manifest's five MCP tools and read/write/full access declarations. The generated
release identity's hint remains supported by the author tooling and is ignored
by the importer. No service/UI/MCP implementation or grant behavior changes.

Before the fix, the new 31-test release suite fails in exactly two tests:
generated metadata import returns `Unsupported store metadata field 'mcpTools'`,
and active version validation reports `0.2.0 != 0.2.1`. After the fix the same
suite passes, including a legacy-metadata rejection/no-output assertion. Tests
run both the actual Store checkout via `DBX_STORE_ROOT` and a byte-identical
pinned importer fixture for normal standalone test runs. All fetches are replaced
by a closed local response map; unexpected URLs throw without network access.

## Fresh Checks

| Command/check | Result |
| --- | --- |
| Baseline `GOARCH=arm64 go test ./...` in `backend` | PASS |
| Baseline Node / release tests | PASS: 207 / 28 after existing npm dependencies are installed |
| `npm ci --ignore-scripts --no-audit --no-fund` | PASS, 11 packages; no dependency version changes |
| `DBX_STORE_ROOT=../store python3 -m unittest discover -s tests -p test_release.py` | RED before fix; GREEN 31 after fix |
| `npm test` | PASS: 207 Node + 31 Python release tests |
| `GOARCH=arm64 go test -count=1 ./...` in `backend` | PASS |
| `GOARCH=arm64 go test -count=1 -race ./...` in `backend` | PASS |
| `GOARCH=arm64 go vet ./...` in `backend` | PASS |
| `npm run build` | PASS; generated tracked UI remains byte-identical |
| `GOMAXPROCS=2 python3 scripts/release.py --target all` | PASS; five targets built serially |
| `python3 scripts/verify-package.py dist/release-v0.2.1/io.github.caichangqing1120.apollo-0.2.1-darwin-arm64.dbxp --handshake` | PASS; actual Mach-O ARM64, initialize ID/version `0.2.1` |
| `APOLLO_SMOKE_SIDECAR=<unpacked ARM64 candidate> npm run test:smoke` | PASS; existing complete sidecar/service flow against loopback fixture, including controlled mutation paths |
| AJV 2020 + URI formats, complete current DBX manifest schema | PASS: active manifest and all five packaged manifests |
| Actual Store importer, final generated release index and metadata via closed fetch map | PASS; five-target candidate, no unsupported candidate fields |
| AJV 2020 + URI formats, complete current Store candidate schema | PASS |
| Actual Store `node scripts/validate.mjs --plan-candidates` in disposable Store copy | PASS; existing unrelated localization warnings remain advisory |
| Current author publisher local preflight, remote lookup replaced by a stop sentinel | PASS; all five packages, notes, aggregate identity/bytes, checksum list and proof agree; no remote command called |
| `git diff --check` | PASS |

The machine is ARM64 while the shell's Go default and Python architecture report
x64. Native Go checks therefore explicitly set `GOARCH=arm64`; packaging sets
GOOS/GOARCH per target and inspects Mach-O/PE/ELF headers. The existing helper's
automatic Darwin x64 initialize also passes under the local compatibility
runtime. ARM64 initialize and smoke are explicitly verified separately, not
inferred from the helper's native-target label.

## Candidate Set And Preservation

`dist/release-v0.2.1/` holds five `.dbxp` files, five `.artifact.json` files,
`release-candidates.json`, `SHA256SUMS-v0.2.1.txt` and `package-verification.json`
(13 assets total). Each archive has 26 entries and 25 pinned checksum entries;
the actual target executable, reviewed manifest, complete UI/source equality,
artifact hash/size and aggregate index are checked by the existing helper.

| Target | Actual executable | Package bytes |
| --- | --- | ---: |
| darwin-arm64 | Mach-O 64-bit ARM64 | 2938078 |
| darwin-x64 | Mach-O 64-bit x64 | 3160924 |
| windows-x64 | PE32+ x64 | 3174927 |
| linux-x64 | ELF 64-bit x64 | 3133526 |
| linux-arm64 | ELF 64-bit ARM64 | 2858506 |

The manifest differs only in version from the source base. No service/MCP source,
UI, old release notes or historical receipts are modified. Exact hashes and
verification reports are in the candidate output; external logs and the
generated Store candidate are retained in the task evidence directory under the
logical key `evidence/apollo`.

## Remaining Gates

No commit, tag, push, release upload, Store submission/signing/merge, package
installation, production-service request or real profile/grant change is
performed by this patch implementation. Windows/Linux runtime execution,
production Apollo acceptance and prior visual gaps remain unverified. Matching
updated DBX/MCP builds and explicit user authorization are still required.
