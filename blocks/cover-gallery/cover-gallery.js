/*
 * cover-gallery — Made Magazine ruled asymmetric cover gallery (canon:
 * magazine .magazine). Schema: stardust/eds-schema/magazine.json.
 * Decode tier: reconstructive (h2-boundary unit segmentation, #52/#76).
 *
 * Authoring rows (flatten-tolerant):
 *   head: h1 (em kept) | lede p | facts p ("3 issues · Free of charge")
 *   unit rows (one per issue, first-with-<strong>-kicker = featured):
 *     <img> cover | [<strong> kicker] | h2 title | excerpt p |
 *     plain <a> "Read it now" (also wraps the cover)
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const inlineRun = kids.length > 1 && kids.every((k) => k.matches('a, strong, em, code, span, u'));
    if (kids.length && !stray && !inlineRun) out.push(...kids);
    else if (kids.length || cell.textContent.trim()) {
      // the pipeline unwraps single-<p> cells (#79) — re-wrap mixed cells whole
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

function arrowLink(a, title) {
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href') || '#');
  link.className = 'arrow-link';
  const t = text(a).replace(/\s*(→|&rarr;)\s*$/u, '').trim();
  const words = t.split(' ');
  const last = words.pop();
  const head = words.length ? `${esc(words.join(' '))} ` : '';
  link.innerHTML = `${head}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>${title ? `<span class="sr-only">: ${esc(title)}</span>` : ''}`;
  return link;
}

function factsHtml(parts) {
  return parts.map((p, i) => (i < parts.length - 1
    ? `${esc(p)} <span class="sep" aria-hidden="true">·</span> `
    : esc(p))).join('');
}

function fillIssue(article, unit) {
  if (unit.img && unit.link) {
    const cover = document.createElement('a');
    cover.className = 'cover';
    cover.setAttribute('href', unit.link.getAttribute('href') || '#');
    cover.append(unit.img.cloneNode(true));
    article.append(cover);
  }
  const copy = document.createElement('div');
  copy.className = 'issue-copy';
  if (unit.kicker) copy.insertAdjacentHTML('beforeend', `<p class="kicker meta-label">${esc(unit.kicker)}</p>`);
  if (unit.h2) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...unit.h2.childNodes].map((n) => n.cloneNode(true)));
    copy.append(h2);
  }
  if (unit.excerpt) {
    const p = document.createElement('p');
    p.className = 'excerpt';
    p.replaceChildren(...[...unit.excerpt.childNodes].map((n) => n.cloneNode(true)));
    copy.append(p);
  }
  if (unit.link) copy.append(arrowLink(unit.link, unit.h2 ? text(unit.h2) : ''));
  article.append(copy);
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  const head = { h1: null, lede: null, facts: null };
  const units = [];
  let unit = null;
  let pendingImg = null; // the cover precedes its h2 (#76 buffering)
  let pendingKicker = '';
  nodes.forEach((n) => {
    const media = pick(n, 'picture, img');
    if (media) { pendingImg = media; return; }
    if (n.matches('h1')) { head.h1 = n; return; }
    if (n.matches('h2, h3')) {
      unit = {
        img: pendingImg, kicker: pendingKicker, h2: n, excerpt: null, link: null,
      };
      pendingImg = null;
      pendingKicker = '';
      units.push(unit);
      return;
    }
    const t = text(n);
    if (!t) return;
    const strong = pick(n, 'strong');
    if (strong && text(strong) === t && !pick(n, 'a')) { pendingKicker = t; return; }
    const a = pick(n, 'a');
    if (a && unit && t.length <= text(a).length + 3) { unit.link = a; return; }
    if (!unit) {
      const parts = t.split('·').map((x) => x.trim()).filter(Boolean);
      if (parts.length >= 2 && parts.every((x) => x.length <= 34)) { head.facts = parts; return; }
      head.lede = n;
      return;
    }
    if (!unit.excerpt) unit.excerpt = n;
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  const magHead = document.createElement('div');
  magHead.className = 'mag-head';
  if (head.h1) {
    const h1 = document.createElement('h1');
    h1.replaceChildren(...[...head.h1.childNodes].map((n) => n.cloneNode(true)));
    magHead.append(h1);
  }
  if (head.lede) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...head.lede.childNodes].map((n) => n.cloneNode(true)));
    magHead.append(p);
  }
  if (head.facts) magHead.insertAdjacentHTML('beforeend', `<p class="mag-facts">${factsHtml(head.facts)}</p>`);
  shell.append(magHead);

  const featured = units.find((u) => u.kicker) || units[0];
  if (featured) {
    const article = document.createElement('article');
    article.className = 'issue-featured';
    fillIssue(article, featured);
    const img = article.querySelector('img');
    if (img) img.setAttribute('fetchpriority', 'high');
    shell.append(article);
  }
  const rest = units.filter((u) => u !== featured);
  if (rest.length) {
    const row = document.createElement('div');
    row.className = 'issue-row';
    rest.forEach((u) => {
      const article = document.createElement('article');
      article.className = 'issue';
      fillIssue(article, u);
      row.append(article);
    });
    shell.append(row);
  }
}
