/*
 * newsroom — featured story + dateline list (canon: index blog). Owned by
 * cluster C; shape recorded in eds-conversion-log.md.
 * Schema: stardust/eds-schema/index.json §blog, magazine.json §blog-teaser.
 *
 * Variants (block class):
 *   (default)  featured story (img) left + dateline list right
 *   teaser     canon magazine .blog-teaser: rail head (h2 + View All) left,
 *              3-row thumb-less dateline right, card ground + hairlines
 *
 * Authoring rows:
 *   head row: h2 | plain <a> ("View All")
 *   unit rows (one per story, first with <img> = the feature):
 *     [<img>] | date text | <h3>title</h3> | excerpt p | plain <a> ("Read more")
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---- dynamic blog listing (Phase 3) --------------------------------------- *
 * `newsroom stories dynamic` fetches /blog/query-index.json and renders the
 * newsroom feed with client pagination (12/page), a tag filter, and sort-by-date.
 * Falls back to the authored static units (parsed from the block) if the index
 * is unreachable or empty — the page is never blank. aria-live on results.       */

const BLOG_PAGE = 12;

function fmtDate(ts, label) {
  if (label) return label;
  if (!ts) return '';
  const d = new Date(ts * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function loadBlogIndex(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json.data) ? json.data : [];
    return rows
      .filter((r) => r.path && r.path !== window.location.pathname)
      .filter((r) => !/noindex/i.test(r.robots || ''))
      .map((r) => ({
        title: r.title || r.path,
        href: r.path,
        excerpt: r.description || '',
        imgSrc: r.image || '',
        dateTs: Number(r.date) || 0,
        dateLabel: fmtDate(Number(r.date), r.publishedLabel),
        tags: (Array.isArray(r.tags) ? r.tags : (r.tags || '').split(',')).map((t) => String(t).trim()).filter(Boolean),
      }));
  } catch { return null; }
}

/* map an authored fallback unit (parseUnit output) to the dynamic item shape */
function unitToItem(u) {
  const a = (u.title && u.title.querySelector('a')) || u.link;
  return {
    title: u.title ? text(u.title) : '',
    href: (a && a.getAttribute('href')) || '#',
    excerpt: u.excerpt ? text(u.excerpt) : '',
    imgEl: u.img || null,
    imgSrc: '',
    dateTs: 0,
    dateLabel: u.date || '',
    tags: [],
  };
}

function buildImg(item) {
  if (item.imgEl) return item.imgEl.cloneNode(true);
  if (item.imgSrc) {
    const img = document.createElement('img');
    img.src = item.imgSrc;
    img.alt = item.title;
    img.loading = 'lazy';
    return img;
  }
  return null;
}

function buildFeature(item) {
  const article = document.createElement('article');
  article.className = 'feature';
  const img = buildImg(item);
  if (img) article.append(img);
  if (item.dateLabel) article.insertAdjacentHTML('beforeend', `<span class="date">${esc(item.dateLabel)}</span>`);
  article.insertAdjacentHTML('beforeend', `<h3><a href="${esc(item.href)}">${esc(item.title)}</a></h3>`);
  if (item.excerpt) article.insertAdjacentHTML('beforeend', `<p class="excerpt">${esc(item.excerpt)}</p>`);
  return article;
}

function buildRow(item) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.className = 'story-row';
  a.setAttribute('href', item.href);
  const img = buildImg(item);
  if (img) {
    const thumb = document.createElement('span');
    thumb.className = 'story-thumb';
    thumb.append(img);
    a.append(thumb);
  }
  const copy = document.createElement('span');
  if (item.dateLabel) copy.insertAdjacentHTML('beforeend', `<span class="date">${esc(item.dateLabel)}</span>`);
  copy.insertAdjacentHTML('beforeend', `<h3>${esc(item.title)}</h3>`);
  a.append(copy);
  a.insertAdjacentHTML('beforeend', '<span class="story-arr" aria-hidden="true">→</span>');
  li.append(a);
  return li;
}

