/*
 * pillars — mission statement + ruled icon-column index (canon: careers
 * .mission). Schema: stardust/eds-schema/careers.json §mission-pillars.
 * Decode tier: reconstructive (h3-boundary units, pre-heading icon buffered #76).
 *
 * Authoring rows:
 *   head rows (h2 + p, up to two: section head, then pillars head)
 *   unit rows (one per pillar): <img> icon | h3 | p
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const inlineRun = kids.length > 1 && kids.every((k) => k.matches('a, strong, em, code, span, u'));
    if (kids.length && !stray && !inlineRun) out.push(...kids);
    else if (kids.length || cell.textContent.trim()) {
      // #79: the pipeline unwraps single-<p> cells — re-wrap mixed cells whole
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

/* the authored <code> anchor becomes the section id (in-page pillar anchors) */
function setSectionAnchor(block, anchor) {
  if (!anchor) return;
  const section = block.closest('.section');
  if (!section) return;
  const existing = document.getElementById(anchor);
  if (existing && existing !== section && /^H[1-6]$/.test(existing.tagName)) existing.removeAttribute('id');
  if (!document.getElementById(anchor)) section.id = anchor;
}

/* chapter (canon sustainability .founded/.activities/.pillar/.pillar-alt):
   h2 + intro prose + ruled subtopics (h3+p+[route]) or anchor pillar-index,
   beside the chapter photograph; `media-left`/`mist`/`ethics` skin classes */
function renderChapter(block, nodes) {
  const s = {
    h2: null, intro: [], subs: [], index: null, img: null,
  };
  let sub = null;
  nodes.forEach((n) => {
    const code = pick(n, 'code');
    if (code && !s.h2) { setSectionAnchor(block, text(code)); return; }
    const media = pick(n, 'picture, img');
    if (media) { s.img = media; return; }
    if (n.matches('h1, h2')) { s.h2 = n; return; }
    if (n.matches('h3, h4')) { sub = { h3: n, paras: [], link: null }; s.subs.push(sub); return; }
    if (n.matches('ul, ol')) { s.index = n; return; }
    const t = text(n);
    if (!t) return;
    const a = pick(n, 'a');
    if (a && sub && t.length <= text(a).length + 3) { sub.link = a; return; }
    if (sub) sub.paras.push(n);
    else s.intro.push(n);
  });
  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell chapter-grid';
  if (block.classList.contains('media-left')) shell.classList.add('media-left');
  block.append(shell);
  const copy = document.createElement('div');
  copy.className = 'chapter-copy';
  if (s.h2) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...s.h2.childNodes].map((c) => c.cloneNode(true)));
    copy.append(h2);
  }
  s.intro.forEach((para) => {
    const p = document.createElement('p');
    p.replaceChildren(...[...para.childNodes].map((c) => c.cloneNode(true)));
    copy.append(p);
  });
  if (s.subs.length) {
    const ul = document.createElement('ul');
    ul.className = 'subtopics';
    s.subs.forEach((x) => {
      const li = document.createElement('li');
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...x.h3.childNodes].map((c) => c.cloneNode(true)));
      li.append(h3);
      x.paras.forEach((para) => {
        const p = document.createElement('p');
        p.replaceChildren(...[...para.childNodes].map((c) => c.cloneNode(true)));
        li.append(p);
      });
      if (x.link) li.append(arrowLink(x.link));
      ul.append(li);
    });
    copy.append(ul);
  }
  if (s.index) {
    const ul = document.createElement('ul');
    ul.className = 'pillar-index';
    [...s.index.querySelectorAll('li')].forEach((li) => {
      const a = li.querySelector('a');
      if (!a) return;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href') || '#');
      link.innerHTML = `${esc(text(a).replace(/\s*[↑↓]\s*$/u, ''))} <span class="arr" aria-hidden="true">↓</span>`;
      item.append(link);
      ul.append(item);
    });
    copy.append(ul);
  }
  shell.append(copy);
  if (s.img) {
    const fig = document.createElement('figure');
    fig.className = 'chapter-media';
    fig.append(s.img.cloneNode(true));
    shell.append(fig);
  }
}

/* stories (canon sustainability .pillar-alt society): h2 + intro, alternating
   story rows (copy | photo [+ "Photo: …" credit]), then the community block
   (h3 + p + partner logos). Row-grouped authoring — one row per story. */
