/*
 * record-sheet — tracked-caps column head + tabular first column (canon: index
 * events). BUILT BY CLUSTER A for its pages — cluster B extends/owns (variants
 * congresses/syllabus/timeline/training/battery); shape recorded in
 * eds-conversion-log.md. Schema: stardust/eds-schema/index.json §events.
 *
 * Authoring rows:
 *   head rows (no h3): h2 | intro p
 *   unit rows (one per event): date text ("Jul 14, 2026 - 9:00 am") |
 *     <h3>Event title</h3> | <em><a href>Sign up</a></em>
 *   foot row: plain <a> ("All upcoming events")
 * The Date / Course-or-webinar column labels are template chrome (canon).
 *
 * Variant `training` (canon audiometers training; schema:
 * stardust/eds-schema/audiometers.json §training): the first cell of a unit
 * row is a meta tag ("Type: Reading") rendered as a tracked-caps label (no
 * dd/dm date split, no column-label chrome), and the plain <a> foot renders
 * as the arrow-link beside the h2 (canon .training-head flex row) — author it
 * right after the h2.
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function makeArrowLink(foot) {
  const link = document.createElement('a');
  link.className = 'arrow-link';
  link.setAttribute('href', foot.getAttribute('href') || '#');
  const t = text(foot).replace(/\s*→\s*$/u, '').trim();
  const words = t.split(' ');
  const last = words.pop();
  link.innerHTML = `${words.length ? `${esc(words.join(' '))} ` : ''}<span class="nb">${esc(last)}&nbsp;<span class="arr" aria-hidden="true">→</span></span>`;
  return link;
}

function splitDate(full) {
  const m = full.match(/^(\w+\s+\d{1,2})[,\s]*(.*)$/);
  if (m) return { dd: m[1], dm: m[2] };
  return { dd: full, dm: '' };
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = { h2: null, intro: [] };
  const units = [];
  let foot = null;

  rows.forEach((row) => {
    const h3 = row.querySelector('h3, h4');
    if (h3) {
      const a = row.querySelector('a');
      const titleNode = h3.cloneNode(true);
      const date = [...row.querySelectorAll(':scope > div')]
        .map(text)
        .find((t) => t && t !== text(h3) && (!a || t !== text(a)));
      units.push({ date: date || '', titleNode, a });
      return;
    }
    [...row.querySelectorAll(':scope > div')].forEach((cell) => {
      const kids = [...cell.children].length ? [...cell.children] : [cell];
      kids.forEach((n) => {
        const h2 = pick(n, 'h1, h2');
        if (h2) { head.h2 = h2; return; }
        const a = pick(n, 'a');
        // training authors its "Explore all" link in the head (before units)
        if (a && (units.length || block.classList.contains('training'))) { foot = a; return; }
        if (text(n)) head.intro.push(n);
      });
    });
  });

  block.textContent = '';
  const isTraining = block.classList.contains('training');
  const shell = document.createElement('div');
  shell.className = 'shell';
  block.append(shell);

  if (head.h2 || head.intro.length) {
    const sh = document.createElement('div');
    sh.className = isTraining ? 'training-head' : 'section-head';
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
    if (isTraining && foot) {
      shell.append(sh);
      sh.append(makeArrowLink(foot));
      foot = null;
    } else shell.append(sh);
  }

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  if (!isTraining) {
    sheet.insertAdjacentHTML('beforeend', `
    <div class="sheet-head" aria-hidden="false">
      <span class="meta-label sh-date">Date</span>
      <span class="meta-label">Course or webinar</span>
      <span class="sh-empty"></span>
    </div>`);
  }
  const ul = document.createElement('ul');
  ul.className = 'sheet-list';
  units.forEach((u) => {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'sheet-row';
    if (isTraining) {
      row.insertAdjacentHTML('beforeend', `<span class="meta-label">${esc(u.date)}</span>`);
    } else {
      const { dd, dm } = splitDate(u.date);
      row.insertAdjacentHTML('beforeend', `
      <div class="sheet-date">
        <span class="sr-only">${esc(u.date)}</span>
        <span class="dd" aria-hidden="true">${esc(dd)}</span>
        <span class="dm" aria-hidden="true">${esc(dm)}</span>
      </div>`);
    }
    const h3 = document.createElement('h3');
    h3.replaceChildren(...[...u.titleNode.childNodes].map((n) => n.cloneNode(true)));
    row.append(h3);
    if (u.a) {
      const btn = u.a.cloneNode(true);
      btn.classList.add('btn');
      if (!btn.classList.contains('btn-primary')) btn.classList.add('btn-secondary');
      // canon training a11y: "Learn more<span class=sr-only>: <title></span>"
      if (isTraining && !btn.querySelector('.sr-only')) {
        const t = text(u.titleNode).replace(/\s*\|\s*Interacoustics\s*$/i, '').replace(/\s*\|\s*/g, ' ');
        btn.insertAdjacentHTML('beforeend', `<span class="sr-only">: ${esc(t)}</span>`);
      }
      row.append(btn);
    }
    li.append(row);
    ul.append(li);
  });
  sheet.append(ul);
  shell.append(sheet);

  if (foot) shell.append(makeArrowLink(foot));
}
