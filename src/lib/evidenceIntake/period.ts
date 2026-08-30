import type { PeriodEvaluation, ReportingPeriodInput } from './types';

export function evaluateReportingPeriod(period: ReportingPeriodInput): PeriodEvaluation {
  const errors: string[] = [];
  const timezone = period.timezone;
  const businessDayCutoff = period.businessDayCutoff;
  const periodStart = period.periodStart;
  const periodEnd = period.periodEnd;
  const moneyBasis = period.moneyBasis;

  if (!timezone) errors.push('missing_timezone');
  if (!businessDayCutoff) errors.push('missing_business_day_cutoff');
  if (period.expectedBusinessDays == null || period.observedBusinessDays == null) {
    errors.push('incomplete_period');
  } else if (period.observedBusinessDays < period.expectedBusinessDays) {
    errors.push('incomplete_period');
  }

  const incomplete = errors.includes('incomplete_period') || errors.includes('missing_timezone') || errors.includes('missing_business_day_cutoff');
  return {
    status: incomplete ? 'Open' : 'Closed',
    evidenceState: incomplete ? 'Missing Evidence' : 'Unverified',
    timezone,
    businessDayCutoff,
    periodStart,
    periodEnd,
    moneyBasis,
    errors,
  };
}
