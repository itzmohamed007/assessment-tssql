import { z } from "zod";
import { publicProcedure, router, trpcError } from "../../trpc/core";
import db, { schema } from "../../db/client";
import { eq } from "drizzle-orm";

export const plans = router({
  create: publicProcedure.input(
    // validating params
    z.object({
      name: z.string(),
      price: z.number()
    }))
    .mutation(async ({ input }) => {
      const { name, price } = input
      const plan = await db.query.plans.findFirst({});
      // plans duplication check
      if (plan) throw new trpcError({
        code: "BAD_REQUEST"
      })
      // create plan
      const [createdPlan] = await db
        .insert(schema.plans)
        .values({
          createdAt: new Date(),
          updatedAt: new Date(),
          name,
          price
        })
        .returning();
      return {
        success: true
      };
    }),
  update: publicProcedure.input(
    // validating params
    z.object({
      id: z.number(),
      name: z.string(),
      price: z.number()
    }))
    .mutation(async ({ input }) => {
      const { name, price, id } = input;
      const dbPlan = db.query.plans.findFirst({
        where: eq(schema.plans.id, id)
      });
      if (!dbPlan) throw new trpcError({
        code: "NOT_FOUND"
      })
      await db.update(schema.plans)
        .set({ name, price })
        .where(eq(schema.plans.id, id));
      return {
        success: true
      }
    }),
  read: publicProcedure.query(async () => {
    try {
      return await db.query.plans.findMany();
    } catch (error) {
      console.log("an error occured while fetching teams, ", error);
      return [];
    }
  }),
  upgradePrice: publicProcedure.input(
    z.object({
      oldPlan: z.object({
        price: z.number()
      }),
      newPlan: z.object({
        price: z.number()
      })
    })
  )
    .mutation(({ input }) => {
      const { oldPlan, newPlan } = input;
      if (oldPlan.price >= newPlan.price) {
        throw new trpcError({
          code: "BAD_REQUEST"
        });
      }
      return {
        price: newPlan.price - oldPlan.price
      };
    })
})