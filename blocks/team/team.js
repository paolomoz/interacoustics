/*
 * team — employee video stories as whole-surface links on the videos' own
 * poster frames (canon: careers .team, academy precedent — no third-party
 * iframe). Schema: stardust/eds-schema/careers.json §meet-the-team.
 *
 * Authoring rows:
 *   head row: h2
 *   unit rows (one per story): <img> poster | h3 name | role p |
 *     plain <a href=youtube> whose TEXT selects the play mode:
 *       "Watch video"      → inline click-to-play facade (poster → iframe)
 *       "Watch on YouTube" → non-embeddable card: static poster + an external
 *                            "Watch on YouTube ↗" link opening youtu.be/<id> in
 *                            a new tab (no inline facade). Use this signal for a
 *                            video whose owner has disabled embedding (a bare
 *                            youtu.be embed renders YouTube's error box), e.g.
 *                            Jonathan Wolsing-Hansen (fgLOg4UYhDc), which is
 *                            embed-disabled at the source.
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* pull the 11-char YouTube id out of youtu.be/<id>, watch?v=<id> or embed/<id> */
function youTubeId(href) {
  if (!href) return null;
  const m = href.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

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
    const card = document.createElement('div');
    card.className = 'team-card';
    const href = (u.link && u.link.getAttribute('href')) || '';
    const id = youTubeId(href);
    const name = u.name ? text(u.name) : 'team member';
    // authored "Watch on YouTube" text marks a non-embeddable video: skip the
    // inline facade (its embed renders YouTube's error box) and link out instead
    const external = !!id && /youtube/i.test(text(u.link));
    const watchUrl = id ? `https://youtu.be/${id}` : href;

    if (u.img) {
      const media = document.createElement('div');
      media.className = 'team-media';
      if (id && !external) {
        // privacy/perf-friendly facade: poster + play button, swapped for a
        // playing YouTube iframe on activation (click or keyboard)
        const facade = document.createElement('button');
        facade.type = 'button';
        facade.className = 'team-facade';
        facade.setAttribute('aria-label', `Play video: ${name}`);
        facade.append(u.img.cloneNode(true));
        facade.insertAdjacentHTML('beforeend', '<span class="play-badge" aria-hidden="true"></span>');
        facade.addEventListener('click', () => {
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
          iframe.title = `${name} video`;
          iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
          iframe.setAttribute('allowfullscreen', '');
          iframe.loading = 'lazy';
          facade.replaceWith(iframe);
          iframe.focus();
        });
        media.append(facade);
      } else if (external) {
        // non-embeddable → static poster as a whole-surface link that opens
        // YouTube in a new tab (no dead inline facade / error box)
        const poster = document.createElement('a');
        poster.className = 'team-poster-link';
        poster.href = watchUrl;
        poster.target = '_blank';
        poster.rel = 'noopener';
        poster.setAttribute('aria-label', `Watch on YouTube: ${name} (opens in a new tab)`);
        poster.append(u.img.cloneNode(true));
        poster.insertAdjacentHTML('beforeend', '<span class="play-badge external" aria-hidden="true"></span>');
        media.append(poster);
      } else {
        // no video id → static poster (no dead play affordance)
        media.append(u.img.cloneNode(true));
      }
      card.append(media);
    }

    if (u.name) {
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...u.name.childNodes].map((n) => n.cloneNode(true)));
      card.append(h3);
    }
    if (u.role) card.insertAdjacentHTML('beforeend', `<span class="team-role">${esc(text(u.role))}</span>`);
    if (external) {
      card.insertAdjacentHTML('beforeend', `<a class="team-watch" href="${watchUrl}" target="_blank" rel="noopener">Watch on YouTube <span class="ext-arr" aria-hidden="true">↗</span></a>`);
    }
    grid.append(card);
  });
}
