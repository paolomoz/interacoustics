/*
 * bio-sheet -- tutors/presenters ruled rows (canon: workshop presenters,
 * clinical-diploma tutors). Schema: stardust/eds-schema/workshop.json
 * §presenters, diploma.json §tutors.
 *
 * Authoring rows (flatten-tolerant):
 *   head row:  [h2 title] | [summary p (e.g. "Presenters: A, B and C.")]
 *   unit rows: [<img> portrait] | h3 name | bio p
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const inlineRun = kids.length > 1 && kids.every((k) => k.matches('a, strong, em, code, span, u'));
    if (kids.length && !stray && !inlineRun) out.push(...kids);
    else if (kids.length || cell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...[...cell.childNodes].map((n) => n.cloneNode(true)));
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  let heading = null;
  let summary = null;
  const units = [];
  let cur = null;

  nodes.forEach((n) => {
    const h2 = pick(n, 'h1, h2');
    if (h2 && !cur) { heading = h2; return; }
    const h3 = pick(n, 'h3, h4');
    if (h3) {
      cur = { name: h3, img: null, bio: null };
      units.push(cur);
      return;
    }
    const media = pick(n, 'picture, img');
    if (media) {
      if (cur) cur.img = media;
      return;
    }
    if (!cur && text(n) && !heading) { summary = n; return; }
    if (!cur && text(n)) { summary = n; return; }
    if (cur && text(n) && !cur.bio) { cur.bio = n; }
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
  if (summary) {
    const p = document.createElement('p');
    p.className = 'presenters-line';
    p.replaceChildren(...[...summary.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  }

  const list = document.createElement('ul');
  list.className = 'bio-list';
  units.forEach((u) => {
    const li = document.createElement('li');
    if (u.img) {
      const portrait = document.createElement('span');
      portrait.className = 'bio-portrait';
      portrait.append(u.img.cloneNode(true));
      li.append(portrait);
    }
    const body = document.createElement('div');
    body.className = 'bio-body';
    const h3 = document.createElement('h3');
    h3.replaceChildren(...[...u.name.childNodes].map((n) => n.cloneNode(true)));
    body.append(h3);
    if (u.bio) {
      const p = document.createElement('p');
      p.replaceChildren(...[...u.bio.childNodes].map((n) => n.cloneNode(true)));
      body.append(p);
    }
    li.append(body);
    list.append(li);
  });
  shell.append(list);
}
