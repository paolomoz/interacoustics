/*
 * ledger — hairline whole-row-link product ledger (canon: index products-ledger,
 * solutions chapter-* catalogue ledgers). BUILT BY CLUSTER A for its pages —
 * cluster B extends/owns; authoring shape recorded in eds-conversion-log.md.
 * Schema: stardust/eds-schema/{index,solutions}.json.
 *
 * Variants (block class):
 *   index      home products: duotone editorial thumbs, rail = h2 + portfolio p
 *   catalogue  solutions chapters: undoctored product renders, rail = count
 *              meta + h2 + intro + optional rail photo; `mist` adds the tinted band
 *   grouped    audiometers catalogue (schema: stardust/eds-schema/audiometers.json
 *              §products-ledger): SEVERAL groups in ONE block — a new group opens
 *              on each <strong>N products</strong> count row (or h2) once the
 *              current group has units; groups stack with the canon rhythm
 *   directory  product-support family chapters (schema:
 *              stardust/eds-schema/product-support.json §family-*): units are
 *              name-only support routes (h3 + <a>, no thumb/desc) rendered as
 *              the compact .dir sheet; the <code> anchor row may carry TWO
 *              tokens ("abr directory") — section id + shell id
 *   courses    academy online-courses (schema: stardust/eds-schema/academy.json
 *              §online-courses): the <strong> label ("Our latest courses")
 *              renders as a ruled .ledger-head ABOVE the list (not in the
 *              rail); unit desc = the author|topic meta line; wide 160x72
 *              course-banner thumbs; the plain foot link renders alone
 *
 * Authoring rows:
 *   [<p><code>anchor</code></p>]                — section anchor id (subnav target)
 *   head rows (no h3): [<strong>N products</strong>] | h2 | intro p | [rail <img>]
 *   unit rows (one per product): <img> thumb | <h3><a href>Name</a> [<em>NEW</em>]</h3>
 *                                + desc p (same or next cell)
 *   [sublist row: <strong>Label:</strong> + plain <a>s]
 *   [foot row: p copy + <em><a> category route(s)]
 *   grouped: repeat head rows + unit rows per group
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* parse one group's rows (head/units/sublist/foot) — canon classifier */
function parseGroup(rows) {
  const head = {
    anchor: null, count: null, h2: null, intro: [], photo: null,
  };
  const units = [];
  const sublist = [];
  let sublistLabel = null;
  const foot = { copy: null, ctas: [] };

  const classifyHead = (n) => {
    const t = text(n);
    const code = pick(n, 'code');
    if (code && !head.anchor && !units.length) { head.anchor = text(code); return; }
    const media = pick(n, 'picture, img');
    if (media) { head.photo = media; return; }
    const h2 = pick(n, 'h1, h2');
    if (h2) { head.h2 = h2; return; }
    if (!t) return;
    const links = n.matches?.('a') ? [n] : [...(n.querySelectorAll?.('a') || [])];
    const strong = pick(n, 'strong');
    if (strong && !links.length && text(strong) === t) {
      if (!units.length) head.count = t;
      else sublistLabel = t;
      return;
    }
    if (links.length) {
      const isCta = (l) => l.closest('strong, em') || l.querySelector('strong, em') || l.classList.contains('btn');
      const emphasised = links.some(isCta);
      if (units.length && !emphasised) {
        sublist.push(...links);
        if (strong) sublistLabel = text(strong);
        return;
      }
      if (emphasised) foot.ctas.push(...links.filter(isCta));
      let plain = t;
      links.forEach((l) => { plain = plain.replace(text(l), ''); });
      plain = plain.trim();
      if (plain && units.length) foot.copy = plain;
      return;
    }
    if (units.length) { foot.copy = t; return; }
    head.intro.push(t);
  };

  rows.forEach((row) => {
    const cells = [...row.children];
    const h3 = row.querySelector('h3, h4');
    if (h3) {
      // unit row: thumb + linked name (+ NEW pill) + desc
      const a = h3.querySelector('a');
      const em = h3.querySelector('em');
      const name = text(h3).replace(em ? text(em) : '', '').trim();
      const desc = [...row.querySelectorAll('p')].map(text).filter((t) => t && t !== text(h3)).join(' ');
      units.push({
        img: pick(row, 'picture, img'),
        href: a ? a.getAttribute('href') : '#',
        name,
        pill: em ? text(em) : null,
        desc,
      });
      return;
    }
    cells.forEach((cell) => {
      const kids = [...cell.children];
      if (kids.length) kids.forEach(classifyHead);
      else classifyHead(cell);
    });
  });

  return {
    head, units, sublist, sublistLabel, foot,
  };
}

