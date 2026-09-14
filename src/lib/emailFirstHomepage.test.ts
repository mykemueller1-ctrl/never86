import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import Home from '../components/OwnerHome';
import Pricing from '../app/pricing/page';
import {SELECTED_SITES_BASE_URL} from './selectedSites';
describe('public owner experience',()=>{
 const html=renderToStaticMarkup(createElement(Home));
 it('offers three direct checks before asking for contact information',()=>{
  for(const path of ['/check/invoices','/check/labor','/check/menu'])expect(html).toContain(`href="${path}"`);
  expect(html.indexOf('id="checks"')).toBeLessThan(html.indexOf('href="/contact"'));
  expect(html).toContain(`${SELECTED_SITES_BASE_URL}/seat`);
 });
 it('renders a playable hosted demo with captions and honest disclosure',()=>{
  expect(html).toContain('/media/never86-landscape-v24.mp4');
  expect(html).toContain('kind="captions"');expect(html).toContain('Fictional sample documents');
  expect(html).not.toContain('autoplay');expect(html).not.toContain('src=""');
 });
 it('labels the sample and shows price change without promising recovered savings',()=>{
  expect(html).toContain('FICTIONAL EXAMPLE');expect(html).toContain('not money recovered');
  expect(html).toContain('15.8%');expect(html).toContain('same product and pack');
 });
 it('keeps optional detail accessible and public pricing honest',()=>{
  expect(html).toContain('<details>');expect(html).toContain('Skip to the checks');
  const pricing=renderToStaticMarkup(createElement(Pricing));
  expect(pricing).toContain('not finalized');expect(pricing).not.toMatch(/199|499|fully separate database|545,677/);
 });
 it('retains selected Sites handoffs and separate house access',()=>{
  const config=readFileSync(resolve('next.config.js'),'utf8');
  for(const p of ['/contact','/check/invoices','/check/labor','/check/menu'])expect(config).toContain(`source: '${p}'`);
  expect(config).toContain("destination: '/portal'");
 });
});
