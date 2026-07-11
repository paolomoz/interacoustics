/*
 * tinted-panel — mist statement band (canon: index integration, solutions
 * teleaudiology) and split tinted panels (canon: contact routing-split,
 * academy diploma-virtual-clinic).
 * Schema: stardust/eds-schema/{index,solutions,contact}.json.
 *
 * Variants (block class):
 *   (base)  rows: h2 | body p | plain <a> route (arrow-link)
 *   row     rows: h2 | plain <a> — one flex row, title left / route right
 *   split   repeating panels segmented on the panel heading (h2/h3), each:
 *           [<img> media] | heading | [body p] | CTA (<strong>/<em> link) or
 *           plain link(s) (rendered as panel-links)
 *
 * Decode: flatten-first collectNodes (#62); split segments on heading
 * boundaries with pre-heading media buffered to the panel it opens (#76).
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

function renderSplit(block, nodes) {
  const panels = [];
  let panel = null;
  let pendingMedia = null;
  const open = () => {
    panel = {
      media: pendingMedia, heading: null, level: 'h3', body: [], cta: null, links: [],
    };
    pendingMedia = null;
    panels.push(panel);
  };
  nodes.forEach((n) => {
    const media = pick(n, 'picture, img');
    if (media) {
      if (panel && !panel.cta && !panel.links.length && !panel.heading) panel.media = media;
      else pendingMedia = media;
      return;
    }
    const h = pick(n, 'h2, h3, h4');
    if (h) {
      open();
      panel.heading = h;
      panel.level = h.tagName.toLowerCase() === 'h2' ? 'h2' : 'h3';
      return;
    }
    if (!panel) return;
    if (n.matches('ul, ol')) {
      panel.links.push(...n.querySelectorAll('a'));
      return;
    }
    const a = pick(n, 'a');
    if (a) {
      const emphasised = a.closest('strong, em') || a.querySelector('strong, em') || a.classList.contains('btn');
      if (emphasised) panel.cta = a;
      else panel.links.push(...(n.matches('a') ? [n] : n.querySelectorAll('a')));
      return;
    }
    if (text(n)) panel.body.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell pair-grid';
  block.append(shell);
  panels.forEach((p) => {
    const art = document.createElement('article');
    art.className = p.media ? 'panel' : 'route-panel';
    if (p.media) {
      const media = document.createElement('div');
      media.className = 'panel-media';
      media.append(p.media.cloneNode(true));
      art.append(media);
    }
    const body = document.createElement('div');
    body.className = p.media ? 'panel-body' : 'route-body';
    const h = document.createElement(p.level);
    h.replaceChildren(...[...p.heading.childNodes].map((n) => n.cloneNode(true)));
    body.append(h);
    p.body.forEach((bp) => {
      const para = document.createElement('p');
      para.replaceChildren(...[...bp.childNodes].map((n) => n.cloneNode(true)));
      body.append(para);
    });
    if (p.links.length) {
      const ul = document.createElement('ul');
      ul.className = 'panel-links';
      p.links.forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'panel-link';
        link.setAttribute('href', a.getAttribute('href') || '#');
        link.innerHTML = `${esc(text(a).replace(/\s*→\s*$/u, ''))} <span class="arr" aria-hidden="true">→</span>`;
        li.append(link);
        ul.append(li);
      });
      body.append(ul);
    }
    if (p.cta) {
      const btn = p.cta.cloneNode(true);
      btn.classList.add('btn');
      if (!btn.classList.contains('btn-secondary')) btn.classList.add('btn-primary');
      body.append(btn);
    }
    if (p.media) art.append(body);
    else art.append(...body.childNodes);
    shell.append(art);
  });
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  if (block.classList.contains('split')) {
    renderSplit(block, nodes);
    return;
  }

  let heading = null;
  const paras = [];
  let route = null;
  nodes.forEach((n) => {
    const h = pick(n, 'h1, h2, h3');
    if (h) { heading = h; return; }
    const a = pick(n, 'a');
    if (a && text(n).length <= text(a).length + 3) { route = a; return; }
    if (text(n)) paras.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  if (heading) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...heading.childNodes].map((n) => n.cloneNode(true)));
    shell.append(h2);
  }
  paras.forEach((para) => {
    const p = document.createElement('p');
    p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  });
  if (route) shell.append(arrowLink(route));
}
