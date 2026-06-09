export interface SquareCredentials {
  accessToken: string;
  locationId?: string;
}

export interface PosZReportData {
  reportDate: string;
  netSales: number;
  grossSales: number;
  taxCollected: number;
  discounts: number;
  covers: number;
  rawResponse?: unknown;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  locationId?: string;
  businessName?: string;
}

const SQUARE_BASE = "https://connect.squareup.com/v2";

async function squareFetch(path: string, accessToken: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(`${SQUARE_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-01-17",
      ...(opts.headers || {}),
    },
  });
}

export async function testConnection(creds: SquareCredentials): Promise<ConnectionTestResult> {
  try {
    const res = await squareFetch("/merchants/me", creds.accessToken);
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { errors?: Array<{ detail?: string }> };
      return { success: false, message: err.errors?.[0]?.detail || `Square API error (${res.status})` };
    }
    const data = await res.json() as { merchant?: { business_name?: string } };
    const merchant = data.merchant;

    let locationId = creds.locationId;
    if (!locationId) {
      const locRes = await squareFetch("/locations", creds.accessToken);
      if (locRes.ok) {
        const locData = await locRes.json() as { locations?: Array<{ id: string; name: string }> };
        locationId = locData.locations?.[0]?.id;
      }
    }

    return {
      success: true,
      message: "Connected to Square",
      businessName: merchant?.business_name,
      locationId,
    };
  } catch (err) {
    return { success: false, message: `Connection failed: ${(err as Error).message}` };
  }
}

export async function pullDailySales(creds: SquareCredentials, date: string): Promise<PosZReportData> {
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const body = {
    location_ids: creds.locationId ? [creds.locationId] : undefined,
    query: {
      filter: {
        date_time_filter: {
          created_at: { start_at: dayStart, end_at: dayEnd },
        },
        state_filter: { states: ["COMPLETED"] },
      },
    },
    limit: 500,
  };

  let grossSales = 0;
  let discounts = 0;
  let taxCollected = 0;
  let covers = 0;
  type SquareOrder = {
    id?: string;
    state?: string;
    total_money?: { amount?: number; currency?: string };
    total_discount_money?: { amount?: number };
    total_tax_money?: { amount?: number };
    total_tip_money?: { amount?: number };
    line_items?: Array<{ name?: string; quantity?: string; total_money?: { amount?: number } }>;
    fulfillments?: Array<{ type?: string }>;
  };

  const allOrders: SquareOrder[] = [];
  let pagesFetched = 0;

  let cursor: string | undefined;
  do {
    const pageBody: typeof body & { cursor?: string } = cursor ? { ...body, cursor } : body;
    const res = await squareFetch("/orders/search", creds.accessToken, {
      method: "POST",
      body: JSON.stringify(pageBody),
    });

    if (!res.ok) {
      throw new Error(`Square orders/search failed (${res.status})`);
    }

    const data = await res.json() as { orders?: SquareOrder[]; cursor?: string };
    pagesFetched++;

    for (const order of data.orders || []) {
      grossSales += (order.total_money?.amount || 0);
      discounts += (order.total_discount_money?.amount || 0);
      taxCollected += (order.total_tax_money?.amount || 0);
      covers++;
      allOrders.push(order);
    }

    cursor = data.cursor;
  } while (cursor);

  const grossSalesDollars = grossSales / 100;
  const discountsDollars = discounts / 100;
  const taxDollars = taxCollected / 100;
  const netSales = grossSalesDollars - discountsDollars;

  const rawResponse = {
    source: "square",
    pullDate: new Date().toISOString(),
    reportDate: date,
    locationId: creds.locationId || null,
    orderCount: allOrders.length,
    pagesFetched,
    currency: allOrders[0]?.total_money?.currency || "USD",
    aggregates: {
      grossSalesCents: grossSales,
      discountsCents: discounts,
      taxCents: taxCollected,
      netSalesCents: grossSales - discounts,
    },
    orderIds: allOrders.map(o => o.id).filter(Boolean),
  };

  return {
    reportDate: date,
    netSales,
    grossSales: grossSalesDollars,
    taxCollected: taxDollars,
    discounts: discountsDollars,
    covers,
    rawResponse,
  };
}
