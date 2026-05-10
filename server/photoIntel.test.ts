import { describe, it, expect } from "vitest";
import {
  getPhotoIntelStats,
  processCompliancePhoto,
  processInvoicePhotoActions,
  processShelfPhotoAlerts,
  getAllPhotoSubmissions,
  getPhotoIntelFeed,
} from "./db";

describe("Photo Intelligence Pipeline — Wave 24", () => {
  // ─── getPhotoIntelStats ─────────────────────────────────
  it("getPhotoIntelStats returns correct structure", async () => {
    const stats = await getPhotoIntelStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("byType");
    expect(stats).toHaveProperty("verifiedCount");
    expect(stats).toHaveProperty("unverifiedCount");
    expect(stats).toHaveProperty("actionItems");
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.verifiedCount).toBe("number");
    expect(typeof stats.unverifiedCount).toBe("number");
    expect(typeof stats.actionItems).toBe("number");
    expect(typeof stats.byType).toBe("object");
    // total = verified + unverified
    expect(stats.total).toBe(stats.verifiedCount + stats.unverifiedCount);
  });

  // ─── processCompliancePhoto — station with poor cleanliness ─────
  it("processCompliancePhoto scores station with poor cleanliness < 70", async () => {
    const extraction = {
      station: "Fry Line",
      setupComplete: true,
      cleanliness: "poor",
      items: [
        { item: "fryer basket", status: "ok", notes: "" },
        { item: "thermometer", status: "missing", notes: "not found" },
      ],
    };
    const result = await processCompliancePhoto(extraction, "station");
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThan(70);
    expect(result!.deductions.length).toBeGreaterThan(0);
    expect(result!.photoType).toBe("station");
    // Poor cleanliness = -30, 1 missing item = -5, total = 65
    expect(result!.score).toBe(65);
  });

  it("processCompliancePhoto scores perfect station at 100", async () => {
    const extraction = {
      station: "Pizza Line",
      setupComplete: true,
      cleanliness: "good",
      items: [
        { item: "pizza peel", status: "ok", notes: "" },
        { item: "dough roller", status: "ok", notes: "" },
      ],
    };
    const result = await processCompliancePhoto(extraction, "station");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
    expect(result!.deductions.length).toBe(0);
  });

  it("processCompliancePhoto scores incomplete station setup", async () => {
    const extraction = {
      station: "Bar",
      setupComplete: false,
      cleanliness: "fair",
      items: [],
    };
    const result = await processCompliancePhoto(extraction, "station");
    expect(result).not.toBeNull();
    // -20 for incomplete setup, -15 for fair cleanliness = 65
    expect(result!.score).toBe(65);
    expect(result!.deductions.length).toBe(2);
  });

  it("processCompliancePhoto handles prep with food safety violation", async () => {
    const extraction = {
      prepItem: "Chicken Wings",
      technique: "breading",
      portionConsistency: "inconsistent",
      foodSafety: "violation",
      notes: "Raw chicken on same surface as cooked items",
    };
    const result = await processCompliancePhoto(extraction, "prep");
    expect(result).not.toBeNull();
    // -40 for violation, -15 for inconsistent portioning = 45
    expect(result!.score).toBe(45);
    expect(result!.deductions.length).toBe(2);
    expect(result!.photoType).toBe("prep");
  });

  // ─── processShelfPhotoAlerts ─────────────────────────────
  it("processShelfPhotoAlerts returns alerts for low/empty items", async () => {
    const extraction = {
      location: "Walk-in Cooler",
      items: [
        { product: "Mozzarella Cheese", estimatedQuantity: "2 bags", level: "low", notes: "" },
        { product: "Pepperoni", estimatedQuantity: "0", level: "empty", notes: "completely out" },
        { product: "Lettuce", estimatedQuantity: "5 heads", level: "full", notes: "" },
      ],
    };
    const alerts = await processShelfPhotoAlerts(999, extraction);
    expect(alerts.length).toBe(2);
    expect(alerts[0].product).toBe("Mozzarella Cheese");
    expect(alerts[0].level).toBe("low");
    expect(alerts[1].product).toBe("Pepperoni");
    expect(alerts[1].level).toBe("empty");
  });

  it("processShelfPhotoAlerts returns empty array for full shelves", async () => {
    const extraction = {
      location: "Dry Storage",
      items: [
        { product: "Flour", estimatedQuantity: "10 bags", level: "full", notes: "" },
        { product: "Sugar", estimatedQuantity: "8 bags", level: "full", notes: "" },
      ],
    };
    const alerts = await processShelfPhotoAlerts(999, extraction);
    expect(alerts.length).toBe(0);
  });

  it("processShelfPhotoAlerts handles null/invalid extraction", async () => {
    const alerts1 = await processShelfPhotoAlerts(999, null);
    expect(alerts1.length).toBe(0);
    const alerts2 = await processShelfPhotoAlerts(999, { items: "not an array" });
    expect(alerts2.length).toBe(0);
    const alerts3 = await processShelfPhotoAlerts(999, {});
    expect(alerts3.length).toBe(0);
  });

  // ─── processInvoicePhotoActions ─────────────────────────
  it("processInvoicePhotoActions handles empty extraction", async () => {
    const result = await processInvoicePhotoActions({});
    expect(result.pricesUpdated).toBe(0);
    expect(result.newProducts).toBe(0);
    expect(result.alertsGenerated).toBe(0);
  });

  it("processInvoicePhotoActions handles null items", async () => {
    const result = await processInvoicePhotoActions({ items: null });
    expect(result.pricesUpdated).toBe(0);
    expect(result.newProducts).toBe(0);
  });

  it("processInvoicePhotoActions handles items without product/price", async () => {
    const result = await processInvoicePhotoActions({
      vendor: "Test Vendor",
      items: [
        { product: null, unitPrice: 5.99 },
        { product: "Widget", unitPrice: null },
        { product: null, unitPrice: null },
      ],
    });
    // None should process since they're missing required fields
    expect(result.pricesUpdated).toBe(0);
    expect(result.newProducts).toBe(0);
  });

  // ─── getAllPhotoSubmissions ──────────────────────────────
  it("getAllPhotoSubmissions returns array", async () => {
    const submissions = await getAllPhotoSubmissions();
    expect(Array.isArray(submissions)).toBe(true);
  });

  it("getAllPhotoSubmissions respects limit", async () => {
    const submissions = await getAllPhotoSubmissions({ limit: 5 });
    expect(submissions.length).toBeLessThanOrEqual(5);
  });

  // ─── getPhotoIntelFeed ──────────────────────────────────
  it("getPhotoIntelFeed returns array with staff names", async () => {
    const feed = await getPhotoIntelFeed(10);
    expect(Array.isArray(feed)).toBe(true);
    // Each item should have the expected fields
    if (feed.length > 0) {
      const item = feed[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("staffId");
      expect(item).toHaveProperty("photoType");
      expect(item).toHaveProperty("staffName");
    }
  });
});