async function renderDynamicBlog(block, headTitle, headLink, fallbackUnits) {
  const codeEl = block.querySelector('code');
  const indexUrl = (codeEl && text(codeEl)) || '/blog/query-index.json';

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  if (headTitle) {
    const sh = document.createElement('div');
    sh.className = 'stories-head';
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...headTitle.childNodes].map((n) => n.cloneNode(true)));
    sh.append(h2);
    shell.append(sh);
  }

  const indexed = await loadBlogIndex(indexUrl);
  const items = indexed && indexed.length ? indexed : fallbackUnits.map(unitToItem);
  const live = !!(indexed && indexed.length);

  // controls: tag filter + sort (only meaningful with the live index)
  const allTags = [...new Set(items.flatMap((i) => i.tags))].sort();
  let activeTag = '';
  let sortDir = 'desc';

  const controls = document.createElement('div');
  controls.className = 'newsroom-controls';
  if (live) {
    let tagSelect = '';
    if (allTags.length) {
      tagSelect = `<label class="newsroom-filter"><span class="meta-label">Topic</span>
        <select class="newsroom-tag"><option value="">All topics</option>${allTags.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label>`;
    }
    controls.innerHTML = `${tagSelect}
      <label class="newsroom-filter"><span class="meta-label">Sort</span>
        <select class="newsroom-sort"><option value="desc">Newest first</option><option value="oldest">Oldest first</option></select></label>`;
    shell.append(controls);
  }

  const status = document.createElement('p');
  status.className = 'newsroom-status meta-label';
  status.setAttribute('aria-live', 'polite');
  shell.append(status);

  const grid = document.createElement('div');
  grid.className = 'newsroom-grid';
  shell.append(grid);

  let shown = BLOG_PAGE;

  const render = () => {
    let list = items.slice();
    if (activeTag) list = list.filter((i) => i.tags.includes(activeTag));
    list.sort((a, b) => (sortDir === 'desc' ? b.dateTs - a.dateTs : a.dateTs - b.dateTs));

    grid.textContent = '';
    if (!list.length) {
      grid.innerHTML = '<p class="newsroom-empty">No posts match this topic yet. Check back soon.</p>';
      status.textContent = '0 posts';
      return;
    }
    const visible = list.slice(0, shown);
    const feature = visible[0];
    grid.append(buildFeature(feature));
    const rest = visible.slice(1);
    if (rest.length) {
      const ul = document.createElement('ul');
      ul.className = 'story-ledger';
      rest.forEach((i) => ul.append(buildRow(i)));
      grid.append(ul);
    }
    status.textContent = `Showing ${visible.length} of ${list.length} post${list.length === 1 ? '' : 's'}${activeTag ? ` in ${activeTag}` : ''}`;
    if (list.length > shown) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'btn btn-secondary newsroom-more';
      more.textContent = `Show more posts (${list.length - shown} remaining)`;
      more.addEventListener('click', () => { shown += BLOG_PAGE; render(); });
      grid.append(more);
    }
  };

  const tagSel = controls.querySelector('.newsroom-tag');
  if (tagSel) tagSel.addEventListener('change', () => { activeTag = tagSel.value; shown = BLOG_PAGE; render(); });
  const sortSel = controls.querySelector('.newsroom-sort');
  if (sortSel) sortSel.addEventListener('change', () => { sortDir = sortSel.value; shown = BLOG_PAGE; render(); });

  render();
}

function arrowLink(a, srTitle) {
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href') || '#');
  link.className = 'arrow-link';
  const t = text(a).replace(/\s*(→|&rarr;)\s*$/u, '').trim();
  const words = t.split(' ');
  const last = words.pop();
  link.innerHTML = `${words.length ? `${esc(words.join(' '))} ` : ''}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>${srTitle ? `<span class="sr-only">: ${esc(srTitle)}</span>` : ''}`;
  return link;
}

function parseUnit(row) {
  const unit = {
    img: pick(row, 'picture, img'), date: '', title: null, excerpt: null, link: null,
  };
  const walk = (n) => {
    if (n.matches?.('picture, img') || n.querySelector?.(':scope > img, :scope > picture')) return;
    const h3 = n.matches?.('h3, h4') ? n : null;
    if (h3) { unit.title = h3; return; }
    const a = n.matches?.('a') ? n : (n.querySelector?.('a') || null);
    if (a && text(n).length <= text(a).length + 3) { unit.link = a; return; }
    const t = text(n);
    if (!t) return;
    if (!unit.date && t.length <= 24 && /\d{4}/.test(t)) { unit.date = t; return; }
    if (!unit.excerpt) unit.excerpt = n;
  };
  row.querySelectorAll(':scope > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) kids.forEach(walk);
    else walk(cell);
  });
  return unit;
}

