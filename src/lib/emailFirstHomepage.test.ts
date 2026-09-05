import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_DEMO_VIDEO_URL, homeDemoVideoReady } from './homeDemo';

function firstHref(source: string, className: string): string | null {
  const match = source.match(new RegExp(`href="([^"]+)"[^>]*className="[^"]*${className}`));
  if (match) return match[1];
  const flipped = source.match(new RegExp(`className="[^"]*${className}[^"]*"[^>]*href="([^"]+)"`));
  return flipped ? flipped[1] : null;
}

describe('email-first homepage (no sandbox as the stranger door)', () => {
  const home = readFileSync(resolve('src/components/HomePage.tsx'), 'utf8');
  const shell = readFileSync(resolve('src/components/HumanSiteShell.tsx'), 'utf8');
  const demo = readFileSync(resolve('src/lib/homeDemo.ts'), 'utf8');
  const config = readFileSync(resolve('next.config.js'), 'utf8');

  it('makes the homepage primary button claim the free owner seat', () => {
    expect(home).toMatch(/human-button human-button-primary/);
    expect(firstHref(home, 'human-button-primary')).toBe('/onboard');
    expect(home).toMatch(/Claim the free owner seat/);
    expect(home).not.toMatch(/Start playing/);
    expect(home).not.toMatch(/Try Owner desk/);
    expect(home).not.toMatch(/href="\/play"[^>]*human-button-primary/);
  });

  it('tells strangers to watch the recorded demo, then give their email', () => {
    expect(home).toMatch(/Watch the recorded demo, then give your email/);
    expect(home).toMatch(/id="demo"/);
    expect(home).toMatch(/homeDemoVideoReady/);
    expect(home).toContain('/onboard');
  });

  it('does not invent a broken video embed while no hosted demo URL exists', () => {
    expect(HOME_DEMO_VIDEO_URL).toBe('');
    expect(homeDemoVideoReady()).toBe(false);
    expect(homeDemoVideoReady('https://cdn.example.test/never86-demo.mp4')).toBe(true);
    expect(homeDemoVideoReady('not-a-url')).toBe(false);
    expect(demo).toMatch(/export const HOME_DEMO_VIDEO_URL = ''/);
    expect(home).not.toMatch(/<iframe/);
    expect(home).not.toMatch(/youtube\.com\/embed/);
    expect(home).not.toMatch(/src=""/);
  });

  it('keeps Void Hunter blue on the public home brand', () => {
    expect(home).toMatch(/#005de8/);
    expect(shell).not.toMatch(/Start playing/);
  });

  it('stops primary nav from leading with Play or Owner desk', () => {
    expect(shell).toMatch(/Claim the free owner seat/);
    expect(firstHref(shell, 'human-button-primary')).toBe('/onboard');
    expect(shell).not.toMatch(/Start playing/);
    expect(shell).not.toMatch(/href="\/play"[^>]*human-button-primary/);
    expect(shell).not.toMatch(/href="\/play"[^>]*human-nav-link">Play/);
    expect(shell).not.toMatch(/human-nav-link">Owner desk/);
    expect(shell).toMatch(/href="\/login"/);
    expect(shell).toMatch(/href="\/portal"/);
    expect(shell).not.toMatch(/href="\/communities"/);
  });

  it('does not rewrite the homepage to open play', () => {
    expect(config).not.toMatch(/source: '\/'/);
    expect(config).toMatch(/source: '\/play'/);
    expect(config).toMatch(/destination: '\/demo\/action-shift\.html'/);
  });
});
