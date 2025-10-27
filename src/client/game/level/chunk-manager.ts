export type EntityDef = {
  id: string;
  type: string;
  x: number;
  y: number;
  props?: Record<string, unknown>;
};

export type ChunkData = {
  cx: number;
  cy: number;
  entities: EntityDef[];
};

export type ChunkLoader = (cx: number, cy: number) => Promise<ChunkData | null>;

export class ChunkManager {
  constructor(
    private readonly chunkSize: number,
    private readonly loadChunk: ChunkLoader,
    private readonly cacheLimit = 64
  ) {}

  private cache = new Map<string, ChunkData>();
  private lru: string[] = [];

  private key(cx: number, cy: number) {
    return `${cx},${cy}`;
  }

  private touch(k: string) {
    const i = this.lru.indexOf(k);
    if (i >= 0) this.lru.splice(i, 1);
    this.lru.push(k);
    while (this.lru.length > this.cacheLimit) {
      const old = this.lru.shift();
      if (old) this.cache.delete(old);
    }
  }

  async ensureChunksForView(
    x: number,
    y: number,
    w: number,
    h: number,
    padding = 0
  ) {
    const minCX = Math.floor((x - padding) / this.chunkSize);
    const maxCX = Math.floor((x + w + padding) / this.chunkSize);
    const minCY = Math.floor((y - padding) / this.chunkSize);
    const maxCY = Math.floor((y + h + padding) / this.chunkSize);

    const needed: Array<Promise<void>> = [];
    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const k = this.key(cx, cy);
        if (!this.cache.has(k)) {
          needed.push(
            this.loadChunk(cx, cy).then((data) => {
              if (data) {
                this.cache.set(k, data);
                this.touch(k);
              }
            })
          );
        } else {
          this.touch(k);
        }
      }
    }
    await Promise.all(needed);
  }

  *entitiesInRect(x: number, y: number, w: number, h: number) {
    const minCX = Math.floor(x / this.chunkSize);
    const maxCX = Math.floor((x + w) / this.chunkSize);
    const minCY = Math.floor(y / this.chunkSize);
    const maxCY = Math.floor((y + h) / this.chunkSize);

    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const k = this.key(cx, cy);
        const chunk = this.cache.get(k);
        if (!chunk) continue;
        for (const e of chunk.entities) {
          if (e.x >= x && e.x <= x + w && e.y >= y && e.y <= y + h) {
            yield e;
          }
        }
      }
    }
  }
}
