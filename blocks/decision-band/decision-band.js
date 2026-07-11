/*
 * decision-band — closing decision point: dark forest chapter, copy + primary
 * ask left, ruled trust facts + proof routing right (canon: stardust/migrated
 * index / solutions / audiometers/ad629 decision-band; solutions future-safe).
 * Schema: stardust/eds-schema/{index,solutions}.json.
 *
 * Variants (block class):
 *   (base)       rows: h2 | lede p | <strong><a> primary ask | <ul> trust facts |
 *                p of plain <a>s (proof links)
 *   quote-panel  base rows + sub-routes (h3 + p + plain <a>, repeated) +
 *                <strong>panel label | <a href> to the embedded form (iframe) |
 *                fallback p (text + link, rendered under the iframe)
 *   ink          rows: h2 | body p | <ul> proof column (an <li> holding an <a>
 *                renders as the arrow-link route; plain <li>s are ruled facts)
 *
 * Decode: flatten-first collectNodes (#62); roles classified by content, never
 * row index (#48). The embed link is recognised by order (after the <strong>
 * panel label); a later text+link paragraph is the iframe fallback line.
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

function arrowLink(a, cls = 'arrow-link') {
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href') || '#');
  link.className = cls;
  const t = text(a).replace(/\s*(→|&rarr;)\s*$/u, '').trim();
  const words = t.split(' ');
  const last = words.pop();
  const head = words.length ? `${esc(words.join(' '))} ` : '';
  link.innerHTML = `${head}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>`;
  return link;
}

function btnLink(a) {
  const link = a.cloneNode(true);
  link.classList.add('btn');
  if (!link.classList.contains('btn-secondary')) link.classList.add('btn-primary');
  return link;
}

function classify(nodes) {
  const s = {
    heading: null,
    lede: null,
    cta: null,
    trust: null,
    proofLinks: [],
    subs: [],
    panelLabel: null,
    embed: null,
    fallback: null,
  };
  let sub = null;
  let mode = 'main';
  nodes.forEach((n) => {
    if (pick(n, 'h1, h2')) { s.heading = pick(n, 'h1, h2') || n; return; }
    const h3 = pick(n, 'h3, h4');
    if (h3) {
      sub = { title: text(h3), body: null, link: null };
      s.subs.push(sub);
      mode = 'subs';
      return;
    }
    if (n.matches('ul, ol')) { s.trust = n; return; }
    const t = text(n);
    const links = n.matches('a') ? [n] : [...(n.querySelectorAll?.('a') || [])];
    const strongOnly = !links.length && (n.matches('strong') || (pick(n, 'strong') && text(pick(n, 'strong')) === t));
    if (strongOnly) {
      s.panelLabel = t;
      mode = 'panel';
      sub = null;
      return;
    }
    if (links.length) {
      const a = links[0];
      const emphasised = a.closest('strong, em') || a.querySelector('strong, em')
        || a.classList.contains('btn');
      const linkTextLen = links.reduce((sum, l) => sum + text(l).length, 0);
      const linkOnly = t.length <= linkTextLen + links.length * 3;
      if (emphasised && !s.cta) { s.cta = a; return; }
      if (mode === 'panel') {
        if (!s.embed && linkOnly && links.length === 1) { s.embed = a; return; }
        s.fallback = n;
        return;
      }
      if (mode === 'subs' && sub) { sub.link = a; return; }
      if (linkOnly) { s.proofLinks.push(...links); return; }
      s.fallback = n;
      return;
    }
    if (!t) return;
    if (mode === 'subs' && sub) { sub.body = n; return; }
    if (!s.lede) { s.lede = n; }
  });
  return s;
}

function trustList(ul) {
  const list = document.createElement('ul');
  list.className = 'trust-rule';
  [...ul.children].forEach((li) => {
    const item = document.createElement('li');
    const a = li.querySelector('a');
    if (a) {
      item.className = 'proof-link';
      item.append(arrowLink(a));
    } else {
      item.textContent = text(li);
    }
    list.append(item);
  });
  return list;
}

function fallbackLine(node, cls) {
  const p = document.createElement('p');
  p.className = cls;
  [...node.childNodes].forEach((n) => {
    if (n.nodeType === 1 && n.matches('a')) p.append(arrowLink(n));
    else if (n.nodeType === 1 && n.querySelector?.('a')) p.append(...[...n.childNodes].map((c) => c.cloneNode(true)));
    else p.append(n.cloneNode(true));
  });
  return p;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  const s = classify(nodes);
  block.textContent = '';

  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  if (block.classList.contains('ink')) {
    const grid = document.createElement('div');
    grid.className = 'futuresafe-grid';
    shell.append(grid);
    const copy = document.createElement('div');
    copy.className = 'futuresafe-copy';
    if (s.heading) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...s.heading.childNodes].map((n) => n.cloneNode(true)));
      copy.append(h2);
    }
    if (s.lede) {
      const p = document.createElement('p');
      p.replaceChildren(...[...s.lede.childNodes].map((n) => n.cloneNode(true)));
      copy.append(p);
    }
    grid.append(copy);
    if (s.trust) {
      const list = trustList(s.trust);
      list.classList.add('futuresafe-proof');
      grid.append(list);
    }
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'decision-grid';
  shell.append(grid);

  const cta = document.createElement('div');
  cta.className = 'decision-cta';
  if (s.heading) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...s.heading.childNodes].map((n) => n.cloneNode(true)));
    cta.append(h2);
  }
  if (s.lede) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...s.lede.childNodes].map((n) => n.cloneNode(true)));
    cta.append(p);
  }
  if (s.cta) cta.append(btnLink(s.cta));
  grid.append(cta);

  const proof = document.createElement('div');
  proof.className = 'decision-proof';
  if (s.trust) proof.append(trustList(s.trust));
  if (s.proofLinks.length) {
    const wrap = document.createElement('div');
    wrap.className = 'proof-links';
    s.proofLinks.forEach((a) => {
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href') || '#');
      const t = text(a).replace(/\s*(→|&rarr;)\s*$/u, '').trim();
      const words = t.split(' ');
      const last = words.pop();
      link.innerHTML = words.length
        ? `${esc(words.join(' '))} <span class="nb">${esc(last)}&nbsp;<span aria-hidden="true">→</span></span>`
        : esc(last);
      wrap.append(link);
    });
    proof.append(wrap);
  }
  if (s.subs.length) {
    const subsGrid = document.createElement('div');
    subsGrid.className = 'decision-subs';
    s.subs.forEach((sub) => {
      const cell = document.createElement('div');
      const h3 = document.createElement('h3');
      h3.textContent = sub.title;
      cell.append(h3);
      if (sub.body) {
        const p = document.createElement('p');
        p.replaceChildren(...[...sub.body.childNodes].map((n) => n.cloneNode(true)));
        cell.append(p);
      }
      if (sub.link) cell.append(arrowLink(sub.link));
      subsGrid.append(cell);
    });
    proof.append(subsGrid);
  }
  grid.append(proof);

  // quote-panel variant: embedded form at full content width + fallback line
  if (s.embed) {
    const panel = document.createElement('div');
    panel.className = 'quote-panel';
    panel.id = 'distributor-form';
    if (s.panelLabel) {
      const label = document.createElement('p');
      label.className = 'meta-label';
      label.textContent = s.panelLabel;
      panel.append(label);
    }
    const iframe = document.createElement('iframe');
    iframe.src = s.embed.getAttribute('href');
    iframe.title = text(s.embed);
    iframe.loading = 'lazy';
    panel.append(iframe);
    if (s.fallback) panel.append(fallbackLine(s.fallback, 'quote-fallback'));
    shell.append(panel);
  }
}
