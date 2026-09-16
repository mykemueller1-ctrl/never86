import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import Home from '../components/OwnerHome';
import Pricing from '../app/pricing/page';
describe('public owner experience',()=>{
 const html=renderToStaticMarkup(createElement(Home));
 it('offers three direct checks before asking for contact information',()=>{
  for(const path of ['/check/invoices','/check/labor','/check/menu'])expect(html).toContain(`href="${path}"`);
  expect(html).toContain('href="/onboard"');
  expect(html).toContain('href="/try"');
  expect(html).not.toMatch(/chatgpt\.site/);
 });
 it('renders a playable hosted demo with captions and honest disclosure',()=>{
  expect(html).toContain('/media/never86-landscape-v24.mp4');
  expect(html).toContain('kind="captions"');expect(html).toContain('Fictional sample documents');
  expect(html).not.toContain('autoplay');expect(html).not.toContain('src=""');
 });
 it('labels the sample and shows price change without promising recovered savings',()=>{
  expect(html).toContain('FICTIONAL EXAMPLE');expect(html).toContain('not money recovered');
  expect(html).toContain('16.7%');expect(html).toContain('Same product and pack');
  expect(html).toContain('$48.00');expect(html).toContain('$56.00');
 });
 it('keeps optional detail accessible and public pricing honest',()=>{
  expect(html).toContain('<details>');expect(html).toContain('Skip to the checks');
  const pricing=renderToStaticMarkup(createElement(Pricing));
  expect(pricing).toContain('not finalized');expect(pricing).not.toMatch(/199|499|fully separate database|545,677/);
 });
 it('keeps house access local and retires ChatGPT Sites redirects',()=>{
  const config=readFileSync(resolve('next.config.js'),'utf8');
  expect(config).toContain("destination: '/portal'");
  expect(config).not.toMatch(/chatgpt\.site/);
  for(const p of ['/check/invoices','/check/labor','/check/menu','/login','/onboard']) {
    expect(config).not.toContain(`source: '${p}'`);
  }
 });
});
