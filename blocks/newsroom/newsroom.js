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
