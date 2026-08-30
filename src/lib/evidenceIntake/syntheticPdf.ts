import type { ExtractedPage, NativePdfExtractor, TextBlock } from './types';

function unescapePdfLiteral(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)));
}

function extractTextFromStream(stream: string): string {
  const parts: string[] = [];
  const tj = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tj.exec(stream))) {
    const inner = match[0].slice(1, match[0].lastIndexOf(')'));
    parts.push(unescapePdfLiteral(inner));
  }
  const tjArray = /\[([\s\S]*?)\]\s*TJ/g;
  while ((match = tjArray.exec(stream))) {
    const literals = match[1].match(/\((?:\\.|[^\\)])*\)/g) ?? [];
    for (const lit of literals) {
      parts.push(unescapePdfLiteral(lit.slice(1, -1)));
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function objectBody(source: string, objectId: number): string | null {
  const re = new RegExp(`${objectId}\\s+0\\s+obj([\\s\\S]*?)endobj`);
  const found = source.match(re);
  return found ? found[1] : null;
}

function streamOf(objectBodyText: string): string {
  const start = objectBodyText.indexOf('stream');
  const end = objectBodyText.indexOf('endstream');
  if (start < 0 || end < 0) return '';
  return objectBodyText.slice(start + 6, end);
}

/** Test-only helper: builds an uncompressed synthetic PDF. Not a production extractor. */
export function buildSyntheticPdf(pages: Array<{ text: string; rotate?: number }>): Uint8Array {
  const kids = pages.map((_, i) => `${3 + i} 0 R`).join(' ');
  const contentIds = pages.map((_, i) => 3 + pages.length + i);
  const fontId = 3 + pages.length * 2;
  const chunks: string[] = [];
  chunks.push('%PDF-1.4\n');
  chunks.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  chunks.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((page, i) => {
    const pageId = 3 + i;
    const contentId = contentIds[i];
    const rotate = page.rotate ?? 0;
    const escaped = page.text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    chunks.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Rotate ${rotate} /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );
    const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
    chunks.push(
      `${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  });

  chunks.push(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`);
  chunks.push('trailer\n<< /Root 1 0 R >>\n%%EOF\n');
  return new Uint8Array(Buffer.from(chunks.join(''), 'latin1'));
}

/** Test-only scan of uncompressed synthetic PDFs produced by buildSyntheticPdf. */
export function extractSyntheticPdfPages(bytes: Uint8Array): ExtractedPage[] {
  const source = Buffer.from(bytes).toString('latin1');
  if (!source.startsWith('%PDF')) return [];

  const pageIds: number[] = [];
  const pageHeader = /(\d+)\s+0\s+obj\s*<<\s*\/Type\s*\/Page\b/g;
  let header: RegExpExecArray | null;
  while ((header = pageHeader.exec(source))) {
    pageIds.push(Number(header[1]));
  }

  return pageIds.map((id, pageIndex) => {
    const body = objectBody(source, id) ?? '';
    const media = body.match(/\/MediaBox\s*\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
    const rotate = body.match(/\/Rotate\s+(-?\d+)/);
    const contents = body.match(/\/Contents\s+(\d+)\s+0\s+R/);
    const contentBody = contents ? objectBody(source, Number(contents[1])) : null;
    const text = contentBody ? extractTextFromStream(streamOf(contentBody)) : '';
    const x0 = media ? Number(media[1]) : 0;
    const y0 = media ? Number(media[2]) : 0;
    const x1 = media ? Number(media[3]) : null;
    const y1 = media ? Number(media[4]) : null;
    const blocks: TextBlock[] = text
      ? [{
          text,
          confidence: '1.0000',
          lineIndex: 0,
          boundingBox: {
            x: '72.0000',
            y: '720.0000',
            width: '468.0000',
            height: '14.0000',
            unit: 'pdf-pt',
          },
        }]
      : [];
    return {
      pageIndex,
      width: x1 == null ? null : (x1 - x0).toFixed(2),
      height: y1 == null ? null : (y1 - y0).toFixed(2),
      rotationDegrees: rotate ? Number(rotate[1]) : 0,
      blocks,
      errors: [],
    };
  });
}

/** Test-only NativePdfExtractor. Production intake must inject a real extractor. */
export function createSyntheticNativePdfExtractor(): NativePdfExtractor {
  return {
    async extract(input) {
      return extractSyntheticPdfPages(input.bytes);
    },
  };
}
