import { attr, escapeHTML as e } from './ui.js';

let fieldSequence = 0;

// Keep column gutters and help text together without importing the reference framework.
export function referenceRow(label, content, {
  labelColumns = 2, columns = 6, required = false, help = '', labelFor = '', className = '', trailing = '',
} = {}) {
  const caption = `${required ? '<b>*</b> ' : ''}${e(label)}`;
  const tips = (Array.isArray(help) ? help : help ? [help] : []).map(tip => `<small>${e(tip)}</small>`).join('<br>');
  return `<div class="form-field reference-grid-row ${attr(className)}" style="--field-label-columns:${labelColumns};--field-control-columns:${columns}"><span class="reference-grid-label">${labelFor ? `<label for="${attr(labelFor)}">${caption}</label>` : caption}</span><div class="reference-control-column">${content}${tips}</div>${trailing}</div>`;
}

export function referenceField(name, label, value = '', options = {}) {
  const { type = 'text', required = false } = options;
  const id = 'reference-field-' + ++fieldSequence;
  const control = type === 'static'
    ? `<input type="hidden" name="${attr(name)}" value="${attr(value)}"><output id="${id}" class="reference-static-value" data-static-field="${attr(name)}">${e(value)}</output>`
    : type === 'textarea'
      ? `<textarea id="${id}" name="${attr(name)}" rows="3"${required ? ' required' : ''}>${e(value)}</textarea>`
      : `<input id="${id}" name="${attr(name)}" type="${attr(type)}" value="${attr(value)}"${required ? ' required' : ''}>`;
  return referenceRow(label, control, { ...options, labelFor: id });
}
