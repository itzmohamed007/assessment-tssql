import { beforeAll, describe, expect, it } from "vitest";
import resetDb from "../helpers/resetDb";
import { createCaller, createAuthenticatedCaller } from "../helpers/utils";
import { db, schema } from "../../db/client";
import { eq } from "drizzle-orm";
import { trpcError } from "../../trpc/core";

describe("plans routes", async () => {
  // declaring a mock user
  const user = {
    email: "mail@mail.com",
    password: "P@ssw0rd",
    name: "test",
    timezone: "Asia/Riyadh",
    locale: "en",
  };
  // declaring a mock admin
  const admin = {
    email: "mail2@mail.com",
    password: "P@ssw0rd",
    name: "test2",
    timezone: "Asia/Riyadh",
    locale: "en",
    isAdmin: true
  };

  beforeAll(async () => {
    // reseting database
    await resetDb();
    // authenticating both users
    await createCaller({}).auth.register(user);
    await createCaller({}).auth.register(admin);
  });

  describe("create", async () => {
    const mockPlan = {
      name: "standard",
      price: 9.99,
    };

    it("should not permit non admin user access to create method", async () => {
      const authenticatedUser = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email),
      });

      // checking if non admin user can access create method
      await expect(createAuthenticatedCaller({
        userId: authenticatedUser!.id
      }).plans.create(mockPlan)).rejects.toThrowError(
        new trpcError({
          code: "BAD_REQUEST",
        })
      );
    });

    it("should permit admin user access to create method", async () => {
      const authenticatedAdmin = await db.query.users.findFirst({
        where: eq(schema.users.email, admin.email),
      });

      // checking if admin user can access create method
      const results = await createAuthenticatedCaller({
        userId: authenticatedAdmin!.id
      }).plans.create(mockPlan);
      expect(results.success).toBe(true);
    });

    it("should find a plan in db", async () => {
      const planInDb = await db.query.plans.findFirst({
        where: eq(schema.plans.name, mockPlan.name),
      });
      expect(planInDb!.name).toBe(mockPlan.name);
      expect(planInDb!.price).toBe(mockPlan.price);
    });
  });

  describe("update", async () => {
    const mockUpdatePlan = {
      id: 1,
      name: "premium",
      price: 19.99,
    };

    it("should not permit non admin user access to update method", async () => {
      const authenticatedUser = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email),
      });

      // checking if non admin user can access update method
      await expect(createAuthenticatedCaller({
        userId: authenticatedUser!.id
      }).plans.update(mockUpdatePlan)).rejects.toThrowError(
        new trpcError({
          code: "BAD_REQUEST",
        })
      );
    });

    it("should permit admin user access to update method", async () => {
      const authenticatedAdmin = await db.query.users.findFirst({
        where: eq(schema.users.email, admin.email),
      });

      // checking if admin user can access update method
      const results = await createAuthenticatedCaller({
        userId: authenticatedAdmin!.id
      }).plans.update(mockUpdatePlan);
      expect(results.success).toBe(true);
    });

    it("should find the old plan updated", async () => {
      const planInDb = await db.query.plans.findFirst({
        where: eq(schema.plans.id, mockUpdatePlan.id),
      });
      expect(planInDb!.name).toBe(mockUpdatePlan.name);
      expect(planInDb!.price).toBe(mockUpdatePlan.price);
    });
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
