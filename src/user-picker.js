import { escapeHTML as e, attr } from './ui.js';
import { referenceRow } from './reference-fields.js';
let serial = 0;

export function userSelector(name, label, value, s, required = true, layout = null) {
  const id = 'user-options-' + ++serial, multiple = name === 'admins';
  const choices = s.userChoices || s.users || [];
  const picker = `<div class="user-picker${multiple ? ' user-picker-multiple' : ''}" data-user-picker="${attr(name)}"${multiple ? ' data-multiple' : ''}>${multiple ? `<input type="hidden" name="${attr(name)}" value="${attr(value || '')}"><span class="user-picker-tags"></span>` : ''}<input id="${id}-input" ${multiple ? '' : `name="${attr(name)}"`} class="user-picker-input" value="${attr(multiple ? '' : value || '')}" autocomplete="off" role="combobox" aria-label="${attr(label)}" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}"${required && !multiple ? ' required' : ''}><button type="button" class="user-picker-toggle" data-action="user-picker-toggle" aria-label="${attr(label)}">▾</button><div id="${id}" class="user-picker-options" role="listbox" hidden>${choices.map(user => `<button type="button" role="option" data-action="user-picker-select" data-user-id="${attr(user.userId)}" data-search="${attr((user.userId + ' ' + (user.name || '')).toLowerCase())}">${e(user.userId)}${user.name && user.name !== user.userId ? ` (${e(user.name)})` : ''}</button>`).join('')}</div></div>`;
  return layout
    ? referenceRow(label, picker, { ...layout, required, labelFor: id + '-input' })
    : `<div class="form-field"><span><label for="${id}-input">${required ? '<b>*</b> ' : ''}${e(label)}</label></span>${picker}</div>`;
}

function setOpen(picker, open) {
  picker.querySelector('.user-picker-options').hidden = !open;
  picker.querySelector('.user-picker-input').setAttribute('aria-expanded', String(open));
}

export function syncUserPickers(root) {
  for (const picker of root.querySelectorAll('[data-user-picker][data-multiple]')) {
    const values = picker.querySelector('input[type="hidden"]').value.split(/[,\s]+/).filter(Boolean), tags = picker.querySelector('.user-picker-tags');
    tags.replaceChildren();
    for (const id of values) {
      const chip = root.ownerDocument.createElement('span'), remove = root.ownerDocument.createElement('button');
      chip.dataset.userChip = id; chip.append(id);
      remove.type = 'button'; remove.dataset.action = 'user-picker-remove'; remove.dataset.userId = id; remove.textContent = '×';
      chip.append(remove); tags.append(chip);
    }
  }
}

export function userPickerInput(input) {
  const picker = input.closest('[data-user-picker]');
  if (!picker || !input.classList.contains('user-picker-input')) return false;
  const query = input.value.toLowerCase();
  for (const option of picker.querySelectorAll('[role="option"]')) { option.hidden = !option.dataset.search.includes(query); option.classList.remove('highlighted'); }
  setOpen(picker, true);
  return true;
}

export function userPickerAction(action, element, root) {
  const picker = element.closest('[data-user-picker]'), input = picker.querySelector('.user-picker-input');
  if (action === 'user-picker-toggle') {
    const open = input.getAttribute('aria-expanded') !== 'true';
    for (const option of picker.querySelectorAll('[role="option"]')) option.hidden = false;
    setOpen(picker, open); input.focus(); return;
  }
  if (picker.hasAttribute('data-multiple')) {
    const field = picker.querySelector('input[type="hidden"]'), ids = new Set(field.value.split(/[,\s]+/).filter(Boolean));
    if (action === 'user-picker-remove') ids.delete(element.dataset.userId); else ids.add(element.dataset.userId);
    field.value = [...ids].join(','); input.value = ''; syncUserPickers(root);
  } else input.value = element.dataset.userId;
  setOpen(picker, false); input.focus();
}

export function userPickerKey(event, root) {
  const picker = event.target.closest('[data-user-picker]');
  if (!picker || !event.target.classList.contains('user-picker-input')) return false;
  if (event.target.getAttribute('aria-expanded') !== 'true') {
    if (!['Enter','ArrowDown','ArrowUp'].includes(event.key)) return false;
    event.preventDefault();
    const options = [...picker.querySelectorAll('[role="option"]')];
    for (const option of options) { option.hidden = false; option.classList.remove('highlighted'); }
    const selected = options.find(option => option.dataset.userId === event.target.value);
    (selected || options[event.key === 'ArrowUp' ? options.length - 1 : 0])?.classList.add('highlighted');
    setOpen(picker, true);
    return true;
  }
  const options = [...picker.querySelectorAll('[role="option"]')].filter(option => !option.hidden), selected = options.findIndex(option => option.classList.contains('highlighted'));
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); options.forEach(option => option.classList.remove('highlighted'));
    const next = selected < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (selected + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next]?.classList.add('highlighted'); return true;
  }
  if (event.key === 'Enter' || event.key === 'Escape') {
    event.preventDefault();
    if (event.key === 'Enter' && options.length) userPickerAction('user-picker-select', options[Math.max(selected, 0)], root); else setOpen(picker, false);
    return true;
  }
  return false;
}
