// Selected Apache-2.0 Apollo UI copy, not frontend runtime or templates.
export const referenceCopy = {
  "Namespace.Link.Tips1": [
    "应用可以通过关联公共 Namespace 来覆盖公共 Namespace 的配置",
    "Applications can override the configuration of a public namespace by associating a public namespace"
  ],
  "Namespace.Link.Tips2": [
    "如果应用不需要覆盖公共 Namespace 的配置，那么无需关联公共 Namespace",
    "If the application does not need to override the configuration of the public namespace, then there is no need to associate the public namespace"
  ],
  "Namespace.CreatePublic.Tips1": [
    "公共的 Namespace 的配置能被任何应用读取",
    "The configuration of the public Namespace can be fetched by any application"
  ],
  "Namespace.CreatePublic.Tips2": [
    "通过创建公共 Namespace 可以实现公共组件的配置，或多个应用共享同一份配置的需求",
    "Configuration of public components or the need for multiple applications to share the same configuration can be achieved by creating a public namespace."
  ],
  "Namespace.CreatePublic.Tips3": [
    "如果其它应用需要覆盖公共部分的配置，可以在其它应用那里关联公共 Namespace，然后在关联的 Namespace 里面配置需要覆盖的配置即可",
    "If other applications need to override the configuration of the public namespace, you can associate the public namespace in other applications, and then configure the configuration that needs to be overridden in the associated namespace."
  ],
  "Namespace.CreatePublic.Tips4": [
    "如果其它应用不需要覆盖公共部分的配置，那么就不需要在其它应用那里关联公共 Namespace",
    "If other applications do not need to override the configuration of public namespace, then there is no need to associate public namespace in other applications."
  ],
  "Namespace.CreatePrivate.Tips1": [
    "私有 Namespace 的配置只能被所属的应用获取到",
    "The configuration of a private Namespace can only be fetched by the application to which it belongs."
  ],
  "Namespace.CreatePrivate.Tips2": [
    "通过创建一个私有的 Namespace 可以实现分组管理配置",
    "Group management configuration can be achieved by creating a private namespace"
  ],
  "Namespace.CreatePrivate.Tips3": [
    "私有 Namespace 的格式可以是 xml、yml、yaml、json、txt.  您可以通过 apollo-client 中 ConfigFile 接口来获取非 properties 格式 Namespace 的内容",
    "The format of private namespaces can be xml, yml, yaml, json, txt. You can get the content of namespace in non-property format through the ConfigFile interface in apollo-client."
  ],
  "Namespace.CreatePrivate.Tips4": [
    "1.3.0 及以上版本的 apollo-client 针对 yaml/yml 提供了更好的支持，可以通过 ConfigService.getConfig（\"someNamespace.yml\"）直接获取 Config对象，也可以通过 @EnableApolloConfig（\"someNamespace.yml\"）或 apollo.bootstrap.namespaces=someNamespace.yml 注入 yml 配置到 Spring/SpringBoot 中去",
    "The 1.3.0 and above versions of apollo-client provide better support for yaml/yml. Config objects can be obtained directly through ConfigService.getConfig(\"someNamespace.yml\"), or through @EnableApolloConfig(\"someNamespace.yml\") or apollo.bootstrap.namespaces=someNamespace.yml to inject YML configuration into Spring/Spring Boot"
  ],
  "AccessKey.Tips.1": [
    "每个环境最多可添加 5 个访问密钥",
    "Add up to 5 access keys per environment."
  ],
  "AccessKey.Tips.2": [
    "一旦该环境有启用状态的访问密钥，客户端将被要求配置密钥，否则无法获取配置",
    "Once the environment has any enabled access key, the client will be required to configure access key, or the configurations cannot be obtained."
  ],
  "AccessKey.Tips.3": [
    "观察状态密钥用于预校验，只做日志记录不拦截配置获取，注意：一旦该环境有启用状态的访问密钥，观察状态将不再生效",
    "Observed access keys are used for pre-check and logging only. Note: Once the environment has any enabled access key, the observed status will no longer take effect."
  ],
  "AccessKey.Tips.4": [
    "配置访问密钥防止非法客户端获取该应用配置，配置方式如下:（仅支持apollo-client 1.6.0+）",
    "Configure the access key to prevent unauthorized clients from obtaining the application configuration. The configuration method is as follows(only apollo-client version 1.6.0+):"
  ],
  "AccessKey.Tips.4.1": [
    "通过JVM参数配置: apollo-client >=1.9.0 推荐使用 -Dapollo.access-key.secret; 其它版本使用 -Dapollo.accesskey.secret",
    "Via jvm parameter: apollo-client version >=1.9.0 is recommended to use -Dapollo.access-key.secret; other versions use -Dapollo.accesskey.secret"
  ],
  "AccessKey.Tips.4.2": [
    "通过操作系统环境变量配置: apollo-client >=1.9.0 推荐使用 APOLLO_ACCESS_KEY_SECRET; 其它版本使用 APOLLO_ACCESSKEY_SECRET",
    "Through the os environment variable: apollo-client version >=1.9.0 is recommended to use APOLLO_ACCESS_KEY_SECRET; other versions use APOLLO_ACCESSKEY_SECRET"
  ],
  "AccessKey.Tips.4.3": [
    "通过 META-INF/app.properties 或 application.properties配置: apollo-client >=1.9.0 推荐使用 apollo.access-key.secret; 其它版本使用 apollo.accesskey.secret（注意多环境 secret 不一样）",
    "Via META-INF/app.properties or application.properties: apollo-client version >=1.9.0 is recommended to use apollo.access-key.secret; other versions use apollo.accesskey.secret(note that the multi-environment secret is different)"
  ],
  "Component.GrayscalePublishRule.Title": [
    "编辑灰度规则",
    "Edit Grayscale Rule"
  ],
  "Component.GrayscalePublishRule.AppId": [
    "灰度的 AppId",
    "Grayscale AppId"
  ],
  "Component.GrayscalePublishRule.AcceptRule": [
    "灰度应用规则",
    "Grayscale Application Rule"
  ],
  "Component.GrayscalePublishRule.AcceptPartInstance": [
    "应用到部分实例",
    "Apply to some instances"
  ],
  "Component.GrayscalePublishRule.AcceptAllInstance": [
    "应用到所有的实例",
    "Apply to all instances"
  ],
  "Component.GrayscalePublishRule.IP": [
    "灰度的 IP",
    "Grayscale IP"
  ],
  "Component.GrayscalePublishRule.Label": [
    "灰度的标签",
    "Grayscale Label"
  ],
  "Component.GrayscalePublishRule.AppIdFilterTips": [
    "（实例列表会根据输入的 AppId 自动过滤）",
    "(The list of instances are filtered by the typed AppId automatically)"
  ],
  "Component.GrayscalePublishRule.IpTips": [
    "没找到你想要的 IP？可以",
    "Can't find the IP you want? You may "
  ],
  "Component.GrayscalePublishRule.EnterIp": [
    "手动输入 IP",
    "enter IP manually"
  ],
  "Component.GrayscalePublishRule.EnterIpTips": [
    "输入 IP 列表，英文逗号隔开，输入完后点击添加按钮",
    "Enter the list of IP, using ',' as the separator, and then click the Add button."
  ],
  "Component.GrayscalePublishRule.EnterLabelTips": [
    "输入标签列表，英文逗号隔开，输入完后点击添加按钮",
    "Enter the list of Label, using ',' as the separator, and then click the Add button."
  ],
  "Component.GrayscalePublishRule.Add": [
    "添加",
    "Add"
  ],
  "RulesModal.ChooseInstances": [
    "从实例列表中选择",
    "Select from the list of instances"
  ],
  "grayInvalidIP": [
    "请输入有效的 IPv4 地址",
    "Enter a valid IPv4 address"
  ],
  "grayDuplicateApp": [
    "该 AppId 已存在灰度规则，请修改已有规则",
    "A rule for this AppId already exists; edit the existing rule"
  ],
  "Component.ConfigItem.Title": [
    "添加配置项",
    "Add Configuration"
  ],
  "Component.ConfigItem.TitleTips": [
    "（温馨提示: 可以通过文本模式批量添加配置）",
    "(Reminder: Configuration can be added in batch via text mode)"
  ],
  "Component.ConfigItem.AddGrayscaleItem": [
    "添加灰度配置项",
    "Add Grayscale Configuration"
  ],
  "Component.ConfigItem.ModifyItem": [
    "修改配置项",
    "Modify Configuration"
  ],
  "Component.ConfigItem.ItemKey": [
    "Key",
    "Key"
  ],
  "Component.ConfigItem.ItemValue": [
    "Value",
    "Value"
  ],
  "Component.ConfigItem.ItemValueTips": [
    "注意: 特殊字符(空格、换行符、制表符Tab、中文逗号)容易导致配置出错，如果需要检测 Value 中特殊字符，请点击",
    "Note: Special characters (Spaces, Newline, Tab, Chinese comma) easily cause configuration errors. If you want to check special characters in Value, please click"
  ],
  "Component.ConfigItem.ItemValueShowDetection": [
    "检测特殊字符",
    "Check Special Characters"
  ],
  "Component.ConfigItem.ItemValueNotHiddenChars": [
    "无特殊字符",
    "No Special Characters"
  ],
  "Component.ConfigItem.FormatItemValue": [
    "格式化",
    "Format Content"
  ],
  "Component.ConfigItem.ItemComment": [
    "Comment",
    "Comment"
  ],
  "Component.ConfigItem.ChooseCluster": [
    "选择集群",
    "Select Cluster"
  ],
  "Component.ConfigItem.ItemTypeName": [
    "类型",
    "Type"
  ],
  "Component.ConfigItem.ItemTypeString": [
    "String",
    "String"
  ],
  "Component.ConfigItem.ItemTypeNumber": [
    "Number",
    "Number"
  ],
  "Component.ConfigItem.ItemTypeBoolean": [
    "Boolean",
    "Boolean"
  ],
  "Component.ConfigItem.ItemTypeJson": [
    "JSON",
    "JSON"
  ],
  "Component.ConfigItem.ItemNumberError": [
    "非法 Number",
    "Illegal Number"
  ],
  "Component.ConfigItem.ItemJsonError": [
    "JSON 格式不正确",
    "JSON Incorrect format"
  ],
  "Component.ConfigItem.ItemTypeTrue": [
    "true",
    "True"
  ],
  "Component.ConfigItem.ItemTypeFalse": [
    "false",
    "False"
  ],
  "App.AppIdTips": [
    "（应用唯一标识）",
    "(Application's unique identifiers)"
  ],
  "App.AppAdminTips1": [
    "（应用负责人默认具有应用管理员权限，",
    "(The application owner has project administrator permission by default."
  ],
  "App.AppAdminTips2": [
    "应用管理员可以创建 Namespace 和集群、分配用户权限）",
    "Project administrators can create namespace, cluster, and assign user permissions)"
  ],
  "Config.History.Title": [
    "发布历史",
    "Release History"
  ],
  "Config.History.MasterVersionPublish": [
    "主版本发布",
    "Main version release"
  ],
  "Config.History.MasterVersionRollback": [
    "主版本回滚",
    "Main version rollback"
  ],
  "Config.History.GrayscaleOperator": [
    "灰度操作",
    "Grayscale operation"
  ],
  "Config.History.PublishHistory": [
    "发布历史",
    "Release History"
  ],
  "Config.History.OperationType0": [
    "普通发布",
    "Normal release"
  ],
  "Config.History.OperationType1": [
    "回滚",
    "Rollback"
  ],
  "Config.History.OperationType2": [
    "灰度发布",
    "Grayscale Release"
  ],
  "Config.History.OperationType3": [
    "更新灰度规则",
    "Update Gray Rules"
  ],
  "Config.History.OperationType4": [
    "灰度全量发布",
    "Full Grayscale Release"
  ],
  "Config.History.OperationType5": [
    "灰度发布（主版本发布）",
    "Grayscale Release(Main Version Release)"
  ],
  "Config.History.OperationType6": [
    "灰度发布（主版本回滚）",
    "Grayscale Release(Main Version Rollback)"
  ],
  "Config.History.OperationType7": [
    "放弃灰度",
    "Abandon Grayscale"
  ],
  "Config.History.OperationType8": [
    "删除灰度（全量发布）",
    "Delete Grayscale(Full Release)"
  ],
  "Config.History.UrgentPublish": [
    "紧急发布",
    "Emergency Release"
  ],
  "Config.History.LoadMore": [
    "加载更多",
    "Load more"
  ],
  "Config.History.Abandoned": [
    "已废弃",
    "Abandoned"
  ],
  "Config.History.RollbackTo": [
    "回滚到此版本",
    "Rollback To This Release"
  ],
  "Config.History.RollbackToTips": [
    "回滚已发布的配置到此版本",
    "Rollback released configuration to this release"
  ],
  "Config.History.ChangedItem": [
    "变更的配置",
    "Changed Configuration"
  ],
  "Config.History.ChangedItemTips": [
    "查看此次发布与上次版本的变更",
    "View changes between this release and the previous release"
  ],
  "Config.History.AllItem": [
    "全部配置",
    "Full Configuration"
  ],
  "Config.History.AllItemTips": [
    "查看此次发布的所有配置信息",
    "View all configurations for this release"
  ],
  "Config.History.ChangeType": [
    "类型",
    "Type"
  ],
  "Config.History.ChangeKey": [
    "Key",
    "Key"
  ],
  "Config.History.ChangeValue": [
    "值",
    "Value"
  ],
  "Config.History.ChangeOldValue": [
    "旧值",
    "Old Value"
  ],
  "Config.History.ChangeNewValue": [
    "新值",
    "New Value"
  ],
  "Config.History.ChangeTypeNew": [
    "新增",
    "Add"
  ],
  "Config.History.ChangeTypeModify": [
    "修改",
    "Update"
  ],
  "Config.History.ChangeTypeDelete": [
    "删除",
    "Delete"
  ],
  "Config.History.NoChange": [
    "无配置更改",
    "No configuration changes"
  ],
  "Config.History.NoItem": [
    "无配置",
    "No configuration"
  ],
  "Config.History.GrayscaleRule": [
    "灰度规则",
    "Grayscale Rule"
  ],
  "Config.History.GrayscaleAppId": [
    "灰度的 AppId",
    "Grayscale AppId"
  ],
  "Config.History.GrayscaleIp": [
    "灰度的IP",
    "Grayscale IP"
  ],
  "Config.History.NoGrayscaleRule": [
    "无灰度规则",
    "No Grayscale Rule"
  ],
  "Config.History.NoPermissionTips": [
    "您不是该应用的管理员，也没有该 Namespace 的编辑或发布权限，无法查看发布历史",
    "You are not this project's administrator, nor you have edit or release permission for the namespace. Thus you cannot view the release history."
  ],
  "Config.History.NoPublishHistory": [
    "无发布历史信息",
    "No release history"
  ],
  "Config.History.LoadingHistoryError": [
    "无发布历史信息",
    "No release history"
  ],
  "Config.RevokeItem.DialogTitle": [
    "撤销配置",
    "Revoke configuration changes"
  ],
  "Config.RevokeItem.DialogContent": [
    "当前命名空间下已修改但尚未发布的配置将被撤销，确定要撤销么?",
    "Modified but unpublished configurations in the current namespace will be revoked. Are you sure to revoke the configuration changes?"
  ],
  "Config.DeleteItem.DialogTitle": [
    "删除配置",
    "Delete configuration"
  ],
  "Config.DeleteItem.DialogContent": [
    "您正在删除 Key 为 <b> '{{config.key}}' </b> Value 为 <b> '{{config.value}}' </b> 的配置，<br>确定要删除配置吗?",
    "You are deleting the configuration whose Key is <b>'{{config.key}}'</b> Value is <b>'{{config.value}}'</b>. <br> Are you sure to delete the configuration?"
  ],
  "Config.PublishNoPermission.DialogTitle": [
    "发布",
    "Release"
  ],
  "Config.PublishNoPermission.DialogContent": [
    "您没有发布权限哦~ 请找应用管理员 '{{masterUsers}}' 分配发布权限",
    "You do not have release permission. Please ask the project administrators '{{masterUsers}}' to authorize release permission."
  ],
  "Config.ModifyNoPermission.DialogTitle": [
    "申请配置权限",
    "Apply for Configuration Permission"
  ],
  "Config.ModifyNoPermission.DialogContent": [
    "请找应用管理员 '{{masterUsers}}' 分配编辑或发布权限",
    "Please ask the project administrators '{{masterUsers}}' to authorize release or edit permission."
  ],
  "Config.MasterNoPermission.DialogTitle": [
    "申请配置权限",
    "Apply for Configuration Permission"
  ],
  "Config.MasterNoPermission.DialogContent": [
    "您不是应用管理员， 只有应用管理员才有添加集群、Namespace 的权限。如需管理员权限，请找应用管理员 '{{masterUsers}}' 分配管理员权限",
    "You are not this project's administrator. Only project administrators have the permission to add clusters and namespaces. Please ask the project administrators '{{masterUsers}}' to assign administrator permission"
  ],
  "Config.NamespaceLocked.DialogTitle": [
    "编辑受限",
    "Edit not allowed"
  ],
  "Config.NamespaceLocked.DialogContent": [
    "当前namespace正在被 '{{lockOwner}}' 编辑，一次发布只能被一个人修改.",
    "Current namespace is being edited by '{{lockOwner}}', and a release phase can only be edited by one person."
  ],
  "Config.RollbackAlert.DialogTitle": [
    "回滚",
    "Rollback"
  ],
  "Config.RollbackAlert.DialogContent": [
    "确定要回滚吗?",
    "Are you sure to roll back?"
  ],
  "Config.EmergencyPublishAlert.DialogTitle": [
    "紧急发布",
    "Emergency release"
  ],
  "Config.EmergencyPublishAlert.DialogContent": [
    "确定要紧急发布吗?",
    "Are you sure to perform the emergency release?"
  ],
  "Config.DeleteBranch.DialogTitle": [
    "删除灰度",
    "Delete grayscale"
  ],
  "Config.DeleteBranch.DialogContent": [
    "删除灰度会丢失灰度的配置，确定要删除吗?",
    "Deleting grayscale will lose the grayscale configurations. Are you sure to delete it?"
  ],
  "Config.UpdateRuleTips.DialogTitle": [
    "更新灰度规则提示",
    "Update gray rule prompt"
  ],
  "Config.UpdateRuleTips.DialogContent": [
    "灰度规则已生效，但发现灰度版本有未发布的配置，这些配置需要手动灰度发布才会生效",
    "Grayscale rules are in effect. However there are unreleased configurations in grayscale version, they won't be effective until a manual grayscale release is performed."
  ],
  "Config.MergeAndReleaseDeny.DialogTitle": [
    "全量发布",
    "Full release"
  ],
  "Config.MergeAndReleaseDeny.DialogContent": [
    "Namespace 主版本有未发布的配置，请先发布主版本配置",
    "The main version has unreleased configuration. Please release the main version first."
  ],
  "Config.GrayReleaseWithoutRulesTips.DialogTitle": [
    "缺失灰度规则提示",
    "Missing gray rule prompt"
  ],
  "Config.GrayReleaseWithoutRulesTips.DialogContent": [
    "灰度版本还没有配置任何灰度规则，请配置灰度规则",
    "The grayscale version has not configured any grayscale rule. Please configure the grayscale rules."
  ],
  "Config.DeleteNamespaceDenyForMasterInstance.DialogTitle": [
    "删除 Namespace 警告信息",
    "Delete namespace warning"
  ],
  "Config.DeleteNamespaceDenyForMasterInstance.DialogContent": [
    "发现有 <b>'{{deleteNamespaceContext.namespace.instancesCount}}'</b> 个实例正在使用 Namespace（'{{deleteNamespaceContext.namespace.baseInfo.namespaceName}}'），删除 Namespace 将导致实例获取不到配置。<br>请到 <ins>“实例列表”</ins> 确认实例信息，如确认相关实例都已经不再使用该 Namespace 配置，可以联系 Apollo 相关负责人删除实例信息（InstanceConfig）或等待实例24小时自动过期后再来删除。",
    "There are <b>'{{deleteNamespaceContext.namespace.instancesCount}}'</b> instances using namespace ('{{deleteNamespaceContext.namespace.baseInfo.namespaceName}}'), and deleting namespace would cause those instances failed to fetch configuration. <br> Please go to <ins> \"Instance List\"</ins> to confirm the instance information. If you confirm that the relevant instances are no longer using the namespace configuration, you can contact the Apollo administrators to delete the instance information (Instance Config) or wait for the instance to expire automatically 24 hours before deletion."
  ],
  "Config.DeleteNamespaceDenyForBranchInstance.DialogTitle": [
    "删除Namespace警告信息",
    "Delete namespace warning information"
  ],
  "Config.DeleteNamespaceDenyForBranchInstance.DialogContent": [
    "发现有 <b>'{{deleteNamespaceContext.namespace.branch.latestReleaseInstances.total}}'</b> 个实例正在使用 Namespace（'{{deleteNamespaceContext.namespace.baseInfo.namespaceName}}'）灰度版本的配置，删除 Namespace 将导致实例获取不到配置。<br> 请到 <ins>“灰度版本” => “实例列表”</ins> 确认实例信息，如确认相关实例都已经不再使用该 Namespace 配置，可以联系 Apollo 相关负责人删除实例信息（InstanceConfig）或等待实例24小时自动过期后再来删除。",
    "There are <b>'{{deleteNamespaceContext.namespace.branch.latestReleaseInstances.total}}'</b> instances using the grayscale version of namespace ('{{deleteNamespaceContext.namespace.baseInfo.namespaceName}}') configuration, and deleting Namespace would cause those instances failed to fetch configuration. <br> Please go to <ins> \"Grayscale Version\"=> \"Instance List\"</ins> to confirm the instance information. If you confirm the relevant instances are no longer using the namespace configuration, you can contact the Apollo administrators to delete the instance information (Instance Config) or wait for the instance to expire automatically 24 hours before deletion."
  ],
  "Config.DeleteNamespaceDenyForPublicNamespace.DialogTitle": [
    "删除 Namespace 失败提示",
    "Delete Namespace Failure Tip"
  ],
  "Config.DeleteNamespaceDenyForPublicNamespace.DialogContent": [
    "删除 Namespace 失败提示",
    "Delete Namespace Failure Tip"
  ],
  "Config.SyntaxCheckFailed.DialogTitle": [
    "语法检查错误",
    "Syntax Check Error"
  ],
  "Config.SyntaxCheckFailed.DialogContent": [
    "删除 Namespace 失败提示",
    "Delete Namespace Failure Tip"
  ],
  "Config.CreateBranchTips.DialogTitle": [
    "创建灰度须知",
    "Create Grayscale Notice"
  ],
  "Config.CreateBranchTips.DialogContent": [
    "通过创建灰度版本，您可以对某些配置做灰度测试<br>灰度流程为:<br>&nbsp;&nbsp;1.创建灰度版本 <br>&nbsp;&nbsp;2.配置灰度配置项<br>&nbsp;&nbsp;3.配置灰度规则.如果是私有的 Namespace 可以按照客户端的 IP 和 Label 进行灰度，如果是公共的 Namespace则可以同时按 AppId，客户端的 IP 和客户端的 Label 进行灰度<br>&nbsp;&nbsp;4.灰度发布<br>灰度版本最终有两种结果:<b>全量发布和放弃灰度</b><br><b>全量发布</b>:灰度的配置合到主版本并发布，所有的客户端都会使用合并后的配置<br><b>放弃灰度</b>:删除灰度版本，所有的客户端都会使用回主版本的配置<br>注意事项:<br>&nbsp;&nbsp;1.如果灰度版本已经有灰度发布过，那么修改灰度规则后，无需再次灰度发布就立即生效",
    "By creating grayscale version, you can do grayscale test for some configurations. <br> Grayscale process is as follows: <br> &nbsp; &nbsp; 1. Create grayscale version <br> &nbsp; &nbsp; 2. Configure grayscale configuration items <br> &nbsp; &nbsp; 3. Configure grayscale rules. If it is a private namespace, it can be grayed according to the IP and Label of client. If it is a public namespace, it can be grayed according to appId, IP and Label. <br> &nbsp; &nbsp; 4. Grayscale release <br> Grayscale version has two final results: <b> Full release and Abandon grayscale</b> <br> <b>Full release</b>: grayscale configurations are merged with the main version and released, all clients will use the merged configurations <br> <b> Abandon grayscale</b>: Delete grayscale version. All clients will use the configurations of the main version<br> Notice: <br> &nbsp; &nbsp; 1. If the grayscale version has been released, then the grayscale rules will be effective immediately without the need to release grayscale configuration again."
  ],
  "Component.Namespace.Master.Items.RequestPermission": [
    "申请配置权限",
    "Apply for configuration permission"
  ],
  "Cluster.CreateCluster": [
    "新建集群",
    "Create Cluster"
  ],
  "Cluster.Tips.1": [
    "通过添加集群，可以使同一份程序在不同的集群（如不同的数据中心）使用不同的配置",
    "By adding clusters, the same program can use different configuration in different clusters (such as different data centers)"
  ],
  "Cluster.Tips.2": [
    "如果不同集群使用一样的配置，则没有必要创建集群",
    "If the different clusters use the same configuration, there is no need to create clusters"
  ],
  "Cluster.Tips.3": [
    "Apollo 默认会读取机器上 /opt/settings/server.properties（linux）或C:\\opt\\settings\\server.properties（windows）文件中的 idc 属性作为集群名字，  如 SHAJQ（金桥数据中心）、SHAOY（欧阳数据中心）",
    "By default, Apollo reads IDC attributes in /opt/settings/server.properties(Linux) or C:\\opt\\settings\\server.properties(Windows) files on the machine as cluster names, such as SHAJQ (Jinqiao Data Center), SHAOY (Ouyang Data Center)"
  ],
  "Cluster.Tips.4": [
    "在这里创建的集群名字需要和机器上 server.properties 中的 idc 属性一致",
    "The cluster name created here should be consistent with the IDC attribute in server.properties on the machine"
  ],
  "Cluster.CreateNameTips": [
    "（部署集群如: SHAJQ,SHAOY 或自定义集群如: SHAJQ-xx,SHAJQ-yy）",
    "(Cluster names such as SHAJQ, SHAOY or customized clusters such as SHAJQ-xx, SHAJQ-yy)"
  ],
  "Cluster.CreateRemarksTips": [
    "（为新建集群增加备注说明可以帮助用户更好地理解每个集群的用途）",
    "(Adding remarks to clusters can help users better understand the purpose of each cluster.)"
  ],
  "Cluster.ChooseEnvironment": [
    "选择环境",
    "Environment"
  ],
  "Cluster.LoadingEnvironmentError": [
    "加载环境信息出错",
    "Error in loading environment information"
  ],
  "Cluster.ClusterCreated": [
    "集群创建成功",
    "Created cluster successfully"
  ],
  "Cluster.ClusterCreateFailed": [
    "集群创建失败",
    "Failed to create cluster"
  ],
  "Cluster.PleaseChooseEnvironment": [
    "请选择环境",
    "Please select the environment"
  ],
  "Cluster.Grant": [
    "授权",
    "Authorize"
  ],
  "Cluster.GrantTips": [
    "配置修改、发布权限",
    "Manage the configuration edit and release permission"
  ],
  "Cluster.Role.Title": [
    "集群权限管理",
    "Cluster Permission Management"
  ],
  "Cluster.Role.GrantModifyTo": [
    "修改权",
    "Permission to edit"
  ],
  "Cluster.Role.GrantModifyTo2": [
    "（可以修改配置）",
    "(Can edit the configuration)"
  ],
  "Cluster.Role.GrantPublishTo": [
    "发布权",
    "Permission to release"
  ],
  "Cluster.Role.GrantPublishTo2": [
    "（可以发布配置）",
    "(Can release the configuration)"
  ],
  "Cluster.Role.Add": [
    "添加",
    "Add"
  ],
  "Cluster.Role.NoPermission": [
    "您没有权限哟!",
    "You do not have permission!"
  ],
  "Cluster.Role.InitClusterPermissionError": [
    "初始化授权出错",
    "Error initializing authorization"
  ],
  "Cluster.Role.GetGrantUserError": [
    "加载授权用户出错",
    "Failed to load authorized users"
  ],
  "Cluster.Role.PleaseChooseUser": [
    "请选择用户",
    "Please select the user"
  ],
  "Cluster.Role.Added": [
    "添加成功",
    "Add Successfully"
  ],
  "Cluster.Role.AddFailed": [
    "添加失败",
    "Failed to add"
  ],
  "Cluster.Role.Deleted": [
    "删除成功",
    "Delete Successfully"
  ],
  "Cluster.Role.DeleteFailed": [
    "删除失败",
    "Failed to Delete"
  ],
  "query": [
    "查询",
    "Query"
  ],
  "selectAll": [
    "全选",
    "Select all"
  ],
  "requestPermissions": [
    "申请权限",
    "Request permission"
  ],
  "SystemRole.Title": [
    "系统权限管理",
    "System Permission Management"
  ],
  "SystemRole.AddCreateAppRoleToUser": [
    "为用户添加创建应用权限",
    "Create application permission for users"
  ],
  "SystemRole.AddCreateAppRoleToUserTips": [
    "（系统参数中设置 role.create-application.enabled=true 会限制只有超级管理员和拥有创建应用权限的帐号可以创建应用）",
    "(When role.create-application.enabled=true is set in system configurations, only super admin and those accounts with Create application permission can create application)"
  ],
  "SystemRole.ChooseUser": [
    "用户选择",
    "Select User"
  ],
  "SystemRole.Add": [
    "添加",
    "Add"
  ],
  "SystemRole.AuthorizedUser": [
    "已拥有权限用户",
    "Users with permission"
  ],
  "SystemRole.ModifyAppAdminUser": [
    "修改应用管理员分配权限",
    "Modify Application Administrator Allocation Permissions"
  ],
  "SystemRole.ModifyAppAdminUserTips": [
    "（系统参数中设置 role.manage-app-master.enabled=true 会限制只有超级管理员和拥有管理员分配权限的帐号可以修改应用管理员）",
    "(When role.manage-app-master.enabled=true is set in system configurations, only super admin and those accounts with application administrator allocation permissions can modify the application's administrators)"
  ],
  "SystemRole.AppIdTips": [
    "（请先查询应用信息）",
    "(Please query the application information first)"
  ],
  "SystemRole.AppInfo": [
    "应用信息",
    "Application information"
  ],
  "SystemRole.AllowAppMasterAssignRole": [
    "允许此用户作为管理员时添加 Master",
    "Allow this user to add Master as an administrator"
  ],
  "SystemRole.DeleteAppMasterAssignRole": [
    "禁止此用户作为管理员时添加 Master",
    "Disallow this user to add Master as an administrator"
  ],
  "SystemRole.IsRootUser": [
    "当前页面只对 Apollo 管理员开放",
    "The current page is only accessible to Apollo administrators"
  ],
  "SystemRole.PleaseChooseUser": [
    "请选择用户名",
    "Please select a user"
  ],
  "SystemRole.Added": [
    "添加成功",
    "Add Successfully"
  ],
  "SystemRole.AddFailed": [
    "添加失败",
    "Failed to add"
  ],
  "SystemRole.Deleted": [
    "删除成功",
    "Delete Successfully"
  ],
  "SystemRole.DeleteFailed": [
    "删除失败",
    "Failed to Delete"
  ],
  "SystemRole.GetCanCreateProjectUsersError": [
    "获取拥有创建应用权限的用户列表出错",
    "Error getting user list with create project permission"
  ],
  "SystemRole.PleaseEnterAppId": [
    "请输入 AppId",
    "Please enter appId"
  ],
  "SystemRole.AppIdNotFound": [
    "AppId: '{{appId}}' 不存在！",
    "AppId: '{{appId}}' does not exist!"
  ],
  "SystemRole.AppInfoContent": [
    "应用名：'{{appName}}' 部门：'{{departmentName}}（{{departmentId}}）' 负责人：'{{ownerName}}",
    "Application name: '{{appName}}' department: '{{departmentName}}({{departmentId}})' owner: '{{ownerName}}'"
  ],
  "SystemRole.DeleteMasterAssignRoleTips": [
    "确认删除 AppId: '{{appId}}' 的用户: '{{userId}}' 分配应用管理员的权限？",
    "Are you sure to disallow the user '{{userId}}' to add Master as an administrator for AppId:'{{appId}}'?"
  ],
  "SystemRole.DeletedMasterAssignRoleTips": [
    "删除 AppId: '{{appId}}' 的用户: '{{userId}}' 分配应用管理员的权限成功",
    "Disallow the user '{{userId}}' to add Master as an administrator for AppId:'{{appId}}' Successfully"
  ],
  "SystemRole.AllowAppMasterAssignRoleTips": [
    "确认添加 AppId: '{{appId}}' 的用户: '{{userId}}' 分配应用管理员的权限？",
    "Are you sure to allow the user '{{userId}}' to add Master as an administrator for AppId:'{{appId}}'?"
  ],
  "SystemRole.AllowedAppMasterAssignRoleTips": [
    "添加 AppId: '{{appId}}' 的用户: '{{userId}}' 分配应用管理员的权限成功",
    "Allow the user '{{userId}}' to add Master as an administrator for AppId:'{{appId}}' Successfully"
  ],
  "Open.Manage.Title": [
    "开放平台",
    "Open Platform"
  ],
  "Open.Manage.CreateThirdApp": [
    "创建第三方应用",
    "Create third-party applications"
  ],
  "Open.Manage.CreateThirdAppTips": [
    "（说明: 第三方应用可以通过 Apollo 开放平台来对配置进行管理）",
    "(Note: Third-party applications can manage configuration through Apollo Open Platform)"
  ],
  "Open.Manage.ThirdAppId": [
    "第三方应用ID",
    "Third party appId"
  ],
  "Open.Manage.ThirdAppIdTips": [
    "（创建前请先查询第三方应用是否已经申请过）",
    "(Please check if the third-party application has already exists first)"
  ],
  "Open.Manage.ThirdAppName": [
    "第三方应用名称",
    "Third party application name"
  ],
  "Open.Manage.ThirdAppNameTips": [
    "（建议格式 xx-yy-zz 例:apollo-server）",
    "(Suggested format xx-yy-zz e.g. apollo-server)"
  ],
  "Open.Manage.ProjectOwner": [
    "应用负责人",
    "Owner"
  ],
  "Open.Manage.Create": [
    "创建",
    "Create"
  ],
  "Open.Manage.GrantPermission": [
    "赋权",
    "Authorization"
  ],
  "Open.Manage.GrantPermissionTips": [
    "（Namespace 级别权限包括: 修改、发布Namespace。应用级别权限包括: 创建 Namespace、修改或发布应用下任何 Namespace）",
    "(Namespace level permissions include edit and release namespace. Application level permissions include creating namespace, edit or release any namespace in the application.)"
  ],
  "Open.Manage.Token": [
    "Token",
    "Token"
  ],
  "Open.Manage.ManagedAppId": [
    "被管理的 AppId",
    "Managed AppId"
  ],
  "Open.Manage.ManagedNamespace": [
    "被管理的 Namespace",
    "Managed Namespace"
  ],
  "Open.Manage.ManagedNamespaceTips": [
    "（非 properties 类型的 Namespace 请加上类型后缀，例如 apollo.xml）",
    "(For non-properties namespaces, please add the suffix, such as apollo.xml)"
  ],
  "Open.Manage.GrantType": [
    "授权类型",
    "Authorization type"
  ],
  "Open.Manage.GrantType.Namespace": [
    "Namespace",
    "Namespace"
  ],
  "Open.Manage.GrantType.App": [
    "App",
    "App"
  ],
  "Open.Manage.GrantEnv": [
    "环境",
    "Environments"
  ],
  "Open.Manage.GrantEnvTips": [
    "（不选择则所有环境都有权限，如果提示 Namespace's role does not exist，请先打开该 Namespace 的授权页面触发一下权限的初始化动作）",
    "(If you don't select any environment, then will have permissions to all environments.)"
  ],
  "Open.Manage.PleaseEnterAppId": [
    "请输入 AppId",
    "Please enter appId"
  ],
  "Open.Manage.AppNotCreated": [
    "App（'{{appId}}'）未创建，请先创建",
    "App('{{appId}}') does not exist, please create it first"
  ],
  "Open.Manage.GrantSuccessfully": [
    "赋权成功",
    "Authorize Successfully"
  ],
  "Open.Manage.GrantFailed": [
    "赋权失败",
    "Failed to authorize"
  ],
  "Open.Manage.ViewAndGrantPermission": [
    "查看Token并赋权",
    "Grant Permission"
  ],
  "Open.Manage.DeleteConsumer.Confirm": [
    "您正在删除 <b>AppId='{{toOperationConsumer.appId}}',应用名称='{{toOperationConsumer.name}}'</b> 的第三方应用，<br>确定要删除吗?",
    "You are deleting a third-party app with <b>AppId={{toOperationConsumer.appId}},AppName={{toOperationConsumer.name}}</b>,<br>Are you sure you want to delete?"
  ],
  "Open.Manage.DeleteConsumer.Success": [
    "第三方应用删除成功",
    "Third-party app deleted successfully"
  ],
  "Open.Manage.DeleteConsumer.Error": [
    "第三方应用删除失败",
    "Third-party app deletion failed"
  ],
  "Open.Manage.CreateConsumer.Button": [
    "创建第三方应用",
    "Create Third-Party App"
  ],
  "Open.Manage.Consumer.AllowCreateApplication": [
    "允许创建app？",
    "Allow app creation?"
  ],
  "Open.Manage.Consumer.AllowCreateApplicationTips": [
    "（允许第三方应用创建app，并且对创建出的app，拥有应用管理员的权限）",
    "（Allow third-party applications to create apps and grant them app administrator privileges."
  ],
  "Open.Manage.Consumer.AllowCreateApplication.No": [
    "否",
    "no"
  ],
  "Open.Manage.Consumer.AllowCreateApplication.Yes": [
    "是",
    "yes"
  ],
  "Open.Manage.Consumer.RateLimit.Enabled": [
    "是否启用限流",
    "Whether to enable rate limit"
  ],
  "Open.Manage.Consumer.RateLimit.Enabled.Tips": [
    "（开启后，第三方应用在 Apollo 上发布配置时，会根据配置的 QPS 限制，控制其流量）",
    "(After enabling this feature, when third-party applications publish configurations on Apollo, their traffic will be controlled according to the configured QPS limit)"
  ],
  "Open.Manage.Consumer.RateLimitValue": [
    "限流QPS",
    "Rate limiting QPS"
  ],
  "Open.Manage.Consumer.RateLimitValueTips": [
    "（单位:次/秒，例如: 100 表示每秒最多发布 100 次配置）",
    "(Unit: times/second, for example: 100 means that the configuration is published at most 100 times per second)"
  ],
  "Open.Manage.Consumer.RateLimitValue.Error": [
    "限流QPS最小为1",
    "The minimum rate limiting QPS is 1"
  ],
  "Open.Manage.Consumer.RateLimitValue.Display": [
    "无限制",
    "Unlimited"
  ],
  "Namespace.Role.Title": [
    "权限管理",
    "Permission Management"
  ],
  "Namespace.Role.GrantModifyTo": [
    "修改权",
    "Permission to edit"
  ],
  "Namespace.Role.GrantModifyTo2": [
    "（可以修改配置）",
    "(Can edit the configuration)"
  ],
  "Namespace.Role.AllEnv": [
    "所有环境",
    "All environments"
  ],
  "Namespace.Role.GrantPublishTo": [
    "发布权",
    "Permission to release"
  ],
  "Namespace.Role.GrantPublishTo2": [
    "（可以发布配置）",
    "(Can release the configuration)"
  ],
  "Namespace.Role.Add": [
    "添加",
    "Add"
  ],
  "Namespace.Role.NoPermission": [
    "您没有权限哟!",
    "You do not have permission!"
  ],
  "Namespace.Role.InitNamespacePermissionError": [
    "初始化授权出错",
    "Error initializing authorization"
  ],
  "Namespace.Role.GetEnvGrantUserError": [
    "加载 '{{env}}' 授权用户出错",
    "Failed to load authorized users for '{{env}}'"
  ],
  "Namespace.Role.GetGrantUserError": [
    "加载授权用户出错",
    "Failed to load authorized users"
  ],
  "Namespace.Role.PleaseChooseUser": [
    "请选择用户",
    "Please select the user"
  ],
  "Namespace.Role.Added": [
    "添加成功",
    "Add Successfully"
  ],
  "Namespace.Role.AddFailed": [
    "添加失败",
    "Failed to add"
  ],
  "Namespace.Role.Deleted": [
    "删除成功",
    "Delete Successfully"
  ],
  "Namespace.Role.DeleteFailed": [
    "删除失败",
    "Failed to Delete"
  ],
  "allEnvs": [
    "所有环境",
    "All environments"
  ],
  "Component.DeleteNamespace.Title": [
    "删除 Namespace",
    "Delete Namespace"
  ],
  "Component.DeleteNamespace.PublicContent": [
    "注意，所有环境的公共 Namespace 都会被删除！这将导致实例以及关联的 Namespace 获取不到此 Namespace 的配置，确定要删除吗？",
    "Caution, the public namespace for all environments will be deleted! This will cause the instances unable to get the configuration of this namespace. Are you sure you want to delete it?"
  ],
  "Component.DeleteNamespace.PrivateContent": [
    "注意，所有环境的私有 Namespace 都会被删除！这将导致实例获取不到此 Namespace 的配置，确定要删除吗？",
    "Caution, the private namespace for all environments will be deleted! This will cause the instances unable to get the configuration of this namespace. Are you sure you want to delete it?"
  ],
  "Component.DeleteNamespace.LinkedContent": [
    "注意，当前环境关联的 Namespace 会被删除！这将导致实例获取不到此 Namespace 的配置，确定要删除吗？",
    "Caution, all the namespaces associated with the current environment will be deleted! This will cause the instances unable to get the configuration of this namespace. Are you sure you want to delete it?"
  ],
  "Component.DeleteNamespace.ForceDeleteContent": [
    "当前 Namespace 在 24H 内，存在使用中的实例，二次确认是否强制删除？",
    "There are instances in use for the current namespace within 24 hours, are you sure to force delete the namespace?"
  ],
  "Component.PublishDeny.Title": [
    "发布受限",
    "Release Restriction"
  ],
  "Component.PublishDeny.Tips1": [
    "您不能发布哟~{{env}}环境配置的编辑和发布必须为不同的人，请找另一个具有当前 Namespace 发布权的人操作发布~",
    "You can't release! The operators to edit and release the configurations in {{env}} environment must be different, please find someone else who has the release permission of this namespace to do the release operation."
  ],
  "Component.PublishDeny.Tips2": [
    "（如果是非工作时间或者特殊情况，您可以通过点击'紧急发布'按钮进行发布）",
    "(If it is non working time or a special situation, you may release by clicking the 'Emergency Release' button.)"
  ],
  "Component.PublishDeny.EmergencyPublish": [
    "紧急发布",
    "Emergency Release"
  ],
  "Component.PublishDeny.Close": [
    "关闭",
    "Close"
  ],
  "forceDelete": [
    "强制删除",
    "Force Delete"
  ],
  "Component.Rollback.To": [
    "回滚到",
    "roll back to"
  ],
  "Component.Rollback.Tips": [
    "此操作将会回滚到上一个发布版本，且当前版本作废，但不影响正在修改的配置。可在发布历史页面查看当前生效的版本",
    "This operation will roll back to the last released version, and the current version is abandoned, but there is no impact to the currently editing configurations. You may view the currently effective version in the release history page"
  ],
  "Component.RollbackTo.Tips": [
    "此操作将会回滚到此发布版本，且当前版本作废，但不影响正在修改的配置",
    "This operation will roll back to this released version, and the current version is abandoned, but there is no impact to the currently editing configurations"
  ],
  "Component.Rollback.ClickToView": [
    "点击查看",
    "Click to view"
  ],
  "Component.Rollback.ItemType": [
    "Type",
    "Type"
  ],
  "Component.Rollback.ItemKey": [
    "Key",
    "Key"
  ],
  "Component.Rollback.RollbackBeforeValue": [
    "回滚前",
    "Before Rollback"
  ],
  "Component.Rollback.RollbackAfterValue": [
    "回滚后",
    "After Rollback"
  ],
  "Component.Rollback.Added": [
    "新增",
    "Add"
  ],
  "Component.Rollback.Modified": [
    "更新",
    "Update"
  ],
  "Component.Rollback.Deleted": [
    "删除",
    "Delete"
  ],
  "Component.Rollback.NoChange": [
    "配置没有变化",
    "No configuration changes"
  ],
  "Component.Rollback.OpRollback": [
    "回滚",
    "Rollback"
  ],
  "Rollback.NoRollbackList": [
    "没有可以回滚的发布历史",
    "No released history to rollback"
  ],
  "Rollback.SameAsCurrentRelease": [
    "该版本与当前版本相同",
    "This release is the same as current release"
  ],
  "Rollback.RollbackSuccessfully": [
    "回滚成功",
    "Rollback Successfully"
  ],
  "Rollback.RollbackFailed": [
    "回滚失败",
    "Failed to Rollback"
  ],
  "sourceConfirm": [
    "确认",
    "OK"
  ],
  "Common.Environment": [
    "环境",
    "Environment"
  ],
  "Common.Cluster": [
    "集群",
    "Cluster"
  ],
  "Common.Namespace": [
    "Namespace",
    "Namespace"
  ],
  "Common.Instance": [
    "实例",
    "Instance"
  ],
  "Common.GrayscaleInstance": [
    "灰度实例",
    "GrayscaleInstance"
  ],
  "Common.LinkedNamespace": [
    "关联的 Namespace",
    "LinkedNamespace"
  ],
  "Component.ShowText.Title": [
    "查看",
    "View"
  ],
  "Config.Note": [
    "注意",
    "Note"
  ],
  "ConfigExport.UploadFile": [
    "上传导出的文件",
    "Upload the exported file"
  ],
  "ConfigImport.Title": [
    "导入 Namespace",
    "Import Namespace"
  ],
  "ConfigImport.Tip1": [
    "当配置项冲突时，导入的值将会覆盖已有的值",
    "When the configuration item conflicts, the imported value will overwrite the past value"
  ],
  "ConfigImport.Tip2": [
    "当配置项不冲突时，则会新增配置项",
    "When the configuration items do not conflict, a new configuration item will be added"
  ],
  "ConfigImport.Tip3": [
    "导入配置项后，需要发布才能生效",
    "After importing the configuration item, it needs to be released to take effect"
  ],
  "Component.Namespace.Master.Items.ExportNamespace": [
    "导出 Namespace",
    "Export Namespace"
  ],
  "Component.Namespace.Master.Items.ImportNamespace": [
    "导入 Namespace",
    "Import Namespace"
  ],
  "Component.Namespace.Master.Items.DeleteNamespace": [
    "删除 Namespace",
    "Delete Namespace"
  ],
  "App.Setting.DeleteAdmin": [
    "删除管理员",
    "Delete Administrator"
  ],
  "App.Setting.CanNotDeleteAllAdmin": [
    "不能删除所有的管理员",
    "Cannot delete all administrators"
  ],
  "Component.Namespace.Master.Items.ChangedUser": [
    "当前修改者",
    "Current modifier"
  ],
  "Component.Namespace.Branch.ChangeUser": [
    "当前修改者",
    "Current Modifier"
  ],
  "AccessKey.Operator.Disable": [
    "禁用",
    "Disable"
  ],
  "AccessKey.Operator.Enable": [
    "启用",
    "Enable"
  ],
  "AccessKey.Operator.Observe": [
    "观察",
    "Observe"
  ],
  "AccessKey.Operator.Disabled": [
    "已禁用",
    "Disabled"
  ],
  "AccessKey.Operator.Enabled": [
    "已启用",
    "Enabled"
  ],
  "AccessKey.Operator.Observed": [
    "已观察",
    "Observed"
  ],
  "AccessKey.Operator.Remove": [
    "删除",
    "Remove"
  ],
  "AccessKey.Operator.CreateSuccess": [
    "访问密钥创建成功",
    "Access key created successfully"
  ],
  "AccessKey.Operator.DisabledSuccess": [
    "访问密钥禁用成功",
    "Access key disabled successfully"
  ],
  "AccessKey.Operator.EnabledSuccess": [
    "访问密钥启用成功",
    "Access key enabled successfully"
  ],
  "AccessKey.Operator.ObservedSuccess": [
    "访问密钥观察成功",
    "Access key observed successfully"
  ],
  "AccessKey.Operator.RemoveSuccess": [
    "访问密钥删除成功",
    "Access key removed successfully"
  ],
  "AccessKey.Operator.CreateError": [
    "访问密钥创建失败",
    "Access key created failed"
  ],
  "AccessKey.Operator.DisabledError": [
    "访问密钥禁用失败",
    "Access key disabled failed"
  ],
  "AccessKey.Operator.EnabledError": [
    "访问密钥启用失败",
    "Access key enabled failed"
  ],
  "AccessKey.Operator.ObservedError": [
    "访问密钥观察失败",
    "Access key observed failed"
  ],
  "AccessKey.Operator.RemoveError": [
    "访问密钥删除失败",
    "Access key removed failed"
  ],
  "AccessKey.Operator.DisabledTips": [
    "是否确定禁用该访问密钥?",
    "Are you sure you want to disable the access key?"
  ],
  "AccessKey.Operator.EnabledTips": [
    " 是否确定启用该访问密钥?",
    "Are you sure you want to enable the access key?"
  ],
  "AccessKey.Operator.ObservedTips": [
    " 是否确定观察该访问密钥?",
    "Are you sure you want to observe the access key?"
  ],
  "AccessKey.Operator.RemoveTips": [
    " 是否确定删除该访问密钥?",
    "Are you sure you want to remove the access key?"
  ],
  "AccessKey.ConfigAccessKeys.Secret": [
    "访问密钥",
    "Access Key Secret"
  ],
  "AccessKey.ConfigAccessKeys.Status": [
    "状态",
    "Status"
  ],
  "AccessKey.ConfigAccessKeys.LastModify": [
    "最后修改人",
    "Last Modifier"
  ],
  "AccessKey.ConfigAccessKeys.LastModifyTime": [
    "最后修改时间",
    "Last Modified Time"
  ],
  "AccessKey.ConfigAccessKeys.Operator": [
    "操作",
    "Operation"
  ],
  "AccessKey.NoAccessKeyServiceTips": [
    "该环境没有配置访问密钥",
    "There are no access keys in this environment."
  ],
  "Config.Sync.Tips1": [
    "通过同步配置功能，可以使多个环境、集群间的配置保持一致",
    "Configurations between multiple environments and clusters can be maintained by synchronize configuration"
  ],
  "Config.Sync.Tips2": [
    "需要注意的是，同步完之后需要发布后才会对应用生效",
    "It should be noted that the configurations will not take effect until they are released after synchronization."
  ],
  "Config.Diff.Tips": [
    "通过比较配置功能，可以查看多个环境、集群间的配置差异",
    "By comparing configuration, you can see configuration differences between multiple environments and clusters"
  ],
  "Component.Namespace.Master.Items.Body.Grayscale": [
    "灰",
    "Gray"
  ],
  "Component.Namespace.Master.Items.Body.HaveGrayscale": [
    "该配置有灰度配置,点击查看灰度的值",
    "This configuration has grayscale configuration. Click to view the value of grayscale."
  ],
  "Delete.DeleteApp": [
    "删除应用",
    "Delete application"
  ],
  "Component.Namespace.MasterBranch.Body.Title": [
    "主版本的配置",
    "Configuration of the main version"
  ],
  "Common.AppOwnerLong": [
    "应用负责人",
    "App Owner"
  ],
  "Common.AppAdmin": [
    "应用管理员",
    "App Administrators"
  ],
  "App.Setting.Admin": [
    "管理员",
    "Administrators"
  ]
};
