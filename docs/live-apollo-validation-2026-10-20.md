# 真实 Apollo 后端与原生 DBX 验证

日期：2026-10-20。结论：**15 项聚焦原生场景通过，存在 1 项未修复的成功提示交互问题。**
这不是全部页面、弹窗、权限或生产验收，完整 1:1 门禁仍为 FAIL。

## 验证环境

- 原生 DBX `0.6.49`，macOS ARM64；通过桌面界面安装并操作 `0.1.3-rc.1`。
- 用户确认安装本地未签名开发包；没有修改既有信任设置，也不是官方签名安装验收。
- 包来自已发布的作者 Prerelease，SHA-256 为
  `000ab57db763335ffb8f9314518a1b31ab3e084e1f270774b4930ad57033f619`。
- 真实 Apollo `2.5.2`，官方源提交 `ed9785c87b390c22efece9ea7ec7eeab2d20a042`；
  构建并启动官方 Assembly，包含 ConfigService、AdminService 和 Portal，使用普通密码认证。
- 使用两个独立的 H2 文件数据库和官方初始化 SQL，不是先前的 HTTP 夹具或 SDK sandbox。
  上游 12 个模块打包成功；为了启动本地环境跳过上游单元测试，不宣称这些测试通过。
- Portal `127.0.0.1:8070`、ConfigService `127.0.0.1:8080`、AdminService `127.0.0.1:8090`；
  三个服务均只绑定 loopback，健康状态 UP。没有连接生产 Apollo 或修改既有业务连接。

插件源代码、UI、sidecar 和发布包未因本次验证而改变。原生 UI 由 CUA 操作，
结果通过真实 Portal/ConfigService HTTP 接口独立回读，而不是仅凭绿色成功提示判断。

## 聚焦结果

| 场景 | 已观察结果 |
| --- | --- |
| 原生安装 | DBX 识别 Apollo Portal 控制台 `0.1.3-rc.1`，加载实际包内 UI 和 sidecar |
| 普通密码认证 | 错误密码被拒绝；正确本地账号显示连接成功 |
| 保存连接与打开工作台 | 新建 `Apollo 本地实机验证`，仅指向 `127.0.0.1:8070` |
| 创建应用 | DBX 创建 `DBXNative20261020`，Portal 回读部门 TEST2、负责人 apollo 和应用名称一致 |
| 关闭的负责人组合框 Enter | 打开候选项；有效表单没有误创建应用，前后真实应用列表均为空 |
| 新增 String 配置 | `native.acceptance=native-v1` 写入真实草稿；发布前客户端接口为 404，没有假发布 |
| 第一次发布 | DBX 发布 `Native v1`；真实 ConfigService 返回 `native-v1` 和实际 releaseKey |
| 修改草稿隔离 | 修改为 `native-v2` 后，Portal 草稿为 v2，但 ConfigService 仍返回 v1 |
| 删除确认框取消 Enter | 用 Tab 确认焦点在“取消”后按 Enter；配置仍在，真实 Portal 没有 DELETE 请求 |
| 第二次发布 | 预览显示 v1/v2 差异；发布 `Native v2` 后 ConfigService 返回 v2，releaseKey 改变 |
| 用户确认的回滚 | 两阶段确认后回滚至 v1；v2 发布作废、v1 活跃，v2 编辑草稿保留 |
| 创建集群 | `native-lab` 实际创建，页面保留“创建成功”，真实导航树包含该集群 |
| 公共 Namespace | 切换 public 保留名称和备注，显示 TEST2 前缀；真实创建 `TEST2.native.public` |
| 格式选择器 Enter | 有效 Namespace 表单中在格式选择器按 Enter，前后公共 Namespace 列表均为空 |
| 后端重启与原生重连 | 重新打开原有 H2 文件后数据仍在；DBX 断开再连接不需重输密码，恢复真实集群、Namespace 和草稿 |

回滚后的正确状态是：**客户端活跃值为 `native-v1`，编辑区的 `native-v2` 仍是未发布草稿。**
不能因为编辑区仍显示 v2 就判断回滚失败，也不应为了“清理显示”再次发布它。

真实访问日志确认两次发布、一次回滚，以及零次 DELETE。权限页面两次加载触发了
正常的 `initPermission` 请求，目标均为本次新建测试 Namespace；没有手动修改既有业务权限。
完整请求路径、次数、截图/回读文件摘要见 [机器记录](live-apollo-validation-2026-10-20.json)。

## 未修复问题：成功提示不自动收起

`NATIVE-UX-01` / P2 / OPEN。

- “操作成功”是上一次请求已完成的提示，**不是后台仍在执行或卡住**。
- 当前实现将 `success` 保留为 true，没有自动关闭计时器；点 `×` 或加载其他路由才清除。
- 因而旧提示会留在后续回滚确认框的下方，容易让人误以为尚未确认的操作已经成功。
- 根因在 [成功提示渲染](../src/views.js) 和 [状态赋值、dismiss 处理](../src/app.js)。
- 建议补齐成功提示自动收起和新操作的陈旧提示处理，保留手动关闭；不能因此清空草稿、
  抢走编辑焦点或自动隐藏重要错误。本次只验证和记录，没有改动已发布的 RC 包。

## 本地环境与证据

环境位于 `~/.local/share/dbx-apollo-lab/2026-10-20-v2.5.2/`。当前使用会话级用户 launchd
任务运行，没有写入登录自启动目录，退出当前登录会话后不会自动恢复。H2 数据文件保留。

```sh
LAB="$HOME/.local/share/dbx-apollo-lab/2026-10-20-v2.5.2"
"$LAB/service.sh" status
```

需要停止时运行 `"$LAB/service.sh" stop`，保留数据；以后手动启动运行
`"$LAB/service.sh" start`。只管理本次测试任务，不影响其他服务。

原生截图、AX 文本、真实 HTTP 回读和脱敏请求路径日志位于本地忽略目录
`output/playwright/live-apollo-20261020/`，未上传为新 Release 资产。
截图捕获偶发失败后均重新读取状态，不盲目重放写操作。测试探针的错误路径、Cookie 读取问题和
短生命周期 shell 进程退出，均与插件实际请求区分；最终运行服务和断线重连已另行复验。

## 未覆盖边界

- 24 个页面、全部弹窗/条件状态的完整视觉及交互 1:1。
- MySQL/生产部署、多环境、多账号和权限/403 矩阵。
- 整个 DBX 桌面应用冷启动、Secret Store 冷解锁；本次仅验证保存连接后的断开/重连。
- 原生只读模式、导入/导出/Host 保存文件、灰度合并/同步和系统管理全流程。
- Windows/Linux 原生运行。既有夹具和跨目标包校验不能替代这些原生验收。

本次为本地验证和文档更新，没有另发版本、替换不可变发布包、变更 Store 候选或执行生产写入。
