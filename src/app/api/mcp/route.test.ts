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

  it('exposes only Payroll, Prices, and Process tools', () => {
    expect(MCP_PUBLIC_TOOLS.map((tool) => tool.name)).toEqual([
      'analyze_labor',
      'analyze_vendor_prices',
      'build_action_shift',
    ]);
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

  it('analyzes operator-provided labor without alleging misconduct', async () => {
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'analyze_labor',
          arguments: {
            csv: [
              'Location,Employee,ScheduledStart,ScheduledEnd,ClockIn,ClockOut,WageRate',
              'Main,Sam,2026-08-27 09:00,2026-08-27 17:00,2026-08-27 08:45,2026-08-27 17:30,18',
            ].join('\n'),
          },
        },
      }),
    }));
    const body = await response.json();
    const text = body.result.content[0].text as string;
    expect(text).toContain('Unverified');
    expect(text).toContain('review leads');
    expect(text).toContain('"employees": 1');
  });
});
