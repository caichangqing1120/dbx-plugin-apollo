# Apollo Portal Console 0.2.1

Patch candidate prepared on 2026-10-29. Author publication, official DBX Store
review/signing/listing and installation acceptance are separate gates; this
document does not assert they have completed.

## Changes

- Removes the unsupported `mcpTools` property from `.dbx-store.json`. The current
  Store importer rejects that property before preparing a candidate.
- Keeps the existing release generator's top-level `plugin` identity plus
  `artifacts` contract. Its identity hint may still include `mcpTools`; the Store
  importer intentionally does not copy that hint into the candidate schema.
- Preserves all five manifest MCP tools, read/write/full access declarations,
  lifecycle identity, redaction, readonly and confirmation guards. No service API,
  UI behavior or user grant changes are part of this patch.
- Aligns active package, manifest and backend initialize versions to `0.2.1`.
  Immutable `0.2.0` tags, release receipts and published assets are not rewritten.

## Validation And Compatibility

See `specs/002-mcp-tools/patch-validation-0.2.1.md` for fresh commands and results.
The importer regression uses generated packages and a closed local fetch fixture,
not real Apollo credentials or service requests.

The matching updated DBX Desktop and standalone MCP requirement is unchanged
from `0.2.0`; the engine floor alone does not prove older-host compatibility.
Enable the plugin and explicitly authorize its connections/tools in MCP settings.
Installing or upgrading does not grant access automatically.

## Candidate Assets

The local complete set is generated under `dist/release-v0.2.1/`, including five
native-target `.dbxp` files, `release-candidates.json`, artifact metadata,
`package-verification.json` and `SHA256SUMS-v0.2.1.txt`. These are unsigned author
candidates, not official Store-signed packages. Cross-platform runtime execution,
production-service acceptance and previously documented visual gaps are not
resolved by this metadata patch.
