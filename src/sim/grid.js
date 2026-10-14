// Uniform spatial grid used to keep enemy separation cheap with hundreds of units.
export class Grid {
  constructor(cell = 24) {
    this.cell = cell;
    this.map = new Map();
  }
  clear() {
    this.map.clear();
  }
  key(cx, cy) {
    return cx * 73856093 ^ cy * 19349663;
  }
  insert(e) {
    const cx = Math.floor(e.x / this.cell);
    const cy = Math.floor(e.y / this.cell);
    const k = this.key(cx, cy);
    let bucket = this.map.get(k);
    if (!bucket) {
      bucket = [];
      this.map.set(k, bucket);
    }
    bucket.push(e);
  }
  // Calls fn(other) for every entity in the 3x3 cells around e.
  neighbours(e, fn) {
    const cx = Math.floor(e.x / this.cell);
    const cy = Math.floor(e.y / this.cell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.map.get(this.key(cx + dx, cy + dy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) fn(bucket[i]);
      }
    }
  }
}
