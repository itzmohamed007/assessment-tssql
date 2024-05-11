import { router } from "./core";

import { auth } from "../modules/auth/router";
import { account } from "../modules/users/router";
import { teams } from "../modules/teams/router";
import { plans } from "../modules/plans/router";

export const appRouter = router({
  auth,
  plans,
  // protected
  account,
  teams
});

export type AppRouter = typeof appRouter;
