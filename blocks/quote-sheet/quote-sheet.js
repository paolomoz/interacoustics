/*
 * quote-sheet — ruled testimonial columns on ground (canon: customer-stories
 * .voices-sheet, record-sheet voice, not cards).
 * Schema: stardust/eds-schema/customer-stories.json §testimonial-sheet.
 *
 * Authoring rows (one per quote):
 *   <img> avatar | quote p ("…") | attribution p (<strong>who</strong> role)
 */

const pick = (n, sel) => (n.matches?.(sel) ? n : n.querySelector?.(sel));
const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function parseQuote(row) {
  const q = { img: pick(row, 'picture, img'), quote: null, attrib: null };
  const walk = (n) => {
    if (n.matches?.('picture, img') || n.querySelector?.(':scope > img, :scope > picture')) return;
    const t = text(n);
    if (!t) return;
    const strong = pick(n, 'strong');
    if (strong && t.startsWith(text(strong))) {
      q.attrib = { who: text(strong), role: t.slice(text(strong).length).trim() };
      return;
    }
    if (!q.quote) q.quote = n;
  };
  row.querySelectorAll(':scope > div').forEach((cell) => {
    const kids = [...cell.children];
    const stray = [...cell.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (kids.length && !stray) kids.forEach(walk);
    else walk(cell); // #79: pipeline-unwrapped or mixed cell — read whole
  });
  return q;
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const headTitle = rows.map((r) => r.querySelector('h1, h2')).find(Boolean);
  const quotes = rows.filter((r) => !r.querySelector('h1, h2')).map(parseQuote).filter((q) => q.quote);
  if (!quotes.length) return;
  block.textContent = '';

  // voices variant (canon careers .voices): forest statement chapter —
  // h2 head + 3 duotone 4:5 portraits above quotes
  if (block.classList.contains('voices')) {
    const shell = document.createElement('div');
    shell.className = 'shell';
    block.append(shell);
    if (headTitle) {
      const h2 = document.createElement('h2');
      h2.replaceChildren(...[...headTitle.childNodes].map((n) => n.cloneNode(true)));
      shell.append(h2);
    }
    const grid = document.createElement('div');
    grid.className = 'voices-grid';
    shell.append(grid);
    quotes.forEach((q) => {
      const fig = document.createElement('figure');
      fig.className = 'voice';
      if (q.img) {
        const media = document.createElement('div');
        media.className = 'voice-media';
        const img = q.img.cloneNode(true);
        (img.matches('img') ? img : img.querySelector('img'))?.classList.add('voice-photo');
        media.append(img);
        fig.append(media);
      }
      const bq = document.createElement('blockquote');
      const p = document.createElement('p');
      p.replaceChildren(...[...q.quote.childNodes].map((n) => n.cloneNode(true)));
      bq.append(p);
      fig.append(bq);
      if (q.attrib) {
        fig.insertAdjacentHTML('beforeend', `<figcaption><span class="v-name">${esc(q.attrib.who)}</span><span class="v-role">${esc(q.attrib.role)}</span></figcaption>`);
      }
      grid.append(fig);
    });
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'shell sheet-cols';
  block.append(shell);
  quotes.forEach((q) => {
    const fig = document.createElement('figure');
    if (q.img) {
      const media = q.img.cloneNode(true);
      (media.matches('img') ? media : media.querySelector('img'))?.classList.add('avatar');
      fig.append(media);
    }
    const bq = document.createElement('blockquote');
    const p = document.createElement('p');
    p.replaceChildren(...[...q.quote.childNodes].map((n) => n.cloneNode(true)));
    bq.append(p);
    fig.append(bq);
    if (q.attrib) {
      fig.insertAdjacentHTML('beforeend', `<figcaption class="attrib"><span class="who">${esc(q.attrib.who)}</span><span class="role">${esc(q.attrib.role)}</span></figcaption>`);
    }
    shell.append(fig);
  });
}