function fillArticle(article, unit, isFeature, srTitles) {
  if (isFeature && unit.img) article.append(unit.img.cloneNode(true));
  if (unit.date) article.insertAdjacentHTML('beforeend', `<span class="date">${esc(unit.date)}</span>`);
  if (unit.title) {
    const h3 = document.createElement('h3');
    h3.replaceChildren(...[...unit.title.childNodes].map((n) => n.cloneNode(true)));
    article.append(h3);
  }
  if (unit.excerpt) {
    const p = document.createElement('p');
    p.className = 'excerpt';
    p.replaceChildren(...[...unit.excerpt.childNodes].map((n) => n.cloneNode(true)));
    article.append(p);
  }
  if (unit.link) article.append(arrowLink(unit.link, srTitles && unit.title ? text(unit.title) : ''));
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  let headTitle = null;
  let headLink = null;
  const units = [];
  rows.forEach((row) => {
    if (row.querySelector('h3, h4')) { units.push(parseUnit(row)); return; }
    const h2 = row.querySelector('h1, h2');
    if (h2) headTitle = h2;
    const a = row.querySelector('a');
    if (a) headLink = a;
  });

  // dynamic blog listing (Phase 3): query-index feed + pagination/filter/sort,
  // authored units become the graceful fallback. Leaves static variants untouched.
  if (block.classList.contains('dynamic')) {
    await renderDynamicBlog(block, headTitle, headLink, units);
    return;
  }

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  // teaser variant (canon magazine .blog-teaser): rail head + thumb-less dateline
  if (block.classList.contains('teaser')) {
    shell.classList.add('teaser-grid');
    const rail = document.createElement('div');
    rail.className = 'teaser-rail';
    if (headTitle) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...headTitle.childNodes].map((n) => n.cloneNode(true)));
      rail.append(h2);
    }
    if (headLink) rail.append(arrowLink(headLink));
    shell.append(rail);
    const ul = document.createElement('ul');
    ul.className = 'dateline-list';
    units.forEach((u) => {
      const li = document.createElement('li');
      const article = document.createElement('article');
      fillArticle(article, u, false, true);
      li.append(article);
      ul.append(li);
    });
    shell.append(ul);
    return;
  }

  // stories variant (canon customer-stories): feature + thumbnailed whole-row
  // ledger (story-row: thumb | date + h3 | arrow), head is the h2 alone
  if (block.classList.contains('stories')) {
    if (headTitle) {
      const sh = document.createElement('div');
      sh.className = 'stories-head';
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...headTitle.childNodes].map((n) => n.cloneNode(true)));
      sh.append(h2);
      shell.append(sh);
    }
    const grid = document.createElement('div');
    grid.className = 'newsroom-grid';
    shell.append(grid);
    const feature = units.find((u) => u.excerpt) || units[0];
    if (feature) {
      const article = document.createElement('article');
      article.className = 'feature';
      fillArticle(article, feature, true);
      grid.append(article);
    }
    const rest = units.filter((u) => u !== feature);
    if (rest.length) {
      const ul = document.createElement('ul');
      ul.className = 'story-ledger';
      rest.forEach((u) => {
        const li = document.createElement('li');
        const titleA = u.title ? u.title.querySelector('a') : null;
        const href = (titleA && titleA.getAttribute('href')) || (u.link && u.link.getAttribute('href')) || '#';
        const row = document.createElement('a');
        row.className = 'story-row';
        row.setAttribute('href', href);
        if (u.img) {
          const thumb = document.createElement('span');
          thumb.className = 'story-thumb';
          thumb.append(u.img.cloneNode(true));
          row.append(thumb);
        }
        const copy = document.createElement('span');
        if (u.date) copy.insertAdjacentHTML('beforeend', `<span class="date">${esc(u.date)}</span>`);
        if (u.title) {
          const h3 = document.createElement('h3');
          h3.textContent = text(u.title);
          copy.append(h3);
        }
        row.append(copy);
        row.insertAdjacentHTML('beforeend', '<span class="story-arr" aria-hidden="true">→</span>');
        li.append(row);
        ul.append(li);
      });
      grid.append(ul);
    }
    return;
  }

  const head = document.createElement('div');
  head.className = 'blog-head';
  if (headTitle) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...headTitle.childNodes].map((n) => n.cloneNode(true)));
    head.append(h2);
  }
  if (headLink) head.append(arrowLink(headLink));
  shell.append(head);

  const grid = document.createElement('div');
  grid.className = 'newsroom-grid';
  shell.append(grid);

  const featureIdx = units.findIndex((u) => u.img);
  const feature = units[featureIdx >= 0 ? featureIdx : 0];
  if (feature) {
    const article = document.createElement('article');
    article.className = 'feature';
    fillArticle(article, feature, true);
    grid.append(article);
  }
  const rest = units.filter((u) => u !== feature);
  if (rest.length) {
    const ul = document.createElement('ul');
    ul.className = 'dateline-list';
    rest.forEach((u) => {
      const li = document.createElement('li');
      const article = document.createElement('article');
      fillArticle(article, u, false);
      li.append(article);
      ul.append(li);
    });
    grid.append(ul);
  }
}
