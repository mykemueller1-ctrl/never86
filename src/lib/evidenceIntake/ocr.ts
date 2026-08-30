import type { ExtractionPath, NativePdfExtractor, OcrFallback, SupportedMimeType } from './types';

export function selectExtractionPath(input: {
  mimeType: SupportedMimeType | 'unsupported';
  nativeExtractorAvailable: boolean;
  nativeTextPresent: boolean;
  ocrAvailable: boolean;
}): ExtractionPath {
  if (input.mimeType === 'unsupported') return 'unavailable';
  if (input.mimeType === 'application/pdf' && input.nativeExtractorAvailable && input.nativeTextPresent) {
    return 'native-pdf';
  }
  if (input.ocrAvailable) return 'ocr-fallback';
  return 'unavailable';
}

export function hasOcrFallback(ocr: OcrFallback | undefined): ocr is OcrFallback {
  return typeof ocr?.extractPage === 'function';
}

export function hasNativePdfExtractor(native: NativePdfExtractor | undefined): native is NativePdfExtractor {
  return typeof native?.extract === 'function';
}

export function pageHasUsableText(blocks: Array<{ text: string }>): boolean {
  return blocks.some((block) => block.text.trim().length > 0);
}
