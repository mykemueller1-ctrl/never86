import type { PageQualityObservation, QualityFlag } from './types';

export const QUALITY_REJECT = {
  blur: 0.65,
  glare: 0.65,
} as const;

export const QUALITY_FLAG = {
  rotation: 15,
  deskew: 5,
  crop: 0.25,
} as const;

export function qualityFlagsFor(
  observation: PageQualityObservation | undefined,
  nativeText: string,
): {
  flags: QualityFlag[];
  reject: boolean;
  errors: string[];
} {
  const flags: QualityFlag[] = [];
  const errors: string[] = [];
  const obs = observation ?? { pageIndex: 0 };

  if ((obs.blurScore ?? 0) >= QUALITY_REJECT.blur) {
    flags.push('blur');
    errors.push('blur_above_threshold');
  }
  if ((obs.glareScore ?? 0) >= QUALITY_REJECT.glare) {
    flags.push('glare');
    errors.push('glare_above_threshold');
  }
  if (Math.abs(obs.rotationDegrees ?? 0) >= QUALITY_FLAG.rotation) {
    flags.push('rotation');
    errors.push('rotation_above_threshold');
  }
  if (Math.abs(obs.deskewDegrees ?? 0) >= QUALITY_FLAG.deskew) {
    flags.push('deskew');
    errors.push('deskew_above_threshold');
  }
  if ((obs.cropRatio ?? 0) >= QUALITY_FLAG.crop) {
    flags.push('crop');
    errors.push('crop_above_threshold');
  }

  const empty = nativeText.trim() === '';
  const rejectQuality = flags.includes('blur') || flags.includes('glare');
  if (empty) {
    flags.push('unreadable');
    errors.push('unreadable_no_text');
  }

  return { flags: [...new Set(flags)], reject: rejectQuality || empty, errors };
}
