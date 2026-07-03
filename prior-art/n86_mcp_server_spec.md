# N86 Operator MCP Server · Production Spec

**Server name:** `n86-operator`
**Purpose:** Connect an operator's Never 86'd account to Claude.ai (or any MCP-aware client) with a single API key. Plain-English questions of their own operational data return source-stamped, RLS-isolated answers.
**Status:** v1 shipped; v2 in build
**Owner:** Tim Starn (CTO) + Code
**Auth:** Per-operator API key → maps to `operator_id` → Supabase RLS enforces row visibility
**Transport:** stdio for desktop Claude · HTTP for Claude.ai
**Data discipline:** Every tool returns a `source` field naming the table and view the answer came from. No hallucinations.

---

## v1 Tools (Production)

### 1. `n86_get_prime_cost`
Prime cost breakdown for an operator's location and date range.

```json
{
  "name": "n86_get_prime_cost",
  "description": "Returns prime cost (food % + labor %), broken out by location and date range. Always uses TOTAL sales as denominator — never food-only sales. Returns calculation method in the response so the operator can show the work.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location_id": { "type": "integer", "description": "Operator's location_id. Omit for network rollup." },
      "start_date": { "type": "string", "format": "date" },
      "end_date": { "type": "string", "format": "date" }
    },
    "required": ["start_date", "end_date"]
  }
}
```

**Returns:**
```json
{
  "operator_id": 3,
  "location": "Store 101",
  "period": "2026-04-01 to 2026-04-30",
  "total_sales": 261243.50,
  "food_cost_dollars": 59302.18,
  "food_cost_pct": 22.7,
  "labor_cost_dollars": 70797.17,
  "labor_cost_pct": 27.1,
  "prime_cost_pct": 49.8,
  "grade": "elite",
  "calc_method": "food_spend / TOTAL sales (industry standard)",
  "source": "supabase.public.toast_location_breakdown joined with payroll_aggregates"
}
```

### 2. `n86_get_sales_summary`
Revenue, daily averages, recent Z-report data.

```json
{
  "name": "n86_get_sales_summary",
  "description": "Returns net sales, gross sales, transactions, and average check for a given location and date range. Daily breakdown included.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location_id": { "type": "integer" },
      "start_date": { "type": "string", "format": "date" },
      "end_date": { "type": "string", "format": "date" },
      "granularity": { "type": "string", "enum": ["daily", "weekly", "monthly"], "default": "daily" }
    },
    "required": ["start_date", "end_date"]
  }
}
```

### 3. `n86_list_locations`
The operator's locations with basic operational info.

```json
{
  "name": "n86_list_locations",
  "description": "Returns operator's locations with name, city, state, square footage, opened date, POS system, and current 4-week sales velocity.",
  "input_schema": { "type": "object", "properties": {} }
}
```

### 4. `n86_get_inventory_snapshot`
Current inventory items and dollar value.

```json
{
  "name": "n86_get_inventory_snapshot",
  "description": "Returns current inventory items and dollar value by location. Date-stamped to last count. Identifies items past par and out-of-stocks.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location_id": { "type": "integer" },
      "category": { "type": "string", "description": "Optional filter: food, beer, liquor, wine, packaging, paper" }
    }
  }
}
```

### 5. `n86_get_vendor_spend`
Top vendors by spend from invoice history.

```json
{
  "name": "n86_get_vendor_spend",
  "description": "Returns top vendors by spend across a date range. Includes total dollars, invoice count, and percentage of total food spend per vendor.",
  "input_schema": {
    "type": "object",
    "properties": {
      "start_date": { "type": "string", "format": "date" },
      "end_date": { "type": "string", "format": "date" },
      "limit": { "type": "integer", "default": 10 }
    },
    "required": ["start_date", "end_date"]
  }
}
```

### 6. `n86_find_overcharges` · THE KILLER TOOL
Top SKUs where the operator is paying above public state wholesale median.

```json
{
  "name": "n86_find_overcharges",
  "description": "Compares operator's invoice line-items against Iowa ABD or PLCB public wholesale medians (whichever state the operator is in). Returns top SKUs where the operator is paying more than the median, with dollar overage per unit and monthly leak. Citation: Iowa ABD Socrata API or PLCB public PDF.",
  "input_schema": {
    "type": "object",
    "properties": {
      "limit": { "type": "integer", "default": 20 },
      "min_overage_pct": { "type": "number", "default": 5.0, "description": "Only return SKUs at least N% over median" }
    }
  }
}
```

