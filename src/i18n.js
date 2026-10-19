import { referenceCopy } from "./reference-copy.js";
const messages = {
  zh: {
    myProjects: "我的项目",
    favorites: "收藏的项目",
    recent: "最近浏览的项目",
    publicNamespaces: "公共 Namespace",
    createProject: "创建项目",
    appId: "AppId",
    appName: "应用名称",
    department: "部门",
    owner: "负责人",
    email: "邮箱",
    help: "帮助",
    admin: "管理员工具",
    users: "用户管理",
    systemConfig: "系统参数",
    search: "搜索应用 ID 或应用名称",
    noData: "暂无数据",
    loading: "加载中…",
    retry: "重试",
    refresh: "刷新",
    envs: "环境列表",
    projectInfo: "项目信息",
    projectManage: "项目管理",
    manageCluster: "集群管理",
    createCluster: "创建集群",
    createNamespace: "添加 Namespace",
    config: "配置",
    history: "发布历史",
    permissions: "权限管理",
    gray: "灰度",
    publish: "发布",
    addItem: "新增配置",
    text: "文本",
    table: "表格",
    filter: "搜索配置项",
    key: "Key",
    value: "Value",
    comment: "备注",
    modifiedBy: "修改人",
    modifiedTime: "修改时间",
    actions: "操作",
    edit: "修改",
    remove: "删除",
    cancel: "取消",
    save: "提交",
    close: "关闭",
    itemEdit: "修改配置",
    itemCreate: "新增配置",
    releaseTitle: "发布名称",
    releaseComment: "发布备注",
    emergency: "紧急发布",
    confirmPublish: "发布配置",
    pending: "有未发布的修改",
    published: "已发布",
    private: "私有",
    public: "公共",
    rollback: "回滚",
    confirmRollback: "确定回滚到上一个有效版本？此操作会立即影响客户端配置。",
    confirmDelete: "确定删除此配置项？删除后需要发布才会对客户端生效。",
    confirm: "确定",
    success: "操作成功",
    denied: "没有此操作的权限",
    hidden: "当前账号没有查看配置内容的权限",
    connect:
      "请在 DBX 新建并打开 Apollo 连接，填写 Portal 主机、端口、用户名和密码。",
    reconnect: "重新连接",
    expired: "登录已过期，请重新连接",
    logout: "退出登录",
    disconnected: "已断开 Apollo 会话",
    userId: "用户名",
    name: "姓名",
    enabled: "启用",
    newUser: "创建用户",
    password: "密码",
    namespace: "Namespace 名称",
    format: "格式",
    isPublic: "公共 Namespace",
    clusterName: "集群名称",
    modified: "已修改",
    release: "发布版本",
    operator: "操作人",
    time: "时间",
    details: "详情",
    back: "返回配置",
    addRole: "添加权限",
    role: "角色",
    user: "用户",
    loadMore: "加载更多",
    changes: "变更",
    newKey: "新增",
    deleted: "已删除",
    view: "查看",
    branch: "灰度分支",
    createGray: "创建灰度",
    rules: "灰度规则",
    noGray: "尚未创建灰度分支",
    rootOnly: "仅管理员可访问此页面",
    newConfig: "新增参数",
    parameter: "参数名",
    readOnly: "只读连接",
    required: "请填写所有必填项",
    searchUsers: "搜索用户名",
    noRelease: "暂无发布记录",
    footer: "Apollo 配置中心",
    error: "请求失败",
    unavailable: "该页面仍在实现中",
    project: "项目",
    copy: "复制",
    unsaved: "离开前请保存或放弃尚未提交的修改",
    discard: "放弃修改",
    searchResults: "搜索结果",
  },
  en: {
    myProjects: "My Projects",
    favorites: "Favorites",
    recent: "Recently Viewed",
    publicNamespaces: "Public Namespace",
    createProject: "Create Project",
    appId: "AppId",
    appName: "App Name",
    department: "Department",
    owner: "Owner",
    email: "Email",
    help: "Help",
    admin: "Admin Tools",
    users: "User Management",
    systemConfig: "System Parameters",
    search: "Search by AppId or App Name",
    noData: "No data",
    loading: "Loading…",
    retry: "Retry",
    refresh: "Refresh",
    envs: "Environment List",
    projectInfo: "Project Information",
    projectManage: "Project Management",
    manageCluster: "Manage Clusters",
    createCluster: "Create Cluster",
    createNamespace: "Add Namespace",
    config: "Configuration",
    history: "Release History",
    permissions: "Manage Permissions",
    gray: "Gray Release",
    publish: "Publish",
    addItem: "Add Config",
    text: "Text",
    table: "Table",
    filter: "Search configuration",
    key: "Key",
    value: "Value",
    comment: "Comment",
    modifiedBy: "Modified By",
    modifiedTime: "Modified At",
    actions: "Actions",
    edit: "Edit",
    remove: "Delete",
    cancel: "Cancel",
    save: "Submit",
    close: "Close",
    itemEdit: "Edit Configuration",
    itemCreate: "Add Configuration",
    releaseTitle: "Release Name",
    releaseComment: "Release Comment",
    emergency: "Emergency Publish",
    confirmPublish: "Publish Configuration",
    pending: "Unpublished changes",
    published: "Published",
    private: "Private",
    public: "Public",
    rollback: "Rollback",
    confirmRollback:
      "Roll back to the previous active release? This immediately affects client configuration.",
    confirmDelete:
      "Delete this configuration item? Publish afterwards to apply the deletion to clients.",
    confirm: "Confirm",
    success: "Operation succeeded",
    denied: "Permission denied",
    hidden: "You do not have permission to view configuration values",
    connect:
      "Create and open an Apollo connection in DBX with your Portal host, port, username and password.",
    reconnect: "Reconnect",
    expired: "Session expired. Reconnect to continue.",
    logout: "Sign Out",
    disconnected: "Apollo session disconnected",
    userId: "Username",
    name: "Name",
    enabled: "Enabled",
    newUser: "Create User",
    password: "Password",
    namespace: "Namespace Name",
    format: "Format",
    isPublic: "Public Namespace",
    clusterName: "Cluster Name",
    modified: "Modified",
    release: "Release",
    operator: "Operator",
    time: "Time",
    details: "Details",
    back: "Back to Config",
    addRole: "Add Permission",
    role: "Role",
    user: "User",
    loadMore: "Load More",
    changes: "Changes",
    newKey: "New",
    deleted: "Deleted",
    view: "View",
    branch: "Gray Branch",
    createGray: "Create Gray Branch",
    rules: "Gray Rules",
    noGray: "No gray branch exists",
    rootOnly: "Administrator access required",
    newConfig: "Add Parameter",
    parameter: "Parameter",
    readOnly: "Read-only connection",
    required: "Complete all required fields",
    searchUsers: "Search username",
    noRelease: "No release history",
    footer: "Apollo Configuration Center",
    error: "Request failed",
    unavailable: "This page is still being implemented",
    project: "Project",
    copy: "Copy",
    unsaved: "Save or discard your unsubmitted changes before leaving.",
    discard: "Discard Changes",
    searchResults: "Search Results",
  },
};
export const translator = (locale) => (key) =>
  messages[locale.startsWith("zh") ? "zh" : "en"][key] || key;

