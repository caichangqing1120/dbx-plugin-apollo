# Reference, Not Bundled Runtime

Apollo reference: https://github.com/apolloconfig/apollo/tree/v2.5.2

Commit: `ed9785c87b390c22efece9ea7ec7eeab2d20a042`.

Pages, DOM, CSS, routing/state and JavaScript are independently authored under `src/`.
No Apollo HTML, AngularJS, Bootstrap or original controllers are built into the plugin.
Only logo/config images, the four-glyph Apollo icon font and GitHub SVG in `assets/`
are reused design assets (Apollo Authors, Apache-2.0); no upstream runtime is bundled.
The DBX host's standard sandbox iframe is not a remote Apollo website or nested Portal.

API source references under upstream `apollo-portal/src/main/java`:

- `portal/spi/configuration/AuthConfiguration.java`: form/session authentication.
- `portal/controller/UserInfoController.java`: current user and password updates.
- `portal/controller/PermissionController.java`: creation/global/env/cluster permissions.
- `portal/controller/AppController.java`: projects and environment navigation.
- `portal/controller/ClusterController.java`: session-authenticated cluster creation.
- `portal/controller/ItemController.java`: singular `/item`, JSON NamespaceTextModel.
- `portal/entity/bo/{NamespaceBO,ItemBO,ReleaseBO,ReleaseHistoryBO}.java`: response shapes.
- `portal/entity/model/NamespaceTextModel.java`: namespaceId, format, operator, configText.
- `portal/controller/ReleaseController.java`: versions, publishing, rollback and comparison.
- `portal/controller/CommitController.java`, common `dto/{CommitDTO,ItemChangeSets,ItemDTO}.java`:
  commit pagination/filter, change sets and numeric item types.
- `portal/controller/{NamespaceBranchController,NamespaceController,ConfigsImportController,ConfigsExportController}.java`: gray/sync/import/export.
- `portal/controller/{AccessKeyController,ConsumerController,PermissionController}.java`:
  keys, consumers and system grants.
- `portal/controller/SystemInfoController.java` and audit module `ApolloAuditController.java`:
  service information/health and audit list/trace.

The exact controller names for advanced APIs are recorded by literal path/body regression
tests; original source is checked out outside the deliverable and is not needed to build.

Visual measurements reference `static/styles/common-style.css` and home/config/history/admin
structures. These are investigation evidence, not copied stylesheets/templates in the plugin.
Full pixel-perfect and interaction parity is not yet verified.
