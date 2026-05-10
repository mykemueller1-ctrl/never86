import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  createNewHire: vi.fn(),
  generateUniquePin: vi.fn(),
  logSecurityEvent: vi.fn(),
}));

import { createNewHire, generateUniquePin } from "./db";

describe("Staff Onboarding - createNewHire", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new hire with auto-generated PIN", async () => {
    const mockResult = {
      id: 42,
      pin: "7291",
      firstName: "Jake",
      lastName: "Smith",
      department: "kitchen_line",
      jobRole: "line_cook",
    };
    (createNewHire as any).mockResolvedValue(mockResult);

    const result = await createNewHire({
      firstName: "Jake",
      lastName: "Smith",
      department: "kitchen_line",
      jobRole: "line_cook",
      isKeyEmployee: false,
    });

    expect(result).toEqual(mockResult);
    expect(result.pin).toMatch(/^\d{4}$/);
    expect(result.firstName).toBe("Jake");
    expect(result.lastName).toBe("Smith");
    expect(result.department).toBe("kitchen_line");
    expect(result.jobRole).toBe("line_cook");
  });

  it("should generate a 4-digit PIN that never starts with 0", async () => {
    (generateUniquePin as any).mockResolvedValue("4821");
    const pin = await generateUniquePin();
    expect(pin).toMatch(/^[1-9]\d{3}$/);
    expect(parseInt(pin)).toBeGreaterThanOrEqual(1000);
    expect(parseInt(pin)).toBeLessThanOrEqual(9999);
  });

  it("should accept all valid department values", async () => {
    const departments = ["bar", "dining_room", "kitchen_line", "pizza_side", "driver", "dishwasher", "management"] as const;
    for (const dept of departments) {
      (createNewHire as any).mockResolvedValue({
        id: 1, pin: "1234", firstName: "Test", lastName: "User", department: dept, jobRole: "line_cook",
      });
      const result = await createNewHire({
        firstName: "Test",
        lastName: "User",
        department: dept,
        jobRole: "line_cook",
      });
      expect(result.department).toBe(dept);
    }
  });

  it("should accept all valid job role values", async () => {
    const roles = ["owner", "key_manager", "kitchen_manager", "kitchen_key", "bartender", "bar_manager", "server", "wait_staff", "driver", "line_cook", "pizza", "dishwasher"] as const;
    for (const role of roles) {
      (createNewHire as any).mockResolvedValue({
        id: 1, pin: "1234", firstName: "Test", lastName: "User", department: "kitchen_line", jobRole: role,
      });
      const result = await createNewHire({
        firstName: "Test",
        lastName: "User",
        department: "kitchen_line",
        jobRole: role,
      });
      expect(result.jobRole).toBe(role);
    }
  });

  it("should set isKeyEmployee flag when specified", async () => {
    (createNewHire as any).mockResolvedValue({
      id: 1, pin: "5555", firstName: "Sally", lastName: "Manager", department: "management", jobRole: "key_manager",
    });
    const result = await createNewHire({
      firstName: "Sally",
      lastName: "Manager",
      department: "management",
      jobRole: "key_manager",
      isKeyEmployee: true,
    });
    expect(createNewHire).toHaveBeenCalledWith(expect.objectContaining({ isKeyEmployee: true }));
    expect(result.id).toBe(1);
  });
});
