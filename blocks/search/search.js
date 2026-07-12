/*
 * search — site search UI (input + live results region + empty / no-results
 * states). GAP template (search-results). Covers /search.
 *
 * PHASE 3 (dynamic): the query is filtered client-side over an AUTHORED SAMPLE of
 * representative site entries so the template is a real, functional stub — not a
 * dead box. The production build fetches the published `query-index.json`
 * (title / description / path, ~2k pages) and filters/ranks that instead of the
 * authored sample (migration-plan.md section 4 #1). The DOM, states and a11y
 * wiring here are the final shape; only the data source changes.
 *
 * Authoring rows:
 *   prompt row:  a single <p> — the input placeholder text
 *   sample rows: one per entry — <h3><a href>Title</a></h3> + description <p>
 */

const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  let placeholder = 'Search';
  const items = [];
  rows.forEach((row) => {
    const h3 = row.querySelector('h3, h4');
    if (h3) {
      const a = h3.querySelector('a');
      const desc = [...row.querySelectorAll('p')].map((p) => text(p)).find(Boolean) || '';
      items.push({ title: text(h3), href: a ? a.getAttribute('href') : '#', desc });
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

  const renderPrompt = () => {
    results.innerHTML = '<p class="search-state search-prompt">Start typing to search across products, courses, articles and support. <span class="search-note">Full client-side index search over the published site index lands in Phase 3.</span></p>';
  };
  const renderNoResults = (q) => {
    results.innerHTML = `<p class="search-state search-empty">No results for &ldquo;${esc(q)}&rdquo;. Try a different term.</p>`;
  };
  const renderList = (matches, q) => {
    const ul = document.createElement('ul');
    ul.className = 'search-list';
    matches.forEach((it) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'search-hit';
      a.setAttribute('href', it.href);
      a.innerHTML = `<span class="search-hit-title">${esc(it.title)}</span><span class="search-hit-desc">${esc(it.desc)}</span><span class="search-hit-url">${esc(it.href)}</span>`;
      li.append(a);
      ul.append(li);
    });
    const count = document.createElement('p');
    count.className = 'search-count meta-label';
    count.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} for "${q}"`;
    results.replaceChildren(count, ul);
  };

  const run = (raw) => {
    const q = raw.trim();
    if (!q) { renderPrompt(); return; }
    const needle = q.toLowerCase();
    const matches = items.filter((it) => `${it.title} ${it.desc}`.toLowerCase().includes(needle));
    if (!matches.length) { renderNoResults(q); return; }
    renderList(matches, q);
  };

  const input = form.querySelector('.search-input');
  input.addEventListener('input', () => run(input.value));
  form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); });

  // prefill from ?q= (the live Joomla search posts q=; keep the contract)
  const q0 = new URLSearchParams(window.location.search).get('q') || '';
  if (q0) { input.value = q0; run(q0); } else renderPrompt();
}
