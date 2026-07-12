/*
 * syllabus-index — ruled 2-col typographic subject index (canon academy
 * clinical-areas). Schema: stardust/eds-schema/academy.json §clinical-areas.
 *
 * Authoring rows:
 *   [<p><code>anchor</code></p>]          — section anchor id (hero CTA target)
 *   head rows: h2 | intro p
 *   unit rows (one per area): <h3><a href>Area</a></h3> + caps line p
 *     ("ABR | ASSR | … and more" — captured literal, kept as text)
 * The "View all →" row tail is template chrome.
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setSectionAnchor(block, anchor) {
  if (!anchor) return;
  const section = block.closest('.section');
  if (!section) return;
  const existing = document.getElementById(anchor);
  if (existing && existing !== section && /^H[1-6]$/.test(existing.tagName)) existing.removeAttribute('id');
  if (!document.getElementById(anchor)) section.id = anchor;
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = { h2: null, intro: [] };
  const units = [];
  rows.forEach((row) => {
    const code = row.querySelector('code');
    if (code && !units.length && !head.h2) { setSectionAnchor(block, text(code)); return; }
    const h3 = row.querySelector('h3, h4');
    if (h3) {
      const a = h3.querySelector('a');
      const caps = [...row.querySelectorAll('p')].map(text).find((t) => t && t !== text(h3))
        || [...row.children].map(text).find((t) => t && t !== text(h3)) || '';
      units.push({ href: a ? a.getAttribute('href') : '#', name: text(h3), caps });
      return;
    }
    [...row.children].forEach((cell) => {
      const kids = [...cell.children].length ? [...cell.children] : [cell];
      kids.forEach((n) => {
        const h2 = pick(n, 'h1, h2');
        if (h2) { head.h2 = h2; return; }
        if (text(n)) head.intro.push(n);
      });
    });
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  if (head.h2 || head.intro.length) {
    const sh = document.createElement('div');
    sh.className = 'section-head';
    if (head.h2) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...head.h2.childNodes].map((n) => n.cloneNode(true)));
      sh.append(h2);
    }
    head.intro.forEach((n) => {
      const p = document.createElement('p');
      p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      sh.append(p);
    });
    shell.append(sh);
  }
  const ul = document.createElement('ul');
  ul.className = 'clinical-index';
  units.forEach((u) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="index-row" href="${esc(u.href)}">
        <span>
          <h3>${esc(u.name)}</h3>
          <p class="index-caps">${esc(u.caps)}</p>
        </span>
        <span class="index-tail">View all <span class="arr" aria-hidden="true">→</span></span>
      </a>`;
    ul.append(li);
  });
  shell.append(ul);
}
