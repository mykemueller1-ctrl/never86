import { findColumn, norm, parseCsv } from './csv/core';

export const ACTION_SHIFT_PAYROLL_TEMPLATE = [
  'File Number,First Name,Last Name,Job Title,Status,SSN,Pay Rate',
  '1001,Example,Manager,Manager,Active,000-00-0000,0',
  '1002,Example,Cook,Line Cook,Active,000-00-0000,0',
  '1003,Example,Former,Server,Terminated,000-00-0000,0',
].join('\n');

export type PayrollRosterNormalization =
  | {
      ok: true;
      csv: string;
      source: 'roster' | 'payroll';
      droppedHeaders: string[];
      rowCount: number;
    }
  | { ok: false; error: string; droppedHeaders: string[] };

const PII_HEADER_TOKENS = [
  'ssn',
  'social',
  'itin',
  'sin',
  'dob',
  'birth',
  'bank',
  'routing',
  'account',
  'wage',
  'salary',
  'payrate',
  'hourlyrate',
  'email',
  'phone',
  'mobile',
  'address',
  'street',
  'zip',
  'postal',
];

const ID_ALIASES = [
  'external_worker_id',
  'employee_id',
  'employee id',
  'file_number',
  'file number',
  'file no',
  'worker_id',
  'associate_id',
  'associate id',
  'payroll_id',
  'payroll id',
  'clock_id',
  'time_clock_id',
  'badge_id',
  'person_number',
  'personnel_number',
  'employee_number',
  'eeid',
  'emplid',
];

const FULL_NAME_ALIASES = [
  'display_name',
  'employee_name',
  'full_name',
  'worker_name',
  'associate_name',
  'employee',
  'name',
];

const FIRST_NAME_ALIASES = ['first_name', 'firstname', 'given_name', 'preferred_first_name'];
const LAST_NAME_ALIASES = ['last_name', 'lastname', 'surname', 'family_name'];
const ROLE_ALIASES = ['role_key', 'job_title', 'job title', 'position_title', 'position', 'title', 'job', 'role'];
const STATUS_ALIASES = ['status', 'employee_status', 'employment_status', 'worker_status', 'pay_status'];

const ACTIVE_STATUS = new Set(['active', 'a', 'current', 'employed', 'yes', 'y', 'true', '1']);

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function exactHeader(headers: string[], aliases: string[]): number {
  const lc = headers.map(norm);
  for (const alias of aliases) {
    const wanted = norm(alias);
    const index = lc.findIndex((header) => header === wanted);
    if (index >= 0) return index;
  }
  return -1;
}

function isPiiHeader(header: string): boolean {
  const token = norm(header);
  return PII_HEADER_TOKENS.some((pii) => token === pii || token.includes(pii));
}

function piiHeaders(headers: string[]): string[] {
  return headers.filter(isPiiHeader);
}

function cell(row: string[], index: number): string {
  return index >= 0 ? (row[index] ?? '').trim() : '';
}

function displayNameFromRow(row: string[], fullName: number, firstName: number, lastName: number): string {
  const combined = cell(row, fullName);
  if (combined) return combined;
  const first = cell(row, firstName);
  const last = cell(row, lastName);
  return [first, last].filter(Boolean).join(' ');
}

function canonicalStatus(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) return '';
  return ACTIVE_STATUS.has(normalized) ? 'active' : 'inactive';
}

function isRosterContract(headers: string[]): boolean {
  const id = findColumn(headers, ['external_worker_id', 'worker_id', 'employee_id', 'user_id']);
  const name = findColumn(headers, ['display_name', 'employee_name', 'worker_name', 'name'], ['first', 'last', 'status', 'id']);
  const role = findColumn(headers, ['role_key', 'role', 'job', 'position']);
  const status = findColumn(headers, ['status', 'employee_status', 'worker_status']);
  return id >= 0 && name >= 0 && role >= 0 && status >= 0;
}

function findPayrollId(headers: string[]): number {
  const exact = exactHeader(headers, ID_ALIASES);
  if (exact >= 0 && !isPiiHeader(headers[exact])) return exact;
  const fuzzy = findColumn(headers, ID_ALIASES, ['ssn', 'social', 'itin', 'tax', 'ein']);
  return fuzzy >= 0 && !isPiiHeader(headers[fuzzy]) ? fuzzy : -1;
}

export function isPayrollCensus(headers: string[]): boolean {
  if (headers.length === 0) return false;
  if (isRosterContract(headers)) return false;
  const id = findPayrollId(headers);
  const fullName = exactHeader(headers, FULL_NAME_ALIASES);
  const firstName = exactHeader(headers, FIRST_NAME_ALIASES);
  const lastName = exactHeader(headers, LAST_NAME_ALIASES);
  const role = findColumn(headers, ROLE_ALIASES, ['status']);
  const hasName = fullName >= 0 || (firstName >= 0 && lastName >= 0);
  return id >= 0 && hasName && role >= 0;
}

export function normalizePayrollRosterCsv(input: string): PayrollRosterNormalization {
  const droppedHeaders = piiHeaders(parseCsv(input).headers);
  const parsed = parseCsv(input);
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return { ok: false, error: 'Payroll CSV has no data rows.', droppedHeaders };
  }

  if (isRosterContract(parsed.headers)) {
    return {
      ok: true,
      csv: input.trim(),
      source: 'roster',
      droppedHeaders,
      rowCount: parsed.rows.length,
    };
  }

  if (!isPayrollCensus(parsed.headers)) {
    return {
      ok: false,
      error: 'Not a payroll census. Need an employee/file ID, a name (or first + last), and a job/title column. Names alone are not an identity key.',
      droppedHeaders,
    };
  }

  const idIndex = findPayrollId(parsed.headers);
  const fullName = exactHeader(parsed.headers, FULL_NAME_ALIASES);
  const firstName = exactHeader(parsed.headers, FIRST_NAME_ALIASES);
  const lastName = exactHeader(parsed.headers, LAST_NAME_ALIASES);
  const roleIndex = findColumn(parsed.headers, ROLE_ALIASES, ['status']);
  const statusIndex = findColumn(parsed.headers, STATUS_ALIASES);

  const lines = ['external_worker_id,display_name,role_key,status'];
  parsed.rows.forEach((row) => {
    const externalWorkerId = cell(row, idIndex);
    const displayName = displayNameFromRow(row, fullName, firstName, lastName);
    const roleKey = cell(row, roleIndex);
    const status = canonicalStatus(cell(row, statusIndex) || 'active');
    lines.push([externalWorkerId, displayName, roleKey, status].map(csvCell).join(','));
  });

  return {
    ok: true,
    csv: lines.join('\n'),
    source: 'payroll',
    droppedHeaders,
    rowCount: parsed.rows.length,
  };
}
