# Native RC2 Repair Validation

Date: 2026-10-20. Result: **10 focused native cases PASS**. Full 24-page / 31-dialog /
all-state 1:1 acceptance: **FAIL**, unchanged.

## Exact Environment

- Actual macOS DBX **0.6.49**, not the browser SDK host.
- Plugin **0.1.3-rc.2**, macOS ARM64 unsigned development package, SHA-256
  `2753212b424b227352c3f05b97450a4b236461fd7b16f7745cafd62971c5701f`.
- Real upstream Apollo **2.5.2**, commit `ed9785c87b390c22efece9ea7ec7eeab2d20a042`,
  ordinary authentication and persistent H2, all three services on loopback only.
- User confirmed the local replacement and requested verification/publication. DBX first
  refused the update while the test connection was open; only `Apollo 本地实机验证` was
  closed, then the same verified package installed successfully. The existing unsigned
  development setting, saved connection and unrelated sessions were not modified.

The [machine record](native-rc2-validation-2026-10-20.json) retains all case results,
observations and raw file hashes. Evidence is local under `output/playwright/native-rc2/`.

## Passed Cases

| Case | Observed Native Result |
| --- | --- |
| Installation | Installed list and Host confirmation explicitly show `0.1.3-rc.2` |
| Saved credentials | Original local connection reopens without entering its password |
| Success auto-dismiss | Success is visible initially/during input and gone later without X or another action |
| Input focus/cursor | Focus remains on `native`; typing `x` after expiry produces `nativxe`, proving the prior cursor position is retained |
| Next-dialog cleanup | A second success disappears immediately when the next item dialog opens; that new dialog is canceled, not submitted |
| Successful dialog closure | Submitting the unchanged existing local item succeeds and automatically closes its editor |
| Folded Key target | Selecting the real Key match unfolds `application` and shows the filtered table |
| Text-mode Key target | Selecting the real Key match returns the target to table mode while leaving the other Namespace folded |
| Cluster management | Both actual clusters and their compact assignment controls render in native DBX |
| Ordinary app search | App autocomplete plus Enter navigates from management back to the actual app configuration |

The native dismissal observation is a later upper-bound check, not a millisecond benchmark.
The exact 5000ms deadline is covered by timer regressions and the separate real-Apollo SDK
measurement (about 5.4 seconds including polling overhead). Native before/after evidence
proves that it no longer needs a user dismissal. Errors are not treated as success toasts.

The original [RC1 finding](live-apollo-validation-2026-10-20.md) remains historical evidence:
RC1 had persistent success feedback. `NATIVE-UX-01` is **fixed and natively verified in RC2**;
no claim is made that immutable RC1 packages changed. This continuation does not repeat a
publish or rollback merely to produce another toast.

## Data And Safety Readbacks

Only the dedicated `DBXNative20261020` local application is involved. The native checks
perform two favorite toggles and one resubmission of the unchanged existing test item.
Independent real Portal/ConfigService reads before and after show:

- Key `native.acceptance` still has editable draft **`native-v2`**.
- Its type/comment and existing identifier are unchanged.
- Real clients still receive published **`native-v1`**, with the same release key.
- No DELETE, new item, publish, rollback, account, permission or API-key write is executed.

The final native workbench has both Namespaces expanded, the temporary filter closed and
no stale success. The requested real Apollo service and user-owned DBX remain running.

## Remaining Boundaries

This is a scoped repair gate, not all-page native parity, cold DBX restart/Secret Store,
native file transfer, multi-account permission, production/MySQL or Windows/Linux runtime
acceptance. Multi-environment pagination is covered by the actual controller/DTO-shaped unit
regression, not by claiming a second deployed environment in this local single-env lab.
Author release, official Store review, signing and listing remain separate delivery gates.
