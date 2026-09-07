import cadenceJson from '../../config/ctap-vendor-cadence.json';

export const CTAP_VENDOR_CADENCE_PATH = 'config/ctap-vendor-cadence.json';

export type VendorCadenceDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type VendorCadenceFrequency =
  | 'weekly'
  | 'twice-weekly'
  | 'every-other-week'
  | 'frequent'
  | 'varies';
export type VendorCadenceCapture = 'photo' | 'email';

export type VendorCadenceVendor = {
  id: string;
  label: string;
  aliases: readonly string[];
  days: readonly VendorCadenceDay[];
  frequency: VendorCadenceFrequency;
  capture: readonly VendorCadenceCapture[];
  notes: readonly string[];
  missingNudge: string;
};

export type VendorCadenceConfig = {
  id: string;
  store: string;
  timezone: string;
  customizable: true;
  boundary: {
    notPaymentWorkflow: true;
    notLivePurchaseOrder: true;
    noInventedDollars: true;
    noCo2Lecture: true;
    missingIsForgetToSnap: true;
  };
  vendors: readonly VendorCadenceVendor[];
};

const WEEKDAY_SHORT: readonly VendorCadenceDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function asVendor(row: (typeof cadenceJson.vendors)[number]): VendorCadenceVendor {
  return {
    id: row.id,
    label: row.label,
    aliases: row.aliases,
    days: row.days as VendorCadenceDay[],
    frequency: row.frequency as VendorCadenceFrequency,
    capture: row.capture as VendorCadenceCapture[],
    notes: row.notes,
    missingNudge: row.missingNudge,
  };
}

export const CTAP_VENDOR_CADENCE: VendorCadenceConfig = {
  id: cadenceJson.id,
  store: cadenceJson.store,
  timezone: cadenceJson.timezone,
  customizable: true,
  boundary: {
    notPaymentWorkflow: true,
    notLivePurchaseOrder: true,
    noInventedDollars: true,
    noCo2Lecture: true,
    missingIsForgetToSnap: true,
  },
  vendors: cadenceJson.vendors.map(asVendor),
};

function normalizeVendorName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function matchVendorCadence(name: string): VendorCadenceVendor | undefined {
  const needle = normalizeVendorName(name);
  if (!needle) return undefined;
  return CTAP_VENDOR_CADENCE.vendors.find((vendor) => {
    const labels = [vendor.label, vendor.id, ...vendor.aliases].map(normalizeVendorName);
    return labels.some((label) => label === needle || label.includes(needle) || needle.includes(label));
  });
}

export function weekdayShortInTimezone(now = new Date(), timeZone = CTAP_VENDOR_CADENCE.timezone): VendorCadenceDay {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone }).format(now);
  return (WEEKDAY_SHORT.find((day) => day === weekday) ?? 'Mon') as VendorCadenceDay;
}

/** Soft babysit only. Never accuses they did not order. */
export function missingInvoiceNudge(vendorName: string): string {
  const vendor = matchVendorCadence(vendorName);
  return vendor?.missingNudge ?? 'Forget to snap the ticket? Missing paper is Missing — not “you didn’t order.”';
}

export function vendorsExpectedOn(day: VendorCadenceDay): VendorCadenceVendor[] {
  return CTAP_VENDOR_CADENCE.vendors.filter((vendor) => vendor.days.includes(day));
}

export function vendorBabysitLine(input: { question: string; weekday?: VendorCadenceDay }): string | null {
  const named = CTAP_VENDOR_CADENCE.vendors.find((vendor) => {
    const hay = input.question.toLowerCase();
    return [vendor.label, vendor.id, ...vendor.aliases].some((alias) => hay.includes(alias.toLowerCase()));
  });
  if (named) return named.missingNudge;

  const day = input.weekday ?? weekdayShortInTimezone();
  const today = vendorsExpectedOn(day);
  if (today.length === 0) return null;
  const names = today.map((vendor) => vendor.label).join(', ');
  return `Today is usually ${names}. Forget to snap the ticket? Not a claim you skipped the order.`;
}
