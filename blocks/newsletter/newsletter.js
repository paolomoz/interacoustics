/*
 * newsletter — email capture on a quiet mist panel, real labels + consent
 * smallprint (canon: stardust/migrated index newsletter; identical anatomy on
 * activities/academy/blog/workshop pages). Schema: stardust/eds-schema/index.json.
 *
 * Authoring rows: h2 | lede p | smallprint p(s) (links kept).
 * The form (First name / Last name / Email + Sign up) is template-owned —
 * canon markup verbatim, real <label>s, no action (captured shape).
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');

const FORM_HTML = `
  <div class="field">
    <label for="nl-first-name">First name</label>
    <input type="text" id="nl-first-name" name="first-name" autocomplete="given-name" required>
  </div>
  <div class="field">
    <label for="nl-last-name">Last name</label>
    <input type="text" id="nl-last-name" name="last-name" autocomplete="family-name" required>
  </div>
  <div class="field">
    <label for="nl-email">Email</label>
    <input type="email" id="nl-email" name="email" autocomplete="email" required>
  </div>
  <button class="btn btn-primary" type="submit">Sign up</button>`;

export default async function decorate(block) {
  const nodes = collectNodes(block);
  let heading = null;
  let lede = null;
  const smallprint = [];
  nodes.forEach((n) => {
    const h = pick(n, 'h1, h2, h3');
    if (h) { heading = h; return; }
    if (!text(n)) return;
    if (!lede) { lede = n; return; }
    smallprint.push(n);
  });

  block.textContent = '';
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  const head = document.createElement('div');
  head.className = 'section-head';
  if (heading) {
    const h2 = document.createElement('h2');
    h2.replaceChildren(...[...heading.childNodes].map((n) => n.cloneNode(true)));
    head.append(h2);
  }
  if (lede) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.replaceChildren(...[...lede.childNodes].map((n) => n.cloneNode(true)));
    head.append(p);
  }
  shell.append(head);

  const form = document.createElement('form');
  form.className = 'newsletter-form';
  form.innerHTML = FORM_HTML;
  shell.append(form);

  smallprint.forEach((sp) => {
    const p = document.createElement('p');
    p.className = 'smallprint';
    p.replaceChildren(...[...sp.childNodes].map((n) => n.cloneNode(true)));
    shell.append(p);
  });

  // anchor target for the announcement-rail "Sign up here" ask (canon #newsletter)
  const section = block.closest('.section');
  if (section && !document.getElementById('newsletter')) section.id = 'newsletter';
}
