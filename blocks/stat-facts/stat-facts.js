/*
 * stat-facts — about-page trust devices (canon: about .values + .glance).
 * Schema: stardust/eds-schema/about.json §values / §at-a-glance.
 * Decode tier: reconstructive (heading/numeral boundary segmentation).
 *
 * Variants (block class):
 *   values  rail (h2 + intro p) left, ruled 2x2 value ledger right on mist —
 *           head row: h2 | p; unit rows: h3 | p
 *   glance  section head + ruled display-scale numerals —
 *           head row: h2; unit rows: numeral text ("800+") | caption p
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

const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderValues(block, nodes) {
  const shell = document.createElement('div');
  shell.className = 'shell values-grid';
  const rail = document.createElement('div');
  rail.className = 'values-rail';
  const ul = document.createElement('ul');
  ul.className = 'value-grid';
  let li = null;
  nodes.forEach((n) => {
    if (n.matches('h1, h2')) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      rail.append(h2);
      return;
    }
    if (n.matches('h3, h4')) {
      li = document.createElement('li');
      li.className = 'value';
      const h3 = document.createElement('h3');
      h3.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      li.append(h3);
      ul.append(li);
      return;
    }
    if (!text(n)) return;
    const p = document.createElement('p');
    p.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
    (li || rail).append(p);
  });
  shell.append(rail, ul);
  block.replaceChildren(shell);
}

function renderGlance(block, nodes) {
  const shell = document.createElement('div');
  shell.className = 'shell';
  const ul = document.createElement('ul');
  ul.className = 'glance-rule';
  let li = null;
  nodes.forEach((n) => {
    if (n.matches('h1, h2')) {
      const head = document.createElement('div');
      head.className = 'section-head';
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...n.childNodes].map((c) => c.cloneNode(true)));
      head.append(h2);
      shell.append(head);
      return;
    }
    const t = text(n);
    if (!t) return;
    if (/^\d/.test(t) && t.length <= 8) {
      li = document.createElement('li');
      li.insertAdjacentHTML('beforeend', `<span class="glance-num">${esc(t)}</span>`);
      ul.append(li);
      return;
    }
    if (li) li.insertAdjacentHTML('beforeend', `<p class="glance-cap">${esc(t)}</p>`);
  });
  shell.append(ul);
  block.replaceChildren(shell);
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  if (block.classList.contains('glance')) renderGlance(block, nodes);
  else renderValues(block, nodes);
}
