/*
 * record-sheet — tracked-caps column head + tabular first column (canon: index
 * events). BUILT BY CLUSTER A for its pages — cluster B extends/owns (variants
 * congresses/syllabus/timeline/training/battery); shape recorded in
 * eds-conversion-log.md. Schema: stardust/eds-schema/index.json §events.
 *
 * Authoring rows:
 *   head rows (no h3): h2 | intro p
 *   unit rows (one per event): date text ("Jul 14, 2026 - 9:00 am") |
 *     <h3>Event title</h3> | <em><a href>Sign up</a></em>
 *   foot row: plain <a> ("All upcoming events")
 * The Date / Course-or-webinar column labels are template chrome (canon).
 *
 * Variant `battery` (canon ad629 test-battery; schema:
 * stardust/eds-schema/ad629.json §test-battery): h2 + intro p section head |
 * <img> software screens | per column h3 [+ intro p] + <ul> spec rows (inline
 * <a> kept); a SECOND h2 opens the "battery-2" column group. Columns pair in
 * the canon 2-up sheet grid.
 *
 * Variant `doc-list` (canon ad629 support-training; schema:
 * stardust/eds-schema/ad629.json §support-training): h2 + intro p head |
 * unit rows of TWO cells: type meta ("PDF"/"Training") | plain <a> title |
 * foot row: single plain <a> (arrow-link).
 *
 * Variant `training` (canon audiometers training; schema:
 * stardust/eds-schema/audiometers.json §training): the first cell of a unit
 * row is a meta tag ("Type: Reading") rendered as a tracked-caps label (no
 * dd/dm date split, no column-label chrome), and the plain <a> foot renders
 * as the arrow-link beside the h2 (canon .training-head flex row) — author it
 * right after the h2.
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* set the authored <code> anchor as the section id — the pipeline auto-slugs
   headings, so a heading whose text equals the anchor (e.g. an h3 "Support"
   → id="support") must yield its id to the section (subnav target) */
function setSectionAnchor(block, anchor) {
  if (!anchor) return;
  const section = block.closest('.section');
  if (!section) return;
  const existing = document.getElementById(anchor);
  if (existing && existing !== section && /^H[1-6]$/.test(existing.tagName)) existing.removeAttribute('id');
  if (!document.getElementById(anchor)) section.id = anchor;
}

function makeArrowLink(foot) {
  const link = document.createElement('a');
  link.className = 'arrow-link';
  link.setAttribute('href', foot.getAttribute('href') || '#');
  const t = text(foot).replace(/\s*→\s*$/u, '').trim();
  const words = t.split(' ');
  const last = words.pop();
  link.innerHTML = `${words.length ? `${esc(words.join(' '))} ` : ''}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>`;
  return link;
}

function splitDate(full) {
  const m = full.match(/^(\w+\s+\d{1,2})[,\s]*(.*)$/);
  if (m) return { dd: m[1], dm: m[2] };
  return { dd: full, dm: '' };
}

/* flatten-first collector (#62/#79) for the battery variant */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const inlineRun = kids.length > 1 && kids.every((k) => k.matches('a, strong, em, code, span, u'));
    if (kids.length && !stray && !inlineRun) out.push(...kids);
    else if (kids.length || cell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...[...cell.childNodes].map((n) => n.cloneNode(true)));
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

/* battery: section head + screens + h3 columns in 2-up sheet grids (ad629) */
function renderBattery(block) {
  const nodes = collectNodes(block);
  const head = { h2: null, intro: [] };
  let screens = null;
  const groups = [];
  let group = null;
  let col = null;
  const openGroup = (h2) => { group = { h2, cols: [] }; groups.push(group); col = null; };
  nodes.forEach((n) => {
    const media = pick(n, 'picture, img');
    if (media) { screens = media; return; }
    const h2 = n.matches('h1, h2') ? n : null;
    if (h2) {
      if (!head.h2) head.h2 = h2;
      else openGroup(h2);
      return;
    }
    const h3 = pick(n, 'h3, h4');
    if (h3) {
      if (!group) openGroup(null);
      col = { h3, intro: null, rows: [] };
      group.cols.push(col);
      return;
    }
    if (n.matches('ul, ol')) {
      if (col) col.rows.push(...n.querySelectorAll(':scope > li'));
      return;
    }
    if (!text(n)) return;
    if (col && !col.rows.length) col.intro = n;
    else if (!group) head.intro.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  if (head.h2 || head.intro.length) {
    const sh = document.createElement('div');
    sh.className = 'section-head';
    if (head.h2) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...head.h2.childNodes].map((n) => n.cloneNode(true)));
      sh.append(h2);
    }
    head.intro.forEach((n) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      sh.append(p);
    });
    shell.append(sh);
  }
  if (screens) {
    const div = document.createElement('div');
    div.className = 'battery-screens';
    div.append(screens.cloneNode(true));
    shell.append(div);
  }
  groups.forEach((g) => {
    const cols = document.createElement('div');
    cols.className = 'sheet-cols';
    g.cols.forEach((c) => {
      const colEl = document.createElement('div');
      colEl.className = 'sheet-col';
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...c.h3.childNodes].map((n) => n.cloneNode(true)));
      colEl.append(h3);
      if (c.intro) {
        const p = document.createElement('p');
        p.className = 'col-intro';
        p.replaceChildren(...[...c.intro.childNodes].map((n) => n.cloneNode(true)));
        colEl.append(p);
      }
      const ul = document.createElement('ul');
      ul.className = 'sheet-rows';
      c.rows.forEach((li) => ul.append(li.cloneNode(true)));
      colEl.append(ul);
      cols.append(colEl);
    });
    if (g.h2) {
      const wrap = document.createElement('div');
      wrap.className = 'battery-2';
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...g.h2.childNodes].map((n) => n.cloneNode(true)));
      wrap.append(h2);
      wrap.append(cols);
      shell.append(wrap);
    } else shell.append(cols);
  });
}

