import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import { createKnowledgeDocument } from "@/lib/services/rag";
import withAuth from "@/lib/api/authMiddleware";
import { ingestionQueue } from "@/lib/queues/ingestion";

async function secretPOST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const session = await auth();

        const title = formData.get("title") as string;
        const aiUsable = formData.get("aiUsable") as string;
        const file = formData.get("file") as File;

        if (!title || !aiUsable || !file) {
            return Response.json(
                { error: "Missing information" },
                { status: 400 }
            );
        }

        const knowledgeDoc = await createKnowledgeDocument(file, {
            title,
            authorId: session?.user.id as string,
            aiUsable: true
        });

        await ingestionQueue.add("ingest-document", {
            knowledgeDocumentId: knowledgeDoc.id
        });

        return Response.json(
            knowledgeDoc,
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