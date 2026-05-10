import { describe, it, expect } from "vitest";
import {
  copyWeekForward,
  saveWeekAsTemplate,
  applyTemplate,
  getTemplateNames,
  deleteTemplate,
  publishWeek,
  getScheduleWeek,
  getLaborBreakdown,
  detectConflicts,
  updateStaffRate,
  getDailyLaborCosts,
  createScheduleShift,
  getScheduleByDateRange,
} from "./db";

// Helper to get a Monday date for testing
function getTestMonday(offset = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7 - d.getDay() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

describe("Scheduling System — Wave 23", () => {
  const testWeekStart = getTestMonday(20); // Far future to avoid conflicts
  const nextWeekStart = new Date(testWeekStart.getTime() + 7 * 86400000);

  it("createScheduleShift creates a shift", async () => {
    const result = await createScheduleShift({
      staffId: 30001,
      date: testWeekStart,
      startTime: "09:00",
      endTime: "17:00",
      department: "bar",
      createdBy: 30001,
      status: "scheduled",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it("createScheduleShift creates multiple shifts for the week", async () => {
    // Create shifts for 3 different days
    for (let i = 1; i <= 3; i++) {
      const date = new Date(testWeekStart.getTime() + i * 86400000);
      await createScheduleShift({
        staffId: 30002,
        date,
        startTime: "10:00",
        endTime: "18:00",
        department: "kitchen_line",
        createdBy: 30001,
        status: "scheduled",
      });
    }
    const endDate = new Date(testWeekStart.getTime() + 6 * 86400000);
    const shifts = await getScheduleByDateRange(testWeekStart, endDate);
    expect(shifts.length).toBeGreaterThanOrEqual(4); // At least our 4 test shifts
  });

  it("copyWeekForward duplicates shifts to next week", async () => {
    const result = await copyWeekForward(testWeekStart, nextWeekStart, 30001);
    expect(result).toBeDefined();
    expect(result.copied).toBeGreaterThanOrEqual(1);
  });

  it("saveWeekAsTemplate saves the current week as a template", async () => {
    const result = await saveWeekAsTemplate(testWeekStart, "Test Week Template", 30001);
    expect(result).toBeDefined();
    expect(result.name).toBe("Test Week Template");
    expect(result.saved).toBeGreaterThanOrEqual(1);
  });

  it("getTemplateNames returns saved templates", async () => {
    const templates = await getTemplateNames();
    expect(templates.length).toBeGreaterThanOrEqual(1);
    const found = templates.find(t => t.name === "Test Week Template");
    expect(found).toBeDefined();
    expect(found!.shiftCount).toBeGreaterThanOrEqual(1);
  });

  it("applyTemplate applies a template to a target week", async () => {
    const farFuture = new Date(testWeekStart.getTime() + 21 * 86400000);
    const result = await applyTemplate("Test Week Template", farFuture, 30001);
    expect(result).toBeDefined();
    expect(result.template).toBe("Test Week Template");
    expect(result.applied).toBeGreaterThanOrEqual(1);
  });

  it("deleteTemplate removes a template", async () => {
    await deleteTemplate("Test Week Template");
    const templates = await getTemplateNames();
    const found = templates.find(t => t.name === "Test Week Template");
    expect(found).toBeUndefined();
  });

  it("publishWeek publishes a schedule and returns labor summary", async () => {
    const result = await publishWeek(testWeekStart, 30001);
    expect(result).toBeDefined();
    expect(result.published).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalHours).toBe("number");
    expect(typeof result.projectedLaborCost).toBe("number");
  });

  it("getScheduleWeek returns week metadata after publishing", async () => {
    const meta = await getScheduleWeek(testWeekStart);
    expect(meta).toBeDefined();
    expect(meta?.status).toBe("published");
  });

  it("getLaborBreakdown returns cost breakdown by department", async () => {
    const breakdown = await getLaborBreakdown(testWeekStart);
    expect(Array.isArray(breakdown)).toBe(true);
    // Should have at least one department since we created shifts
    expect(breakdown.length).toBeGreaterThanOrEqual(1);
    for (const dept of breakdown) {
      expect(dept).toHaveProperty("department");
      expect(dept).toHaveProperty("totalHours");
      expect(dept).toHaveProperty("totalCost");
      expect(dept).toHaveProperty("shiftCount");
    }
  });

  it("detectConflicts returns an array of conflict objects", async () => {
    const conflicts = await detectConflicts(testWeekStart);
    expect(Array.isArray(conflicts)).toBe(true);
    // Each conflict should have a message
    for (const c of conflicts) {
      expect(c).toHaveProperty("message");
    }
  });

  it("updateStaffRate updates hourly rate", async () => {
    await updateStaffRate(30001, "18.50");
    // Re-run labor breakdown - staffId 30001 now has rate 18.50
    // The shifts we created for staffId 30001 should now have cost
    const breakdown = await getLaborBreakdown(testWeekStart);
    // At least one department should exist
    expect(breakdown.length).toBeGreaterThanOrEqual(1);
    // The bar department (staffId 30001 shift) should have cost > 0 now
    const barDept = breakdown.find((d: any) => d.department === "bar");
    expect(barDept).toBeDefined();
    expect(barDept!.totalCost).toBeGreaterThan(0);
  });

  it("getDailyLaborCosts returns daily cost data", async () => {
    const endDate = new Date(testWeekStart.getTime() + 6 * 86400000);
    const daily = await getDailyLaborCosts(testWeekStart, endDate);
    expect(Array.isArray(daily)).toBe(true);
  });
});
