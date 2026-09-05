/** Hosted recorded-demo URL. Leave empty until a real https URL exists. */
export const HOME_DEMO_VIDEO_URL = '';

export function homeDemoVideoReady(url: string = HOME_DEMO_VIDEO_URL): boolean {
  return /^https:\/\/\S+$/.test(url.trim());
}
