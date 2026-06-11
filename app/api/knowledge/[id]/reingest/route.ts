import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import { getKnowledgeDoc, requeueKnowledgeDoc } from "@/lib/services/rag";
import withAuth from "@/lib/api/authMiddleware";
import { ingestionQueue } from "@/lib/queues/ingestion";
import { KnowledgeDocumentStatus } from "@/prisma/enums";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    const id = (await params).id;
    try {
        const session = await auth();

        const knowledgeDoc = await getKnowledgeDoc(id);
        if (!knowledgeDoc) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (knowledgeDoc.authorId != session?.user.id || knowledgeDoc.status != KnowledgeDocumentStatus.FAILED) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await ingestionQueue.add("ingest-document", {
            knowledgeDocumentId: id,
        }, {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000
            }
        });

        await requeueKnowledgeDoc(id);
        return Response.json(
            { success: true },
            { status: 200 }
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