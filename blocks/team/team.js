/*
 * team — employee video stories as whole-surface links on the videos' own
 * poster frames (canon: careers .team, academy precedent — no third-party
 * iframe). Schema: stardust/eds-schema/careers.json §meet-the-team.
 *
 * Authoring rows:
 *   head row: h2
 *   unit rows (one per story): <img> poster | h3 name | role p |
 *     plain <a href=youtube> ("Watch video") — the card's whole-surface href
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function parseUnit(row) {
  const u = {
    img: pick(row, 'picture, img'), name: null, role: null, link: null,
  };
  const walk = (n) => {
    if (n.matches?.('picture, img') || n.querySelector?.(':scope > img, :scope > picture')) return;
    if (n.matches?.('h3, h4')) { u.name = n; return; }
    const a = pick(n, 'a');
    if (a && text(n).length <= text(a).length + 3) { u.link = a; return; }
    if (!u.role && text(n)) u.role = n;
  };
  row.querySelectorAll(':scope > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) kids.forEach(walk);
    else walk(cell); // #79: pipeline-unwrapped cell
  });
  return u;
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  let headTitle = null;
  const units = [];
  rows.forEach((row) => {
    if (row.querySelector('h3, h4')) { units.push(parseUnit(row)); return; }
    const h2 = row.querySelector('h1, h2');
    if (h2) headTitle = h2;
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);
  if (headTitle) {
    const head = document.createElement('div');
    head.className = 'section-head';
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...headTitle.childNodes].map((n) => n.cloneNode(true)));
    head.append(h2);
    shell.append(head);
  }
  const grid = document.createElement('div');
  grid.className = 'team-grid';
  shell.append(grid);
  units.forEach((u) => {
    const card = document.createElement('a');
    card.className = 'team-card';
    card.setAttribute('href', (u.link && u.link.getAttribute('href')) || '#');
    if (u.img) {
      const media = document.createElement('span');
      media.className = 'team-media';
      media.append(u.img.cloneNode(true));
      media.insertAdjacentHTML('beforeend', '<span class="play-badge" aria-hidden="true"></span>');
      card.append(media);
    }
    if (u.name) {
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...u.name.childNodes].map((n) => n.cloneNode(true)));
      card.append(h3);
    }
    if (u.role) card.insertAdjacentHTML('beforeend', `<span class="team-role">${esc(text(u.role))}</span>`);
    const label = u.link ? text(u.link).replace(/\s*(→|&rarr;)\s*$/u, '') : 'Watch video';
    const words = label.split(' ');
    const last = words.pop();
    card.insertAdjacentHTML('beforeend', `<span class="team-watch">${words.length ? `${esc(words.join(' '))} ` : ''}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span></span>`);
    grid.append(card);
  });
}
