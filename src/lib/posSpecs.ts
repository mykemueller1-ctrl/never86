// Per-POS landing page spec. Used by /connect/[pos] dynamic route.
// Each POS gets its own page so an operator searching "never86 toast"
// or "never86 square" lands on a page that tells them exactly which
// export to grab, the column shape we expect, and the agents that
// work on it.

export type PosSpec = {
  slug: string;
  name: string;
  tagline: string;
  status: 'csv' | 'oauth-coming' | 'oauth-live';
  oauthEta: string;
  agents: Array<{
    slug: 'void-hunter' | 'leak-detector' | 'labor-drift' | 'tip-variance' | 'catering-leak';
    label: string;
    exportName: string;
    columns: string[];
    sampleHref: string;
  }>;
  partnerApplyUrl?: string;
};

export const POS_SPECS: Record<string, PosSpec> = {
  toast: {
    slug: 'toast',
    name: 'Toast',
    tagline: 'Drop a Toast export. See your read in 30 seconds. OAuth in approval.',
    status: 'csv',
    oauthEta: 'Toast Partner Connect approval pending · 2-4 weeks',
    agents: [
      {
        slug: 'void-hunter',
        label: 'Void Hunter',
        exportName: 'Employee Performance Summary',
        columns: ['Location', 'Employee', 'Net Sales', 'Void Amount'],
        sampleHref: '/trial?agent=void',
      },
      {
        slug: 'leak-detector',
        label: 'Leak Detector',
        exportName: 'Sales Detail (per-ticket)',
        columns: ['Location', 'Employee', 'Ticket Total', 'Tender', 'Void Amount', 'Comp Amount', 'Discount Amount', 'Closed At'],
        sampleHref: '/trial?agent=leak',
      },
      {
        slug: 'labor-drift',
        label: 'Labor Drift',
        exportName: 'Toast Payroll · Time Worked Detail',
        columns: ['Location', 'Employee', 'Scheduled Start', 'Scheduled End', 'Clock In', 'Clock Out', 'Net Sales', 'Wage Rate'],
        sampleHref: '/trial?agent=labor',
      },
      {
        slug: 'tip-variance',
        label: 'Tip Variance',
        exportName: 'Toast Payouts · Weekly Tip Summary',
        columns: ['Location', 'Employee', 'Week', 'Net Sales', 'Net Tips'],
        sampleHref: '/trial?agent=tips',
      },
      {
        slug: 'catering-leak',
        label: 'Catering Leak',
        exportName: 'Catering Reconciliation (invoice vs POS)',
        columns: ['Location', 'Customer', 'Invoice Amount', 'POS Amount', 'Order ID', 'Event Date'],
        sampleHref: '/trial?agent=catering',
      },
    ],
    partnerApplyUrl: 'https://pos.toasttab.com/integration/become-a-partner',
  },
  square: {
    slug: 'square',
    name: 'Square',
    tagline: 'Square Developer OAuth is open access. Drop a CSV today, full OAuth landing soon.',
    status: 'csv',
    oauthEta: 'Square dev-account OAuth in build · ~1 week',
    agents: [
      {
        slug: 'void-hunter',
        label: 'Void Hunter',
        exportName: 'Team Sales Report',
        columns: ['Location Name', 'Team Member', 'Net Sales', 'Refunds', 'Items Voided'],
        sampleHref: '/trial?agent=void',
      },
      {
        slug: 'leak-detector',
        label: 'Leak Detector',
        exportName: 'Transactions Report (per-payment)',
        columns: ['Location', 'Team Member', 'Total Amount', 'Tender Type', 'Refund Amount', 'Discount Amount'],
        sampleHref: '/trial?agent=leak',
      },
      {
        slug: 'tip-variance',
        label: 'Tip Variance',
        exportName: 'Tips Report · weekly',
        columns: ['Location', 'Team Member', 'Week', 'Net Sales', 'Tips Collected'],
        sampleHref: '/trial?agent=tips',
      },
    ],
    partnerApplyUrl: 'https://developer.squareup.com/',
  },
  clover: {
    slug: 'clover',
    name: 'Clover',
    tagline: 'Drop a Clover Reports export. CSV agents run today; OAuth on the roadmap.',
    status: 'csv',
    oauthEta: 'Clover Marketplace OAuth · evaluating timeline',
    agents: [
      {
        slug: 'void-hunter',
        label: 'Void Hunter',
        exportName: 'Employee Sales · Reports',
        columns: ['Store', 'Employee Name', 'Net Total', 'Refunded', 'Voids ($)', 'Voids (#)'],
        sampleHref: '/trial?agent=void',
      },
      {
        slug: 'leak-detector',
        label: 'Leak Detector',
        exportName: 'Transactions Export',
        columns: ['Store', 'Employee', 'Total', 'Tender', 'Refund', 'Discount'],
        sampleHref: '/trial?agent=leak',
      },
    ],
  },
  pdq: {
    slug: 'pdq',
    name: 'PDQ POS',
    tagline: 'Drop a PDQ employee report. Header aliases auto-detected.',
    status: 'csv',
    oauthEta: 'PDQ enterprise integration · custom partner cycle',
    agents: [
      {
        slug: 'void-hunter',
        label: 'Void Hunter',
        exportName: 'Employee Report · Sales by Cashier',
        columns: ['Site', 'Cashier Name', 'Period Net', 'Period Gross', 'Voided Sales', 'Void Count'],
        sampleHref: '/trial?agent=void',
      },
    ],
  },
  aloha: {
    slug: 'aloha',
    name: 'NCR Aloha',
    tagline: 'Drop an Aloha report export today. Aloha enterprise OAuth in motion.',
    status: 'csv',
    oauthEta: 'NCR Aloha enterprise partner cycle · 1-2 months',
    agents: [
      {
        slug: 'void-hunter',
        label: 'Void Hunter',
        exportName: 'Employee Sales Detail',
        columns: ['Store', 'Employee', 'Net Sales', 'Void Total'],
        sampleHref: '/trial?agent=void',
      },
      {
        slug: 'leak-detector',
        label: 'Leak Detector',
        exportName: 'Order Detail (per-check)',
        columns: ['Store', 'Server', 'Check Total', 'Tender', 'Void Amount', 'Comp Amount'],
        sampleHref: '/trial?agent=leak',
      },
    ],
  },
  lightspeed: {
    slug: 'lightspeed',
    name: 'Lightspeed Restaurant',
    tagline: 'Drop a Lightspeed Reports export. Open OAuth coming · ~1 week.',
    status: 'csv',
    oauthEta: 'Lightspeed dev OAuth · 1-2 weeks after dev-account approval',
    agents: [
      {
        slug: 'void-hunter',
        label: 'Void Hunter',
        exportName: 'Server Sales Report',
        columns: ['Location', 'Server', 'Net Sales', 'Voids'],
        sampleHref: '/trial?agent=void',
      },
      {
        slug: 'tip-variance',
        label: 'Tip Variance',
        exportName: 'Tip Report · weekly',
        columns: ['Location', 'Server', 'Week', 'Net Sales', 'Tips'],
        sampleHref: '/trial?agent=tips',
      },
    ],
    partnerApplyUrl: 'https://www.lightspeedhq.com/partners/',
  },
};

export const POS_ORDER = ['toast', 'square', 'clover', 'pdq', 'aloha', 'lightspeed'] as const;

export function getPosSpec(slug: string): PosSpec | undefined {
  return POS_SPECS[slug];
}
