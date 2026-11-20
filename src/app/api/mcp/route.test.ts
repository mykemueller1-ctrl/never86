import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET, POST } from './route';
import { MCP_PUBLIC_TOOLS } from '@/lib/mcpPublicContract';

describe('public MCP route', () => {
  it('discovers the shared read-only tool contract', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.endpoint).toBe('https://www.never86.ai/api/mcp');
    expect(body.tools.map((tool: { name: string }) => tool.name)).toEqual(
      MCP_PUBLIC_TOOLS.map((tool) => tool.name),
    );
  });

  it('lists tools with READ-ONLY annotations only', async () => {
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }));
    const body = await response.json();
    expect(body.result.tools).toHaveLength(MCP_PUBLIC_TOOLS.length);
    for (const tool of body.result.tools) {
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.annotations.destructiveHint).toBe(false);
    }
  });

  it('exposes knowledge tools first, then Payroll / Prices / Process / beverage / UoM / recipe analysis', () => {
    expect(MCP_PUBLIC_TOOLS.map((tool) => tool.name)).toEqual([
      'get_operator_system',
      'get_operator_logic',
      'get_3p_audit_logic',
      'list_answers',
      'list_free_agents',
      'list_agent_jobs',
      'list_specialists',
      'analyze_labor',
      'analyze_beverage',
      'convert_uom',
      'ask_pour_standards',
      'declare_pour_standards',
      'ask_fountain_standards',
      'analyze_recipe_cost',
      'analyze_vendor_prices',
      'build_action_shift',
    ]);
  });

  it('returns the operator system from get_operator_system', async () => {
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: { name: 'get_operator_system', arguments: {} },
      }),
    }));
    const body = await response.json();
    const text = body.result.content[0].text as string;
    expect(text).toContain('"version"');
    expect(text).toContain('Find the leak. Assign the fix. Keep the receipt.');
    expect(text).toContain('Memory Curator');
  });

  it('lists one-agent-one-job registry without private store data', async () => {
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'list_agent_jobs', arguments: { team: 'store' } },
      }),
    }));
    const body = await response.json();
    const text = body.result.content[0].text as string;
    expect(text).toContain('supervisor');
    expect(text).toContain('"id": "memory"');
    expect(text).not.toMatch(/karlee|sturtz|\$1,000\.00/i);
  });

  it('lists specialists and serves specialist_brief prompt', async () => {
    const listed = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: { name: 'list_specialists', arguments: {} },
      }),
    }));
    const listedBody = await listed.json();
    const listedText = listedBody.result.content[0].text as string;
    expect(listedText).toContain('labor');
    expect(listedText).toContain('voids');
    expect(listedText).toContain('never86://specialist/labor');
    expect(listedText).not.toContain('design-qa');

    const prompt = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 13,
        method: 'prompts/get',
        params: { name: 'specialist_brief', arguments: { specialist_id: 'labor' } },
      }),
    }));
    const promptBody = await prompt.json();
    expect(promptBody.result.messages[0].content.text).toMatch(/ONE JOB/);
    expect(promptBody.result.messages[0].content.text).toMatch(/analyze_labor/);
  });

  it('analyzes beverage CSV as Unverified without theft language', async () => {
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 14,
        method: 'tools/call',
        params: {
          name: 'analyze_beverage',
          arguments: {
            csv: 'Location,Category,Consumed,Poured,UnitPrice\nDemo,Beer,10,8,4',
          },
        },
      }),
    }));
    const body = await response.json();
    const text = body.result.content[0].text as string;
    expect(text).toContain('Unverified');
    expect(text).toMatch(/No count/i);
    expect(text.toLowerCase()).not.toContain('theft');
  });

  it('analyzes operator-provided vendor pricing as Unverified', async () => {
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'analyze_vendor_prices',
          arguments: {
            csv: 'Vendor,SKU,Period,UnitPrice\nSysco,Chicken,2026-07,50\nSysco,Chicken,2026-08,54',
          },
        },
      }),
    }));
    const body = await response.json();
    const text = body.result.content[0].text as string;
    expect(text).toContain('Unverified');
    expect(text).toContain('"flaggedSkus": 1');
    expect(text).toContain('"driftPct": 0.08');
  });

  const laborHeader = 'Location,Employee,ScheduledStart,ScheduledEnd,ClockIn,ClockOut';
  const lateBy30 = 'Main,Sam,2026-08-27 09:00,2026-08-27 12:00,2026-08-27 09:00,2026-08-27 12:30';
  const extra45 = 'Main,Sam,2026-08-27 09:00,2026-08-27 17:00,2026-08-27 08:45,2026-08-27 17:30';
  const onTime = 'Main,Sam,2026-08-27 09:00,2026-08-27 12:00,2026-08-27 09:00,2026-08-27 12:00';

  it.each([
    { scenario: '30 extra minutes at $18', column: 'WageRate', rows: [lateBy30 + ',18'], minutes: 30, total: 9, priced: 9, unpriced: 0 },
    { scenario: '45 extra minutes at $18', column: 'Hourly Rate', rows: [extra45 + ',$18.00'], minutes: 45, total: 13.5, priced: 13.5, unpriced: 0 },
    { scenario: 'rounding half a cent', column: 'Pay Rate', rows: [lateBy30 + ',20.15'], minutes: 30, total: 10.08, priced: 10.08, unpriced: 0 },
    { scenario: 'an explicit base rate', column: 'Wage,Base Hourly Rate', rows: [lateBy30 + ',100,18'], minutes: 30, total: 9, priced: 9, unpriced: 0 },
    { scenario: 'no rate column', column: '', rows: [lateBy30], minutes: 30, total: null, priced: null, unpriced: 30 },
    { scenario: 'a premium rate alone', column: 'Overtime Wage Rate', rows: [extra45 + ',27'], minutes: 45, total: null, priced: null, unpriced: 45 },
    { scenario: 'invalid and negative rates', column: 'WageRate', rows: [lateBy30 + ',abc', extra45 + ',-5'], minutes: 75, total: null, priced: null, unpriced: 75 },
    { scenario: 'only some rows priced', column: 'WageRate', rows: [lateBy30 + ',18', extra45 + ','], minutes: 75, total: null, priced: 9, unpriced: 45 },
    { scenario: 'explicit zero rate', column: 'WageRate', rows: [lateBy30 + ',0'], minutes: 30, total: 0, priced: 0, unpriced: 0 },
    { scenario: 'zero drift without a rate', column: '', rows: [onTime], minutes: 0, total: 0, priced: 0, unpriced: 0 },
  ])('estimates straight-time drift for $scenario', async ({ column, rows, minutes, total, priced, unpriced }) => {
    const header = column ? laborHeader + ',' + column : laborHeader;
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'analyze_labor',
          arguments: { csv: [header, ...rows].join('\n') },
        },
      }),
    }));
    const body = await response.json();
    expect(body.result.isError).toBeUndefined();
    const result = JSON.parse(body.result.content[0].text);
    expect(result.evidenceState).toBe('Unverified');
    expect(result.warning).toContain('review leads');
    expect(result.estimateBasis).toContain('Overtime requires separate evidence');
    expect(result.report).toMatchObject({
      employees: 1,
      totalDriftMinutes: minutes,
      totalDriftDollars: total,
      pricedDriftDollars: priced,
      unpricedDriftMinutes: unpriced,
    });
  });

  it('costs drink recipes from per-unit house pour — blocks until asked', async () => {
    const blocked = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 20,
        method: 'tools/call',
        params: {
          name: 'analyze_recipe_cost',
          arguments: {
            mode: 'drink_recipe',
            store_id: 'unit-a',
            house_pour_lines: [],
            ingredients: [
              { name: 'well vodka', pourCategory: 'mixed_drink_liquor', epUnitCost: 0.4 },
            ],
          },
        },
      }),
    }));
    const blockedBody = await blocked.json();
    expect(blockedBody.result.isError).toBe(true);
    expect(blockedBody.result.content[0].text).toMatch(/1\.5|1\.75|2/);

    const priced = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 21,
        method: 'tools/call',
        params: {
          name: 'analyze_recipe_cost',
          arguments: {
            mode: 'drink_recipe',
            store_id: 'unit-b',
            house_pour_lines: [
              { category: 'mixed_drink_liquor', pour_spec_fl_oz: 1.75 },
              { category: 'spirit_shot', pour_spec_fl_oz: 1.5 },
              { category: 'wine_glass', pour_spec_fl_oz: 5 },
              { category: 'draft_pour', pour_spec_fl_oz: 16 },
            ],
            ingredients: [
              { name: 'well vodka', pourCategory: 'mixed_drink_liquor', epUnitCost: 0.5 },
              { name: 'soda', pourSource: 'fixed', epQty: 4, epUnitCost: 0.02 },
            ],
          },
        },
      }),
    }));
    const pricedBody = await priced.json();
    const text = pricedBody.result.content[0].text as string;
    expect(pricedBody.result.isError).toBeFalsy();
    expect(text).toContain('"kind": "drink_recipe"');
    expect(text).toContain('"epQty": 1.75');
    expect(text).toMatch(/house pour/i);
  });

  it('walks Pepsi gun + Hawkeye as ask-first, then costs after BIB ratio + cup liquid + pour', async () => {
    const asking = await POST(
      new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 30,
          method: 'tools/call',
          params: {
            name: 'analyze_recipe_cost',
            arguments: { mode: 'fountain_spirit_drink', store_id: 'unit-a', soda_label: 'Pepsi' },
          },
        }),
      }),
    );
    const askingBody = await asking.json();
    expect(askingBody.result.content[0].text).toMatch(/Missing Evidence|mix ratio|liquid/i);

    const costed = await POST(
      new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 31,
          method: 'tools/call',
          params: {
            name: 'analyze_recipe_cost',
            arguments: {
              mode: 'fountain_spirit_drink',
              store_id: 'unit-a',
              soda_label: 'Pepsi',
              spirit_label: 'Hawkeye vodka',
              syrup_gal: 5,
              bib_cost: 60,
              water_parts: 5,
              syrup_parts: 1,
              cup_marked_fl_oz: 9,
              liquid_fill_fl_oz: 5,
              spirit_pour_fl_oz: 2,
              spirit_cost_per_fl_oz: 0.2,
            },
          },
        }),
      }),
    );
    const costedBody = await costed.json();
    const text = costedBody.result.content[0].text as string;
    expect(costedBody.result.isError).toBeFalsy();
    expect(text).toContain('"phase": "costed"');
    expect(text).toContain('"sodaFlOz": 3');
    expect(text).toMatch(/Pepsi|Hawkeye/i);
  });
});
