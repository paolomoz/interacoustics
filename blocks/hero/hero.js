/*
 * hero — template-slotted canon hero (David's-Model tier: template-slotted, #95).
 * Canon DOM lifted verbatim from stardust/migrated pages; authored values are
 * slotted by ROLE (schema: stardust/eds-schema/{index,solutions,contact}.json).
 *
 * Variants (block class):
 *   forest-video (home/solutions/careers/academy/activities)
 *     rows: h1 (em kept) | lede p | facts p ("A · B · C") | <strong><a> CTA
 *           | <a href="…mp4"> video | optional <img> poster (authored still,
 *           media/video-posters/<mp4-basename>.jpg — used as the <video poster>
 *           and, ≤800px, the CSS --hero-poster background frame; alt describes
 *           the scene) | optional campaign rail:
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
 * The pre-play poster is an OPTIONAL authored <img> (no baked data-URIs): its
 * src drives the desktop <video poster> and the ≤800px CSS --hero-poster
 * background frame. With no poster authored, CSS falls back to the brand ground.
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
  // optional authored still (media/video-posters/<base>.jpg): drives the desktop
  // <video poster> pre-play frame and, ≤800px, the --hero-poster CSS background.
  const posterImg = s.imgs[0] && pick(s.imgs[0], 'img');
  const posterSrc = posterImg ? posterImg.getAttribute('src') : '';
  const poster = posterSrc ? ` poster="${esc(posterSrc)}"` : '';
  const html = `
    <video class="hero-video" preload="none" muted loop playsinline aria-hidden="true" tabindex="-1"${poster}></video>
    <div class="hero-scrim" aria-hidden="true"></div>
    <div class="hero-main"><div class="shell">
      <h1></h1>
    </div></div>
    <button class="video-toggle" type="button" aria-pressed="false"><span class="vt-label">Play video</span></button>`;
  block.innerHTML = html;
  if (posterSrc) block.style.setProperty('--hero-poster', `url("${posterSrc}")`);
  const shell = block.querySelector('.hero-main .shell');
  // featured-event record rail (canon activities): kv rows + h2 → the rail
  // claims the LAST cta (Sign up) before the hero-actions render
  const recordRail = s.kv.length > 0 && s.h2s.length > 0;
  const railCta = recordRail && s.ctas.length ? s.ctas.pop() : null;
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
  if (s.ctas.length) {
    const extra = block.classList.contains('meadow') ? 'btn-meadow' : 'btn-primary';
    if (s.ctas.length > 1) {
      // canon academy: meadow ask + on-dark outline secondary, one flex row
      const actions = document.createElement('div');
      actions.className = 'hero-actions';
      actions.append(btnLink(s.ctas[0], extra));
      s.ctas.slice(1).forEach((a) => {
        const b = a.cloneNode(true);
        b.classList.add('btn', 'btn-secondary');
        actions.append(b);
      });
      shell.append(actions);
    } else shell.append(btnLink(s.ctas[0], extra));
  }
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
  // featured-event record rail (canon activities featured-event)
  if (recordRail) {
    const kicker = s.kickers.length ? s.kickers[0] : 'Next course';
    const dateRow = s.kv.find((r) => r.key.toLowerCase() === 'date');
    const locRow = s.kv.find((r) => r.key.toLowerCase() === 'location');
    const rail = document.createElement('aside');
    rail.className = 'hero-rail hero-rail-record';
    rail.setAttribute('aria-label', kicker);
    const grid = document.createElement('div');
    grid.className = 'shell featured-grid';
    rail.append(grid);
    if (dateRow) {
      const val = (dateRow.value || text(dateRow.node).replace(/^[^:]+:\s*/, '')).trim();
      const m = val.match(/^(\w+\s+\d{1,2})[,\s]*(.*)$/);
      const dd = m ? m[1] : val;
      const dm = m ? m[2] : '';
      grid.insertAdjacentHTML('beforeend', `
      <div class="featured-date">
        <p class="meta-label kicker-line">${esc(kicker)}</p>
        <span class="sr-only">Begins ${esc(val)}</span>
        <span class="dd" aria-hidden="true">${esc(dd)}</span>
        <span class="dm" aria-hidden="true">${esc(dm)}</span>
      </div>`);
    }
    const info = document.createElement('div');
    info.className = 'featured-info';
    const title = document.createElement('h2');
    fillHeading(title, s.h2s[0]);
    info.append(title);
    if (locRow) {
      const p = document.createElement('p');
      p.className = 'loc';
      p.textContent = text(locRow.node) || `${locRow.key}: ${locRow.value}`;
      info.append(p);
    }
    grid.append(info);
    if (railCta) {
      const btn = railCta.cloneNode(true);
      btn.classList.add('btn', 'btn-meadow', 'featured-cta');
      grid.append(btn);
    }
    block.append(rail);
    wireVideo(block);
    return;
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
  // inventory fact line (canon product-support "45 products · 7 product families")
  if (s.facts) {
    const p = document.createElement('p');
    p.className = 'hero-facts';
    p.innerHTML = factsHtml(s.facts);
    copy.append(p);
  }
  if (s.ctas.length) copy.append(btnLink(s.ctas[0]));
  if (s.imgs.length) media.append(s.imgs[0].cloneNode(true));
  else media.remove();
}

/* collage (canon about .about-hero): copy left, 4-photo two-column collage right */
function renderCollage(block, s) {
  block.innerHTML = '<div class="shell"></div>';
  const shell = block.querySelector('.shell');
  if (s.crumbs) shell.insertAdjacentHTML('beforeend', crumbsOl(s.crumbs, text(s.crumbs.node).split(' / ').pop()));
  const grid = document.createElement('div');
  grid.className = 'about-hero-grid';
  shell.append(grid);
  const copy = document.createElement('div');
  copy.className = 'about-hero-copy';
  const h1 = document.createElement('h1');
  if (s.h1) fillHeading(h1, s.h1);
  nbCompounds(h1);
  copy.append(h1);
  if (s.ledes.length) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...s.ledes[0].node.childNodes].map((n) => n.cloneNode(true)));
    copy.append(p);
  }
  if (s.ctas.length) {
    const btn = btnLink(s.ctas[0], 'btn-secondary');
    btn.classList.add('btn-video');
    btn.insertAdjacentHTML('afterbegin', '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2 1.5v9l8-4.5z"/></svg> ');
    copy.append(btn);
  }
  grid.append(copy);
  if (s.imgs.length) {
    const fig = document.createElement('figure');
    fig.className = 'collage';
    fig.id = 'hero-collage';
    fig.setAttribute('tabindex', '-1');
    const half = Math.ceil(s.imgs.length / 2);
    [s.imgs.slice(0, half), s.imgs.slice(half)].forEach((col) => {
      if (!col.length) return;
      const div = document.createElement('div');
      div.className = 'collage-col';
      col.forEach((img) => div.append(img.cloneNode(true)));
      fig.append(div);
    });
    grid.append(fig);
  }
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
  else if (block.classList.contains('collage')) renderCollage(block, s);
  else if (block.classList.contains('light')) renderLight(block, s);
  else if (block.classList.contains('immersive')) renderImmersive(block, s);
  else if (block.classList.contains('product')) renderProduct(block, s);
  else if (block.classList.contains('record-card')) renderRecordCard(block, s);
  else renderForestVideo(block, s);
}
