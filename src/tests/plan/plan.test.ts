import { beforeAll, describe, expect, it } from "vitest";
import resetDb from "../helpers/resetDb";
import { createCaller } from "../helpers/utils";
import { db, schema } from "../../db/client";
import { eq } from "drizzle-orm";

describe("plans routes", async () => {
  beforeAll(async () => {
    await resetDb();
  });

  describe("create", async () => {
    const mockPlan = {
      name: "standard",
      price: 9.99,
    };
    it("should create a new plan", async () => {
      const results = await createCaller({}).plans.create(mockPlan);
      expect(results.success).toBe(true);
      const planInDb = await db.query.plans.findFirst({
        where: eq(schema.plans.name, mockPlan.name),
      });
      expect(planInDb!.name).toBe(mockPlan.name);
      expect(planInDb!.price).toBe(mockPlan.price);
    });
  });
});
