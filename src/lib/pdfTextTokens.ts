/**
 * Native PDF text tokens. FlateDecode streams, Tj / TJ, and ToUnicode.
 * Printable ASCII is kept as written. CMap is applied only to glyph ids
 * (hex strings and UTF-16BE), never to already-printable ASCII.
 * No OCR. A photo with no text layer stays empty.
 */

import { inflateSync } from 'node:zlib';

const MAX_STREAM = 2_000_000;
const COLUMN_GAP = -80;

export function extractPdfTokens(bytes: Uint8Array): string[] {
  if (bytes.length < 5 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    return [];
  }
  const streams = inflatePdfStreams(Buffer.from(bytes));
  const cmap = parseToUnicode(streams);
  const tokens: string[] = [];
  for (const blob of streams) {
    if (!blob.includes(Buffer.from('Tj')) && !blob.includes(Buffer.from('TJ'))) continue;
    tokens.push(...tokensFromContent(blob.toString('latin1'), cmap));
  }
  return tokens.map((token) => token.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function inflatePdfStreams(data: Buffer): Buffer[] {
  const out: Buffer[] = [];
  let cursor = 0;
  while (cursor < data.length) {
    const idx = data.indexOf('stream', cursor);
    if (idx < 0) break;
    if (idx >= 3 && data.subarray(idx - 3, idx).toString('latin1') === 'end') {
      cursor = idx + 6;
      continue;
    }
    const dictStart = data.lastIndexOf('<<', idx - 1);
    const dictionary = dictStart >= 0 && idx - dictStart < 12000
      ? data.subarray(dictStart, idx).toString('latin1')
      : '';
    let dataStart = idx + 6;
    if (data[dataStart] === 0x0d && data[dataStart + 1] === 0x0a) dataStart += 2;
    else if (data[dataStart] === 0x0a || data[dataStart] === 0x0d) dataStart += 1;
    const end = data.indexOf('endstream', dataStart);
    if (end < 0) break;
    let raw = data.subarray(dataStart, end);
    if (raw.length >= 2 && raw[raw.length - 2] === 0x0d && raw[raw.length - 1] === 0x0a) raw = raw.subarray(0, raw.length - 2);
    else if (raw.length && (raw[raw.length - 1] === 0x0a || raw[raw.length - 1] === 0x0d)) raw = raw.subarray(0, raw.length - 1);
    let text: Buffer | null = raw;
    if (dictionary.includes('FlateDecode')) {
      try {
        text = inflateSync(raw);
      } catch {
        text = null;
      }
    }
    if (text && text.length <= MAX_STREAM) out.push(text);
    cursor = end + 9;
  }
  return out;
}

function utf16Hex(dst: string): string {
  if (dst.length >= 4 && dst.length % 2 === 0) {
    const bytes = Buffer.from(dst, 'hex');
    if (bytes.length >= 2 && bytes.length % 2 === 0) {
      let text = '';
      for (let i = 0; i < bytes.length; i += 2) {
        text += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
      }
      return text;
    }
  }
  const code = Number.parseInt(dst, 16);
  return Number.isFinite(code) ? String.fromCharCode(code) : '';
}

function bumpUtf16(baseHex: string, offset: number): string {
  const base = Buffer.from(baseHex, 'hex');
  const bumped = Buffer.from(base);
  let add = offset;
  for (let i = bumped.length - 1; i >= 0 && add; i -= 1) {
    const val = bumped[i] + add;
    bumped[i] = val & 0xff;
    add = val >> 8;
  }
  if (base.length >= 2 && base.length % 2 === 0) {
    let text = '';
    for (let i = 0; i < bumped.length; i += 2) {
      text += String.fromCharCode((bumped[i] << 8) | bumped[i + 1]);
    }
    return text;
  }
  return bumped.length ? String.fromCharCode(bumped[bumped.length - 1]) : '';
}

function parseToUnicode(streams: Buffer[]): Map<number, string> {
  const cmap = new Map<number, string>();
  const put = (code: number, value: string) => {
    if (!cmap.has(code) && value) cmap.set(code, value);
  };
  for (const blob of streams) {
    if (!blob.includes(Buffer.from('beginbfchar')) && !blob.includes(Buffer.from('beginbfrange'))) continue;
    if (!blob.includes(Buffer.from('begincmap')) && blob.length > 400_000) continue;
    const s = blob.toString('latin1');
    let i = 0;
    while (i < s.length) {
      const a = s.indexOf('beginbfchar', i);
      const b = s.indexOf('beginbfrange', i);
      if (a < 0 && b < 0) break;
      if (b < 0 || (a >= 0 && a < b)) {
        const end = s.indexOf('endbfchar', a);
        if (end < 0) break;
        const block = s.slice(a, end);
        let j = 0;
        while (j < block.length) {
          const p = block.indexOf('<', j);
          if (p < 0) break;
          const p2 = block.indexOf('>', p);
          const q = p2 > 0 ? block.indexOf('<', p2 + 1) : -1;
          const q2 = q > 0 ? block.indexOf('>', q) : -1;
          if (p2 < 0 || q < 0 || q2 < 0) break;
          const src = block.slice(p + 1, p2);
          const dst = block.slice(q + 1, q2);
          if (/^[0-9A-Fa-f]+$/.test(src) && /^[0-9A-Fa-f]+$/.test(dst)) {
            put(Number.parseInt(src, 16), utf16Hex(dst));
          }
          j = q2 + 1;
        }
        i = end + 9;
      } else {
        const end = s.indexOf('endbfrange', b);
        if (end < 0) break;
        const block = s.slice(b, end);
        let j = 0;
        while (j < block.length) {
          const p = block.indexOf('<', j);
          if (p < 0) break;
          const p2 = block.indexOf('>', p);
          const q = p2 > 0 ? block.indexOf('<', p2 + 1) : -1;
          const q2 = q > 0 ? block.indexOf('>', q) : -1;
          if (p2 < 0 || q < 0 || q2 < 0) break;
          const src = block.slice(p + 1, p2);
          const endc = block.slice(q + 1, q2);
          if (!/^[0-9A-Fa-f]+$/.test(src) || !/^[0-9A-Fa-f]+$/.test(endc)) {
            j = p + 1;
            continue;
          }
          const startI = Number.parseInt(src, 16);
          const endI = Number.parseInt(endc, 16);
          const rest = block.slice(q2 + 1, q2 + 80).trimStart();
          if (rest.startsWith('[')) {
            const arrS = block.indexOf('[', q2);
            const arrE = block.indexOf(']', arrS);
            if (arrE < 0) break;
            const dests: string[] = [];
            let k = arrS;
            while (k < arrE) {
              const d1 = block.indexOf('<', k);
              if (d1 < 0 || d1 > arrE) break;
              const d2 = block.indexOf('>', d1);
              if (d2 < 0 || d2 > arrE) break;
              dests.push(block.slice(d1 + 1, d2));
              k = d2 + 1;
            }
            dests.forEach((dst, off) => put(startI + off, utf16Hex(dst)));
            j = arrE + 1;
          } else {
            const r1 = block.indexOf('<', q2);
            const r2 = r1 > 0 ? block.indexOf('>', r1) : -1;
            if (r1 < 0 || r2 < 0) {
              j = q2 + 1;
              continue;
            }
            const dst = block.slice(r1 + 1, r2);
            if (!/^[0-9A-Fa-f]+$/.test(dst)) {
              j = r2 + 1;
              continue;
            }
            const span = endI - startI;
            if (span >= 0 && span <= 2000) {
              for (let code = startI; code <= endI; code += 1) put(code, bumpUtf16(dst, code - startI));
            }
            j = r2 + 1;
          }
        }
        i = end + 11;
      }
    }
  }
  return cmap;
}

function readLiteral(s: string, start: number): { raw: Buffer; next: number } {
  let i = start + 1;
  const out: number[] = [];
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      i += 1;
      if (i >= s.length) break;
      const n = s[i];
      const simple: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12, '(': 40, ')': 41, '\\': 92 };
      if (n in simple) {
        out.push(simple[n]);
        i += 1;
      } else if (n >= '0' && n <= '7') {
        let octal = n;
        i += 1;
        for (let k = 0; k < 2; k += 1) {
          if (i < s.length && s[i] >= '0' && s[i] <= '7') {
            octal += s[i];
            i += 1;
          }
        }
        out.push(Number.parseInt(octal, 8) & 0xff);
      } else if (n === '\n' || n === '\r') {
        i += 1;
        if (n === '\r' && s[i] === '\n') i += 1;
      } else {
        out.push(n.charCodeAt(0) & 0xff);
        i += 1;
      }
    } else if (c === ')') {
      return { raw: Buffer.from(out), next: i + 1 };
    } else {
      out.push(c.charCodeAt(0) & 0xff);
      i += 1;
    }
  }
  return { raw: Buffer.from(out), next: i };
}

