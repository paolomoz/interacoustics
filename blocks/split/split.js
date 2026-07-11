/*
 * split — editorial photo/copy chapters (canon: index affinity-fullrange +
 * academy band). BUILT BY CLUSTER A for the home page — cluster C extends/owns
 * (about promise/we-care, research process); shape recorded in
 * eds-conversion-log.md. Schema: stardust/eds-schema/index.json.
 *
 * Variants (block class):
 *   affinity  duotone media left / kicker+h3+p+plain <a> right, then the
 *             full-range ruled row (h2 + <em><a> route)
 *   academy   copy left (h2+p+plain <a>) / duotone media bleeding right
 *   features  ink feature-chapter ledger beside a sticky product render
 *             (canon ad629 overview; schema: stardust/eds-schema/ad629.json
 *             §feature-chapters) — rows: <img> render, then per chapter
 *             h2 | body p (heading-boundary segmentation)
 *
 * Authoring rows: <img> | [<strong> kicker] | h3 | p | plain <a> |
 *                 [ruled row: h2 | <em><a> route]
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const inlineRun = kids.length > 1 && kids.every((k) => k.matches('a, strong, em, code, span, u'));
    if (kids.length && !stray && !inlineRun) out.push(...kids);
    else if (kids.length || cell.textContent.trim()) {
      // the pipeline unwraps single-<p> cells (#79) — a mixed text+element cell
      // is re-wrapped whole so stray text survives beside the elements
      const p = document.createElement('p');
      p.append(...[...cell.childNodes].map((n) => n.cloneNode(true)));
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function arrowLink(a) {
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href') || '#');
  link.className = 'arrow-link';
  const t = text(a).replace(/\s*(→|&rarr;)\s*$/u, '').trim();
  const words = t.split(' ');
  const last = words.pop();
  link.innerHTML = `${words.length ? `${esc(words.join(' '))} ` : ''}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>`;
  return link;
}

/* features: sticky render + ruled chapter ledger (canon ad629 overview) */
function renderFeatures(block, nodes) {
  let img = null;
  const features = [];
  let cur = null;
  nodes.forEach((n) => {
    const code = pick(n, 'code');
    if (code && !features.length) {
      const section = block.closest('.section');
      const anchor = text(code);
      if (section && anchor && !document.getElementById(anchor)) section.id = anchor;
      return;
    }
    const media = pick(n, 'picture, img');
    if (media) { img = media; return; }
    const h = pick(n, 'h2, h3');
    if (h) { cur = { h, paras: [] }; features.push(cur); return; }
    if (cur && text(n)) cur.paras.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell overview-grid';
  block.append(shell);
  if (img) {
    const media = document.createElement('div');
    media.className = 'overview-media';
    media.append(img.cloneNode(true));
    shell.append(media);
  }
  const ledger = document.createElement('div');
  ledger.className = 'feature-ledger';
  features.forEach((f) => {
    const div = document.createElement('div');
    div.className = 'feature';
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...f.h.childNodes].map((n) => n.cloneNode(true)));
    div.append(h2);
    f.paras.forEach((para) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
      div.append(p);
    });
    ledger.append(div);
  });
  shell.append(ledger);
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  if (block.classList.contains('features')) {
    renderFeatures(block, nodes);
    return;
  }
  const s = {
    img: null, kicker: null, h2: null, h3: null, paras: [], link: null, cta: null,
  };
  nodes.forEach((n) => {
    const media = pick(n, 'picture, img');
    if (media) { s.img = media; return; }
    if (pick(n, 'h2')) { s.h2 = pick(n, 'h2'); return; }
    if (pick(n, 'h3, h4')) { s.h3 = pick(n, 'h3, h4'); return; }
    const t = text(n);
    if (!t) return;
    const a = pick(n, 'a');
    if (a) {
      const emphasised = a.closest('strong, em') || a.querySelector('strong, em') || a.classList.contains('btn');
      if (emphasised) s.cta = a;
      else s.link = a;
      return;
    }
    const strong = pick(n, 'strong');
    if (strong && text(strong) === t) { s.kicker = t; return; }
    s.paras.push(n);
  });

  block.textContent = '';

  if (block.classList.contains('academy')) {
    const grid = document.createElement('div');
    grid.className = 'academy-grid';
    const copy = document.createElement('div');
    copy.className = 'academy-text';
    const h2 = document.createElement('h2');
    const src = s.h2 || s.h3;
    if (src) h2.replaceChildren(...[...src.childNodes].map((n) => n.cloneNode(true)));
    copy.append(h2);
    s.paras.forEach((para) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
      copy.append(p);
    });
    if (s.link) copy.append(arrowLink(s.link));
    grid.append(copy);
    if (s.img) {
      const media = document.createElement('div');
      media.className = 'academy-media';
      media.append(s.img.cloneNode(true));
      grid.append(media);
    }
    block.append(grid);
    return;
  }

  // affinity (default): duotone split + full-range ruled row
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  const grid = document.createElement('div');
  grid.className = 'affinity-grid';
  shell.append(grid);
  if (s.img) {
    const media = document.createElement('div');
    media.className = 'affinity-media';
    media.append(s.img.cloneNode(true));
    grid.append(media);
  }
  const copy = document.createElement('div');
  copy.className = 'affinity-copy';
  if (s.kicker) copy.insertAdjacentHTML('beforeend', `<p class="kicker meta-label">${esc(s.kicker)}</p>`);
  if (s.h3) {
    const h3 = document.createElement('h3');
    h3.replaceChildren(...[...s.h3.childNodes].map((n) => n.cloneNode(true)));
    copy.append(h3);
  }
  s.paras.forEach((para) => {
    const p = document.createElement('p');
    p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
    copy.append(p);
  });
  if (s.link) copy.append(arrowLink(s.link));
  grid.append(copy);

  if (s.h2 || s.cta) {
    const rowEl = document.createElement('div');
    rowEl.className = 'fullrange-row';
    if (s.h2) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...s.h2.childNodes].map((n) => n.cloneNode(true)));
      rowEl.append(h2);
    }
    if (s.cta) {
      const btn = s.cta.cloneNode(true);
      btn.classList.add('btn');
      if (!btn.classList.contains('btn-primary')) btn.classList.add('btn-secondary');
      rowEl.append(btn);
    }
    shell.append(rowEl);
  }
}
