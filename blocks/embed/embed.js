/*
 * embed — captured third-party iframe panels with hygiene + fallback line
 * (canon: contact distributors ZenLocator map, contact hq-form Tally panel).
 * Schema: stardust/eds-schema/contact.json.
 *
 * The embed URL is authored as a PLAIN <a href>; the block builds the titled,
 * lazy, fixed-height (CLS-safe) iframe. A text+link paragraph after the embed
 * link renders as the visible fallback line.
 *
 * Variants (block class):
 *   panel (default) rows: [h2 head] | [lede p] | <strong> panel label |
 *                   <a href> embed | fallback p (text + links)
 *   locator         rows: h2 | intro p | <img> photo | <strong> index label |
 *                   p of index <a>s | h3 map head | <a href> embed | fallback p
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

function buildIframe(a) {
  const iframe = document.createElement('iframe');
  iframe.src = a.getAttribute('href');
  iframe.title = text(a);
  iframe.loading = 'lazy';
  return iframe;
}

function fallbackLine(node, cls) {
  const p = document.createElement('p');
  p.className = cls;
  [...node.childNodes].forEach((n) => {
    if (n.nodeType === 1 && n.matches('a') && !(n.getAttribute('href') || '').startsWith('mailto:')) {
      const t = text(n).replace(/\s*→\s*$/u, '').trim();
      const words = t.split(' ');
      const last = words.pop();
      const link = document.createElement('a');
      link.className = 'arrow-link';
      link.setAttribute('href', n.getAttribute('href') || '#');
      link.innerHTML = `<span class="nb">${words.length ? `${esc(words.join(' '))} ` : ''}${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>`;
      p.append(link);
    } else p.append(n.cloneNode(true));
  });
  return p;
}

function classify(nodes) {
  const s = {
    heading: null,
    mapHead: null,
    intro: [],
    img: null,
    labels: [],
    indexLinks: null,
    embed: null,
    fallback: null,
  };
  nodes.forEach((n) => {
    const media = pick(n, 'picture, img');
    if (media) { s.img = media; return; }
    const h2 = pick(n, 'h1, h2');
    if (h2) { s.heading = h2; return; }
    const h3 = pick(n, 'h3, h4');
    if (h3) { s.mapHead = h3; return; }
    const t = text(n);
    if (!t) return;
    const links = n.matches('a') ? [n] : [...(n.querySelectorAll?.('a') || [])];
    const strongOnly = !links.length && pick(n, 'strong') && text(pick(n, 'strong')) === t;
    if (strongOnly) { s.labels.push(t); return; }
    if (links.length) {
      const linkText = links.reduce((sum, l) => sum + text(l).length, 0);
      const linksOnly = t.length <= linkText + links.length * 3;
      if (linksOnly && links.length === 1 && /^https?:/.test(links[0].getAttribute('href') || '') && !s.embed) {
        [s.embed] = links;
        return;
      }
      if (linksOnly && links.length > 1) { s.indexLinks = links; return; }
      s.fallback = n;
      return;
    }
    s.intro.push(n);
  });
  return s;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  const s = classify(nodes);
  const isLocator = block.classList.contains('locator');
  block.textContent = '';

  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  const section = block.closest('.section');

  if (isLocator) {
    if (section && !document.getElementById('distributors')) section.id = 'distributors';
    const intro = document.createElement('div');
    intro.className = 'dist-intro';
    const copy = document.createElement('div');
    if (s.heading) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...s.heading.childNodes].map((n) => n.cloneNode(true)));
      copy.append(h2);
    }
    s.intro.forEach((para) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
      copy.append(p);
    });
    intro.append(copy);
    if (s.img) {
      const media = document.createElement('div');
      media.className = 'dist-media';
      media.append(s.img.cloneNode(true));
      intro.append(media);
    }
    shell.append(intro);
    if (s.indexLinks) {
      const index = document.createElement('div');
      index.className = 'continent-index';
      if (s.labels.length) {
        const label = document.createElement('p');
        label.className = 'meta-label';
        label.id = 'continent-label';
        [label.textContent] = s.labels;
        index.append(label);
      }
      s.indexLinks.forEach((a) => {
        const link = document.createElement('a');
        link.setAttribute('href', a.getAttribute('href') || '#');
        link.textContent = text(a);
        index.append(link);
      });
      shell.append(index);
    }
    if (s.mapHead) {
      const head = document.createElement('div');
      head.className = 'map-head';
      head.id = 'distributor-map';
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...s.mapHead.childNodes].map((n) => n.cloneNode(true)));
      head.append(h3);
      shell.append(head);
    }
    if (s.embed) {
      const panel = document.createElement('div');
      panel.className = 'map-panel';
      panel.append(buildIframe(s.embed));
      if (s.fallback) panel.append(fallbackLine(s.fallback, 'map-fallback'));
      shell.append(panel);
    }
    return;
  }

  // panel (default): quiet band head + captured form on a card quote-panel
  if (section && !document.getElementById('contact')) section.id = 'contact';
  if (s.heading || s.intro.length) {
    const head = document.createElement('div');
    head.className = 'section-head';
    if (s.heading) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...s.heading.childNodes].map((n) => n.cloneNode(true)));
      head.append(h2);
    }
    if (s.intro.length) {
      const p = document.createElement('p');
      p.className = 'lede';
      p.replaceChildren(...[...s.intro[0].childNodes].map((n) => n.cloneNode(true)));
      head.append(p);
    }
    shell.append(head);
  }
  if (s.embed) {
    const panel = document.createElement('div');
    panel.className = 'quote-panel';
    if (s.labels.length) {
      const label = document.createElement('p');
      label.className = 'meta-label';
      [label.textContent] = s.labels;
      panel.append(label);
    }
    panel.append(buildIframe(s.embed));
    if (s.fallback) panel.append(fallbackLine(s.fallback, 'quote-fallback'));
    shell.append(panel);
  }
}
