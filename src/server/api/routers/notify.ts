import EventEmitter from "events";
import { createTRPCRouter, publicProcedure } from "../trpc";
import z from "zod";
import { observable } from "@trpc/server/observable";

export const notificationEmitter = new EventEmitter()

export const notificationRouter = createTRPCRouter({
    onNotification: publicProcedure.input(z.object({
        accountId: z.string()
    })).subscription(() => {
        return observable((emit) => {
            const onNotify = (data: {accountId: string}) => {
                emit.next(data)
            }
            notificationEmitter.on("notification", onNotify)
            return () => notificationEmitter.off("notification", onNotify)
        })
    })
})