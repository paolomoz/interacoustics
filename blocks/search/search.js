/*
 * search — site search (input + live results region + empty / no-results states).
 * Covers /search. GAP template (search-results).
 *
 * PHASE 3 (dynamic — BUILT): the query runs client-side over the published
 * `/query-index.json` (title / description / path, ~2k-page ceiling), fetched
 * once and cached in memory (migration-plan.md section 4 #1). The authored
 * sample rows in the block are kept as a GRACEFUL FALLBACK: if the index is
 * unreachable (404 / network error) the block searches the authored sample
 * instead, so the page is never a dead box. As Phase-1 clones publish more
 * pages the index grows and search scales automatically — no code change.
 *
 * Behaviour: debounced input (180ms), ?q= prefill, empty prompt + no-results
 * states, capped/paginated results (20/page, "Show more"), aria-live region,
 * reduced-motion friendly (no essential motion).
 *
 * Authoring rows:
 *   prompt row:  a single <p> — the input placeholder text
 *   sample rows: one per fallback entry — <h3><a href>Title</a></h3> + desc <p>
 */

const INDEX_URL = '/query-index.json';
const PAGE = 20;
const DEBOUNCE = 180;

const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* breadcrumb from a path: /academy/oae-training → "Academy › OAE Training" */
function crumb(href) {
  try {
    const p = (href || '').split('?')[0].split('#')[0].replace(/^https?:\/\/[^/]+/, '');
    const parts = p.split('/').filter(Boolean);
    if (!parts.length) return 'Home';
    return parts
      .map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(' › ');
  } catch { return ''; }
}

async function loadIndex() {
  try {
    const res = await fetch(INDEX_URL);
    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json.data) ? json.data : [];
    return rows
      .filter((r) => r.path && (r.title || r.description))
      .filter((r) => !/noindex/i.test(r.robots || ''))
      .map((r) => ({
        title: r.title || r.path,
        desc: r.description || '',
        href: r.path,
      }));
  } catch { return null; }
}

export default async function decorate(block) {
  // parse authored placeholder + fallback sample BEFORE clearing the block
  const rows = [...block.querySelectorAll(':scope > div')];
  let placeholder = 'Search';
  const sample = [];
  rows.forEach((row) => {
    const h3 = row.querySelector('h3, h4');
    if (h3) {
      const a = h3.querySelector('a');
      const desc = [...row.querySelectorAll('p')].map((p) => text(p)).find(Boolean) || '';
      sample.push({ title: text(h3), href: a ? a.getAttribute('href') : '#', desc });
      return;
    }
    const t = text(row);
    if (t) placeholder = t;
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.setAttribute('action', '/search');
  form.setAttribute('method', 'get');
  form.innerHTML = `
    <label class="sr-only" for="site-search">Search the site</label>
    <input id="site-search" class="search-input" name="q" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(placeholder)}">
    <button type="submit" class="btn btn-primary search-submit">Search</button>`;
  shell.append(form);

  const results = document.createElement('div');
  results.className = 'search-results';
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('role', 'region');
  results.setAttribute('aria-label', 'Search results');
  shell.append(results);

  // data source: published index (preferred), authored sample (fallback)
  let entries = sample;
  let live = false;
  const indexed = await loadIndex();
  if (indexed && indexed.length) { entries = indexed; live = true; }

  let shown = PAGE;
  let current = [];

  const renderPrompt = () => {
    const note = live
      ? `Searching ${entries.length} published page${entries.length === 1 ? '' : 's'}.`
      : 'Showing a representative sample (site index unavailable).';
    results.innerHTML = `<p class="search-state search-prompt">Start typing to search across products, courses, articles and support. <span class="search-note">${esc(note)}</span></p>`;
  };
  const renderNoResults = (q) => {
    results.innerHTML = `<p class="search-state search-empty">No results for &ldquo;${esc(q)}&rdquo;. Try a different term.</p>`;
  };
  const renderList = (q) => {
    const slice = current.slice(0, shown);
    const count = document.createElement('p');
    count.className = 'search-count meta-label';
    count.textContent = `${current.length} result${current.length === 1 ? '' : 's'} for "${q}"`;
    const ul = document.createElement('ul');
    ul.className = 'search-list';
    slice.forEach((it) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'search-hit';
      a.setAttribute('href', it.href);
      a.innerHTML = `<span class="search-hit-crumb">${esc(crumb(it.href))}</span><span class="search-hit-title">${esc(it.title)}</span><span class="search-hit-desc">${esc(it.desc)}</span><span class="search-hit-url">${esc(it.href)}</span>`;
      li.append(a);
      ul.append(li);
    });
    const kids = [count, ul];
    if (current.length > shown) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'btn btn-secondary search-more';
      more.textContent = `Show more (${current.length - shown} remaining)`;
      more.addEventListener('click', () => { shown += PAGE; renderList(q); });
      kids.push(more);
    }
    results.replaceChildren(...kids);
  };

  const run = (raw) => {
    const q = raw.trim();
    if (!q) { renderPrompt(); return; }
    const needle = q.toLowerCase();
    shown = PAGE;
    current = entries.filter((it) => `${it.title} ${it.desc} ${it.href}`.toLowerCase().includes(needle));
    if (!current.length) { renderNoResults(q); return; }
    renderList(q);
  };

  const input = form.querySelector('.search-input');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => run(input.value), DEBOUNCE);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(timer); run(input.value); });

  // prefill from ?q= (the live Joomla search posts q=; keep the contract)
  const q0 = new URLSearchParams(window.location.search).get('q') || '';
  if (q0) { input.value = q0; run(q0); } else renderPrompt();
}
