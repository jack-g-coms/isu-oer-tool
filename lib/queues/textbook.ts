import { Queue } from "bullmq";

export const textbookQueue = new Queue("textbook", {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000
        }
    }
});