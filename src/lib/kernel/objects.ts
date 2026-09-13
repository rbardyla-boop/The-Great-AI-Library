import { bytesEqual, objectPath, sha256Bytes } from "./crypto.ts";

export class IntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrityError";
  }
}

export class ContentAddressedStore {
  private readonly blobs = new Map<string, Uint8Array>();

  get size(): number {
    return this.blobs.size;
  }

  path(hash: string): string {
    return objectPath(hash);
  }

  async put(bytes: Uint8Array): Promise<{ hash: string; wrote: boolean }> {
    const copy = new Uint8Array(bytes);
    const hash = await sha256Bytes(copy);
    const existing = this.blobs.get(hash);
    if (existing) {
      if (!bytesEqual(existing, copy)) {
        throw new IntegrityError(`object ${hash.slice(0, 8)} collided with different bytes`);
      }
      return { hash, wrote: false };
    }
    this.blobs.set(hash, copy);
    return { hash, wrote: true };
  }

  get(hash: string): Uint8Array | undefined {
    const found = this.blobs.get(hash);
    return found ? new Uint8Array(found) : undefined;
  }

  has(hash: string): boolean {
    return this.blobs.has(hash);
  }

  hashes(): string[] {
    return [...this.blobs.keys()].sort();
  }

  async verify(hash: string): Promise<boolean> {
    const bytes = this.blobs.get(hash);
    if (!bytes) return false;
    return (await sha256Bytes(bytes)) === hash;
  }

  /** Test-only. Originals are never mutated through put(). */
  unsafeReplace(hash: string, bytes: Uint8Array): void {
    this.blobs.set(hash, new Uint8Array(bytes));
  }

  delete(hash: string): boolean {
    return this.blobs.delete(hash);
  }

  exportAll(): Record<string, number[]> {
    const out: Record<string, number[]> = {};
    for (const [hash, bytes] of this.blobs) out[hash] = [...bytes];
    return out;
  }

  importAll(dump: Record<string, number[]>): void {
    this.blobs.clear();
    for (const [hash, arr] of Object.entries(dump)) {
      this.blobs.set(hash, Uint8Array.from(arr));
    }
  }
}
