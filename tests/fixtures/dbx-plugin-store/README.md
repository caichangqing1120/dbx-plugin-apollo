# DBX Store Compatibility Fixture

These files are unmodified Apache-2.0 upstream fixtures from
`t8y2/dbx-plugin-store` commit `5b8ab0045086a9838c35b730c5a37df02632f870`:

- `scripts/sync-release-candidate.mjs` -> `sync-release-candidate.mjs`
- `schemas/plugin-candidate.schema.json` -> `plugin-candidate.schema.json`

The release tests execute the real importer with a closed, in-memory fetch map;
unexpected URLs fail rather than reaching the network. Set `DBX_STORE_ROOT` to a
Store checkout to exercise that checkout's importer and schema instead.

SHA256:

```text
b8d653b9841e613a181989db58adc9391c5a504ecd4d2e272ba1d52044dc60de  sync-release-candidate.mjs
ad79a8bea4c24ef54fb9e7aa61e40090fc9d8810994d65155f548c39b55715ee  plugin-candidate.schema.json
```
