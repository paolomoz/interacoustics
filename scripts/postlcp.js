import { getMetadata } from './ak.js';

async function loadStaticFragment(name) {
  const el = document.querySelector(name);
  if (!el) return;
  if (getMetadata(name) === 'off') { el.remove(); return; }
  const resp = await fetch(`/fragments/${name}.html`);
  if (!resp.ok) return;
  const html = await resp.text();
  el.className = name; // header.header / footer.footer root selectors must match
  el.innerHTML = html;
}

export default async function loadPostLCP() {
  await Promise.all([loadStaticFragment('header'), loadStaticFragment('footer')]);
}
