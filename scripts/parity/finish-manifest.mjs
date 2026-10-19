import {readFile,writeFile,readdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..'),directory='output/playwright/finish';
const read=async name=>JSON.parse(await readFile(resolve(root,name),'utf8'));
const manifest=await read('docs/parity/manifest.json');
const notices=await read(directory+'/notices-verification.json');
const pixels=await read(directory+'/notice-pixel-comparison.json');
const native=await read(directory+'/native-capture.json'),reference=await read(directory+'/reference-capture.json');
const pages={
 'index.html':['导航、语言页签、应用列表和页脚对照','顶栏搜索仍不是原版 Select2，部分图标/控件细节不同。'],
 'app.html':['自写单/多用户选择器，原版负责人/管理员标签和表单顺序','输入列宽、选择器内部细节和底部间距仍有偏差。'],
 'config.html':['类型/空值、过滤/文本/提交历史、发布/回滚、灰度 Key 跳转','主灰切换、表格列宽/排序图标及行操作排列仍不同；不能判整页 1:1。'],
 'app/setting.html':['默认只读、独立编辑、管理员选择、最后管理员专用警告','内容区高度、信息字段比例和部分按钮/标签间距仍有差异。'],
 'app/access_key.html':['原版明文授权页、适用模式操作、全部环境及原版空态','列宽、环境选择文案和表头/操作细节仍需对齐。'],
 'app/manage_cluster.html':['紧凑集群行、按环境分组、右侧授权','标题/分组留白与行内按钮图标仍不同。'],
 'cluster.html':['四条真实说明、独立创建、多环境和备注','环境选择行结构、字段比例和面板总高度仍有差异。'],
 'cluster/ns_role.html':['真实 DTO、单独修改/发布授权、可搜索用户控件','授权标签的边界、横向比例和组间间距仍有差异。'],
 'namespace.html':['创建/关联模式、公开/私有、格式和原版说明','表单列宽、格式组合及选择目标的细节未全部一致。'],
 'namespace/role.html':['同时展开全局/DEV/UAT 授权组，授予/移除保持行 scope','组边距、用户控件/环境控件细节未达完整像素一致。'],
 'config/history.html':['真实 compare、时间线、10 条分页、选定版本真实 GET 和防串页','详情按钮/图例及不同格式的版本内容仍需完整逐态对齐。'],
 'config/sync.html':['原版默认目标/源行、两条原版说明、两步流程','表头排序按钮样式、选择表列宽及预览布局仍不同。'],
 'config/diff.html':['表格/文本模式、联合 Key、空源比较和原版说明','选择表宽度、间距及差异高亮仍需逐态对齐。'],
 'user-manage.html':['同页新增/编辑、筛选/重置、账号状态','部分列名/提示、编辑字段比例和按钮排列仍有差异。'],
 'server_config_manage.html':['Portal/ConfigDB 页签、过滤及内联编辑','说明文案、编辑控件及行/页签几何仍有差异。'],
 'system-role-manage.html':['横排选择/查询、Master 捕获目标、条件变化立即失效','查询提示、标签/按钮位置和表单高度仍不同。'],
 'system_info.html':['按环境两类服务、真实 Eureka appName 和健康查询','标题/说明和段落留白仍不同；并非原版长页像素一致。'],
 'open/manage.html':['创建/Token 授权入口、源删除确认与列表','表头文案、表格边界/列宽、按钮图标和页面高度仍有差异。'],
 'open/add-consumer.html':['共享 AppId、保留创建草稿、键盘选用户、原版限流条件','复选框说明、查询/授权表单间距及部分动态状态仍需对齐。'],
 'config_export.html':['环境/应用集群页签、查询导出及 ZIP 导入','环境选项布局、提示/冲突选择及文件/按钮位置仍不同。'],
 'delete_app_cluster_namespace.html':['分资源查询/回显后删除、条件变化失效','查询结果区/说明/字段比例及删除确认还未完全等价。'],
 'audit_log_menu.html':['查询日期/操作名称、真实审计行及链路入口','筛选区与列表面板边界、表头文案和间距仍有差异。'],
 'audit_log_trace_detail.html':['等宽三栏、树/实体/属性历史联动和分页','标题/徽标/空态及非空属性历史未完成所有浏览器状态的像素验收。'],
 'global_search_value.html':['查询表、去除多余空行、原版空态图和页脚','列名、查询控件/空态几何仍未全部一致。'],
};
for(const entry of manifest.pages){
 const [remediation,finding]=pages[entry.source];
 Object.assign(entry,{remediation,finding,status:'FAIL',evidenceKind:'current-equal-viewport-browser-pair-and-manual-review'});
}
const normal={
 deleteConfirmDialog:'modal-item-delete',deleteBranchDialog:'modal-delete-gray',revokeItemConfirmDialog:'modal-revoke',
 grantPermissionModal:'modal-consumer-authorize',deleteConsumerDialog:'modal-consumer-delete',rulesModal:'modal-gray-rule',
 importNamespaceModal:'modal-import-namespace',itemModal:'modal-item-edit',mergeAndPublishModal:'modal-merge',
 releaseModal:'modal-release',rollbackModal:'modal-rollback',showTextModal:'modal-show-text',rollbackAlertDialog:'modal-rollback-confirm',
};
const unreachable=new Set(['deleteNamespaceDenyForMasterInstanceDialog','deleteNamespaceDenyForBranchInstanceDialog','deleteNamespaceDenyForPublicNamespaceDialog','{{dialogId}}']);
async function exists(name){try{await access(resolve(root,directory,name));return true;}catch{return false;}}
for(const entry of manifest.dialogs){
 entry.status='FAIL';entry.referenceImage=null;entry.nativeImage=null;
 const states=notices.results.filter(state=>state.id===entry.id || entry.id==='deleteNamespaceModal'&&state.id.startsWith('deleteNamespaceModal-'));
 if(states.length){
  const first=states[0],scores=states.map(state=>pixels.find(score=>score.id===state.id));
  const frameEqual=state=>['x','y','width','height'].every(key=>Math.abs(state.nativeBox[key]-state.referenceBox[key])<=.1);
  const passed=states.every((state,index)=>!state.error&&state.copyEqual&&state.fontEqual&&frameEqual(state)&&scores[index]?.exactEqualPixelPercent>=99.99);
  Object.assign(entry,{status:passed?'PASS':'FAIL',referenceImage:'reference-dialog-'+first.id+'.png',nativeImage:'native-dialog-'+first.id+'.png',
   evidenceKind:'current-browser-triggered-source-state; normalized-copy-font-frame-and-cropped-pixels',
   remediation:'原版专用流程已独立实现，并在原版和实际 SDK 两侧用同一受控场景触发。',
   finding:passed?'本声明所列受控状态通过文案、字体、框体及弹窗内像素门禁；不代表背景页面或全部应用验收通过。':'流程/文案/字体已匹配，但框体位置或弹窗内像素仍未通过严格门禁。',
   verifiedStates:states.map((state,index)=>({id:state.id,scenario:state.fixture,copyEqual:state.copyEqual,fontEqual:state.fontEqual,nativeBox:state.nativeBox,referenceBox:state.referenceBox,pixels:scores[index]}))});
 }else if(unreachable.has(entry.id)){
  Object.assign(entry,{status:'BLOCKED',evidenceKind:'source-inventory-only; not-a-rendered-browser-state',remediation:'保留完整声明清单，未伪造原版运行状态。',finding:entry.id==='{{dialogId}}'?'可复用的确认模板，不是独立用户入口；由具体声明实例验证。':'pinned 原版仅有声明而无调用路径；实际删除使用 usage/force-delete 弹窗。',unreachableOrTemplate:true});
 }else{
  const id=normal[entry.id];
  if(id&&await exists('reference-'+id+'.png'))entry.referenceImage='reference-'+id+'.png';
  if(id&&await exists('native-'+id+'.png'))entry.nativeImage='native-'+id+'.png';
  Object.assign(entry,{evidenceKind:entry.referenceImage&&entry.nativeImage?'current-normal-browser-pair; full-context-parity-not-passed':'source-and-focused-tests; missing-current-paired-state',remediation:'对应原生流程、真实接口/DTO及保护回归已实现；正常状态已捕获。',finding:'正常截图和流程回归不替代完整 1:1：字段比例、差异展示、按钮或特定状态尚未全部一致。'});
 }
}
const hash=createHash('sha256');for(const name of (await readdir(resolve(root,'src'))).sort()){hash.update('src/'+name+'\0');hash.update(await readFile(resolve(root,'src',name)));}
Object.assign(manifest,{phase:'finish',baseline:'repair-manifest.json',evidenceDirectory:directory,verdict:'FAIL',acceptancePassed:false,
 nativeSourceSHA256:hash.digest('hex'),nativeSourceHashAlgorithm:'sha256 of sorted src/name + NUL + file bytes',
 nativeUISHA256:createHash('sha256').update(await readFile(resolve(root,'ui/index.html'))).digest('hex'),
 capturedNativeStates:native.length,capturedReferencePages:reference.length,browserWriteChecks:17,
 dialogRenderedStateGate:{normalizedCopy:true,computedTitleFont:true,frameTolerancePx:.1,croppedExactPixelMinimumPercent:99.99,excludedBorderPx:3,scope:'Rendered dialog interior only; neutral pointer and source transient toasts settled. Not page/background parity.'},
 captureNotes:[
  'Both page viewports are 1304x876 inside the actual SDK iframe or the reference top-level tab; document scrollbars are measured separately.',
  'SDK UI is explicitly reloaded after a new build; initial/stale or transition captures are not accepted as current verification.',
  'Raw NamespaceBO has no lockOwner; separate lock-info DTOs feed master/branch modifiers. ItemBO newValue/isModified and MultiResponseEntity fixtures match pinned source.',
  'Source-only declarations are not claimed browser-triggered. Long-page screenshot crops cover the first viewport; below-fold whole-page parity is not claimed.',
  'App-settings source confirm translation can initialize with its raw key; repeat source load rather than patching or injecting original UI state.',
 ],note:'Current rectification evidence. Significant page/form/context differences remain developer-owned; passing dialog states, unit tests or fixture writes do not close full 1:1 acceptance.'});
await writeFile(resolve(root,'docs/parity/finish-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Current census:',manifest.pages.length,'pages;',manifest.dialogs.length,'declarations;',manifest.dialogs.filter(entry=>entry.status==='PASS').length,'rendered declarations passed. Full gate FAIL.');
