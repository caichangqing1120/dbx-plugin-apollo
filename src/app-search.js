import { escapeHTML, attr } from './ui.js';

export function appSearchMarkup(t) {
  return `<form class="app-search" data-form="search" data-app-search><button type="button" class="app-search-selection" data-app-search-toggle role="combobox" aria-label="${attr(t('search'))}" aria-haspopup="listbox" aria-expanded="false" aria-controls="app-search-results"><span>${escapeHTML(t('search'))}</span><b aria-hidden="true"></b></button><div class="app-search-dropdown" data-app-search-dropdown hidden><div class="app-search-field"><input name="query" data-app-search-input aria-label="${attr(t('search'))}" role="searchbox" autocomplete="off" aria-controls="app-search-results"></div><ul id="app-search-results" role="listbox"></ul></div></form>`;
}

export function createAppSearch(root, { client, navigate, state, track, fail }) {
  const doc = root.ownerDocument, win = doc.defaultView;
  let opened = false, query = '', rows = [], active = 0, page = -1;
  let more = false, loading = false, error = '', timer = null, revision = 0, disposed = false;
  const box = () => root.querySelector('[data-app-search]');
  const input = () => root.querySelector('[data-app-search-input]');
  const dropdown = () => root.querySelector('[data-app-search-dropdown]');
  const identity = row => JSON.stringify([row.appId, row.orgId, row.orgName]);
  function stopTimer() {
    if (timer !== null) win.clearTimeout(timer);
    timer = null;
  }
  function close(focus = false) {
    opened = false; revision++; stopTimer();
    root.querySelector('[data-app-search-toggle]')?.setAttribute('aria-expanded', 'false');
    if (dropdown()) dropdown().hidden = true;
    if (focus) root.querySelector('[data-app-search-toggle]')?.focus();
  }
  function paint() {
    const list = root.querySelector('#app-search-results');
    if (!list || !opened || disposed) return;
    dropdown().hidden = false;
    root.querySelector('[data-app-search-toggle]')?.setAttribute('aria-expanded', 'true');
    list.innerHTML = rows.map((row, index) => `<li id="app-search-option-${index}" role="option" aria-selected="${index === active}" data-app-search-index="${index}" class="${index === active ? 'highlighted' : ''}">${escapeHTML(row.appId)} / ${escapeHTML(row.name)}</li>`).join('') +
      (error ? `<li class="app-search-message" role="alert">${escapeHTML(error)}</li>` : loading
        ? `<li class="app-search-message" role="status">${rows.length ? 'Loading more results…' : 'Searching…'}</li>`
        : more ? '<li class="app-search-message" data-app-search-more><button type="button">Loading more results…</button></li>'
          : !rows.length ? '<li class="app-search-message">No results found</li>' : '');
    if (rows.length) input()?.setAttribute('aria-activedescendant', `app-search-option-${active}`);
    else input()?.removeAttribute('aria-activedescendant');
  }
  async function load(nextPage = 0) {
    if (disposed || !opened) return;
    stopTimer();
    const ticket = ++revision, term = query;
    loading = true; error = ''; paint();
    try {
      const result = await client.search(term, nextPage);
      if (ticket !== revision || !opened || disposed) return;
      const rawContent = Array.isArray(result?.content) ? result.content : [];
      const content = rawContent.filter(row => typeof row?.appId === 'string' && row.appId);
      const previous = nextPage ? rows : [];
      const seen = new Set(previous.map(identity));
      rows = [...previous, ...content.filter(row => {
        const key = identity(row); if (seen.has(key)) return false; seen.add(key); return true;
      })];
      page = nextPage;
      const size = Number.isInteger(result?.size) && result.size > 0 ? result.size : 20;
      // Key search merges environment pages; total/size still describe one environment.
      more = rawContent.length > 0 && (Number.isFinite(result?.total) && result.total >= 0
        ? (page + 1) * size < result.total : rawContent.length >= size);
      active = Math.min(active, Math.max(0, rows.length - 1));
    } catch (failure) {
      if (ticket !== revision || !opened || disposed) return;
      if (failure.status === 401 || failure.code === -32001) { close(); fail(failure); return; }
      error = failure.message || String(failure); more = false;
    } finally {
      if (ticket === revision && !disposed) { loading = false; paint(); }
    }
  }
  function schedule() {
    stopTimer(); revision++;
    rows = []; page = -1; active = 0; more = false; error = ''; loading = true; paint();
    timer = win.setTimeout(() => { timer = null; track(() => load(0)); }, 400);
  }
  function open() {
    if (disposed || state().busy || state().loading) return;
    opened = true; query = ''; input().value = ''; schedule(); input().focus();
  }
  async function select(index) {
    const row = rows[index];
    if (!row || disposed || state().busy) return;
    const route = { view: 'config', appId: row.appId };
    if (row.orgName?.startsWith('SearchByItem+')) {
      const parts = String(row.orgId || '').split('+');
      if (parts.length !== 3 || parts.some(value => !value)) throw Error('Invalid configuration search target');
      Object.assign(route, { env: parts[0], cluster: parts[1], namespace: parts[2],
        item: row.orgName.slice('SearchByItem+'.length) });
    }
    close(); await navigate(route);
  }
  function onClick(event) {
    const target = event.target.closest('[data-app-search-toggle],[data-app-search-index],[data-app-search-more]');
    if (!target || !root.contains(target)) return;
    event.preventDefault(); event.stopPropagation();
    if (target.hasAttribute('data-app-search-toggle')) { opened ? close() : open(); return; }
    if (target.hasAttribute('data-app-search-more')) {
      if (more && !loading) track(() => load(page + 1));
    } else track(() => select(Number(target.dataset.appSearchIndex)));
  }
  function onInput(event) {
    if (!event.target.matches('[data-app-search-input]')) return;
    query = event.target.value; opened = true; schedule();
  }
  function onKey(event) {
    if (!event.target.closest('[data-app-search]')) return;
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.key === 'Escape') { close(true); return; }
      if (!opened) { open(); return; }
      if (event.key === 'Enter') { if (rows.length && !loading) track(() => select(active)); return; }
      if (rows.length) {
        active = (active + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
        paint(); root.querySelector(`#app-search-option-${active}`)?.scrollIntoView?.({ block: 'nearest' });
      }
    } else if (event.key === 'Tab') close();
  }
  function onOutside(event) {
    if (opened && !event.composedPath().some(node => node instanceof win.Element &&
      node.hasAttribute('data-app-search'))) close();
  }
  function onScroll(event) {
    if (event.target.id === 'app-search-results' && more && !loading &&
      event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight < 12)
      track(() => load(page + 1));
  }
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKey);
  root.addEventListener('scroll', onScroll, true);
  doc.addEventListener('click', onOutside);
  return {
    reset: close,
    async submit() {
      if (Object.keys(state().drafts).length) throw Error(state().locale.startsWith('zh') ? '存在未保存的配置，请先保存或丢弃' : 'Save or discard unsaved configuration first');
      if (opened && rows.length && !loading) return select(active);
      if (!opened) opened = true;
      query = input()?.value || ''; return load(0);
    },
    destroy() {
      disposed = true; close();
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
      root.removeEventListener('keydown', onKey);
      root.removeEventListener('scroll', onScroll, true);
      doc.removeEventListener('click', onOutside);
    },
  };
}
