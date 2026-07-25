/**
 * Seeded RNG and an unbiased shuffle.
 *
 * The previous harness sampled with `[...urls].sort(() => Math.random() - 0.5)`, which is
 * wrong twice over: unseeded, so a "reproducible sample" was nothing of the kind, and
 * statistically biased, so it did not even sample uniformly. Comparison-sort with a
 * random comparator produces a distribution that depends on the sort implementation.
 *
 * sfc32 is small, fast and has good statistical properties. Combined with a real
 * Fisher-Yates, the same seed always yields the same sample, on any machine.
 */

/** FNV-1a - turns a seed string into four 32-bit words. */
function seedWords(seed) {
  const s = String(seed);
  const words = [];
  for (let k = 0; k < 4; k += 1) {
    let h = 2166136261 ^ (k * 0x9e3779b9);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    words.push(h >>> 0);
  }
  return words;
}

/** sfc32 - returns a function producing floats in [0, 1). */
export function createRng(seed) {
  let [a, b, c, d] = seedWords(seed);
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) >>> 0;
    t = (t + d) >>> 0;
    c = (c + t) >>> 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i += 1) next();   // warm up
  return next;
}

/** Unbiased Fisher-Yates. Returns a new array; never mutates the input. */
export function shuffle(items, seed) {
  const rng = typeof seed === 'function' ? seed : createRng(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Deterministic sample of `count` items. Input is sorted first so the result depends on
 *  the seed and the SET, not on the order discovery happened to return. */
export function sample(items, count, seed) {
  const sorted = [...items].sort();
  if (count >= sorted.length) return sorted;
  return shuffle(sorted, seed).slice(0, count).sort();
}
