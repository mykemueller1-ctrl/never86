const SITE = 'https://www.never86.ai';
const HOST = 'www.never86.ai';
const KEY = '2bcfd745c9385c6698839a64adf67e5e';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

function urlsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function getPublicUrls() {
  const response = await fetch(`${SITE}/sitemap.xml`, { headers: { 'user-agent': 'Never86-IndexNow/1.0' } });
  if (!response.ok) throw new Error(`Sitemap request failed with ${response.status}`);
  return urlsFromSitemap(await response.text());
}

function selectChangedUrls(allUrls, changedFiles) {
  if (changedFiles.some((file) => ['src/app/layout.tsx', 'src/app/sitemap.ts', 'src/app/robots.ts'].includes(file))) return allUrls;

  const selected = new Set();
  for (const file of changedFiles) {
    if (/src\/lib\/(operatorAnswers|threePEvidenceAnswers|answersDb)\./.test(file) || file.includes('src/app/answers/[slug]')) {
      allUrls.filter((url) => url.includes('/answers/')).forEach((url) => selected.add(url));
    }
    if (file.includes('threePSocialEvidence') || file.includes('research/3p-operator-signal')) {
      selected.add(`${SITE}/research/3p-operator-signal-august-2026`);
      selected.add(`${SITE}/research/3p-operator-signal-august-2026/data.json`);
    }
    if (file.includes('delivery-marketplace-reconciliation')) selected.add(`${SITE}/delivery-marketplace-reconciliation`);
    if (file.includes('evidence-standard')) selected.add(`${SITE}/evidence-standard`);
    if (file.includes('llms.txt')) selected.add(`${SITE}/llms.txt`);
    if (file.includes('llms-full.txt')) selected.add(`${SITE}/llms-full.txt`);
    if (file.includes('answers/feed.xml')) selected.add(`${SITE}/answers/feed.xml`);

    const match = file.match(/^src\/app\/(.+)\/page\.tsx$/);
    if (match && !match[1].includes('[')) selected.add(`${SITE}/${match[1]}`);
    if (file === 'src/app/page.tsx' || file === 'src/components/HomePage.tsx') selected.add(`${SITE}/`);
  }
  return [...selected].filter((url) => url.startsWith(SITE));
}

const allUrls = await getPublicUrls();
const changedFiles = (process.env.CHANGED_FILES ?? '').split('\n').map((file) => file.trim()).filter(Boolean);
const explicitUrls = (process.env.INDEXNOW_URLS ?? '').split(/[\s,]+/).filter(Boolean);
const urlList = explicitUrls.length ? explicitUrls : selectChangedUrls(allUrls, changedFiles);

if (!urlList.length) {
  console.log('No public URL changes to submit.');
  process.exit(0);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow rejected the submission with ${response.status}: ${await response.text()}`);
}

console.log(`Submitted ${urlList.length} changed URL${urlList.length === 1 ? '' : 's'} to IndexNow (${response.status}).`);
