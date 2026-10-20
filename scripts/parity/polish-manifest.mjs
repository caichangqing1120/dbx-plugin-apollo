import { readFile, writeFile, mkdir, copyFile, readdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root=resolve(import.meta.dirname,'../..'),directory='output/playwright/polish';
const historical=resolve(root,process.argv[2] || 'output/playwright/finish');
const read=async name=>JSON.parse(await readFile(resolve(root,name),'utf8'));
const baseline=await read('docs/parity/finish-manifest.json');
const manifest=structuredClone(baseline);
const grid=await read(directory+'/form-grid.json'),warnings=await read(directory+'/notices-verification.json');
const pixels=await read(directory+'/notice-pixel-comparison.json');
const creation=await read(directory+'/creation-flows.json'),keyboard=await read(directory+'/keyboard-safety.json');
const contexts=await read(directory+'/form-contexts.json'),sidebar=await read(directory+'/sidebar-flow.json');
const forms={'app.html':'app','app/setting.html':'app-setting','cluster.html':'cluster','namespace.html':'namespace'};
await mkdir(resolve(root,directory,'baseline'),{recursive:true});
async function oldImage(name){
  if(!name)return null;
  try{await access(resolve(historical,name));await copyFile(resolve(historical,name),resolve(root,directory,'baseline',name));return 'baseline/'+name;}
  catch(error){if(error.code==='ENOENT')return null;throw error;}
}
for(const page of manifest.pages){
  page.status='FAIL';
  if(forms[page.source]){
    const name=forms[page.source];
    Object.assign(page,{referenceImage:`after-reference-${name}.png`,nativeImage:`after-native-${name}.png`,
      evidenceKind:'current paired normal page; selected control/frame geometry only, not complete-page pixel acceptance',
      scopedControlChecks:grid.results.filter(record=>record.source===page.source),
      finding:'本页选定普通控件及面板高度已按原版修复并复测；导航、选择器内部和其他条件状态仍不能据此判整页 1:1。'});
  }else{
    page.referenceImage=await oldImage(page.referenceImage);page.nativeImage=await oldImage(page.nativeImage);
    page.evidenceKind='historical 0.1.2 baseline pair/source finding; not freshly reverified after this increment';
    page.evidenceNativeSourceSHA256=baseline.nativeSourceSHA256;
  }
}
for(const dialog of manifest.dialogs){
  const states=warnings.results.filter(record=>record.id===dialog.id || dialog.id==='deleteNamespaceModal'&&record.id.startsWith('deleteNamespaceModal-'));
  if(states.length){
    const scores=states.map(record=>pixels.find(score=>score.id===record.id));
    const passed=states.every((record,index)=>!record.error&&record.copyEqual&&record.fontEqual&&scores[index]?.exactEqualPixelPercent>=99.99&&['x','y','width','height'].every(key=>Math.abs(record.nativeBox[key]-record.referenceBox[key])<=.1));
    Object.assign(dialog,{status:passed?'PASS':'FAIL',referenceImage:`reference-dialog-${states[0].id}.png`,nativeImage:`native-dialog-${states[0].id}.png`,
      evidenceKind:'current browser-triggered rendered state; copy/font/frame/cropped pixels, not background or all possible contexts',
      finding:passed?'本声明列出的实际提示状态通过文案、字体、框体和内部像素门禁；不代表背景页或全部应用验收通过。':'本声明的当前受控提示状态仍有差异，不能标为通过。',
      verifiedStates:states.map((record,index)=>({id:record.id,scenario:record.fixture,copyEqual:record.copyEqual,fontEqual:record.fontEqual,nativeBox:record.nativeBox,referenceBox:record.referenceBox,pixels:scores[index],...(record.nativeTriggerContext?{nativeTriggerContext:record.nativeTriggerContext}:{})}))});
  }else if(!dialog.unreachableOrTemplate){
    dialog.status='FAIL';dialog.referenceImage=await oldImage(dialog.referenceImage);dialog.nativeImage=await oldImage(dialog.nativeImage);
    dialog.evidenceKind='historical baseline normal dialog; not current complete-context acceptance';
    dialog.evidenceNativeSourceSHA256=baseline.nativeSourceSHA256;
  }
}
const paired=[['namespace-public','公共 Namespace 部门前缀'],['namespace-no-prefix','关闭前缀保留草稿'],['cluster-created','集群创建成功页']];
manifest.additionalStates=paired.map(([id,title])=>({source:title,status:'SCOPED PASS',referenceImage:`reference-${id}.png`,nativeImage:`native-${id}.png`,finding:'当前双侧实际触发；验证流程及指定布局，不宣称整个背景页 1:1。',evidenceKind:'current browser-triggered conditional/success state'}));
for(const [name,title] of [['keyboard-cancel-safe','键盘取消无删除'],['keyboard-format-safe','格式选择器无创建'],['keyboard-owner-safe','组合框无误提交'],['form-english-dark-host','英文草稿及深色宿主'],['form-narrow-host','窄宿主横向布局']])
  manifest.additionalStates.push({source:title,status:'SCOPED PASS',referenceImage:null,nativeImage:`native-${name}.png`,finding:'原生 SDK 操作/请求或上下文检查，非成对像素验收。',evidenceKind:'current SDK-only behavioral/context evidence'});
const hash=createHash('sha256');
for(const name of (await readdir(resolve(root,'src'))).sort()){hash.update('src/'+name+'\0');hash.update(await readFile(resolve(root,'src',name)));}
Object.assign(manifest,{auditDate:'2026-10-20',phase:'polish',baseline:'finish-manifest.json',evidenceDirectory:directory,
  verdict:'FAIL',acceptancePassed:false,nativeSourceSHA256:hash.digest('hex'),
  nativeUISHA256:createHash('sha256').update(await readFile(resolve(root,'ui/index.html'))).digest('hex'),
  capturedReferencePages:Object.keys(forms).length,capturedNativeStates:26,
  scopedVerification:{normalFormControls:{passed:grid.passed,failed:grid.failed},creation:{passed:creation.passed,failed:creation.failed},keyboard:{passed:keyboard.passed,failed:keyboard.failed},contexts:{passed:contexts.passed,failed:contexts.failed},sidebarFlow:{passed:sidebar.passed,failed:sidebar.failed},warnings:{passed:warnings.passed,failed:warnings.failed}},
  note:'Current scoped repairs and evidence are separate from historical 0.1.2 pairs. All-page/all-context acceptance remains FAIL. No live Apollo or native installation acceptance.',
  captureNotes:['Final paired viewports are 1304x876; tall Host viewports may be used to reach long-sidebar controls before opening. Trigger and final capture contexts are not claimed identical.',
    'Shared browser-window viewport caching was corrected in the owned warning harness; no force-click or original UI-state injection.',
    'Historical images are explicitly marked and carry the old source digest; they are not passed as current evidence.',
    'Source-only declarations remain source-only; normal form geometry and selected warning interiors do not close full-page parity.']});
await writeFile(resolve(root,'docs/parity/polish-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Current form controls:',grid.passed,'/',grid.results.length,'; rendered warning states:',warnings.passed,'; declarations passed:',manifest.dialogs.filter(d=>d.status==='PASS').length,'; full gate FAIL');
