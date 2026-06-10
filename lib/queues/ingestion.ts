import { Queue } from "bullmq";

export const ingestionQueue = new Queue("ingestion", {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});