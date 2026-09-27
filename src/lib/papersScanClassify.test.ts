import { describe, expect, it } from 'vitest';
import { buildPapersScanGmailQuery, classifyRestaurantPaper } from './papersScanClassify';
import { PAPERS_GOOGLE_SCOPES } from './papersInbox';
import { papersGoogleScopesStayReadOnly } from './papersScanTypes';

describe('papers scan classifier', () => {
  it('keeps Google scopes read-only and bounds the Gmail query to 90 days', () => {
    expect(papersGoogleScopesStayReadOnly()).toBe(true);
    expect(PAPERS_GOOGLE_SCOPES.join(' ')).not.toMatch(/gmail\.(send|modify|compose|insert|labels)/);
    expect(PAPERS_GOOGLE_SCOPES.some((scope) => /\/auth\/drive$/.test(scope))).toBe(false);
    const query = buildPapersScanGmailQuery();
    expect(query).toMatch(/newer_than:90d/);
    expect(query).toMatch(/doordash/);
    expect(query).toMatch(/timesheet/);
    expect(query).toMatch(/recipe/);
  });

  it('classifies restaurant papers and leaves everything else out', () => {
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-z-report.txt' }).category).toBe('eod-z');
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-invoice.txt' }).category).toBe('vendor-invoice');
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-timesheet.txt' }).category).toBe('labor');
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-beer-delivery.txt' }).category).toBe('liquor-beer');
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-doordash-statement.txt' }).category).toBe('delivery-app');
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-ubereats.txt' }).category).toBe('delivery-app');
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-grubhub.txt' }).category).toBe('delivery-app');
    expect(classifyRestaurantPaper({ filename: 'FIXTURE-recipe-burger.txt' }).category).toBe('menu-recipe');
    expect(classifyRestaurantPaper({ filename: 'vacation-selfie.jpg', subject: 'cute' }).category).toBeNull();
  });

  it('marks a filename hit Verified and a body-only hit Estimated', () => {
    expect(classifyRestaurantPaper({ filename: 'DoorDash.pdf' }).honesty).toBe('Verified');
    const bodyOnly = classifyRestaurantPaper({
      filename: 'notes.txt',
      text: 'DoorDash statement\nGross Sales: $10.00',
    });
    expect(bodyOnly.category).toBe('delivery-app');
    expect(bodyOnly.honesty).toBe('Estimated');
  });
});
