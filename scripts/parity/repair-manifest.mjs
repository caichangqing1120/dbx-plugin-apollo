import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..'), dir = 'output/playwright/repair';
const manifest = JSON.parse(await readFile(resolve(root, 'docs/parity/manifest.json'), 'utf8'));
const pageFindings = {
 'index.html': ['Language 下拉已恢复；主页及配置入口保留', '导航搜索控件、图标和页脚间距仍不同；外部链接使用明确的 sandbox 适配。'],
 'app.html': ['字段顺序和说明已恢复，独立创建页面', '用户选择器仍为 datalist；部分输入宽度、标签和间距未与原版完全一致。'],
 'config.html': ['排序、完整值查看、折叠、文本编辑/检查/格式化、实例和更改历史、主灰度布局', '主灰度切换和控件细节仍不同；新增灰度说明和部分权限警告分支尚未全部同构。'],
 'app/setting.html': ['管理员区域在前，基础信息默认只读，显式进入修改', '内联用户选择器/按钮横排、基本信息列宽与纵向高度仍不同。'],
 'app/access_key.html': ['说明、全部环境区域、修改人/时间、环境隔离操作', '原版明文改为默认脱敏；布局、列宽及按钮位置仍不同，不擅自接受安全例外。'],
 'app/manage_cluster.html': ['按环境显示集群及授权入口', '原版紧凑行仍被较高卡片替代，授权位置和额外配置入口不同。'],
 'cluster.html': ['独立创建页、说明、备注及多环境创建', '说明内容、输入宽度/高度、标签和按钮仍不同。'],
 'cluster/ns_role.html': ['内联用户选择、真实 DTO 标签、添加/删除权限', '用户选择器、控件横向比例和整体高度仍不同。'],
 'namespace.html': ['创建/关联模式、私有/公共类型、格式、选择集群及原版说明', '创建页宽度、单选/选择器横排、格式栏和部分提示仍不同。'],
 'namespace/role.html': ['每个角色独立选择环境、真实用户标签、pending 期间拒绝写入', '原版同时展开全部环境授权组；当前仅显示所选环境标签，未通过全量 1:1。'],
 'config/history.html': ['真实 compare、首灰基线、重试、静态操作图例、时间线、10 条分页及隐藏保护', '正常时间线结构已重新对齐；文本版本详情、操作标记和按钮细节仍需逐态一致性验收。'],
 'config/sync.html': ['两步流程、日期过滤、排序、预览与应用', '原版默认目标勾选、源集群展示、表格宽度及说明位置仍不同。'],
 'config/diff.html': ['两步表格/文本比较、联合 Key、差异/备注开关、空源比较', '选择表的宽度/留白和说明文字仍不同；不能只据 API 测试判为 1:1。'],
 'user-manage.html': ['同页新增/修改，过滤/重置与状态操作', '搜索栏、表头文案、按钮布局和编辑字段比例仍不同。'],
 'server_config_manage.html': ['Portal/ConfigDB 页签、过滤/重置、内联参数编辑', '说明文案、行高/间距和新增/编辑状态仍需像素对齐。'],
 'system-role-manage.html': ['补齐 Master 查询、允许/禁止和目标输入失效', '内联选择器/查询/操作按钮位置与原版不同。'],
 'system_info.html': ['每环境 Config/Admin 独立表格和服务健康查询', '表格行高、段落间距及长页面高度仍不同。'],
 'open/manage.html': ['消费者列表及创建/授权路由', '空表占位、表头及按钮细节仍不同；全部原版弹窗尚未逐态验证。'],
 'open/add-consumer.html': ['独立查询/创建，实际 Token 查询，按环境 App/Namespace 赋权', '查询、创建及赋权表单的行宽/横排/高度明显不同，未达 1:1。'],
 'config_export.html': ['按环境/按应用集群两个页签、独立导入表单及查询后导出', '环境选项、冲突选项、上传控件和按钮位置仍不同。'],
 'delete_app_cluster_namespace.html': ['三种资源独立查询/回显后删除，变更条件立即失效', '查询按钮和删除按钮未与字段同行，说明/字段比例及页面高度不同。'],
 'audit_log_menu.html': ['查询日期/操作名、真实列表与链路入口', '查询区宽度、按钮位置和表头布局仍不同。'],
 'audit_log_trace_detail.html': ['树、实体、属性历史三栏联动及分页', '空态留白、标题/徽标/按钮位置仍不同；正常截图不冒充非空属性历史浏览器验收。'],
 'global_search_value.html': ['查询表和原版许可空态图片', '空表额外占位及留白导致空态图和页面高度不同。'],
};
for (const entry of manifest.pages) {
 const [remediation, finding] = pageFindings[entry.source];
 Object.assign(entry, { remediation, finding, status: 'FAIL', evidenceKind: 'current-browser-pair-and-source; strict-parity-not-passed' });
}
const knownDialogs = {
 itemModal: '已修复空值/类型/只读 Key/跨集群/JSON 格式化/展开与全选；正常编辑器已重拍。',
 releaseModal: '已修复真实发布值/草稿预览及上下文；正常预览和无提前写入已在 SDK 验证。',
 rollbackModal: '已修复真实差异预览、第二次确认和草稿保留。',
 rollbackAlertDialog: '已实现预览后的独立确认；SDK 实测回滚及显式撤销。',
 mergeAndReleaseDenyDialog: '已实测主版本草稿阻断，且最终提交前再次检查。',
 mergeAndPublishModal: '已实现先选择分支处置再预览差异及最终确认。',
 rulesModal: '已实现实例/IP/标签、去重删除、仅标签、全部实例、关联公共和异步输入保护。',
 deleteNamespaceModal: '已实现使用情况与强制确认，提交前重新查询，零实例但仍有使用记录也需确认。',
 publishDenyModal: '已实现编辑/发布分离检查和显式紧急发布入口，使用真实 LockInfo 字段。',
 emergencyPublishAlertDialog: '已实现额外紧急发布警告和最终开关重查，DOM 回归已验证。',
 namespaceLockedDialog: '已实现锁拥有者提示和跨导航过期响应隔离，DOM 回归已验证。',
 showTextModal: '已实现 Key/Value 完整文本查看，已重拍。',
};
for (const entry of manifest.dialogs) {
 const oldNative = entry.nativeImage;
 entry.referenceImage = entry.referenceImage ? '../parity/' + entry.referenceImage : null;
 entry.nativeImage = null;
 if (oldNative) { try { await access(resolve(root, dir, oldNative)); entry.nativeImage = oldNative; } catch {} }
 if (entry.id === 'showTextModal') entry.nativeImage = 'native-modal-show-text.png';
 if (entry.id === 'mergeAndReleaseDenyDialog') entry.nativeImage = 'native-gray-merge-blocked.png';
 if (entry.id === 'rollbackAlertDialog') entry.nativeImage = 'native-modal-rollback-confirm.png';
 entry.remediation = knownDialogs[entry.id] || '本项未列入已完成的异常态浏览器验收。';
 entry.finding = knownDialogs[entry.id]
  ? '业务修复与正常截图不能代替该声明所有上下文的完整 1:1；原版布局/文案/控件和异常态仍未全部验收。'
  : '仍存在原版专用流程与通用提示/确认的差异，或尚未触发当前全部分支；保留 FAIL，不冒充已修复/已浏览器验收。';
 entry.status = 'FAIL';
 entry.evidenceKind = entry.nativeImage ? 'current-native-state-and-source; reference-image-historical-when-present' : 'source-and-focused-tests-only; not-current-browser-triggered';
}
const hash = createHash('sha256');
for (const name of (await readdir(resolve(root, 'src'))).sort()) {
 hash.update('src/' + name + '\0'); hash.update(await readFile(resolve(root, 'src', name)));
}
Object.assign(manifest, {
 phase: 'repair', baseline: 'manifest.json', evidenceDirectory: dir,
 verdict: 'FAIL', acceptancePassed: false,
 nativeSourceSHA256: hash.digest('hex'),
 nativeSourceHashAlgorithm: 'sha256 of sorted src/name + NUL + file bytes',
 nativeUISHA256: createHash('sha256').update(await readFile(resolve(root, 'ui/index.html'))).digest('hex'),
 browserWriteChecks: 17, capturedNativeStates: 54,
 note: 'Seven review defects repaired; normal pages re-captured and manually inspected. All original UI parity remains FAIL, including significant layout/grouping and warning-flow differences. Not live Apollo acceptance.',
});
await writeFile(resolve(root, 'docs/parity/repair-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Wrote current repair census, strict full-parity gate remains FAIL.');
