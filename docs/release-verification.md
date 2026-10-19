# Preview Release Verification - 0.1.2

Date: 2026-10-19. Scope: package/release infrastructure only. **Full 1:1 gate remains FAIL.**
The user explicitly authorized complete installation candidates, source push and marketplace
submission; no official signing authority or acceptance completion is implied.

## Local Preflight

- `npm test`: 161 JavaScript tests and 12 standard-library Python packaging tests pass.
  Packaging tests first fail before implementation and cover real archive bytes, actual CPU
  header mismatches, deterministic packaging, symlink/path rejection, checksum tampering,
  manifest/default normalization, preservation of the full release index after single-target
  packaging and the store synchronizer's `plugin`/`artifacts` contract.
- `go test -race -count=1 ./...` and `go vet ./...`: unchanged backend passes (14 tests).
- `npm run package:all`: five full unsigned archives build and verify; each has 23 entries
  and 22 checked content digests, matching source manifest/permissions and all UI/assets.
- Official DBX CLI 0.1.9 also packages the reviewed source successfully. Its two omitted
  backend defaults are confirmed in the Host's `PluginBackendEntrypoint` serde behavior;
  only exact `[1]` protocol and `stdio-jsonl` default omission is normalized by the verifier.
  An explicitly changed transport still fails source equality.
- Both local packaged darwin-arm64 and darwin-x64 executables pass the actual initialize
  identity handshake and the complete controlled-fixture smoke suite, including 2 MiB
  chunked body/reply transfers. Windows/Linux header checks are not local runtime acceptance.
- `git diff --exit-code -- src ui` passes after the release builds. The verified UI SHA-256
  remains `306372e3fd343780419c543c5d420676b31ce00d4152b0235ce001b6a1dfdeef`;
  source digest remains `8a94f26740c40b1c0ad678568012ecc4bbfa56750b9d110afff4a6527c69a519`.
  Previous developer-owned browser evidence remains applicable to those unchanged bytes;
  its failed full-page acceptance is not waived or rerun as a passing package check.
- Source filename/content review finds no private keys or real credentials. Fixture-only
  dummy credentials are intentional test data. Generated packages, `.dbx-dev/`, caches,
  dependency directories and browser output are not source commits.

## Published Candidate Provenance

Public source: https://github.com/caichangqing1120/dbx-plugin-apollo/tree/v0.1.2

Release: https://github.com/caichangqing1120/dbx-plugin-apollo/releases/tag/v0.1.2

The standalone GitHub workflow checks the exact source tag/version, runs all tests and Go
race/vet, rebuilds the verified UI, cross-builds all five real executables with explicit
GOOS/GOARCH/CGO settings, verifies each archive and executes the packaged Linux x64 smoke.
Only CI-generated candidate assets are uploaded; the local macOS preflight archives and
host-specific proof reports are not uploaded first. Existing stable releases are explicitly
rejected: unsigned Preview candidates require a GitHub prerelease. Published files cannot be clobbered:
reruns must match existing bytes or fail. There is no private signing key in this workflow.

For each published package, the author delivery step downloads the Release's exact bytes
and rechecks SHA-256, size, every archive checksum, native CPU, source/UI equality and
packaged macOS handshakes/smoke. The Release checksum and identity/artifact JSON files pin
the authoritative bytes. CI run results and the final candidate PR provide live delivery
status; this preflight record is not a claim that maintainer approval is already complete.

## Store Submission And Remaining Gates

Only `candidates/io.github.caichangqing1120.apollo.json` is submitted to `t8y2/dbx-store:main`.
The publisher identity already exists. Official `plugins/` and `catalog/` are not edited by
the author. The store schema planning validation and release-sync tests are separate from
the intentionally red normal check while unsigned candidates await official signing.

DBX Store maintainers own review, protected signing and merge. Until those finish, the
accurate status is **Preview published; marketplace candidate submitted/pending review**,
not officially listed. No extra submission issue, fake signature/verified flag, issue closure,
production Apollo mutation, native desktop installation or live backend acceptance is implied.
