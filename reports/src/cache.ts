/** Bounded per-generator LRU keyed by complete canonical strings. */
export class LruCache<T> {
  private readonly values = new Map<string, T>();
  private readonly weights = new Map<string, number>();
  private bytes = 0;
  private hits = 0;
  private misses = 0;
  readonly capacity: number;
  readonly maxBytes: number;
  constructor(capacity = 128, maxBytes = Infinity) {
    this.maxBytes = maxBytes;
    this.capacity = capacity;
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('cacheSize must be a positive integer');
  }
  get(key: string): T | undefined {
    if (!this.values.has(key)) { this.misses++; return undefined; }
    const value = this.values.get(key)!;
    this.values.delete(key);
    this.values.set(key, value);
    this.hits++;
    return value;
  }
  set(key: string, value: T, weight = 1): void {
    this.bytes -= this.weights.get(key) ?? 0;
    this.weights.delete(key);
    this.values.delete(key);
    if (weight > this.maxBytes) return;
    this.values.set(key, value);
    this.weights.set(key, weight);
    this.bytes += weight;
    while (this.values.size > this.capacity || this.bytes > this.maxBytes) {
      const oldest = this.values.keys().next().value!;
      this.bytes -= this.weights.get(oldest)!;
      this.weights.delete(oldest); this.values.delete(oldest);
    }
  }
  clear(): void { this.values.clear(); this.weights.clear(); this.bytes = 0; this.hits = 0; this.misses = 0; }
  get stats(): { size: number; capacity: number; hits: number; misses: number; bytes: number; maxBytes: number } {
    return { size: this.values.size, capacity: this.capacity, hits: this.hits, misses: this.misses, bytes: this.bytes, maxBytes: this.maxBytes };
  }
}
