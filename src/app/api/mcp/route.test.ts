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

  it('exposes knowledge tools first, then Payroll / Prices / Process / beverage analysis', () => {
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
    expect(text).toContain('store-chief-of-staff');
    expect(text).toContain('memory-curator');
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
    expect(listedText).toContain('truth-qa');
    expect(listedText).toContain('never86://specialist/labor');

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
