import { z } from "zod";
import { publicProcedure, router, trpcError } from "../../trpc/core";
import db, { schema } from "../../db/client";

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
      if(plan) throw new trpcError({
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
    })
})