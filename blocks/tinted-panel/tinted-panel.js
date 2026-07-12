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
 *   faq     mist Q/A band (canon audiometers faq; schema:
 *           stardust/eds-schema/audiometers.json §faq): h2 section title |
 *           repeating h3 question + p answer (inline <a> kept)
 *   close   quiet ruled close band (canon our-history quiet-close; schema:
 *           stardust/eds-schema/our-history.json §quiet-close): lede p |
 *           <ul> of forward links (ledger-row style, arrow right)
 *
 * Decode: flatten-first collectNodes (#62); split segments on heading
 * boundaries with pre-heading media buffered to the panel it opens (#76).
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
      if (emphasised) {
        panel.cta = a;
        panel.ctaEm = !!(a.closest('em') || a.querySelector('em'));
      } else panel.links.push(...(n.matches('a') ? [n] : n.querySelectorAll('a')));
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
      // authored emphasis decides the family: <em> = secondary (canon academy
      // "Enter Virtual Clinic"), <strong> = primary (canon contact routing)
      const secondary = p.ctaEm || btn.classList.contains('btn-secondary');
      btn.classList.add(secondary ? 'btn-secondary' : 'btn-primary');
      body.append(btn);
    }
    if (p.media) art.append(body);
    else art.append(...body.childNodes);
    shell.append(art);
  });
}

function renderFaq(block, nodes) {
  let title = null;
  const items = [];
  let item = null;
  nodes.forEach((n) => {
    const h2 = pick(n, 'h1, h2');
    if (h2 && !item) { title = h2; return; }
    const h3 = pick(n, 'h2, h3, h4');
    if (h3) { item = { q: h3, a: [] }; items.push(item); return; }
    if (item && text(n)) item.a.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  if (title) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...title.childNodes].map((n) => n.cloneNode(true)));
    shell.append(h2);
  }
  items.forEach((it) => {
    const div = document.createElement('div');
    div.className = 'faq-item';
    const h3 = document.createElement('h3');
    h3.replaceChildren(...[...it.q.childNodes].map((n) => n.cloneNode(true)));
    div.append(h3);
    it.a.forEach((an) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...an.childNodes].map((n) => n.cloneNode(true)));
      div.append(p);
    });
    shell.append(div);
  });
}

function renderClose(block, nodes) {
  const paras = [];
  const links = [];
  nodes.forEach((n) => {
    if (n.matches('ul, ol')) { links.push(...n.querySelectorAll('a')); return; }
    const a = pick(n, 'a');
    if (a) { links.push(...(n.matches('a') ? [n] : n.querySelectorAll('a'))); return; }
    if (text(n)) paras.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell close-grid';
  block.append(shell);
  paras.forEach((para) => {
    const p = document.createElement('p');
    p.className = 'close-lede';
    p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  });
  if (links.length) {
    const ul = document.createElement('ul');
    ul.className = 'close-links';
    links.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href') || '#');
      link.innerHTML = `${esc(text(a).replace(/\s*→\s*$/u, ''))} <span class="arr" aria-hidden="true">→</span>`;
      li.append(link);
      ul.append(li);
    });
    shell.append(ul);
  }
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  if (block.classList.contains('split')) {
    renderSplit(block, nodes);
    return;
  }

  if (block.classList.contains('faq')) {
    renderFaq(block, nodes);
    return;
  }

  if (block.classList.contains('close')) {
    renderClose(block, nodes);
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

  // inset variant (canon careers .toronto): mist panel framed by hairlines,
  // copy left + emphasised CTA button right
  if (block.classList.contains('inset')) {
    const panel = document.createElement('div');
    panel.className = 'inset-panel';
    shell.append(panel);
    const copy = document.createElement('div');
    copy.className = 'inset-copy';
    if (heading) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...heading.childNodes].map((n) => n.cloneNode(true)));
      copy.append(h2);
    }
    paras.forEach((para) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...para.childNodes].map((n) => n.cloneNode(true)));
      copy.append(p);
    });
    panel.append(copy);
    if (route) {
      const btn = route.cloneNode(true);
      btn.classList.add('btn');
      if (!btn.classList.contains('btn-primary')) btn.classList.add('btn-secondary');
      panel.append(btn);
    }
    return;
  }

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
