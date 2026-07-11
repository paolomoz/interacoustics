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
function buildGroup(grid, parsed, isIndex) {
  const {
    head, units, sublist, sublistLabel, foot,
  } = parsed;

  const rail = document.createElement('div');
  rail.className = isIndex ? 'products-rail' : 'group-rail';
  if (head.count) rail.insertAdjacentHTML('beforeend', `<p class="meta-label group-count">${esc(head.count)}</p>`);
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
  const ul = document.createElement('ul');
  ul.className = 'ledger-list';
  units.forEach((u) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'ledger-row';
    a.setAttribute('href', u.href);
    const thumb = document.createElement('span');
    thumb.className = 'thumb';
    if (u.img) thumb.append(u.img.cloneNode(true));
    a.append(thumb);
    const copy = document.createElement('span');
    const h3 = document.createElement('h3');
    h3.textContent = u.name;
    if (u.pill) h3.insertAdjacentHTML('beforeend', ` <span class="new-pill">${esc(u.pill)}</span>`);
    copy.append(h3);
    if (u.desc) copy.insertAdjacentHTML('beforeend', `<p class="ledger-desc">${esc(u.desc)}</p>`);
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

export default async function decorate(block) {
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
  const anchor = groups.find((g) => g.head.anchor)?.head.anchor;
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
  if (grouped) {
    shell.className = 'shell';
    groups.forEach((g) => {
      const grid = document.createElement('div');
      grid.className = 'group-grid';
      buildGroup(grid, g, isIndex);
      shell.append(grid);
    });
  } else {
    shell.className = `shell ${isIndex ? 'products-grid' : 'group-grid'}`;
    buildGroup(shell, groups[0], isIndex);
  }
}
