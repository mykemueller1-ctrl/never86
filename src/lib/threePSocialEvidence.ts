export type PublicSignal = {
  id: string;
  platform: 'Facebook' | 'TikTok' | 'LinkedIn';
  date: string;
  classification: 'Direct operator voice' | 'Carried operator case' | 'Corroborating mechanism';
  issue: string;
  sourceUrl: string;
  evidenceLimit: string;
};

export const THREE_P_PUBLIC_SIGNALS: PublicSignal[] = [
  { id: 'D1', platform: 'Facebook', date: '2026-08-14', classification: 'Direct operator voice', issue: 'Refund and dispute evidence', sourceUrl: 'https://www.facebook.com/permalink.php?story_fbid=pfbid02ELp12tmjqFexew6DyDYNLwzxup1ytELpu1yAub3GUjch74KVFAkT3qcwHGzaAc2dl&id=100063718736691', evidenceLimit: 'Public restaurant-origin post; statement and bank outcome were not independently audited.' },
  { id: 'D2', platform: 'Facebook', date: '2026-08-15', classification: 'Direct operator voice', issue: 'Refund ownership and direct-order workflow', sourceUrl: 'https://www.facebook.com/permalink.php?story_fbid=pfbid02ELp12tmjqFexew6DyDYNLwzxup1ytELpu1yAub3GUjch74KVFAkT3qcwHGzaAc2dl&id=100063718736691&comment_id=1671552457863784', evidenceLimit: 'First-person operator comment; no platform statement or contract was reviewed.' },
  { id: 'D3', platform: 'Facebook', date: '2026-08-14', classification: 'Direct operator voice', issue: 'Delivery-channel contribution economics', sourceUrl: 'https://www.facebook.com/groups/748711238658025/posts/3092461217616337/', evidenceLimit: 'First-person operator account; percentages and restaurant identity were not independently audited.' },
  { id: 'D4', platform: 'Facebook', date: '2026-08-17', classification: 'Direct operator voice', issue: 'Channel exit and direct-order economics', sourceUrl: 'https://www.facebook.com/eatlocalbread', evidenceLimit: 'Named restaurant-origin source page; the attributed cost figure was not independently audited.' },
  { id: 'C1', platform: 'LinkedIn', date: '2026-08-15', classification: 'Carried operator case', issue: 'Dispute and account-control workflow', sourceUrl: 'https://www.linkedin.com/feed/update/urn:li:share:7494482828622041088/', evidenceLimit: 'Public operator-side case; underlying account history and statement were not supplied.' },
  { id: 'C2', platform: 'TikTok', date: '2026-08-14', classification: 'Carried operator case', issue: 'Payout hold and verification', sourceUrl: 'https://www.tiktok.com/@dan_onthestreet/video/7674045787092864270', evidenceLimit: 'Media-carried operator case; no independent conclusion about residual disputed amounts.' },
  { id: 'C3', platform: 'TikTok', date: '2026-08-18', classification: 'Carried operator case', issue: 'Channel-switch economics', sourceUrl: 'https://www.tiktok.com/@getsaucedelivery/video/7675396950987934990', evidenceLimit: 'Vendor-carried restaurant case; useful demand signal, not an independent savings study.' },
  { id: 'M1', platform: 'TikTok', date: '2026-08-14', classification: 'Corroborating mechanism', issue: 'POS-to-statement-to-deposit reconciliation', sourceUrl: 'https://www.tiktok.com/@fixeforrestaurants/video/7673979537109093645', evidenceLimit: 'Restaurant-finance specialist mechanism evidence, not an operator complaint.' },
  { id: 'M2', platform: 'LinkedIn', date: '2026-08-14', classification: 'Corroborating mechanism', issue: 'Fee structure and margin pressure', sourceUrl: 'https://www.linkedin.com/company/nova-one-advisory/posts/', evidenceLimit: 'Advisory-market signal, not a restaurant statement or audited loss case.' },
  { id: 'M3', platform: 'LinkedIn', date: '2026-08-16', classification: 'Corroborating mechanism', issue: 'Net-deposit accounting and payout reconciliation', sourceUrl: 'https://www.linkedin.com/in/chriskachmar/', evidenceLimit: 'Finance-specialist explanation; not an allegation against a specific marketplace.' },
  { id: 'M4', platform: 'LinkedIn', date: '2026-08-14', classification: 'Corroborating mechanism', issue: 'Marketplace cost-stack economics', sourceUrl: 'https://www.linkedin.com/in/lathashishagarwal/', evidenceLimit: 'Platform-side perspective supporting the multi-line economics mechanism.' },
  { id: 'M5', platform: 'LinkedIn', date: '2026-08-14', classification: 'Corroborating mechanism', issue: 'Payout matching and marketplace availability drift', sourceUrl: 'https://www.linkedin.com/in/jamescrook1/', evidenceLimit: 'Automation-vendor workflow thesis, not an operator-origin loss case.' },
  { id: 'M6', platform: 'LinkedIn', date: '2026-08-18', classification: 'Corroborating mechanism', issue: 'Promotion control and payout workflow', sourceUrl: 'https://www.linkedin.com/company/kitchenhub-app/posts/', evidenceLimit: 'Competitive vendor claim included only as market-demand evidence.' },
];

export const PUBLIC_SIGNAL_METHOD = {
  window: '2026-08-14/2026-08-20',
  included: ['Publicly visible during the window', 'Restaurant-side third-party delivery economics or control', 'Unique after deduplication', 'Source attribution preserved'],
  excluded: ['Consumer-only or driver-only posts', 'Stale material outside the window', 'Generic restaurant-margin content without a 3P link', "Never86'd's own posts", 'Duplicate reshares', 'Unsupported legal or recovery claims'],
};
