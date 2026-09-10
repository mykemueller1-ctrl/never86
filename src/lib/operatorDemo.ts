/** Fictional public demo data. No customer files or backend services are used. */
export const DEMO_RESTAURANT = 'Cedar & Salt';
export const DEMO_VENDOR = 'Hilltop Food Supply';

export type DemoInvoiceLine = {
  sku: string;
  vendor: string;
  casePrice: number;
  poundsPerCase: number;
  cases: number;
};

export const PREVIOUS_DEMO_INVOICE: DemoInvoiceLine = {
  sku: 'CHZ-600', vendor: DEMO_VENDOR, casePrice: 72, poundsPerCase: 30, cases: 2,
};
export const CURRENT_DEMO_INVOICE: DemoInvoiceLine = {
  ...PREVIOUS_DEMO_INVOICE, casePrice: 78,
};

function positive(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function compareDemoInvoices(previous: DemoInvoiceLine, current: DemoInvoiceLine) {
  if (!previous.sku || previous.sku !== current.sku || previous.vendor !== current.vendor) return null;
  if (![previous.casePrice, previous.poundsPerCase, previous.cases,
    current.casePrice, current.poundsPerCase, current.cases].every(positive)) return null;
  const previousUnitPrice = previous.casePrice / previous.poundsPerCase;
  const currentUnitPrice = current.casePrice / current.poundsPerCase;
  const unitDifference = currentUnitPrice - previousUnitPrice;
  // Compare the same weight, even when the case size changes.
  const equivalentCaseDifference = unitDifference * current.poundsPerCase;
  const percentChange = unitDifference / previousUnitPrice * 100;
  const currentOrderDifference = equivalentCaseDifference * current.cases;
  const currentInvoiceTotal = current.casePrice * current.cases;
  if (![previousUnitPrice, currentUnitPrice, unitDifference, equivalentCaseDifference,
    percentChange, currentOrderDifference, currentInvoiceTotal].every(Number.isFinite)) return null;
  return {
    previousUnitPrice, currentUnitPrice, unitDifference,
    percentChange,
    equivalentCaseDifference,
    currentOrderDifference, currentInvoiceTotal,
  };
}

export type DemoShift = { start: string; end: string; nextDay: boolean; unpaidBreakMinutes: number };

function minutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function demoPaidMinutes(shift: DemoShift) {
  const start = minutes(shift.start);
  const end = minutes(shift.end);
  if (start === null || end === null || !Number.isFinite(shift.unpaidBreakMinutes) || shift.unpaidBreakMinutes < 0) return null;
  const elapsed = end + (shift.nextDay ? 1440 : 0) - start;
  if (elapsed < 0 || elapsed > 1440 || shift.unpaidBreakMinutes > elapsed) return null;
  return elapsed - shift.unpaidBreakMinutes;
}

export function compareDemoShifts(planned: DemoShift, actual: DemoShift, hourlyWage?: number) {
  const plannedMinutes = demoPaidMinutes(planned);
  const actualMinutes = demoPaidMinutes(actual);
  if (plannedMinutes === null || actualMinutes === null) return null;
  const differenceMinutes = actualMinutes - plannedMinutes;
  const wageKnown = hourlyWage !== undefined && positive(hourlyWage);
  const wageDifference = wageKnown ? differenceMinutes / 60 * hourlyWage : null;
  return {
    plannedMinutes, actualMinutes, differenceMinutes,
    wageDifference: wageDifference !== null && Number.isFinite(wageDifference) ? wageDifference : null,
  };
}

export function calculateDemoPour(bottleCost: number, bottleMl: number, pourOz: number) {
  if (![bottleCost, bottleMl, pourOz].every(positive)) return null;
  const pourMl = pourOz * 29.5735295625;
  if (pourMl > bottleMl) return null;
  const costPerPour = bottleCost * (pourMl / bottleMl);
  const theoreticalPours = bottleMl / pourMl;
  if (![costPerPour, theoreticalPours, pourMl].every(Number.isFinite)) return null;
  return { costPerPour, theoreticalPours, pourMl };
}

export type DemoTopic = 'invoices' | 'labor' | 'pours';
export type DemoDraft = {
  topic: DemoTopic;
  title: string;
  evidence: string;
  owner: 'Alex · sample manager' | 'Riley · sample owner';
  dueDay: string;
  dueTime: string;
  proof: string;
  question?: string;
};