/* build one group's rail + body pair from a parsed group */
function buildGroup(grid, parsed, isIndex, isDir, isCourses) {
  const {
    head, units, sublist, sublistLabel, foot,
  } = parsed;

  const rail = document.createElement('div');
  rail.className = isIndex ? 'products-rail' : 'group-rail';
  if (head.count && !isCourses) rail.insertAdjacentHTML('beforeend', `<p class="meta-label group-count">${esc(head.count)}</p>`);
  if (head.h2) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...head.h2.childNodes].map((n) => n.cloneNode(true)));
    rail.append(h2);
  }
  head.intro.forEach((t) => {
    rail.insertAdjacentHTML('beforeend', `<p class="${isIndex ? '' : 'intro'}">${esc(t)}</p>`);
  });
  if (head.photo) {
    const fig = document.createElement('figure');
    fig.className = 'rail-photo';
    fig.append(head.photo.cloneNode(true));
    rail.append(fig);
  }
  grid.append(rail);

  const body = document.createElement('div');
  if (isCourses && head.count) {
    body.insertAdjacentHTML('beforeend', `<div class="ledger-head"><span class="meta-label">${esc(head.count)}</span></div>`);
  }
  const ul = document.createElement('ul');
  ul.className = isDir ? 'dir' : 'ledger-list';
  units.forEach((u) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.setAttribute('href', u.href);
    if (isDir) {
      // compact support-directory row: name + arrow, no thumb/desc
      a.className = 'dir-row';
      const h3 = document.createElement('h3');
      h3.textContent = u.name;
      a.append(h3);
      a.insertAdjacentHTML('beforeend', '<span class="dir-arr" aria-hidden="true">→</span>');
      li.append(a);
      ul.append(li);
      return;
    }
    a.className = 'ledger-row';
    const thumb = document.createElement('span');
    thumb.className = 'thumb';
    if (u.img) thumb.append(u.img.cloneNode(true));
    a.append(thumb);
    const copy = document.createElement('span');
    const h3 = document.createElement('h3');
    h3.textContent = u.name;
    if (u.pill) h3.insertAdjacentHTML('beforeend', ` <span class="new-pill">${esc(u.pill)}</span>`);
    copy.append(h3);
    if (u.desc) copy.insertAdjacentHTML('beforeend', `<p class="${isCourses ? 'ledger-meta' : 'ledger-desc'}">${esc(u.desc)}</p>`);
    a.append(copy);
    a.insertAdjacentHTML('beforeend', '<span class="ledger-arr" aria-hidden="true">→</span>');
    li.append(a);
    ul.append(li);
  });
  body.append(ul);

  if (sublist.length) {
    const sub = document.createElement('div');
    sub.className = 'sublist';
    if (sublistLabel) sub.insertAdjacentHTML('beforeend', `<p class="meta-label">${esc(sublistLabel)}</p>`);
    sublist.forEach((a) => {
      const link = document.createElement('a');
      link.className = 'arrow-link';
      link.setAttribute('href', a.getAttribute('href') || '#');
      link.textContent = text(a);
      sub.append(link);
    });
    body.append(sub);
  }

  if (foot.copy || foot.ctas.length) {
    const cf = document.createElement('div');
    cf.className = 'chapter-foot';
    if (foot.copy) cf.insertAdjacentHTML('beforeend', `<p>${esc(foot.copy)}</p>`);
    foot.ctas.forEach((a) => {
      const btn = a.cloneNode(true);
      btn.classList.add('btn');
      if (!btn.classList.contains('btn-primary')) btn.classList.add('btn-secondary');
      cf.append(btn);
    });
    body.append(cf);
  }

  grid.append(body);
}

