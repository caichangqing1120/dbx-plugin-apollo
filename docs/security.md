# Privacy, Security And Native Behavior

## Permissions And Persistence

The only declared Manifest permission is `host.storage`. It stores language, recent
application and route metadata through DBX's Host API, not credentials or configuration
contents. Passwords come from the DBX connection secret binding. The production Host owns
secret storage; the development CLI's ignored `.dbx-dev/` plaintext connection files are
not a production Secret Store and must never be committed or packaged.

Per-connection session cookies and active transfers live in Go sidecar memory. They are
discarded on disconnect/session invalidation or process exit. Passwords/cookies do not
enter frontend context, browser persistent state or backend error messages. Explicitly
requested AccessKey/consumer token screens display those values temporarily, but do not
persist them. This is not a guarantee that the upstream Portal's own logging is secret-free.

## Network And Data Access

The sidecar sends HTTP(S) only to the user-configured Apollo Portal origin and context
path, including login and the management APIs selected by the user. Authenticated
redirects or request paths cannot escape that origin/context. TLS uses system trust and
does not disable certificate verification. HTTP remains available for legacy internal
deployments; use HTTPS on untrusted networks. There is no plugin telemetry or remote
asset/CDN load from the management workbench.

Management actions can read and modify applications, configuration, namespaces, gray
releases, roles, consumers, tokens, users and system parameters within the connected
account's Portal permissions. Read-only DBX contexts reject writes. Destructive actions
have confirmations, but production use still requires the operator's own authorization
and backups. No write is automatically replayed after failure.

The sidecar enforces a 4 MiB HTTP body limit and bounded chunked JSON-RPC transfer under
the Host message limit. User-initiated configuration file import and export use Host file
transfer/save APIs; file contents are not persisted in workbench storage.

## Native Executable

Every native package contains one Go executable using stdio JSON-RPC. Production code
does not spawn shells, child processes or external commands, open a listening port, write
credential files, or execute a bundled development server. Fixture servers, package
scripts, tests and source files are not included in `.dbxp` packages. The backend uses
the standard HTTP client and a vendored Apache-2.0 DBX Go SDK.

## Verification Boundaries

Tests use controlled loopback fixtures, not real Apollo credentials/data. All-page 1:1
acceptance still fails; see [parity-finish.md](parity-finish.md). Native desktop installation,
production Secret Store/restart and live Apollo persistence/readback are unverified.
Unsigned author candidates are not official signed marketplace artifacts. Report problems
at https://github.com/caichangqing1120/dbx-plugin-apollo/issues without posting secrets.
