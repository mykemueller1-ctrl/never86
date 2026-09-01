import type { OperatorSnapshot, OperatorView } from "./contracts.js";
import { getDemoSnapshot } from "./demo-data.js";

export interface OperatorDataProvider {
  mode: "synthetic-preview" | "authenticated-tenant";
  getSnapshot(view: OperatorView): Promise<OperatorSnapshot>;
}

export const demoProvider: OperatorDataProvider = {
  mode: "synthetic-preview",
  async getSnapshot(view) {
    return getDemoSnapshot(view);
  },
};

// Production provider requirements:
// 1. Resolve the authenticated tenant and location on the server.
// 2. Authorize every read/write against that tenant.
// 3. Read normalized facts from the canonical database, never from widget state.
// 4. Return evidence references without exposing secrets or unrelated PII.
// 5. Keep write operations in separate, explicit tools with confirmation semantics.
