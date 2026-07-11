/*
 * article — blog reading column + hairline-ruled rail (canon: blog/why-rem
 * .article-wrap). Schema: stardust/eds-schema/blog-why-rem.json §article.
 * Decode tier: reconstructive (heading-boundary segmentation, #52/#76).
 *
 * Authoring rows (flatten-tolerant):
 *   body rows: h2 chapter heads + flowing <p>s (everything BEFORE the first h3)
 *   rail rows, segmented on h3 boundary:
 *     byline:  h3 author name | bio p
 *     follow:  h3 "Follow Us" | p of social <a>s (icon derived from hostname)
 *     similar: h3 head, then per story: date p | h4 <a> title | excerpt p |
 *              plain <a> "Read more" (date precedes its h4 — buffered, #76)
 */

const ICONS = {
  facebook: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.3-.04-1.3-.12-2.45-.12-2.4 0-4.05 1.46-4.05 4.15v2.27H7.5V13h2.7v8h3.3z"/></svg>',
  linkedin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2zM3.2 9.3h3.6V21H3.2V9.3zm5.7 0h3.45v1.6h.05c.48-.9 1.65-1.85 3.4-1.85 3.64 0 4.3 2.4 4.3 5.5V21h-3.6v-5.8c0-1.38-.02-3.16-1.92-3.16-1.93 0-2.22 1.5-2.22 3.06V21H8.9V9.3z"/></svg>',
  youtube: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.28 5 12 5 12 5s-6.28 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.72 19 12 19 12 19s6.28 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.4-4.8zM10 15.2V8.8L15.6 12 10 15.2z"/></svg>',
};

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const inlineRun = kids.length > 1 && kids.every((k) => k.matches('a, strong, em, code, span, u'));
    if (kids.length && !stray && !inlineRun) out.push(...kids);
    else if (kids.length || cell.textContent.trim()) {
      // the pipeline unwraps single-<p> cells (#79) — re-wrap mixed/inline-run
      // cells whole so stray text survives beside the elements
      const p = document.createElement('p');
      p.append(...[...cell.childNodes].map((n) => n.cloneNode(true)));
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

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

function iconFor(href) {
  if (/facebook\.com/.test(href)) return ICONS.facebook;
  if (/linkedin\.com/.test(href)) return ICONS.linkedin;
  if (/youtube\.com|youtu\.be/.test(href)) return ICONS.youtube;
  return null;
}

function renderSimilar(section, nodes) {
  const ul = document.createElement('ul');
  ul.className = 'dateline-list';
  let unit = null;
  let pendingDate = '';
  nodes.forEach((n) => {
    if (n.matches('h4, h3')) {
      const li = document.createElement('li');
      unit = document.createElement('article');
      li.append(unit);
      ul.append(li);
      if (pendingDate) {
        unit.insertAdjacentHTML('beforeend', `<span class="date">${esc(pendingDate)}</span>`);
        pendingDate = '';
      }
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      unit.append(h3);
      return;
    }
    const t = text(n);
    if (!t) return;
    const a = n.matches('a') ? n : n.querySelector('a');
    if (!unit || (!a && t.length <= 24 && /\d{4}/.test(t))) { pendingDate = t; return; }
    if (a && t.length <= text(a).length + 3) {
      unit.append(arrowLink(a, text(unit.querySelector('h3'))));
      return;
    }
    const p = document.createElement('p');
    p.className = 'excerpt';
    p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
    unit.append(p);
  });
  section.append(ul);
}

function renderRailBlock(group, rail) {
  const links = group.rest.flatMap((n) => (n.matches('a') ? [n] : [...n.querySelectorAll('a')]));
  const social = links.length >= 2 && links.every((a) => iconFor(a.getAttribute('href') || ''));
  const hasUnits = group.rest.some((n) => n.matches('h4') || n.querySelector?.('h4'));
  const section = document.createElement('section');
  const h2 = document.createElement('h2');
  h2.textContent = text(group.head);
  section.append(h2);
  if (social) {
    section.className = 'rail-block follow';
    const div = document.createElement('div');
    div.className = 'rail-social';
    links.forEach((a) => {
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.setAttribute('aria-label', `Interacoustics on ${text(a)}`);
      link.innerHTML = iconFor(a.getAttribute('href') || '');
      div.append(link);
    });
    section.append(div);
  } else if (hasUnits) {
    section.className = 'rail-block similar';
    renderSimilar(section, group.rest);
  } else {
    section.className = 'rail-block byline';
    group.rest.forEach((n) => {
      const p = document.createElement('p');
      p.className = 'byline-bio';
      p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      section.append(p);
    });
  }
  rail.append(section);
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell article-grid';
  block.append(shell);
  const body = document.createElement('article');
  body.className = 'article-body';
  const rail = document.createElement('aside');
  rail.className = 'article-rail';
  rail.setAttribute('aria-label', 'About this article');
  shell.append(body, rail);

  const groups = [];
  let current = null;
  nodes.forEach((n) => {
    if (n.matches('h3')) {
      current = { head: n, rest: [] };
      groups.push(current);
      return;
    }
    if (current) current.rest.push(n);
    else body.append(n.cloneNode(true));
  });
  groups.forEach((g) => renderRailBlock(g, rail));
  if (!rail.children.length) rail.remove();
}
