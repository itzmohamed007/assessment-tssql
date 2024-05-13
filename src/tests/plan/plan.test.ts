import { beforeAll, describe, expect, it } from "vitest";
import resetDb from "../helpers/resetDb";
import { createCaller } from "../helpers/utils";
import { db, schema } from "../../db/client";
import { eq } from "drizzle-orm";
import { trpcError } from "../../trpc/core";

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

  describe("update", async () => {
    const mockPlan = {
      id: 1,
      name: "premium",
      price: 19.99,
    };
    it("should update an old plan", async () => {
      const results = await createCaller({}).plans.update(mockPlan);
      expect(results.success).toBe(true);
      const dbPlan = await db.query.plans.findFirst(
        {
          where: eq(schema.plans.id, 1)
        }
      );
      expect(dbPlan!.name).toEqual(mockPlan.name);
      expect(dbPlan!.price).toEqual(mockPlan.price);
    });
  });

  describe("read", async () => {
    it("should at lest get one plan", async () => {
      const results = await createCaller({}).plans.read();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("upgradePrice", () => {
    const standardPlan = {
      price: 9.99
    }
    const premiumPlan = {
      price: 19.99
    }

    it("should throw an exception if old plan price is higher than the new plan`s", async () => {
      await expect(createCaller({}).plans.upgradePrice({
        newPlan: standardPlan,
        oldPlan: premiumPlan
      })).rejects.toThrowError(
        new trpcError({
          code: "BAD_REQUEST",
        })
      );
    });

    it("should return the prorated upgrade price", async () => {
      const results = createCaller({}).plans.upgradePrice({
        newPlan: premiumPlan,
        oldPlan: standardPlan
      });

      expect((await results).price).toBeGreaterThan(0);
    });
  });
});
