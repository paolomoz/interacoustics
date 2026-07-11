/*
 * hero — template-slotted canon hero (David's-Model tier: template-slotted, #95).
 * Canon DOM lifted verbatim from stardust/migrated pages; authored values are
 * slotted by ROLE (schema: stardust/eds-schema/{index,solutions,contact}.json).
 *
 * Variants (block class):
 *   forest-video (home/solutions/careers/academy/activities)
 *     rows: h1 (em kept) | lede p | facts p ("A · B · C") | <strong><a> CTA
 *           | <a href="…mp4"> video | optional campaign rail:
 *           <strong>pill | h2 title | lede p | plain <a> link
 *   light   (listing/statics): crumbs p (<a> / <a> / text) | h1 | lede |
 *           <strong><a> CTA | <img> portrait
 *   immersive (blog/sustainability/our-history): [crumbs p] | [<strong> kicker]
 *           | h1 | [lede] | optional <img> photo layer
 *   product (ad629): crumbs p | <strong> kicker | h1 (em) | lede |
 *           <strong><a> CTA + plain <a> | <img> render
 *   record-card (event pages): crumbs p | <strong> kicker | h1 |
 *           "Date: …" / "Location: …" lines | <strong><a> CTA
 *   contact: h1 | <strong> index label | <ul> of index links | h2 card title |
 *           "Key: value" record rows (value may hold an <a>)
 *
 * Decode is flatten-first (#62 collectNodes cascade) and classifies by content
 * (#48/#53/#72) — never by row index. CTA anchors are cloned; when the harness
 * runs without ak.js decorateButton, .btn classes are ensured on the clone.
 * Poster/mobile-frame data-URIs are template-owned, keyed by the authored mp4
 * basename (data-video attr; CSS carries the ≤800px frame per scene).
 */

const POSTERS = {
  /* home evo-compress hero poster — injected at build from canon (index.html) */
  'evo-compress': 'data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9k=',
};

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

function isVideoLink(a) {
  if (!a) return false;
  const href = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
  return href.endsWith('.mp4') || href.endsWith('.webm');
}

/* canon link device: arrow bound to the last word via .nb (strip any authored arrow first — #70) */
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

function btnLink(a, extra = 'btn-primary') {
  const link = a.cloneNode(true);
  link.classList.add('btn');
  if (!link.classList.contains('btn-secondary') && !link.classList.contains('btn-meadow')) {
    link.classList.add(extra);
  }
  return link;
}

/* the heading may arrive wrapped (#55) — clone INNER child nodes so <em> survives */
function fillHeading(target, source) {
  const inner = source.matches('h1,h2,h3,h4,h5,h6') ? source : (source.querySelector('h1,h2,h3,h4,h5,h6') || source);
  target.replaceChildren(...[...inner.childNodes].map((n) => n.cloneNode(true)));
}

