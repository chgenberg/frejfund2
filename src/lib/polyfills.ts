// Minimal polyfills for Node runtimes where Web APIs are missing

// Provide a dummy File constructor if not present (Node 18)
// This avoids ReferenceError when modules reference global File symbol at import time.
if (typeof (globalThis as any).File === 'undefined') {
  (globalThis as any).File = class {
    name: string;
    type: string;
    lastModified: number;
    private _buffer: Uint8Array;
    constructor(parts: Array<ArrayBuffer | Uint8Array>, name: string, options: { type?: string; lastModified?: number } = {}) {
      this.name = name;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
      const buffers = parts.map((p) => (p instanceof Uint8Array ? p : new Uint8Array(p)));
      const total = buffers.reduce((s, b) => s + b.byteLength, 0);
      this._buffer = new Uint8Array(total);
      let offset = 0;
      for (const b of buffers) { this._buffer.set(b, offset); offset += b.byteLength; }
    }
    async arrayBuffer(): Promise<ArrayBuffer> { return this._buffer.buffer.slice(this._buffer.byteOffset, this._buffer.byteOffset + this._buffer.byteLength); }
  } as any;
}


