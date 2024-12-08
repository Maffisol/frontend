// src/globals.d.ts
import { Buffer as NodeBuffer } from 'buffer';

declare global {
  const Buffer: typeof NodeBuffer;
}
