import { Worker, Job } from "bullmq";
import { outlineTextbook, markOutlineFailure, writeFullTextbook } from "../services/textbooks";

const worker = new Worker("textbook", async (job: Job) => {
    console.log("starting textbook job")
    const { textbookId } = job.data;

    await outlineTextbook(textbookId);
    await writeFullTextbook(textbookId);
}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});

worker.on("failed", (job, err) => {
    console.log(`Failed textbook job ${job?.id}: ${err.message}`);
    console.error(err);
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        markOutlineFailure(job.data.textbookId);
    }
});