function readHex(s: string, start: number): { raw: Buffer; next: number } {
  let i = start + 1;
  const hexes: string[] = [];
  while (i < s.length && s[i] !== '>') {
    if (/[0-9A-Fa-f]/.test(s[i])) hexes.push(s[i]);
    i += 1;
  }
  if (hexes.length % 2) hexes.push('0');
  const bytes: number[] = [];
  for (let j = 0; j < hexes.length; j += 2) bytes.push(Number.parseInt(hexes[j] + hexes[j + 1], 16));
  return { raw: Buffer.from(bytes), next: i < s.length ? i + 1 : i };
}

function decodeShown(raw: Buffer, cmap: Map<number, string>): string {
  if (!raw.length) return '';
  const ascii = [...raw].every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126));
  if (ascii) return raw.toString('latin1');
  if (raw.length % 2 === 0) {
    let text = '';
    let hit = false;
    for (let i = 0; i < raw.length; i += 2) {
      const code = (raw[i] << 8) | raw[i + 1];
      let mapped = cmap.get(code);
      if (mapped == null && raw[i] === 0) mapped = cmap.get(raw[i + 1]);
      if (mapped != null) {
        text += mapped;
        hit = true;
      } else if (code >= 32 && code <= 126) {
        text += String.fromCharCode(code);
      }
    }
    if (hit) return text;
  }
  if (cmap.size) {
    let text = '';
    let hit = false;
    for (const b of raw) {
      const mapped = cmap.get(b);
      if (mapped != null) {
        text += mapped;
        hit = true;
      } else if (b >= 32 && b <= 126) {
        text += String.fromCharCode(b);
      }
    }
    if (hit) return text;
  }
  return '';
}

