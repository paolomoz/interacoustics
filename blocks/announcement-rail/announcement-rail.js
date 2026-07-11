/*
 * announcement-rail — the canon promo/announcement strip (edge-to-edge meadow
 * band under the header; non-sticky, dismissible). Canon: stardust/migrated
 * [data-section="banner"] on every page.
 *
 * Authoring rows: message p | plain <a> ask. The dismiss control is
 * template-owned (canon banner-dismiss); dismissing removes the whole section.
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

const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  let message = '';
  let ask = null;
  nodes.forEach((n) => {
    const a = n.matches?.('a') ? n : n.querySelector?.('a');
    if (a && text(n).length <= text(a).length + 3) { ask = a; return; }
    if (text(n) && !message) message = text(n);
  });

  block.textContent = '';
  const row = document.createElement('div');
  row.className = 'shell banner-row';
  const p = document.createElement('p');
  p.textContent = message;
  row.append(p);
  if (ask) {
    const link = document.createElement('a');
    link.className = 'btn btn-banner';
    link.setAttribute('href', ask.getAttribute('href') || '#');
    link.textContent = text(ask);
    row.append(link);
  }
  const dismiss = document.createElement('button');
  dismiss.className = 'banner-dismiss';
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', 'Dismiss announcement');
  dismiss.textContent = '×';
  dismiss.addEventListener('click', () => {
    (block.closest('.section') || block).remove();
  });
  row.append(dismiss);
  block.append(row);
}