/* doc-list: typed document/training ledger on mist (ad629 support).
   An optional leading <p><code>anchor</code></p> row sets the section id. */
function renderDocList(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = { h2: null, intro: [] };
  const units = [];
  let foot = null;
  rows.forEach((row) => {
    const code = row.querySelector('code');
    if (code && !units.length && !head.h2) {
      setSectionAnchor(block, text(code));
      return;
    }
    const cells = [...row.children];
    const a = row.querySelector('a');
    if (cells.length >= 2 && a) {
      const meta = cells.map(text).find((t) => t && t !== text(a));
      units.push({ meta: meta || '', a });
      return;
    }
    cells.forEach((cell) => {
      const kids = [...cell.children].length ? [...cell.children] : [cell];
      kids.forEach((n) => {
        const h2 = pick(n, 'h1, h2');
        if (h2) { head.h2 = h2; return; }
        const link = pick(n, 'a');
        if (link) { foot = link; return; }
        if (text(n)) head.intro.push(n);
      });
    });
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  if (head.h2 || head.intro.length) {
    const sh = document.createElement('div');
    sh.className = 'section-head';
    if (head.h2) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...head.h2.childNodes].map((n) => n.cloneNode(true)));
      sh.append(h2);
    }
    head.intro.forEach((n) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      sh.append(p);
    });
    shell.append(sh);
  }
  const ul = document.createElement('ul');
  ul.className = 'doc-ledger';
  units.forEach((u) => {
    const li = document.createElement('li');
    li.className = 'doc-row';
    li.insertAdjacentHTML('beforeend', `<span class="meta-label">${esc(u.meta)}</span>`);
    const a = document.createElement('a');
    a.setAttribute('href', u.a.getAttribute('href') || '#');
    a.textContent = text(u.a);
    li.append(a);
    ul.append(li);
  });
  shell.append(ul);
  if (foot) shell.append(makeArrowLink(foot));
}

export default async function decorate(block) {
  if (block.classList.contains('battery')) { renderBattery(block); return; }
  if (block.classList.contains('doc-list')) { renderDocList(block); return; }
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = { h2: null, intro: [] };
  const units = [];
  let foot = null;

  rows.forEach((row) => {
    const h3 = row.querySelector('h3, h4');
    if (h3) {
      const a = row.querySelector('a');
      const titleNode = h3.cloneNode(true);
      const date = [...row.querySelectorAll(':scope > div')]
        .map(text)
        .find((t) => t && t !== text(h3) && (!a || t !== text(a)));
      units.push({ date: date || '', titleNode, a });
      return;
    }
    [...row.querySelectorAll(':scope > div')].forEach((cell) => {
      const kids = [...cell.children].length ? [...cell.children] : [cell];
      kids.forEach((n) => {
        const h2 = pick(n, 'h1, h2');
        if (h2) { head.h2 = h2; return; }
        const a = pick(n, 'a');
        // training authors its "Explore all" link in the head (before units)
        if (a && (units.length || block.classList.contains('training'))) { foot = a; return; }
        if (text(n)) head.intro.push(n);
      });
    });
  });

  block.textContent = '';
  const isTraining = block.classList.contains('training');
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  if (head.h2 || head.intro.length) {
    const sh = document.createElement('div');
    sh.className = isTraining ? 'training-head' : 'section-head';
    if (head.h2) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...head.h2.childNodes].map((n) => n.cloneNode(true)));
      sh.append(h2);
    }
    head.intro.forEach((n) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      sh.append(p);
    });
    if (isTraining && foot) {
      shell.append(sh);
      sh.append(makeArrowLink(foot));
      foot = null;
    } else shell.append(sh);
  }

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  if (!isTraining) {
    sheet.insertAdjacentHTML('beforeend', `
    <div class="sheet-head" aria-hidden="false">
      <span class="meta-label sh-date">Date</span>
      <span class="meta-label">Course or webinar</span>
      <span class="sh-empty"></span>
    </div>`);
  }
  const ul = document.createElement('ul');
  ul.className = 'sheet-list';
  units.forEach((u) => {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'sheet-row';
    if (isTraining) {
      row.insertAdjacentHTML('beforeend', `<span class="meta-label">${esc(u.date)}</span>`);
    } else {
      const { dd, dm } = splitDate(u.date);
      row.insertAdjacentHTML('beforeend', `
      <div class="sheet-date">
        <span class="sr-only">${esc(u.date)}</span>
        <span class="dd" aria-hidden="true">${esc(dd)}</span>
        <span class="dm" aria-hidden="true">${esc(dm)}</span>
      </div>`);
    }
    const h3 = document.createElement('h3');
    h3.replaceChildren(...[...u.titleNode.childNodes].map((n) => n.cloneNode(true)));
    row.append(h3);
    if (u.a) {
      const btn = u.a.cloneNode(true);
      btn.classList.add('btn');
      if (!btn.classList.contains('btn-primary')) btn.classList.add('btn-secondary');
      // canon training a11y: "Learn more<span class=sr-only>: <title></span>"
      if (isTraining && !btn.querySelector('.sr-only')) {
        const t = text(u.titleNode).replace(/\s*\|\s*Interacoustics\s*$/i, '').replace(/\s*\|\s*/g, ' ');
        btn.insertAdjacentHTML('beforeend', `<span class="sr-only">: ${esc(t)}</span>`);
      }
      row.append(btn);
    }
    li.append(row);
    ul.append(li);
  });
  sheet.append(ul);
  shell.append(sheet);

  if (foot) shell.append(makeArrowLink(foot));
}
