import { vi } from 'vitest';

// A minimal stand-in for the Drizzle query builder. Results are keyed by the
// table object passed to insert()/update()/from(), so a single route handler
// can run several queries and get different rows back per table.
//
// Each chain method is a vi.fn, so tests can assert on calls — e.g. that the
// invoices GET applies a `.where(...)` user filter:
//   db.select.mock.results[0].value.where  // the spy
export type TableResults = Map<unknown, unknown>;

export function createDbMock(results: TableResults = new Map()) {
  const resolveFor = (table: unknown) =>
    Promise.resolve(results.has(table) ? results.get(table) : []);

  const insert = vi.fn((table: unknown) => {
    const builder: any = {
      values: vi.fn(() => builder),
      onConflictDoNothing: vi.fn(() => builder),
      returning: vi.fn(() => resolveFor(table)),
    };
    return builder;
  });

  const update = vi.fn((table: unknown) => {
    const builder: any = {
      set: vi.fn(() => builder),
      where: vi.fn(() => resolveFor(table)),
    };
    return builder;
  });

  const select = vi.fn(() => {
    let table: unknown;
    const builder: any = {
      from: vi.fn((t: unknown) => {
        table = t;
        return builder;
      }),
      orderBy: vi.fn(() => builder),
      limit: vi.fn(() => resolveFor(table)),
      where: vi.fn(() => resolveFor(table)),
      // Make `await db.select().from(table)` resolve (no terminal method).
      then: (onFulfilled: any, onRejected: any) =>
        resolveFor(table).then(onFulfilled, onRejected),
    };
    return builder;
  });

  return { insert, update, select };
}

export function makeJsonRequest(body: unknown): any {
  return {
    json: async () => body,
    headers: new Headers(),
    nextUrl: new URL('http://localhost/'),
  };
}

export function makeGetRequest(
  options: { searchParams?: Record<string, string>; headers?: Record<string, string> } = {},
): any {
  const url = new URL('http://localhost/');
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }
  return {
    json: async () => ({}),
    headers: new Headers(options.headers ?? {}),
    nextUrl: url,
  };
}