**Returns:**
```json
{
  "operator_id": 1,
  "state": "IA",
  "lookback_days": 30,
  "skus_analyzed": 20,
  "skus_over_median": 17,
  "monthly_overcharge_total": 2343.45,
  "annualized_overcharge_total": 28121.40,
  "top_skus": [
    {
      "sku": "Tito's Handmade Vodka 750ml",
      "operator_price": 18.99,
      "state_median": 16.50,
      "overage_per_unit": 2.49,
      "units_per_month": 12,
      "monthly_leak": 29.88,
      "source": "iowa_abd_socrata + ctap_invoices"
    }
    // ... more
  ],
  "source": "iowa_abd_socrata_nightly + operator_invoice_lines"
}
```

---

## v2 Tools (Building)

### 7. `n86_get_weekly_pulse`
Full weekly performance report — all KPIs vs targets.

### 8. `n86_get_labor_analysis`
Labor by daypart, overtime flags, scheduling efficiency.

### 9. `n86_benchmark_menu_prices`
Competitor menu price comparison in the operator's trade area. Requires Market Pricing Agent V1 to be live.

### 10. `n86_import_invoice` · WRITE TOOL
Import an invoice via conversation. First write tool — gated by explicit operator opt-in.

---

## Security & RLS

Every tool query is prefixed with:
```sql
SET LOCAL app.current_operator_id = $1; -- from API key resolution
```

RLS policies on every operator-scoped table:
```sql
CREATE POLICY operator_isolation ON toast_employee_performance
  FOR SELECT
  USING (operator_id = current_setting('app.current_operator_id')::integer);
```

API key format: `n86_op_<operator_id>_<random_32>`.

Rate limits: 60 calls/min per operator, 1000 calls/day. Burst capacity for live demos.

---

## Per-Operator Provisioning (Charter Setup)

When a new operator signs the Charter:

1. Run `INSERT INTO operator_users (...)` returning `operator_id`
2. Run `INSERT INTO operator_locations (...)` for each store
3. Provision API key: `n86_op_<id>_<token>`
4. Apply RLS policies (boilerplate migration runs)
5. Generate Claude desktop config snippet:

```json
{
  "mcpServers": {
    "n86-operator": {
      "command": "npx",
      "args": ["-y", "@never86/operator-mcp"],
      "env": {
        "N86_API_KEY": "n86_op_42_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

6. Send onboarding email with the snippet + one demo query: "What was my prime cost last week?"
7. Operator hits enter. Sees their own data. Closes the deal.

**Time from signed contract to working MCP: under 10 minutes.**

---

## Manager Tier (Forthcoming)

Some tools are scoped to managers/GMs at a single location, not the operator/owner. Manager-tier API keys see only their own location's data and only get a subset of tools:

- `n86_get_today_pulse` — today's net sales, covers, labor %, voids, comps
- `n86_get_shift_roster` — who's on, late, flagged
- `n86_get_floor_alerts` — priority-tagged operational alerts (P1/P2/P3/WIN)
- `n86_get_prep_list` — tonight's prep based on demand forecast
- `n86_lookup_sop` — search the operator's SOP knowledge base
- `n86_ask_question` — fallback Q&A (returns "I don't know · ping a manager" if no source)

Manager API key format: `n86_mgr_<operator_id>_<location_id>_<random_32>`.

---

## Source Discipline Rules (Enforced Server-Side)

1. **Every tool response includes a `source` field** naming the table and view the answer came from.
2. **No tool ever invents a number.** If the underlying view returns null, the tool returns `"value": null, "reason": "no data"`, NOT an estimate.
3. **Every dollar figure carries a `confidence`** (`high` / `medium` / `low`) and a `methodology` reference.
4. **If a query returns fewer than 3 data points** (e.g., 2 competitor matches on a menu item), the tool returns `"recommendation": null` and explicitly says so.
5. **Operator-write tools require explicit confirmation** in the response (`requires_confirmation: true`) before the change persists.

---

## What This Unlocks

Every operator who signs a Charter gets:

- A Claude-native restaurant brain that knows THEIR data, not generic hospitality benchmarks
- A 10-second demo that closes other operators ("Find me any overcharges")
- An audit trail every dollar can be reconciled against
- Manager-tier UIs at every location that share the same source-discipline doctrine
- A Compass dashboard at `never86.ai/admin/<their-slug>/` that pulls from the same RLS-isolated tables

This is the moat. Toast and Sysco can't ask their customers for training rights without admitting their AI roadmap exists. OpenAI can't go vertical without abandoning their platform thesis. Never 86'd is the only restaurant AI that can build this.

---

*N86 · Operator MCP · Production Spec v1.0 · 2026-05-27*
