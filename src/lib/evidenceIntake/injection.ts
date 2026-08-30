const INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /ignore (all )?above instructions/i,
  /you are now /i,
  /system\s*:/i,
  /\[inst\]/i,
  /<\|im_start\|>/i,
  /reveal (your|the) (system )?prompt/i,
  /jailbreak/i,
  /do not follow (your|the) rules/i,
  /disregard (your|the) safety/i,
];

export function scanInjection(text: string): { suspected: boolean; matches: string[] } {
  const matches = INJECTION_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);
  return { suspected: matches.length > 0, matches };
}

export function treatDocumentTextAsDataOnly(text: string): string {
  return text;
}
