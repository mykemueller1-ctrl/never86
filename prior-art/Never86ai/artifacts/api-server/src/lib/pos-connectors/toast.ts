export interface ToastCredentials {
  clientId: string;
  clientSecret: string;
  restaurantGuid: string;
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
}

const TOAST_BASE = "https://ws-api.toasttab.com";

interface ToastAuthResponse {
  token?: {
    accessToken?: string;
  };
  status?: string;
}

interface ToastOrder {
  guid?: string;
  checks?: Array<{
    totalAmount?: number;
    taxAmount?: number;
    appliedDiscounts?: Array<{ appliedDiscountAmount?: number }>;
    payments?: Array<{ amount?: number }>;
  }>;
  voided?: boolean;
  deleted?: boolean;
}

async function getAccessToken(creds: ToastCredentials): Promise<string> {
  const res = await fetch(`${TOAST_BASE}/authentication/v1/authentication/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      userAccessType: "TOAST_MACHINE_CLIENT",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Toast auth failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json() as ToastAuthResponse;
  const token = data.token?.accessToken;
  if (!token) throw new Error("Toast auth succeeded but no access token returned");
  return token;
}

async function toastFetch(path: string, accessToken: string, restaurantGuid: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(`${TOAST_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Toast-Restaurant-External-ID": restaurantGuid,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
}

export async function testConnection(creds: ToastCredentials): Promise<ConnectionTestResult> {
  if (!creds.clientId || !creds.clientSecret || !creds.restaurantGuid) {
    return { success: false, message: "Client ID, Client Secret, and Restaurant GUID are all required" };
  }
  try {
    const accessToken = await getAccessToken(creds);
    const res = await toastFetch(
      "/config/v2/configs",
      accessToken,
      creds.restaurantGuid,
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const detail = text.slice(0, 200).trim();
      if (res.status === 404) {
        return { success: false, message: "Restaurant GUID not found — verify it in your Toast backend portal" };
      }
      if (res.status === 403) {
        return { success: false, message: "Access denied — your partner credentials may not have access to this restaurant" };
      }
      return { success: false, message: `Toast API error (${res.status})${detail ? `: ${detail}` : ""}` };
    }
    return { success: true, message: "Connected to Toast" };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

export async function pullDailySales(creds: ToastCredentials, date: string): Promise<PosZReportData> {
  const accessToken = await getAccessToken(creds);

  const [year, month, day] = date.split("-").map(Number);
  const tzOffset = "-0500";
  const startDate = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T000000.000${tzOffset}`;
  const endDate = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T235959.999${tzOffset}`;

  const allOrders: ToastOrder[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const params = new URLSearchParams({
      startDate,
      endDate,
      pageSize: String(pageSize),
      page: String(page),
    });

    const res = await toastFetch(
      `/orders/v2/orders?${params.toString()}`,
      accessToken,
      creds.restaurantGuid,
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Toast orders API failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json() as ToastOrder[];
    if (!Array.isArray(data) || data.length === 0) break;
    allOrders.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  let grossSales = 0;
  let taxCollected = 0;
  let discounts = 0;
  let covers = 0;

  for (const order of allOrders) {
    if (order.voided || order.deleted) continue;
    for (const check of order.checks || []) {
      grossSales += check.totalAmount || 0;
      taxCollected += check.taxAmount || 0;
      for (const d of check.appliedDiscounts || []) {
        discounts += d.appliedDiscountAmount || 0;
      }
      covers++;
    }
  }

  const netSales = grossSales - discounts;

  const rawResponse = {
    source: "toast",
    pullDate: new Date().toISOString(),
    reportDate: date,
    restaurantGuid: creds.restaurantGuid,
    orderCount: allOrders.length,
    pagesFetched: page,
    aggregates: {
      grossSales,
      taxCollected,
      discounts,
      netSales,
      covers,
    },
    orderGuids: allOrders.slice(0, 500).map(o => o.guid).filter(Boolean),
  };

  return {
    reportDate: date,
    netSales,
    grossSales,
    taxCollected,
    discounts,
    covers,
    rawResponse,
  };
}

export const TOAST_SETUP_INSTRUCTIONS = `
To connect Toast POS, you need Toast Technology Partner credentials:

1. Apply at https://developer.toasttab.com/
2. Complete Toast's partner review process (2–4 weeks)
3. Receive your Client ID and Client Secret
4. Find your restaurant's GUID in the Toast backend portal
5. Enter all three values in the fields above

Contact support@never86.ai for help with the Toast integration setup.
`.trim();
