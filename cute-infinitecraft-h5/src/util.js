export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

export function now() {
  return Date.now();
}

export function stablePairKey(a, b) {
  return a <= b ? `${a}|${b}` : `${b}|${a}`;
}

export function pickByHash(str, list) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % list.length;
  return list[idx];
}

export function debounce(fn, ms = 150) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