/* ---- dynamic academy area listing (Phase 3) ------------------------------- *
 * `ledger courses flat dynamic` fetches /academy/query-index.json, filters to
 * the current clinical area (read from <meta name="area"> or the authored
 * <code> anchor's second token), and renders a facet-filtered flat list
 * (All / Course / Reading / Video). The authored static units are the graceful
 * fallback when the index is unreachable/empty. aria-live on results. One block
 * serves all 67 academy area pages — the area comes from page metadata.          */

const FACETS = [
  { key: '', label: 'All' },
  { key: 'course', label: 'Course' },
  { key: 'reading', label: 'Reading' },
  { key: 'video', label: 'Video' },
];

async function loadAcademyIndex(url, area) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json.data) ? json.data : [];
    return rows
      .filter((r) => r.path && r.path !== window.location.pathname)
      .filter((r) => !/noindex/i.test(r.robots || ''))
      .filter((r) => r.format) // items carry a format; area LISTING pages do not
      .filter((r) => !area || (r.area || '').toLowerCase() === area)
      .map((r) => ({
        title: r.title || r.path,
        href: r.path,
        level: r.level || '',
        format: (r.format || '').toLowerCase(),
      }));
  } catch { return null; }
}

async function renderCoursesDynamic(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const parsed = parseGroup(rows);
  const codeTokens = (parsed.head.anchor || '').split(/\s+/).filter(Boolean);
  const [anchorId, areaToken] = codeTokens;
  const areaMeta = document.querySelector('meta[name="area"]');
  const area = ((areaMeta && areaMeta.content) || areaToken || '').toLowerCase();
  const indexUrl = '/academy/query-index.json';

  // set the section anchor (subnav / hero-CTA target) from the <code> token
  if (anchorId) {
    const section = block.closest('.section');
    const existing = document.getElementById(anchorId);
    if (existing && existing !== section && /^H[1-6]$/.test(existing.tagName)) existing.removeAttribute('id');
    if (section && !document.getElementById(anchorId)) { section.id = anchorId; }
  }

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell group-grid';
  block.append(shell);

  const rail = document.createElement('div');
  rail.className = 'group-rail';
  if (parsed.head.h2) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...parsed.head.h2.childNodes].map((n) => n.cloneNode(true)));
    rail.append(h2);
  }
  parsed.head.intro.forEach((t) => rail.insertAdjacentHTML('beforeend', `<p class="intro">${esc(t)}</p>`));
  shell.append(rail);

  const body = document.createElement('div');
  shell.append(body);

  const indexed = await loadAcademyIndex(indexUrl, area);
  const fallback = parsed.units.map((u) => ({
    title: u.name,
    href: u.href,
    level: (u.desc.match(/level\s*:\s*(.+)/i) || [])[1] || '',
    format: '',
  }));
  const items = indexed && indexed.length ? indexed : fallback;
  const live = !!(indexed && indexed.length);

  // facet bar — only the facets that have items (plus All)
  let activeFacet = '';
  const facetBar = document.createElement('div');
  facetBar.className = 'courses-facets';
  facetBar.setAttribute('role', 'group');
  facetBar.setAttribute('aria-label', 'Filter by format');
  const counts = items.reduce((m, i) => { m[i.format] = (m[i.format] || 0) + 1; return m; }, {});
  const shownFacets = live ? FACETS.filter((f) => !f.key || counts[f.key]) : [FACETS[0]];
  if (shownFacets.length > 1) body.append(facetBar);

  const status = document.createElement('p');
  status.className = 'courses-status meta-label';
  status.setAttribute('aria-live', 'polite');
  body.append(status);

  const ul = document.createElement('ul');
  ul.className = 'dir flat';
  body.append(ul);

  const render = () => {
    const list = activeFacet ? items.filter((i) => i.format === activeFacet) : items;
    ul.textContent = '';
    if (!list.length) {
      status.textContent = 'No resources yet';
      ul.innerHTML = '<li class="courses-empty">No resources in this format yet. Check back soon.</li>';
      return;
    }
    list.forEach((i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'dir-row';
      a.setAttribute('href', i.href);
      const copy = document.createElement('span');
      copy.className = 'dir-copy';
      copy.insertAdjacentHTML('beforeend', `<h3>${esc(i.title)}</h3>`);
      const meta = [i.format && live ? i.format.replace(/\b\w/, (c) => c.toUpperCase()) : '', i.level].filter(Boolean).join(' · ');
      if (meta) copy.insertAdjacentHTML('beforeend', `<span class="dir-meta meta-label">${esc(meta)}</span>`);
      a.append(copy);
      a.insertAdjacentHTML('beforeend', '<span class="dir-arr" aria-hidden="true">→</span>');
      li.append(a);
      ul.append(li);
    });
    status.textContent = `${list.length} resource${list.length === 1 ? '' : 's'}${activeFacet ? ` · ${activeFacet}` : ''}`;
  };

  shownFacets.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'courses-facet';
    btn.textContent = f.key ? `${f.label} (${counts[f.key] || 0})` : `All (${items.length})`;
    btn.setAttribute('aria-pressed', f.key === activeFacet ? 'true' : 'false');
    btn.addEventListener('click', () => {
      activeFacet = f.key;
      [...facetBar.children].forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      render();
    });
    facetBar.append(btn);
  });

  render();
}