/* classify collected nodes into named slots (order-tolerant, #76 buffering) */
function classify(nodes) {
  const s = {
    crumbs: null,
    kickers: [], // <strong>-only paragraphs, in order
    h1: null,
    h2s: [],
    ledes: [],
    facts: null,
    kv: [], // "Key: value" rows
    ctas: [], // strong/em-wrapped or .btn links
    links: [], // plain links
    video: null,
    imgs: [],
    lists: [],
  };
  nodes.forEach((n) => {
    if (pick(n, 'img, picture')) {
      const el = pick(n, 'picture') || pick(n, 'img');
      s.imgs.push(el);
      return;
    }
    if (n.matches('h1')) { s.h1 = n; return; }
    if (n.matches('h2, h3') || (n.matches('div') && n.querySelector(':scope > h2'))) { s.h2s.push(pick(n, 'h2, h3') || n); return; }
    if (n.matches('ul, ol')) { s.lists.push(n); return; }
    const a = pick(n, 'a');
    if (a) {
      if (isVideoLink(a)) { s.video = a; return; }
      const links = n.matches('a') ? [n] : [...n.querySelectorAll('a')];
      // crumbs: several links separated by "/" text
      if (links.length >= 1 && /\/\s*\S/.test(text(n).replace(links.map(text).join(''), '')) && / \/ /.test(text(n))) {
        s.crumbs = { node: n, links };
        return;
      }
      const kv = text(n).match(/^([A-Za-z][\w ]{1,20}):\s+(.+)$/);
      if (kv && links.length === 1 && !a.closest('strong') && !a.closest('em') && !a.classList.contains('btn')) {
        s.kv.push({ key: kv[1], node: n, a });
        return;
      }
      links.forEach((link) => {
        const emphasised = link.closest('strong, em') || link.querySelector('strong, em')
          || link.classList.contains('btn');
        if (emphasised) s.ctas.push(link);
        else s.links.push(link);
      });
      return;
    }
    const t = text(n);
    if (!t) return;
    const kv = t.match(/^([A-Za-z][\w ]{1,20}):\s+(.+)$/);
    if (kv) { s.kv.push({ key: kv[1], value: kv[2], node: n }); return; }
    if (n.matches('strong') || (n.querySelector(':scope > strong') && text(n.querySelector(':scope > strong')) === t)) {
      s.kickers.push(t);
      return;
    }
    const parts = t.split('·').map((x) => x.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((x) => x.length <= 34)) { s.facts = parts; return; }
    s.ledes.push({ node: n, afterH2: s.h2s.length > 0 });
  });
  return s;
}

/* article dateline kicker: mark "Published/Modified <date>" dates up as <time>
   (canon device), keeping the ·-separated fact spans */
function articleFactHtml(part) {
  const m = part.match(/^(Published|Modified)\s+(.+)$/);
  if (!m) return esc(part);
  const d = new Date(m[2]);
  const iso = Number.isNaN(d.getTime()) ? '' : ` datetime="${d.toISOString().slice(0, 10)}"`;
  return `${esc(m[1])} <time${iso}>${esc(m[2])}</time>`;
}

function articleKickerHtml(parts) {
  return parts.map((p, i) => (i < parts.length - 1
    ? `<span class="fact"><span>${articleFactHtml(p)}</span><span class="sep" aria-hidden="true">·</span></span>`
    : `<span class="fact"><span>${articleFactHtml(p)}</span></span>`)).join('');
}

/* canon no-break device: hold hyphenated compounds ("real-ear") on one line */
function nbCompounds(el) {
  [...el.childNodes].filter((n) => n.nodeType === 3 && /\S-\S/.test(n.textContent)).forEach((n) => {
    const frag = document.createDocumentFragment();
    n.textContent.split(/(\S+-\S+)/).forEach((tok) => {
      if (/\S-\S/.test(tok)) {
        const nb = document.createElement('span');
        nb.className = 'nb';
        nb.textContent = tok;
        frag.append(nb);
      } else if (tok) frag.append(tok);
    });
    n.replaceWith(frag);
  });
}

function factsHtml(parts) {
  return parts.map((p, i) => (i < parts.length - 1
    ? `<span class="fact"><span>${esc(p)}</span><span class="sep" aria-hidden="true">·</span></span>`
    : `<span class="fact"><span>${esc(p)}</span></span>`)).join('');
}