function renderStories(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const shell = document.createElement('div');
  shell.className = 'shell';
  let storyCount = 0;
  rows.forEach((row) => {
    const code = row.querySelector('code');
    if (code && !shell.children.length) { setSectionAnchor(block, text(code)); return; }
    const h2 = row.querySelector('h1, h2');
    if (h2) {
      const h = document.createElement('h2');
      h.replaceChildren(...[...h2.childNodes].map((c) => c.cloneNode(true)));
      shell.append(h);
      return;
    }
    const imgs = [...row.querySelectorAll('picture, img')].filter((x) => !x.closest('picture') || x.matches('picture'));
    const h3 = row.querySelector('h3, h4');
    if (h3) {
      // community block: h3 + p + partner logos
      const div = document.createElement('div');
      div.className = 'community';
      const h = document.createElement('h3');
      h.replaceChildren(...[...h3.childNodes].map((c) => c.cloneNode(true)));
      div.append(h);
      [...row.querySelectorAll('p')].forEach((para) => {
        if (para.querySelector('img, picture') || !text(para)) return;
        const p = document.createElement('p');
        p.replaceChildren(...[...para.childNodes].map((c) => c.cloneNode(true)));
        div.append(p);
      });
      if (imgs.length) {
        const logos = document.createElement('div');
        logos.className = 'community-logos';
        imgs.forEach((img) => logos.append(img.cloneNode(true)));
        div.append(logos);
      }
      shell.append(div);
      return;
    }
    if (imgs.length) {
      // story row: copy cell (p + link) | media cell (img [+ credit])
      const story = document.createElement('div');
      story.className = 'story';
      storyCount += 1;
      if (storyCount % 2 === 0) story.classList.add('flip');
      const copy = document.createElement('div');
      copy.className = 'story-copy';
      const fig = document.createElement('figure');
      fig.className = 'chapter-media';
      fig.append(imgs[0].cloneNode(true));
      [...row.querySelectorAll('p, a')].forEach((n) => {
        if (n.closest('picture') || n.querySelector?.('img, picture')) return;
        const t = text(n);
        if (!t) return;
        if (/^Photo:/i.test(t)) {
          fig.insertAdjacentHTML('beforeend', `<figcaption>${esc(t)}</figcaption>`);
          return;
        }
        const a = n.matches('a') ? n : n.querySelector('a');
        if (a && t.length <= text(a).length + 3) {
          if (!copy.querySelector('.arrow-link')) copy.append(arrowLink(a));
          return;
        }
        if (n.matches('p')) {
          const p = document.createElement('p');
          p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
          copy.insertBefore(p, copy.querySelector('.arrow-link'));
        }
      });
      story.append(copy, fig);
      shell.append(story);
      return;
    }
    // intro prose row
    const t = text(row);
    if (t) {
      const p = document.createElement('p');
      const src = row.querySelector('p') || row;
      p.replaceChildren(...[...src.childNodes].map((c) => c.cloneNode(true)));
      shell.append(p);
    }
  });
  block.replaceChildren(shell);
}

export default async function decorate(block) {
  if (block.classList.contains('chapter')) {
    const chapterNodes = collectNodes(block);
    if (chapterNodes.length) renderChapter(block, chapterNodes);
    return;
  }
  if (block.classList.contains('stories')) {
    renderStories(block);
    return;
  }
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  const heads = []; // {h2, paras}
  const units = []; // {img, h3, paras}
  let head = null;
  let unit = null;
  let pendingImg = null; // pillar icon precedes its h3 (#76)
  nodes.forEach((n) => {
    const media = pick(n, 'picture, img');
    if (media) { pendingImg = media; return; }
    if (n.matches('h1, h2')) {
      head = { h2: n, paras: [] };
      heads.push(head);
      unit = null;
      return;
    }
    if (n.matches('h3, h4')) {
      unit = { img: pendingImg, h3: n, paras: [] };
      pendingImg = null;
      units.push(unit);
      return;
    }
    if (!text(n)) return;
    if (unit) unit.paras.push(n);
    else if (head) head.paras.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  heads.forEach((h, i) => {
    const div = document.createElement('div');
    div.className = i === 0 ? 'section-head' : 'pillars-head';
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...h.h2.childNodes].map((c) => c.cloneNode(true)));
    div.append(h2);
    h.paras.forEach((para) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...para.childNodes].map((c) => c.cloneNode(true)));
      div.append(p);
    });
    shell.append(div);
  });
  if (units.length) {
    const ul = document.createElement('ul');
    ul.className = 'pillar-list';
    units.forEach((u) => {
      const li = document.createElement('li');
      li.className = 'pillar';
      if (u.img) li.append(u.img.cloneNode(true));
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...u.h3.childNodes].map((c) => c.cloneNode(true)));
      li.append(h3);
      u.paras.forEach((para) => {
        const p = document.createElement('p');
        p.replaceChildren(...[...para.childNodes].map((c) => c.cloneNode(true)));
        li.append(p);
      });
      ul.append(li);
    });
    shell.append(ul);
  }
}
