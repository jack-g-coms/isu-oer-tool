import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import { createKnowledgeDocument } from "@/lib/services/rag";
import withAuth from "@/lib/api/authMiddleware";
import { ingestionQueue } from "@/lib/queues/ingestion";
import { MAX_CLASS_LENGTH, MAX_DOC_TITLE_LENGTH, MAX_FILE_SIZE } from "@/lib/constants/sanity";

async function secretPOST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const session = await auth();

        const title = formData.get("title") as string;
        const className = formData.get("class") as string;
        const file = formData.get("file") as File;

        if (!title || !className || !file) {
            return Response.json(
                { error: "Missing information" },
                { status: 400 }
            );
        }
        if (className.length > MAX_CLASS_LENGTH) {
            return Response.json(
                { error: "Class is too long" },
                { status: 400 }
            );
        }
        if (title.trim().length == 0) {
            return Response.json(
                { error: "Title can't be empty" },
                { status: 400 }
            );
        }
        if (title.length > MAX_DOC_TITLE_LENGTH) {
            return Response.json(
                { error: "Title is too long" },
                { status: 400 }
            );
        }
        if (file.size > MAX_FILE_SIZE) {
            return Response.json(
                { error: `File is too large, ${MAX_FILE_SIZE} MB is the limit` },
                { status: 400 }
            );
        }

        const knowledgeDoc = await createKnowledgeDocument(file, {
            title,
            authorId: session?.user.id as string,
            class: className
        });

        await ingestionQueue.add("ingest-document", {
            knowledgeDocumentId: knowledgeDoc.id,
        }, {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000
            }
        });

        return Response.json(
            { success: true, data: knowledgeDoc },
            { status: 201 }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export const POST = withAuth(secretPOST);