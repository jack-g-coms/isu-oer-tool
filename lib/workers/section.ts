import { Worker, Job } from "bullmq";
import { markSectionFailure, writeSection } from "../services/textbooks";
import { SectionStatus } from "@/prisma/enums";

const worker = new Worker("section", async (job: Job) => {
    const { sectionId } = job.data;

    switch (job.name) {
        case "write-section":
            await writeSection(sectionId);
            break;
        case "refine-section":
            break;
        default:
            throw new Error(`Unknown job ${job.name}`);
    }
}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    },
    concurrency: 5
});

worker.on("failed", (job, err) => {
    console.log(`Failed section job ${job?.id}: ${err.message}`);
    console.error(err);
    
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        switch (job.name) {
            case "write-section":
                markSectionFailure(job.data.sectionId, SectionStatus.FAILED_WRITING)
                break;
            case "refine-section":
                markSectionFailure(job.data.sectionId, SectionStatus.FAILED_REFINING);
                break;
            default:
                throw new Error(`Unknown job ${job.name}`);
        }
    }
});
