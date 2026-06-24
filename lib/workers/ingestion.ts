import { Worker, Job } from "bullmq";
import { getKnowledgeDoc, ingestToKnowledgeBase, markIngestionFailure } from "../services/rag";

const worker = new Worker("ingestion", async (job: Job) => {
    const { knowledgeDocumentId } = job.data;
    const knowledgeDoc = await getKnowledgeDoc(knowledgeDocumentId);
    await ingestToKnowledgeBase(knowledgeDoc); 
}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});

worker.on("failed", (job, err) => {
    console.log(`Failed ingestion job ${job?.id}: ${err.message}`);
    console.error(err);
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        markIngestionFailure(job.data.knowledgeDocumentId);
    }
});