type Piece = { kind: 's'; text: string } | { kind: 'n'; gap: number };

function tokensFromContent(s: string, cmap: Map<number, string>): string[] {
  const tokens: string[] = [];
  let i = 0;
  const n = s.length;
  let array: Piece[] | null = null;
  let depth = 0;
  let pending: string | null = null;
  while (i < n) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f' || c === '\0') {
      i += 1;
      continue;
    }
    if (c === '%') {
      while (i < n && s[i] !== '\n' && s[i] !== '\r') i += 1;
      continue;
    }
    if (c === '(') {
      const lit = readLiteral(s, i);
      i = lit.next;
      const text = decodeShown(lit.raw, cmap);
      if (depth && array) array.push({ kind: 's', text });
      else pending = text;
      continue;
    }
    if (c === '<' && s[i + 1] !== '<') {
      const hex = readHex(s, i);
      i = hex.next;
      const text = decodeShown(hex.raw, cmap);
      if (depth && array) array.push({ kind: 's', text });
      else pending = text;
      continue;
    }
    if (c === '[') {
      depth += 1;
      if (depth === 1) array = [];
      i += 1;
      continue;
    }
    if (c === ']') {
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    if (c === '/') {
      i += 1;
      while (i < n && !' \t\r\n\f()<>[]{}/%'.includes(s[i])) i += 1;
      pending = null;
      continue;
    }
    const jStart = i;
    while (i < n && !' \t\r\n\f()<>[]{}/%'.includes(s[i])) i += 1;
    const word = s.slice(jStart, i);
    if (!word) {
      i += 1;
      continue;
    }
    if (depth && array && /^-?\d/.test(word)) {
      const gap = Number(word);
      if (Number.isFinite(gap)) array.push({ kind: 'n', gap });
      continue;
    }
    if (word === 'Tj' || word === "'" || word === '"') {
      if (pending) tokens.push(pending);
      pending = null;
    } else if (word === 'TJ') {
      if (array) tokens.push(...flushArray(array));
      array = null;
      pending = null;
    } else if (depth === 0 && word !== 'BT' && word !== 'ET') {
      pending = null;
    }
  }
  return tokens;
}

function flushArray(array: Piece[]): string[] {
  const parts: string[] = [];
  let buf = '';
  for (const piece of array) {
    if (piece.kind === 's') buf += piece.text;
    else if (piece.gap <= COLUMN_GAP && buf) {
      parts.push(buf);
      buf = '';
    }
  }
  if (buf) parts.push(buf);
  return parts.filter((part) => part.trim());
}
