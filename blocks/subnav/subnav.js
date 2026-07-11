/*
 * subnav — sticky slim hairline in-page jump bar (canon: solutions-subnav,
 * ad629 product-subnav, product-support/clinical-diploma/our-history subnavs).
 * Schema: stardust/eds-schema/solutions.json §solutions-subnav.
 *
 * Authoring rows: <strong>LABEL:</strong> | p of anchor <a>s
 * (an emphasised <strong><a>/<em><a> link renders as the restated-ask button —
 * the ad629 shape).
 *
 * JS enhancement (canon): right-edge scroll-cue fade drops once the row is
 * scrolled to its end; CSS-only fade without JS.
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

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;
  let label = '';
  const links = [];
  let ask = null;
  nodes.forEach((n) => {
    const t = text(n);
    if (!t) return;
    const anchors = n.matches('a') ? [n] : [...(n.querySelectorAll?.('a') || [])];
    if (!anchors.length && pick(n, 'strong') && text(pick(n, 'strong')) === t) { label = t; return; }
    if (!anchors.length && n.matches('ul, ol')) return;
    anchors.forEach((a) => {
      const emphasised = a.closest('strong, em') || a.querySelector('strong, em') || a.classList.contains('btn');
      if (emphasised) ask = a;
      else links.push(a);
    });
  });

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', label ? label.replace(/:$/, '') : 'Page sections');
  const row = document.createElement('div');
  row.className = 'shell subnav-row';
  nav.append(row);
  if (label) {
    const span = document.createElement('span');
    span.className = 'subnav-label';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = label;
    row.append(span);
  }
  links.forEach((a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href') || '#');
    link.textContent = text(a);
    row.append(link);
  });
  if (ask) {
    const btn = ask.cloneNode(true);
    btn.classList.add('btn');
    if (!btn.classList.contains('btn-secondary')) btn.classList.add('btn-primary');
    btn.classList.add('subnav-ask');
    row.append(btn);
  }
  block.append(nav);

  // canon scroll cue: drop the right-edge fade once scrolled to the end
  const syncFade = () => {
    const atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 4;
    block.classList.toggle('subnav-end', atEnd);
  };
  row.addEventListener('scroll', syncFade, { passive: true });
  window.addEventListener('resize', syncFade);
  syncFade();
}
