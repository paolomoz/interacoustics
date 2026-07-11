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

export default async function decorate(block) {
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
