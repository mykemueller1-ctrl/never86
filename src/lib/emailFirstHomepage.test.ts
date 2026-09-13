import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_DEMO_VIDEO_URL, homeDemoVideoReady } from './homeDemo';
import {
  SELECTED_SITES_BASE_URL,
  SELECTED_SITES_CONTACT_URL,
  SELECTED_SITES_CHECK_URLS,
} from './selectedSites';

function firstHref(source: string, className: string): string | null {
  const match = source.match(new RegExp(`href="([^"]+)"[^>]*className="[^"]*${className}`));
  if (match) return match[1];
  const flipped = source.match(new RegExp(`className="[^"]*${className}[^"]*"[^>]*href="([^"]+)"`));
  return flipped ? flipped[1] : null;
}

describe('owner-seat homepage (selected Sites is the stranger handoff)', () => {
  const home = readFileSync(resolve('src/components/HomePage.tsx'), 'utf8');
  const shell = readFileSync(resolve('src/components/HumanSiteShell.tsx'), 'utf8');
  const demo = readFileSync(resolve('src/lib/homeDemo.ts'), 'utf8');
  const config = readFileSync(resolve('next.config.js'), 'utf8');

  it('keeps the evidence-first operator model visible', () => {
    expect(home).toMatch(/The invoice you haven’t checked/);
    expect(home).toMatch(/Bring what you have/);
    expect(home).toMatch(/No inbox or Drive access is required/);
    expect(home).toMatch(/Labor cards name roles/);
    expect(home).toMatch(/Daily compare to the clock/);
    expect(home).toMatch(/punch ≠ schedule/);
  });

  it('makes the homepage primary button use the single selected Sites contact path', () => {
    expect(home).toMatch(/human-button human-button-primary/);
    expect(firstHref(home, 'human-button-primary')).toBe('/contact');
    expect(home).toMatch(/Request the free owner seat/);
    expect(home).not.toMatch(/Start playing/);
    expect(home).not.toMatch(/Try Owner desk/);
    expect(home).not.toMatch(/href="\/play"[^>]*human-button-primary/);
    expect(SELECTED_SITES_CONTACT_URL).toBe(`${SELECTED_SITES_BASE_URL}/contact`);
  });

  it('keeps the demo useful even before a hosted recording exists', () => {
    expect(home).toMatch(/id="demo"/);
    expect(home).toMatch(/homeDemoVideoReady/);
    expect(home).toMatch(/Example workflow · invoice check/);
    expect(home).toMatch(/Your records · your decision · a clear next step/);
    expect(home).toContain('/contact');
    expect(home).not.toMatch(/hosted recorded demo.*not/i);
    expect(home).not.toMatch(/Watch the recorded demo, then give your email/);
  });

  it('does not invent a broken video embed while no hosted recording exists', () => {
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

  it('routes public navigation to selected Sites while preserving the house-code and MCP separation', () => {
    expect(shell).toMatch(/Request the free owner seat/);
    expect(firstHref(shell, 'human-button-primary')).toBe('/contact');
    expect(shell).not.toMatch(/Start playing/);
    expect(shell).not.toMatch(/href="\/play"[^>]*human-button-primary/);
    expect(shell).not.toMatch(/href="\/play"[^>]*human-nav-link">Play/);
    expect(shell).not.toMatch(/human-nav-link">Owner desk/);
    expect(shell).toMatch(/SELECTED_SITES_BASE_URL/);
    expect(shell).toMatch(/href="\/check\/invoices"/);
    expect(shell).toMatch(/href="\/check\/labor"/);
    expect(shell).toMatch(/href="\/check\/menu"/);
    expect(shell).toMatch(/href="\/portal"/);
    expect(shell).toMatch(/href="\/llm-shells"/);
    expect(shell).not.toMatch(/href="\/communities"/);
  });

  it('locks the three public check handoffs to selected Sites V28', () => {
    expect(SELECTED_SITES_CHECK_URLS).toEqual({
      invoices: `${SELECTED_SITES_BASE_URL}/check/invoices`,
      labor: `${SELECTED_SITES_BASE_URL}/check/labor`,
      menu: `${SELECTED_SITES_BASE_URL}/check/menu`,
    });
    expect(config).toContain("source: '/check/invoices'");
    expect(config).toContain("source: '/check/labor'");
    expect(config).toContain("source: '/check/menu'");
  });

  it('keeps legacy owner entry as compatibility redirects instead of a second lead store', () => {
    expect(config).toContain("source: '/contact'");
    expect(config).toContain("source: '/onboard'");
    expect(config).toContain("destination: `${SELECTED_SITES_BASE_URL}/contact`");
    expect(config).toContain("source: '/login'");
    expect(config).toContain('destination: SELECTED_SITES_BASE_URL');
  });

  it('does not rewrite the homepage to open play', () => {
    expect(config).not.toMatch(/source: '\/'/);
    expect(config).toMatch(/source: '\/play'/);
    expect(config).toMatch(/destination: '\/demo\/action-shift\.html'/);
  });
});
