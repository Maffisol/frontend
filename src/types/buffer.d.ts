// src/types/buffer.d.ts

declare module 'buffer' {
    export class Buffer {
      static alloc(size: number): Buffer;
      static from(data: string | Uint8Array | ArrayBuffer | number[]): Buffer;
      copyBytesFrom(target: Buffer, targetStart: number, sourceStart: number, sourceEnd: number): number;
      poolSize: number;
    }
  }
  