export function observeHostLocale(initial, changed) {
  let previous = initial;
  return (locale) => {
    if (locale && locale !== previous) {
      previous = locale;
      changed(locale);
    }
  };
}

const advancedCopy = {
  destructiveWarning: [
    "此操作不可撤销，并会影响选定资源。执行前请核对环境和标识。",
    "This operation is irreversible. Verify the selected environment and identifier.",
  ],
  typeIdentifier: ["输入完整标识确认", "Type the exact identifier"],
  identifierMismatch: [
    "确认标识不匹配，尚未执行",
    "Identifier does not match; nothing was changed",
  ],
  deleteGrayAfterMerge: [
    "合并后删除灰度分支",
    "Delete gray branch after merging",
  ],
  grayPublish: ["灰度发布", "Publish Gray"],
  grayMerge: ["全量发布并合并", "Merge and Publish"],
  grayIPs: [
    "客户端 IP（逗号分隔，* 表示全部）",
    "Client IPs (comma separated, * for all)",
  ],
  grayLabels: ["客户端标签（逗号分隔）", "Client labels (comma separated)"],
  addRule: ["新增规则", "Add Rule"],
  chooseSync: [
    "请选择配置项和目标环境/集群",
    "Select configuration items and target environments/clusters",
  ],
  previewFirst: [
    "请重新预览当前选择后再同步",
    "Preview the current selection before applying",
  ],
  syncApply: ["执行同步", "Apply Sync"],
  syncDoesNotPublish: [
    "同步仅修改草稿配置，不会自动发布。请逐个核对目标环境。",
    "Sync updates drafts only and does not publish. Verify every target environment.",
  ],
  sync: ["同步/克隆配置", "Sync / Clone Config"],
  diff: ["配置对比", "Compare Config"],
  source: ["源版本", "Source"],
  target: ["目标版本", "Target"],
  sourceItems: ["选择源配置项", "Select Source Items"],
  syncTargets: ["选择目标环境/集群", "Select Targets"],
  preview: ["预览差异", "Preview Changes"],
  enableKey: ["启用", "Enable"],
  disable: ["禁用", "Disable"],
  keyMode: ["启用模式", "Mode"],
  keyFilter: ["过滤校验", "Filter"],
  keyNotify: ["通知模式", "Notify"],
  accessKeys: ["访问密钥管理", "Access Keys"],
  createKey: ["新增密钥", "Create Access Key"],
  secret: ["密钥", "Secret"],
  systemRoles: ["系统角色管理", "System Roles"],
  systemInfo: ["系统信息", "System Information"],
  serviceType: ["服务类型", "Service Type"],
  address: ["地址", "Address"],
  health: ["健康状态", "Health"],
  checkHealth: ["检测", "Check"],
  userList: ["用户名列表（逗号分隔）", "Usernames (comma separated)"],
  envList: ["环境列表（逗号分隔）", "Environments (comma separated)"],
  audit: ["审计日志", "Audit Log"],
  auditTrace: ["审计链路", "Audit Trace"],
  query: ["查询条件", "Query"],
  operation: ["操作名称", "Operation"],
  operationType: ["操作类型", "Operation Type"],
  startTime: ["开始时间", "Start Time"],
  endTime: ["结束时间", "End Time"],
  searchAction: ["查询", "Search"],
  previous: ["上一页", "Previous"],
  next: ["下一页", "Next"],
  auditDisabled: [
    "当前服务未启用审计",
    "Audit logging is disabled on this server",
  ],
  entity: ["实体", "Entity"],
  field: ["字段", "Field"],
  oldValue: ["原值", "Old Value"],
  newValue: ["新值", "New Value"],
  globalSearch: ["全局配置检索", "Global Configuration Search"],
  consumers: ["开放平台授权管理", "Open Platform Authorization"],
  newConsumer: ["创建第三方应用", "Create Consumer"],
  consumerAuthorize: ["授权", "Authorize"],
  importExport: ["配置导入导出", "Import / Export"],
  importConfig: ["导入配置", "Import Config"],
  exportConfig: ["导出配置", "Export Config"],
  file: ["配置文件", "Configuration File"],
  chooseEnvironment: ["请选择目标环境", "Select target environments"],
  saveUnavailable: [
    "当前宿主不支持保存文件",
    "The current host cannot save files",
  ],
  importWarning: [
    "导入将修改目标配置。覆盖模式可能替换已有草稿，请先导出备份。",
    "Import changes target configurations. Cover mode may overwrite drafts; export a backup first.",
  ],
  conflictAction: ["冲突处理", "Conflict Handling"],
  ignore: ["忽略已存在的 Namespace", "Ignore existing namespaces"],
  overwrite: ["覆盖已存在的 Namespace", "Cover existing namespaces"],
  transferLimit: [
    "单次文件传输上限为 4 MiB（含上传封装），超限会明确报错。",
    "Transfers are limited to 4 MiB including multipart headers; larger files fail explicitly.",
  ],
  importDoesNotPublish: [
    "导入只修改配置，不会自动发布。导出数据可能包含敏感信息。",
    "Import does not publish. Exported configuration may contain secrets.",
  ],
  allApplications: ["全部应用配置", "All Applications"],
  deleteResource: [
    "删除应用/集群/Namespace",
    "Delete Application / Cluster / Namespace",
  ],
  resourceType: ["资源类型", "Resource Type"],
  chooseDepartment: ["请选择部门", "Choose a Department"],
  administratorList: ["项目管理员", "Application Administrators"],
  instances: ["客户端实例", "Client Instances"],
  releaseCompare: ["发布版本对比", "Compare Releases"],
  differentVersions: ["请选择不同版本", "Choose two different releases"],
  more: ["更多", "More"],
  rollbackTo: ["回滚到此版本", "Roll Back To This Version"],
  allEnvs: ["全部环境", "All Environments"],
  configDb: ["Config DB", "Config DB"],
  scope: ["范围", "Scope"],
};
for (const [key, [zh, en]] of Object.entries(advancedCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
Object.assign(messages.zh, {
  namespaceMode: "Namespace 类型",
  newNamespace: "新建 Namespace",
  linkNamespace: "关联公共 Namespace",
  namespacePrefix: "公共 Namespace 自动添加部门前缀",
  confirmPassword: "确认密码",
  passwordMismatch: "两次输入的密码不一致",
  keyNotify: "观察模式",
});
Object.assign(messages.en, {
  namespaceMode: "Namespace Type",
  newNamespace: "Create Namespace",
  linkNamespace: "Link Public Namespace",
  namespacePrefix: "Prefix public namespace with department",
  confirmPassword: "Confirm Password",
  passwordMismatch: "Passwords do not match",
  keyNotify: "Observer",
});
Object.assign(messages.zh, {
  allowCreateApplication: "允许创建 Apollo 应用",
  rateLimitEnabled: "启用请求限流",
  rateLimit: "限流值",
  expires: "Token 过期时间（可选）",
  invalidRateLimit: "限流值必须是正整数",
});
Object.assign(messages.en, {
  allowCreateApplication: "Allow application creation",
  rateLimitEnabled: "Enable rate limiting",
  rateLimit: "Rate limit",
  expires: "Token expires (optional)",
  invalidRateLimit: "Rate limit must be a positive integer",
});
Object.assign(messages.zh, {
  myProjects: "我的应用",
  favorites: "收藏的应用",
  recent: "最近浏览的应用",
  createProject: "创建应用",
  search: "搜索 AppId、应用名、配置项 Key",
});
Object.assign(messages.en, {
  myProjects: "My Applications",
  favorites: "Favorite Applications",
  recent: "Recently Viewed Applications",
  createProject: "Create Application",
  search: "Search AppId, App Name, Config Key",
});
const configCopy = {
  cluster: ["集群", "Cluster"],
  commitHistory: ["更改历史", "Change History"],
  filterConfig: ["过滤配置", "Filter Config"],
  revokeConfig: ["撤销配置", "Revoke Config"],
  confirmRevoke: [
    "确定撤销此 Namespace 的所有未发布修改，恢复为最后发布的配置？",
    "Revert all unpublished namespace changes to the latest release?",
  ],
  revokeDraft: [
    "本地未提交的文本也将被丢弃。",
    "Unsaved local text will also be discarded.",
  ],
  publishStatus: ["发布状态", "Release Status"],
  pendingShort: ["未发布", "Unpublished"],
  type: ["类型", "Type"],
  encrypted: ["加密", "Encrypted"],
  added: ["新增", "Added"],
  oldValue: ["旧值", "Old Value"],
  newValue: ["新值", "New Value"],
  authorize: ["授权", "Authorize"],
  instanceList: ["实例列表", "Instances"],
  hideNotice: ["不再提示", "Dismiss"],
  clusterNotice: [
    "注意: 客户端使用与其集群对应的配置；不属于自定义集群的实例使用 default 集群配置。",
    "Note: clients use their cluster configuration; instances outside custom clusters use default.",
  ],
};
for (const [key, [zh, en]] of Object.entries(configCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
Object.assign(messages.zh, {
  projectInfo: "应用信息",
  projectManage: "管理应用",
  modifiedBy: "最后修改人",
  modifiedTime: "最后修改时间",
  sync: "同步配置",
  diff: "比较配置",
  manageCluster: "管理集群",
  createCluster: "添加集群",
  accessKeys: "管理密钥",
});
const parityEditorCopy = {
  specialCharacterWarning: [
    "注意: 特殊字符(空格、换行符、制表符Tab、中文逗号)容易导致配置出错。",
    "Whitespace, line breaks, tabs and non-ASCII punctuation may affect configuration.",
  ],
  detectSpecialCharacters: ["检测特殊字符", "Detect special characters"],
  chooseClusters: ["选择集群", "Select clusters"],
  environment: ["环境", "Environment"],
  invalidItemType: ["无效的配置类型", "Invalid configuration type"],
  invalidNumber: ["请输入有效的 Number 值", "Enter a valid Number value"],
  invalidBoolean: [
    "Boolean 只能为 true 或 false",
    "Boolean must be true or false",
  ],
  invalidJSON: ["请输入有效的 JSON 值", "Enter valid JSON"],
  publishedValue: ["已发布的值", "Published value"],
  pendingValue: ["待发布的值", "Pending value"],
  noChanges: ["无变更", "No changes"],
  publishContext: [
    "只有发布过的配置才会被客户端获取到，此次发布只作用于当前环境:",
    "Only published configuration is visible to clients. Target environment:",
  ],
  rollbackContext: [
    "此操作会回滚到上一个发布版本，当前版本作废，但不影响正在修改的配置。",
    "Roll back to the previous active release. The current release is abandoned; draft edits are retained.",
  ],
  noPreviousRelease: [
    "没有可回滚的上一个有效版本",
    "No previous active release is available",
  ],
  masterUnpublished: [
    "主版本有未发布的配置，禁止全量发布灰度版本。请先处理主版本未发布的修改。",
    "The master has unpublished changes. Full gray merge is blocked until the master changes are resolved.",
  ],
  mergeContext: [
    "全量发布将会把灰度版本的配置合并到主分支，并发布。",
    "Full publication merges the gray configuration into the master and publishes it.",
  ],
  afterMerge: ["全量发布后，您希望", "After full publication"],
  keepGrayAfterMerge: ["保留灰度版本", "Keep gray branch"],
};
for (const [key, [zh, en]] of Object.entries(parityEditorCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
const referencePageCopy = {
  addUser: ["添加用户", "Add user"],
  simpleAuthOnly: [
    "（仅对默认的 Spring Security 简单认证方式有效）",
    "(Default Spring Security simple authentication only)",
  ],
  filterUsers: ["过滤用户", "Filter users"],
  reset: ["重置", "Reset"],
  userStatus: ["用户状态", "Status"],
  backToList: ["返回", "Back"],
  portalDB: ["PortalDB 配置管理", "PortalDB Configuration"],
  configDB: ["ConfigDB 配置管理", "ConfigDB Configuration"],
  appConfiguration: ["应用配置", "Application Configuration"],
  configTableHint: [
    "（维护 ServerConfig 表数据；已存在配置项会覆盖，否则自动新增）",
    "(Updates an existing ServerConfig key or inserts a new key)",
  ],
  filterKey: ["按Key值过滤", "Filter by key"],
  applicationManagement: ["应用管理", "Application Management"],
  baseInformation: ["基本信息", "Basic information"],
  applicationNameHint: [
    "建议格式: xx-yy-zz，例如 apollo-server",
    "Suggested format: xx-yy-zz, e.g. apollo-server",
  ],
  appAdminHint: [
    "（应用管理员可创建 Namespace、集群，管理应用和授权）",
    "(App admins manage namespaces, clusters, application and roles)",
  ],
  editAppInfo: ["修改应用信息", "Edit application"],
  grantCreateApp: [
    "为用户添加创建应用权限",
    "Grant application-creation permission",
  ],
  createAppRoleHint: [
    "（role.create-application.enabled=true 时限制创建应用）",
    "(Restricted when role.create-application.enabled=true)",
  ],
  selectUser: ["用户选择", "Select user"],
  masterAssignment: [
    "修改应用管理员分配权限",
    "Manage application administrator assignment",
  ],
  masterRoleHint: [
    "（role.manage-app-master.enabled=true 时生效）",
    "(Applies when role.manage-app-master.enabled=true)",
  ],
  allowMaster: [
    "允许此用户作为管理员时添加 Master",
    "Allow administrator to assign Master",
  ],
  forbidMaster: [
    "禁止此用户作为管理员时添加 Master",
    "Forbid administrator from assigning Master",
  ],
  queryFirst: [
    "请先查询并核对应用信息",
    "Query and verify the application first",
  ],
  returnHome: ["返回到应用首页", "Return to application"],
  add: ["添加", "Add"],
  clusterCreationHint: [
    "Tips: 集群用于区分同一应用的不同实例配置。集群内命名空间继承自 default；创建后需发布才对客户端生效。",
    "Clusters distinguish configuration for instances of the same application. Namespaces originate from default. Publish after editing.",
  ],
  clusterComment: ["集群备注", "Cluster comment"],
  selectEnvironment: ["选择环境", "Select environments"],
  createdSuccessfully: ["已创建成功", "created successfully"],
  secret: ["访问密钥", "Access key"],
  keyCountHint: [
    "每个环境最多可添加 5 个访问密钥",
    "Each environment allows up to five access keys",
  ],
  keyEnabledHint: [
    "启用访问密钥后，客户端需要配置密钥才能获取配置",
    "An enabled access key is required by clients reading configuration",
  ],
  keyObserverHint: [
    "观察模式仅记录日志；该环境存在启用密钥时观察模式不再生效",
    "Observer mode records logs only and is superseded by enabled keys",
  ],
  keyClientHint: [
    "客户端通过 -Dapollo.access-key.secret、APOLLO_ACCESS_KEY_SECRET 或 app.properties 配置密钥",
    "Configure clients with -Dapollo.access-key.secret, APOLLO_ACCESS_KEY_SECRET or app.properties",
  ],
  clusterPermissions: ["集群权限管理", "Cluster Permissions"],
  modifyPermission: ["修改权", "Modify permission"],
  releasePermission: ["发布权", "Release permission"],
  modifyPermissionHint: ["（可以修改配置）", "(Can edit configuration)"],
  releasePermissionHint: ["（可以发布配置）", "(Can publish configuration)"],
  deleteApplication: ["删除应用", "Delete application"],
  deleteCluster: ["删除集群", "Delete cluster"],
  deleteAppNamespace: ["删除 AppNamespace", "Delete AppNamespace"],
  deleteQueryHint: [
    "（删除前请先查询并核对资源信息，确认没有客户端读取配置）",
    "(Query and verify the resource before deletion; confirm no client depends on it)",
  ],
  systemVersion: ["系统版本", "System version"],
  systemEnvironmentHint: [
    "环境列表来自 ApolloPortalDB.ServerConfig 中的 apollo.portal.envs 配置。Meta Server 地址由对应环境配置提供。",
    "Environments come from apollo.portal.envs in ApolloPortalDB.ServerConfig; Meta Server addresses come from the environment configuration.",
  ],
  consumerCreateHint: [
    "（第三方应用可通过 Apollo 开放平台接口直接进行管理）",
    "(Third-party applications can manage configuration through Apollo OpenAPI)",
  ],
  ownerEmail: ["负责人/邮箱", "Owner / email"],
  viewTokenAndGrant: ["查看Token并赋权", "View Token and grant permissions"],
  unlimited: ["无限制", "Unlimited"],
  yes: ["是", "Yes"],
  no: ["否", "No"],
};
for (const [key, [zh, en]] of Object.entries(referencePageCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
const configParityCopy = {
  masterVersion: ["主版本", "Master"],
  grayVersion: ["灰度版本", "Gray"],
  masterValue: ["主版本的值", "Master value"],
  grayValue: ["灰度的值", "Gray value"],
  fullPublish: ["全量发布", "Full publication"],
  abandonGray: ["放弃灰度", "Abandon gray"],
  grayInstances: ["灰度实例列表", "Gray instances"],
  grayConfiguration: ["灰度的配置", "Gray configuration"],
  addGrayItem: ["新增灰度配置", "Add gray configuration"],
  grayAppId: ["灰度的 AppId", "Gray AppId"],
  grayRuleDetail: ["灰度的规则", "Gray rule"],
  compareClusters: ["要比较的集群", "Clusters to compare"],
  comparisonMode: ["比对方式", "Comparison mode"],
  syncNamespace: ["同步的 Namespace", "Namespace to synchronize"],
  filterByTime: ["按最后更新时间过滤", "Filter by last update time"],
  onlyDifferences: ["只显示差异项", "Only differences"],
  includeComments: ["比较备注", "Compare comments"],
  stepSelect: ["第一步: 选择信息", "Step 1: Select information"],
  stepReview: ["第二步: 核对差异", "Step 2: Review changes"],
  compareHint: [
    "通过比较配置功能，可以查看多个环境、集群间的配置差异。",
    "Compare configuration across environments and clusters.",
  ],
  allConfigs: ["全部配置", "All configuration"],
  masterPublish: ["主版本发布", "Master publication"],
  masterRollback: ["主版本回滚", "Master rollback"],
  grayOperations: ["灰度操作", "Gray operations"],
  expandCollapse: ["[展开/收缩]", "[Expand/collapse]"],
  hasChanges: ["有修改", "Modified"],
  notice: ["注意", "Note"],
  unpublishedEnvironments: [
    "以下环境/集群有未发布的配置，客户端获取不到未发布的配置，请及时发布。",
    "These environments/clusters contain unpublished configuration that clients cannot read.",
  ],
  consumerAppId: ["第三方应用ID", "Consumer application ID"],
  managedAppId: ["被管理的 AppId", "Managed AppId"],
  create: ["创建", "Create"],
};
for (const [key, [zh, en]] of Object.entries(configParityCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
Object.assign(messages.zh, {
  namespaceLocked: "Namespace 已被其他编辑者锁定",
  publishDenied: "发布限制",
  selfPublishDenied:
    "当前配置由您修改。为保证编辑与发布分离，请由拥有发布权限的其他人发布。",
});
Object.assign(messages.en, {
  namespaceLocked: "Namespace is locked by another editor",
  publishDenied: "Publication restricted",
  selfPublishDenied:
    "You edited this namespace. Another authorized user must publish it to preserve separation of duties.",
});
const traceCopy = {
  noRelatedChanges: ["没有相关数据变动", "No related changes"],
  traceDisplay: ["链路记录展示", "Trace details"],
  traceId: ["链路唯一ID", "Trace ID"],
  traceLogs: ["链路包含审计日志", "Trace audit logs"],
  traceEntityChanges: ["审计日志相关数据变动", "Related entity changes"],
  fieldChangeHistory: ["属性变动历史", "Field change history"],
  globalValueSearch: ["Value的全局搜索", "Global value search"],
  globalSearchHint: [
    "（模糊搜索，key可为配置项名称或content，value为配置项值）",
    "(Fuzzy search by configuration key/content and value)",
  ],
  filterValue: ["按Value值检索", "Search by value"],
  emptySearch: ["暂无数据，请进行检索或查询", "No data. Run a search."],
};
for (const [key, [zh, en]] of Object.entries(traceCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
const namespaceDeleteCopy = {
  deleteNamespace: ["删除 Namespace", "Delete Namespace"],
  deleteNamespaceWarning: [
    "注意，所有环境的 Namespace 都会被删除！这可能导致实例获取不到配置。",
    "This deletes the namespace across environments and may prevent clients from reading configuration.",
  ],
  deleteLinkedWarning: [
    "删除此关联后，当前集群的客户端将无法读取对应公共 Namespace。",
    "Clients of this cluster may lose access to the linked public namespace.",
  ],
  confirmForceDelete: [
    "我已核对使用情况，确认强制删除",
    "I have reviewed usage and acknowledge forced deletion",
  ],
};
for (const [key, [zh, en]] of Object.entries(namespaceDeleteCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
Object.assign(messages.zh, {
  externalLinkHint:
    "DBX 当前插件沙箱不允许打开外部窗口。可复制此官方链接到浏览器访问。",
  github: "GitHub",
});
Object.assign(messages.en, {
  externalLinkHint:
    "This DBX plugin sandbox does not support opening external windows. Copy the official URL to your browser.",
  github: "GitHub",
});

for (const [key, [zh, en]] of Object.entries(referenceCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
const remainingPageCopy = {
  namespaceName: ["名称", "Name"],
  namespaceMoreHint: [
    "（点击了解更多 Namespace 相关知识）",
    "(Learn more about namespaces)",
  ],
  configExportImport: ["配置导出导入", "Configuration import / export"],
  exportEnvironments: ["选择导出的环境", "Select environments to export"],
  importEnvironments: ["选择导入的环境", "Select environments to import"],
  uploadFile: ["上传导出的文件", "Upload exported file"],
  byEnvironment: ["按环境操作", "By environment"],
  byApplicationCluster: ["按应用集群操作", "By application / cluster"],
};
for (const [key, [zh, en]] of Object.entries(remainingPageCopy)) {
  messages.zh[key] = zh;
  messages.en[key] = en;
}
Object.assign(messages.zh, {
  syntaxCheck: "语法检查",
  formatConfig: "格式化配置",
  fullscreen: "全屏/退出全屏",
});
Object.assign(messages.en, {
  syntaxCheck: "Check syntax",
  formatConfig: "Format configuration",
  fullscreen: "Fullscreen / exit fullscreen",
});
Object.assign(messages.zh,{releaseTitle:'版本名称',releaseComment:'说明',changeRecordType:'改动',changeRecord:'修改记录',saveChanges:'保存'});
Object.assign(messages.en,{releaseTitle:'Version name',releaseComment:'Description',changeRecordType:'Change',changeRecord:'Modified by / time',saveChanges:'Save'});
Object.assign(messages.zh,{emergencyNotAllowed:'当前环境未允许紧急发布',emergencyConfirmation:'紧急发布将绕过编辑与发布分离限制，并立即影响客户端配置。确认已核对环境和变更后再继续。'});
Object.assign(messages.en,{emergencyNotAllowed:'Emergency publication is not enabled for this environment',emergencyConfirmation:'Emergency publication bypasses editor/publisher separation and immediately affects clients. Verify the environment and changes before continuing.'});
