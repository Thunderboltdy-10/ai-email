import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCContext, createTRPCRouter } from "@/server/api/trpc";
import { accountRouter } from "./routers/account";
import { notificationRouter } from "./routers/notify";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	post: postRouter,
    account: accountRouter,
    notifcation: notificationRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
