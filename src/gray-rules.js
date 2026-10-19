import { escapeHTML as e, attr, formField, actionButton as button } from './ui.js';

export function grayRuleFields(draft, t) {
  const copy = key => t('Component.GrayscalePublishRule.' + key);
  const chips = (values, kind) => `<div class="gray-rule-chips">${values.map((value, index) => `<span class="reference-tag" data-gray-${kind}>${e(value)}${button('gray-rule-remove-' + kind, '×', `data-index="${index}"`, false, 'link')}</span>`).join('')}</div>`;
  return `<div class="gray-rule-fields">${draft.public ? formField('clientAppId', copy('AppId'), draft.clientAppId, 'text', true) + `<div class="form-field"><span>${copy('AcceptRule')}</span><div><label><input type="radio" name="allInstances" value="false" data-action="gray-rule-mode" data-all="false"${!draft.all ? ' checked' : ''}> ${copy('AcceptPartInstance')}</label><label><input type="radio" name="allInstances" value="true" data-action="gray-rule-mode" data-all="true"${draft.all ? ' checked' : ''}> ${copy('AcceptAllInstance')}</label></div></div>` : ''}${!draft.all ? `<div class="form-field"><span>${copy('IP')}</span><div class="gray-rule-inputs"><select name="instanceIp" data-gray-rule-instances aria-label="${t('RulesModal.ChooseInstances')}"><option value="">${t('RulesModal.ChooseInstances')}</option>${(draft.instances || []).map(ip => `<option value="${attr(ip)}">${e(ip)}</option>`).join('')}</select>${draft.instanceError ? `<small role="alert">${e(draft.instanceError)}</small>` : ''}<small>${draft.public ? copy('AppIdFilterTips') + '<br>' : ''}${copy('IpTips')} ${button('gray-rule-manual', copy('EnterIp'), '', false, 'link')}</small>${draft.manual ? `<div class="gray-rule-batch"><textarea name="newIps" rows="3" placeholder="${attr(copy('EnterIpTips'))}"></textarea>${button('gray-rule-add-ip', copy('Add'))}</div>` : ''}</div></div>${chips(draft.ips, 'ip')}<div class="form-field"><span>${copy('Label')}</span><div class="gray-rule-inputs gray-rule-batch"><textarea name="newLabels" rows="1" placeholder="${attr(copy('EnterLabelTips'))}"></textarea>${button('gray-rule-add-label', copy('Add'))}</div></div>${chips(draft.labels, 'label')}` : ''}</div>`;
}

export function handleGrayRuleControl(action, element, { s, t, root, render }) {
  const dialog = s.dialog, draft = dialog?.grayRule;
  if (!draft) throw Error(t('denied'));
  const form = root.querySelector('[role="dialog"] form'),
    values = Object.fromEntries(new root.ownerDocument.defaultView.FormData(form));
  if (draft.public) draft.clientAppId = values.clientAppId;
  if (action === 'gray-rule-manual') draft.manual = !draft.manual;
  else if (action === 'gray-rule-mode') {
    draft.all = element.dataset.all === 'true';
    values.allInstances = String(draft.all);
  } else if (action === 'gray-rule-remove-ip' || action === 'gray-rule-remove-label') {
    draft[action.endsWith('-ip') ? 'ips' : 'labels'].splice(Number(element.dataset.index), 1);
  } else {
    const ip = action !== 'gray-rule-add-label',
      text = action === 'gray-rule-select' ? values.instanceIp : values[ip ? 'newIps' : 'newLabels'],
      items = String(text || '').split(',').map(value => value.trim()).filter(Boolean);
    if (ip && items.some(value => !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || value.split('.').some(part => Number(part) > 255)))
      throw Error(t('grayInvalidIP'));
    const kind = ip ? 'ips' : 'labels';
    draft[kind] = [...new Set([...draft[kind], ...items])].filter(value => value !== '*');
    values[ip ? 'newIps' : 'newLabels'] = '';
    values.instanceIp = '';
  }
  dialog.values = values;
  dialog.fields = grayRuleFields(draft, t);
  render();
}
