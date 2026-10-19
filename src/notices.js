import { escapeHTML } from './ui.js';

const notices = {
  createBranchTips: 'CreateBranchTips',
  deleteConfirmDialog: 'DeleteItem',
  releaseNoPermissionDialog: 'PublishNoPermission',
  modifyNoPermissionDialog: 'ModifyNoPermission',
  masterNoPermissionDialog: 'MasterNoPermission',
  namespaceLockedDialog: 'NamespaceLocked',
  rollbackAlertDialog: 'RollbackAlert',
  emergencyPublishAlertDialog: 'EmergencyPublishAlert',
  deleteBranchDialog: 'DeleteBranch',
  updateRuleTips: 'UpdateRuleTips',
  mergeAndReleaseDenyDialog: 'MergeAndReleaseDeny',
  grayReleaseWithoutRulesTips: 'GrayReleaseWithoutRulesTips',
  deleteNamespaceDenyForMasterInstanceDialog: 'DeleteNamespaceDenyForMasterInstance',
  deleteNamespaceDenyForBranchInstanceDialog: 'DeleteNamespaceDenyForBranchInstance',
  deleteNamespaceDenyForPublicNamespaceDialog: 'DeleteNamespaceDenyForPublicNamespace',
  syntaxCheckFailedDialog: 'SyntaxCheckFailed',
  revokeItemConfirmDialog: 'RevokeItem',
};

export function sourceNotice({ openDialog, t }, id, submit = null, values = {}, extra = {}) {
  const key = 'Config.' + notices[id];
  const copy = {
    warning: ['App.Setting.DeleteAdmin','App.Setting.CanNotDeleteAllAdmin'],
    deleteConsumerDialog: ['Delete.DeleteApp','Open.Manage.DeleteConsumer.Confirm'],
  }[id] || [key + '.DialogTitle',key + '.DialogContent'];
  const content = values.message !== undefined ? `<pre>${escapeHTML(values.message)}</pre>` : t(copy[1]).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, name) => escapeHTML(values[name] ?? ''));
  openDialog(t(copy[0]), content, submit || (() => {}), {
    sourceId: id, sourceNotice: true, ackOnly: !submit, danger: id !== 'createBranchTips', confirmLabel: t(id === 'createBranchTips' ? 'confirm' : 'sourceConfirm'), ...extra,
  });
}

export function publishDeniedFields(t, env, allowed) {
  return t('Component.PublishDeny.Tips1').replace(/\{\{\s*env\s*\}\}/g, escapeHTML(env)) +
    (allowed ? `<br><br><small>${t('Component.PublishDeny.Tips2')}</small>` : '');
}
