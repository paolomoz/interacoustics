/*
 * statement — full-bleed forest statement chapter over an authored photo
 * (template-slotted, #95). Canon DOM: stardust/migrated index (sustainability),
 * solutions (photo-pause), audiometers/ad629 (statement + parallax),
 * customer-stories (voices / attributed quote).
 * Schema: stardust/eds-schema/{index,solutions}.json.
 *
 * Variants (block class):
 *   (base)    rows: <img> photo | h2 | body p | optional plain <a> route
 *   parallax  rows: <img> photo | h2 | lede p — photo layer scroll-driven
 *             (CSS animation-timeline: view(), @supports + reduced-motion guarded)
 *   pause     rows: <img> photo | one p (the pause line)
 *   quote     rows: <img> scene photo | <img> avatar | quote p ("…") |
 *             attribution p (<strong>who</strong> role)
 *
 * The photo is EDITORIAL (authored content, swappable); the scrim is CSS.
 * Decode: flatten-first collectNodes (#62), self-or-descendant matching (#53/#72).
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (kids.length && !stray) out.push(...kids);
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
  const head = words.length ? `${esc(words.join(' '))} ` : '';
  link.innerHTML = `${head}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>`;
  return link;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  const isQuote = block.classList.contains('quote');
  const isPause = block.classList.contains('pause');
  const isParallax = block.classList.contains('parallax');

  const imgs = [];
  let heading = null;
  const paras = [];
  let route = null;
  nodes.forEach((n) => {
    const media = pick(n, 'picture, img');
    if (media) { imgs.push(media); return; }
    const h = pick(n, 'h1, h2, h3');
    if (h) { heading = h; return; }
    const a = pick(n, 'a');
    if (a && text(n).length === text(a).length) { route = a; return; }
    if (text(n)) paras.push(n);
  });

  block.textContent = '';

  // photo layer: quote keeps its LAST img as the avatar; anything earlier is scene
  const avatar = isQuote ? imgs.pop() : null;
  if (imgs.length) {
    const bg = document.createElement('div');
    bg.className = 'statement-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.append(imgs[0].cloneNode(true));
    block.append(bg);
  }

  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  if (isPause) {
    const p = document.createElement('p');
    p.className = 'pause-line';
    p.replaceChildren(...(paras[0] ? [...paras[0].childNodes].map((n) => n.cloneNode(true)) : []));
    shell.append(p);
    return;
  }

  if (isQuote) {
    const fig = document.createElement('figure');
    fig.className = 'voices-grid';
    if (avatar) {
      const av = avatar.cloneNode(true);
      (av.matches('img') ? av : av.querySelector('img'))?.classList.add('avatar');
      av.classList.add('avatar-slot');
      fig.append(av);
    }
    const body = document.createElement('div');
    // the quote line: the paragraph carrying quote marks, else the longest one
    const quoteP = paras.find((p) => /[“”"]/.test(text(p)))
      || paras.slice().sort((a, b) => text(b).length - text(a).length)[0];
    if (quoteP) {
      const bq = document.createElement('blockquote');
      const p = document.createElement('p');
      p.replaceChildren(...[...quoteP.childNodes].map((n) => n.cloneNode(true)));
      bq.append(p);
      body.append(bq);
    }
    const attribP = paras.find((p) => p !== quoteP && (pick(p, 'strong') || text(p)));
    if (attribP) {
      const cap = document.createElement('figcaption');
      cap.className = 'attrib';
      const strong = pick(attribP, 'strong');
      const who = strong ? text(strong) : text(attribP);
      const role = strong ? text(attribP).replace(who, '').trim() : '';
      cap.innerHTML = `<span class="who">${esc(who)}</span>${role ? `<span class="role">${esc(role)}</span>` : ''}`;
      body.append(cap);
    }
    fig.append(body);
    shell.append(fig);
    return;
  }

  if (heading) {
    const h2 = document.createElement('h2');
    const inner = heading.matches('h1,h2,h3') ? heading : heading.querySelector('h1,h2,h3') || heading;
    h2.replaceChildren(...[...inner.childNodes].map((n) => n.cloneNode(true)));
    shell.append(h2);
  }
  paras.forEach((para) => {
    const p = document.createElement('p');
    if (isParallax) p.className = 'lede';
    p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  });
  if (route) shell.append(arrowLink(route));
}
