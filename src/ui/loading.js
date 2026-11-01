// FIX4: run-start loading bar (DOM, textContent only). Truthful: the width is the pre-bake's real progress (finished work / total work).
import './loading.css';

export function showLoading(doc = document) {
  const el = doc.createElement('div');
  el.className = 'wk-loading';
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100'); el.setAttribute('aria-valuenow', '0');
  const flame = doc.createElement('div'); flame.className = 'wk-loading__flame';
  const bar = doc.createElement('div'); bar.className = 'wk-loading__bar';
  const fill = doc.createElement('div'); fill.className = 'wk-loading__fill'; bar.appendChild(fill);
  const msg = doc.createElement('p'); msg.className = 'wk-loading__msg';
  el.append(flame, bar, msg);
  doc.body.appendChild(el);
  return {
    set(p, label) {
      const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
      fill.style.width = pct + '%'; el.setAttribute('aria-valuenow', String(pct));
      if (label) msg.textContent = label;
    },
    close() { el.remove(); },
  };
}