function crumbsOl(crumbs, current) {
  const items = crumbs.links.map((a) => `<li><a href="${a.getAttribute('href')}">${esc(text(a))}</a><span class="sep" aria-hidden="true">/</span></li>`);
  if (current) items.push(`<li><span aria-current="page">${esc(current)}</span></li>`);
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol class="meta-label">${items.join('')}</ol></nav>`;
}

/* canon deferred playback: poster-first, IO + idle, desktop-only, reduced-motion honored */
function wireVideo(block) {
  const v = block.querySelector('.hero-video');
  const vt = block.querySelector('.video-toggle');
  if (!v || !vt) return;
  const wide = window.matchMedia('(min-width: 801px)');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userTouched = false;
  const setState = (playing) => { vt.setAttribute('aria-pressed', String(playing)); };
  setState(false);
  const autoStart = () => {
    if (userTouched || !wide.matches || still.matches || !v.paused) return;
    v.play().then(() => setState(true)).catch(() => setState(false));
  };
  const whenIdle = (fn) => {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2000 });
    else setTimeout(fn, 2000);
  };
  if (wide.matches && !still.matches) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          whenIdle(autoStart);
        }
      });
      io.observe(block);
    } else {
      whenIdle(autoStart);
    }
  }
  vt.addEventListener('click', () => {
    if (!wide.matches) return;
    userTouched = true;
    if (v.paused) { v.play(); setState(true); } else { v.pause(); setState(false); }
  });
}

function renderForestVideo(block, s) {
  const base = (s.video ? (s.video.getAttribute('href') || '') : '').split('?')[0].split('/').pop().replace(/\.(mp4|webm)$/i, '');
  if (base) block.dataset.video = base;
  const poster = POSTERS[base] ? ` poster="${POSTERS[base]}"` : '';
  const html = `
    <video class="hero-video" preload="none" muted loop playsinline aria-hidden="true" tabindex="-1"${poster}></video>
    <div class="hero-scrim" aria-hidden="true"></div>
    <div class="hero-main"><div class="shell">
      <h1></h1>
    </div></div>
    <button class="video-toggle" type="button" aria-pressed="false"><span class="vt-label">Play video</span></button>`;
  block.innerHTML = html;
  const shell = block.querySelector('.hero-main .shell');
  if (s.h1) fillHeading(block.querySelector('h1'), s.h1);
  const lede = s.ledes.find((l) => !l.afterH2);
  if (lede) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...lede.node.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  }
  if (s.facts) {
    const p = document.createElement('p');
    p.className = 'hero-facts';
    p.innerHTML = factsHtml(s.facts);
    shell.append(p);
  }
  if (s.ctas.length) shell.append(btnLink(s.ctas[0]));
  if (s.video) {
    const v = block.querySelector('.hero-video');
    const src = document.createElement('source');
    src.setAttribute('src', s.video.getAttribute('href'));
    src.setAttribute('type', 'video/mp4');
    v.append(src);
  } else {
    block.querySelector('.hero-video').remove();
    block.querySelector('.video-toggle').remove();
  }
  // campaign rail slot (home): pill + h2 title + lede + arrow link
  if (s.h2s.length) {
    const rail = document.createElement('aside');
    rail.className = 'hero-rail';
    rail.setAttribute('aria-label', 'Product launch');
    const railShell = document.createElement('div');
    railShell.className = 'shell';
    rail.append(railShell);
    if (s.kickers.length) {
      const pill = document.createElement('p');
      pill.className = 'rail-pill';
      [pill.textContent] = s.kickers;
      railShell.append(pill);
    }
    const title = document.createElement('h2');
    title.className = 'rail-title';
    fillHeading(title, s.h2s[0]);
    railShell.append(title);
    const railLede = s.ledes.find((l) => l.afterH2);
    if (railLede) {
      const p = document.createElement('p');
      p.className = 'rail-lede';
      p.textContent = text(railLede.node);
      railShell.append(p);
    }
    if (s.links.length) railShell.append(arrowLink(s.links[s.links.length - 1]));
    block.append(rail);
  }
  wireVideo(block);
}

function renderLight(block, s) {
  block.innerHTML = '<div class="shell"><div class="hero-copy"></div><div class="hero-media"></div></div>';
  const copy = block.querySelector('.hero-copy');
  const media = block.querySelector('.hero-media');
  if (s.crumbs) copy.insertAdjacentHTML('beforeend', crumbsOl(s.crumbs, text(s.crumbs.node).split(' / ').pop()));
  const h1 = document.createElement('h1');
  if (s.h1) fillHeading(h1, s.h1);
  copy.append(h1);
  const lede = s.ledes[0];
  if (lede) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...lede.node.childNodes].map((n) => n.cloneNode(true)));
    copy.append(p);
  }
  if (s.ctas.length) copy.append(btnLink(s.ctas[0]));
  if (s.imgs.length) media.append(s.imgs[0].cloneNode(true));
  else media.remove();
}

/* opener (canon customer-stories .opener): contained h1 + lede on ground */
function renderOpener(block, s) {
  block.innerHTML = '<div class="shell"></div>';
  const shell = block.querySelector('.shell');
  const h1 = document.createElement('h1');
  if (s.h1) fillHeading(h1, s.h1);
  shell.append(h1);
  if (s.ledes.length) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...s.ledes[0].node.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  }
}

function renderImmersive(block, s) {
  block.innerHTML = '<div class="shell"></div>';
  const shell = block.querySelector('.shell');
  if (s.imgs.length) {
    const bg = document.createElement('div');
    bg.className = 'hero-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.append(s.imgs[0].cloneNode(true));
    block.prepend(bg);
  }
  if (s.crumbs) shell.insertAdjacentHTML('beforeend', crumbsOl(s.crumbs, text(s.crumbs.node).split(' / ').pop()));
  if (s.kickers.length) {
    const k = document.createElement('p');
    k.className = 'kicker-meta meta-label';
    [k.textContent] = s.kickers;
    shell.append(k);
  }
  // article sub-variant: the ·-split dateline kicker (Blog · author · dates)
  if (s.facts) {
    const p = document.createElement('p');
    p.className = 'article-kicker meta-label';
    p.innerHTML = articleKickerHtml(s.facts);
    shell.append(p);
  }
  const h1 = document.createElement('h1');
  if (s.h1) fillHeading(h1, s.h1);
  if (block.classList.contains('article')) nbCompounds(h1);
  shell.append(h1);
  if (s.ledes.length) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...s.ledes[0].node.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  }
  if (s.ctas.length) shell.append(btnLink(s.ctas[0]));
}

function renderProduct(block, s) {
  block.innerHTML = '<div class="shell hero-grid"><div class="hero-copy"></div><div class="hero-media"></div></div>';
  const copy = block.querySelector('.hero-copy');
  const media = block.querySelector('.hero-media');
  if (s.crumbs) {
    const nav = document.createElement('nav');
    nav.className = 'crumbs';
    nav.setAttribute('aria-label', 'Breadcrumb');
    s.crumbs.links.forEach((a, i) => {
      if (i) nav.insertAdjacentHTML('beforeend', '<span class="sep" aria-hidden="true">/</span>');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.textContent = text(a);
      nav.append(link);
    });
    copy.append(nav);
  }
  if (s.kickers.length) {
    const k = document.createElement('p');
    k.className = 'kicker-meta';
    [k.textContent] = s.kickers;
    copy.append(k);
  }
  const h1 = document.createElement('h1');
  if (s.h1) fillHeading(h1, s.h1);
  copy.append(h1);
  if (s.ledes.length) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...s.ledes[0].node.childNodes].map((n) => n.cloneNode(true)));
    copy.append(p);
  }
  if (s.ctas.length || s.links.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    if (s.ctas.length) actions.append(btnLink(s.ctas[0]));
    if (s.links.length) actions.append(arrowLink(s.links[0]));
    copy.append(actions);
  }
  if (s.imgs.length) {
    const img = s.imgs[0].cloneNode(true);
    (img.matches('img') ? img : img.querySelector('img'))?.setAttribute('fetchpriority', 'high');
    media.append(img);
  } else media.remove();
}

function renderRecordCard(block, s) {
  block.innerHTML = '<div class="shell"></div>';
  const shell = block.querySelector('.shell');
  if (s.crumbs) {
    const items = s.crumbs.links.map((a) => `<li><a href="${a.getAttribute('href')}">${esc(text(a))}</a><span class="sep" aria-hidden="true">/</span></li>`);
    const current = s.h1 ? text(s.h1) : '';
    if (current) items.push(`<li><span aria-current="page">${esc(current)}</span></li>`);
    shell.insertAdjacentHTML('beforeend', `<nav class="crumbs" aria-label="Breadcrumb"><ol class="meta-label-reset">${items.join('')}</ol></nav>`);
  }
  const grid = document.createElement('div');
  grid.className = 'record-grid';
  shell.append(grid);
  const dateRow = s.kv.find((r) => r.key.toLowerCase() === 'date');
  if (dateRow) {
    const val = dateRow.value || text(dateRow.node).replace(/^[^:]+:\s*/, '');
    const [dd, ...rest] = val.split(' ');
    grid.insertAdjacentHTML('beforeend', `<div class="rec-date"><span class="sr-only">Date: ${esc(val)}</span><span class="dd" aria-hidden="true">${esc(dd)}</span><span class="dm" aria-hidden="true">${esc(rest.join(' '))}</span></div>`);
  }
  const main = document.createElement('div');
  main.className = 'rec-main';
  grid.append(main);
  if (s.kickers.length) {
    const k = document.createElement('p');
    k.className = 'meta-label rec-kicker';
    [k.textContent] = s.kickers;
    main.append(k);
  }
  const h1 = document.createElement('h1');
  if (s.h1) fillHeading(h1, s.h1);
  main.append(h1);
  if (s.kv.length) {
    const dl = document.createElement('dl');
    dl.className = 'rec-facts';
    s.kv.forEach((r) => {
      const val = r.value || text(r.node).replace(/^[^:]+:\s*/, '');
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.className = 'meta-label';
      dt.textContent = r.key;
      const dd = document.createElement('dd');
      if (r.a) dd.append(r.a.cloneNode(true));
      else dd.textContent = val;
      row.append(dt, dd);
      dl.append(row);
    });
    main.append(dl);
  }
  if (s.ctas.length) {
    const cta = document.createElement('div');
    cta.className = 'rec-cta';
    cta.append(btnLink(s.ctas[0]));
    main.append(cta);
  }
}

function renderContact(block, s) {
  block.innerHTML = '<div class="shell hero-grid"><div class="hero-lead"></div><div class="hq-card"></div></div>';
  const lead = block.querySelector('.hero-lead');
  const card = block.querySelector('.hq-card');
  const h1 = document.createElement('h1');
  if (s.h1) fillHeading(h1, s.h1);
  lead.append(h1);
  if (s.lists.length) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'On this page');
    const label = s.kickers[0] || 'On this page';
    nav.insertAdjacentHTML('beforeend', `<p class="meta-label" id="page-index-label">${esc(label)}</p>`);
    const ul = document.createElement('ul');
    ul.className = 'page-index';
    ul.setAttribute('aria-labelledby', 'page-index-label');
    [...s.lists[0].querySelectorAll('a')].forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.innerHTML = `${esc(text(a).replace(/\s*→\s*$/u, ''))} <span class="arr" aria-hidden="true">→</span>`;
      li.append(link);
      ul.append(li);
    });
    nav.append(ul);
    lead.append(nav);
  }
  if (s.h2s.length) {
    const h2 = document.createElement('h2');
    fillHeading(h2, s.h2s[0]);
    card.append(h2);
  }
  if (s.kv.length) {
    const dl = document.createElement('dl');
    dl.className = 'hq-rows';
    s.kv.forEach((r) => {
      const val = r.value || text(r.node).replace(/^[^:]+:\s*/, '');
      const row = document.createElement('div');
      row.className = 'hq-row';
      const dt = document.createElement('dt');
      dt.className = 'meta-label';
      dt.textContent = r.key;
      const dd = document.createElement('dd');
      if (r.a) dd.append(r.a.cloneNode(true));
      else dd.textContent = val;
      row.append(dt, dd);
      dl.append(row);
    });
    card.append(dl);
  }
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  const s = classify(nodes);
  if (block.classList.contains('contact')) renderContact(block, s);
  else if (block.classList.contains('opener')) renderOpener(block, s);
  else if (block.classList.contains('light')) renderLight(block, s);
  else if (block.classList.contains('immersive')) renderImmersive(block, s);
  else if (block.classList.contains('product')) renderProduct(block, s);
  else if (block.classList.contains('record-card')) renderRecordCard(block, s);
  else renderForestVideo(block, s);
}