export default async function decorate(block) {
  // dynamic academy area listing (Phase 3) — index-driven, facet-filtered
  if (block.classList.contains('dynamic') && block.classList.contains('courses')) {
    await renderCoursesDynamic(block);
    return;
  }
  const rows = [...block.querySelectorAll(':scope > div')];
  const isIndex = block.classList.contains('index');
  const grouped = block.classList.contains('grouped');

  // segment rows into groups: a new group opens on a head row carrying a
  // <strong>-only count (or an h2) once the current group already has units
  const chunks = [[]];
  rows.forEach((row) => {
    const cur = chunks[chunks.length - 1];
    if (grouped && cur.some((r) => r.querySelector('h3, h4'))) {
      const t = text(row);
      const strong = row.querySelector('strong');
      const countRow = strong && !row.querySelector('a, h3, h4') && text(strong) === t;
      if (countRow || row.querySelector('h2')) { chunks.push([row]); return; }
    }
    cur.push(row);
  });

  const groups = chunks.filter((c) => c.length).map(parseGroup);
  if (!groups.length) return;
  const isDir = block.classList.contains('directory');
  const isCourses = block.classList.contains('courses');
  // anchor row may carry TWO tokens: "<section-id> <shell-id>" (directory "All" target)
  const tokens = (groups.find((g) => g.head.anchor)?.head.anchor || '').split(/\s+/).filter(Boolean);
  const [anchor, shellAnchor] = tokens;
  if (anchor) {
    // the pipeline auto-slugs headings — a heading whose text equals the
    // anchor must yield its id to the section (subnav target)
    const section = block.closest('.section');
    const existing = document.getElementById(anchor);
    if (existing && existing !== section && /^H[1-6]$/.test(existing.tagName)) existing.removeAttribute('id');
    if (section && !document.getElementById(anchor)) section.id = anchor;
  }

  block.textContent = '';
  const shell = document.createElement('div');
  block.append(shell);
  if (shellAnchor && !document.getElementById(shellAnchor)) shell.id = shellAnchor;
  if (grouped) {
    shell.className = 'shell';
    groups.forEach((g) => {
      const grid = document.createElement('div');
      grid.className = 'group-grid';
      buildGroup(grid, g, isIndex, isDir, isCourses);
      shell.append(grid);
    });
  } else {
    shell.className = `shell ${isIndex ? 'products-grid' : 'group-grid'}`;
    buildGroup(shell, groups[0], isIndex, isDir, isCourses);
  }
}
