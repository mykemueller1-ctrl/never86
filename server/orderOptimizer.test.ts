import { describe, it, expect, beforeAll } from "vitest";
import {
  getOrderProducts, createOrderProduct, updateOrderProduct, deleteOrderProduct,
  getOrders, getOrderById, createOrder, updateOrder,
  createOrderItems, updateOrderItem, optimizeOrder,
} from "./db";

describe("Order Optimizer", () => {
  let testProductId: number;
  let testOrderId: number;

  describe("Product Management", () => {
    it("should create a product", async () => {
      testProductId = await createOrderProduct({
        name: "Test Vodka OO",
        category: "liquor",
        subcategory: "well",
        vendor: "Fort Dodge Distributing",
        costPerUnit: "12.99",
        unitSize: "1.75L",
        parLevel: "4",
        currentStock: "2",
        active: true,
      });
      expect(testProductId).toBeGreaterThan(0);
    });

    it("should list products with filters", async () => {
      const all = await getOrderProducts({});
      expect(all.length).toBeGreaterThan(0);

      const liquorOnly = await getOrderProducts({ category: "liquor" });
      expect(liquorOnly.every((p: any) => p.category === "liquor")).toBe(true);

      const activeOnly = await getOrderProducts({ active: true });
      expect(activeOnly.every((p: any) => p.active === true || p.active === 1)).toBe(true);
    });

    it("should update a product", async () => {
      await updateOrderProduct(testProductId, { costPerUnit: "14.99", parLevel: "5" });
      const products = await getOrderProducts({});
      const updated = products.find((p: any) => p.id === testProductId);
      expect(updated).toBeDefined();
      expect(parseFloat(updated!.costPerUnit)).toBe(14.99);
      expect(parseFloat(updated!.parLevel)).toBe(5);
    });

    it("should delete a product (soft delete)", async () => {
      await deleteOrderProduct(testProductId);
      // After delete, product should not appear in active list
      const activeProducts = await getOrderProducts({ active: true });
      const deleted = activeProducts.find((p: any) => p.id === testProductId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Order Management", () => {
    let orderProductId: number;

    beforeAll(async () => {
      // Create a product for order testing
      orderProductId = await createOrderProduct({
        name: "Test Tequila OO",
        category: "liquor",
        subcategory: "premium",
        vendor: "Johnson Brothers",
        costPerUnit: "25.00",
        unitSize: "750ml",
        parLevel: "3",
        currentStock: "1",
        active: true,
      });
    });

    it("should create an order", async () => {
      testOrderId = await createOrder({
        weekOf: "2026-05-05",
        orderType: "liquor",
        budget: "500.00",
        status: "draft",
      });
      expect(testOrderId).toBeGreaterThan(0);
    });

    it("should add items to an order", async () => {
      await createOrderItems(testOrderId, [
        { productId: orderProductId, originalQty: "2", priority: 100 },
      ]);
      const order = await getOrderById(testOrderId);
      expect(order).toBeDefined();
      expect(order!.items.length).toBe(1);
      expect(parseFloat(order!.items[0].originalQty)).toBe(2);
    });

    it("should list orders with filters", async () => {
      const all = await getOrders({});
      expect(all.length).toBeGreaterThan(0);

      const liquorOrders = await getOrders({ orderType: "liquor" });
      expect(liquorOrders.every((o: any) => o.orderType === "liquor")).toBe(true);
    });

    it("should get order by id with items", async () => {
      const order = await getOrderById(testOrderId);
      expect(order).toBeDefined();
      expect(order!.id).toBe(testOrderId);
      expect(order!.items).toBeDefined();
      expect(Array.isArray(order!.items)).toBe(true);
    });

    it("should update an order", async () => {
      await updateOrder(testOrderId, { budget: "600.00", status: "optimized" });
      const order = await getOrderById(testOrderId);
      expect(order).toBeDefined();
      expect(parseFloat(order!.budget)).toBe(600);
      expect(order!.status).toBe("optimized");
    });

    it("should update an order item", async () => {
      const order = await getOrderById(testOrderId);
      expect(order).toBeDefined();
      expect(order!.items.length).toBeGreaterThan(0);
      const itemId = order!.items[0].id;
      await updateOrderItem(itemId, { finalQty: "3" });
      const updated = await getOrderById(testOrderId);
      expect(parseFloat(updated!.items[0].finalQty!)).toBe(3);
    });

    it("should optimize an order within budget", async () => {
      // Reset order to draft status for optimization
      await updateOrder(testOrderId, { status: "draft", budget: "600.00" });
      const result = await optimizeOrder(testOrderId);
      expect(result).toBeDefined();
      expect(typeof result.originalTotal).toBe("number");
      expect(typeof result.optimizedTotal).toBe("number");
      expect(typeof result.savings).toBe("number");
      expect(result.optimizedTotal).toBeLessThanOrEqual(600);
    });

    // Cleanup
    it("should clean up test data", async () => {
      await deleteOrderProduct(orderProductId);
    });
  });
});
